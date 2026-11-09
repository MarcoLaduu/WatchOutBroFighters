-- WatchOut Bro Fighters: account, coppe, amici, ranked e inviti.
-- Da incollare in Supabase > SQL Editor > New query > Run. Si può rieseguire senza perdere dati.
--
-- Il browser non tocca mai le tabelle direttamente (RLS attiva e nessuna policy):
-- passa solo dalle funzioni qui sotto, che controllano chi sei (auth.uid()) e calcolano le coppe.

create extension if not exists pgcrypto;

-- ---------- tabelle ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  trophies int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

-- richiesta di amicizia da a verso b; accepted = siete amici
create table if not exists public.friends (
  a uuid not null references public.profiles on delete cascade,
  b uuid not null references public.profiles on delete cascade,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (a, b)
);

-- chi sta cercando una partita ranked, con il codice della sua stanza PeerJS
create table if not exists public.queue (
  user_id uuid primary key references public.profiles on delete cascade,
  code text not null,
  joined_at timestamptz not null default now(),
  seen_at timestamptz not null default now()
);

-- una partita ranked: host = chi ha creato la stanza (lato 0), guest = chi è entrato (lato 1).
-- Ognuno dei due dice chi ha vinto (0 o 1): se coincidono si assegnano le coppe.
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'queue',          -- queue | invite
  host uuid not null references public.profiles on delete cascade,
  guest uuid not null references public.profiles on delete cascade,
  code text,
  status text not null default 'open',         -- open | done | disputed | void
  report_host int,
  report_guest int,
  reported_at timestamptz,
  winner uuid,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists matches_host on public.matches (host, status);
create index if not exists matches_guest on public.matches (guest, status);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles on delete cascade,
  to_id uuid not null references public.profiles on delete cascade,
  code text not null,
  status text not null default 'pending',      -- pending | accepted | declined | cancelled | expired
  match_id uuid references public.matches on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists invites_to on public.invites (to_id, status);

alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.queue enable row level security;
alter table public.matches enable row level security;
alter table public.invites enable row level security;

-- ---------- regole ----------
-- coppe: +30 a chi vince, -20 a chi perde (mai sotto zero)
-- una partita dichiarata da uno solo dei due si chiude dopo 5 minuti (l'altro ha abbandonato)

-- utente collegato (e il suo profilo, creato al primo accesso)
create or replace function public._me() returns uuid
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not_logged'; end if;
  insert into profiles (id) values (u) on conflict do nothing;
  return u;
end $$;

create or replace function public._name(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select username from profiles where id = u
$$;

create or replace function public._finish(mid uuid, wside int) returns void
language plpgsql security definer set search_path = public as $$
declare m matches; w uuid; l uuid;
begin
  select * into m from matches where id = mid for update;
  if not found or m.status <> 'open' then return; end if;
  if wside = 0 then w := m.host; l := m.guest; else w := m.guest; l := m.host; end if;
  update profiles set trophies = trophies + 30, wins = wins + 1 where id = w;
  update profiles set trophies = greatest(0, trophies - 20), losses = losses + 1 where id = l;
  update matches set status = 'done', winner = w, finished_at = now() where id = mid;
end $$;

-- pulizia: partite con un solo risultato da più di 5 minuti, partite mai giocate, code e inviti scaduti
create or replace function public._tidy() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select id, coalesce(report_host, report_guest) as s from matches
    where status = 'open' and (report_host is null) <> (report_guest is null)
      and reported_at < now() - interval '5 minutes'
  loop
    perform _finish(r.id, r.s);
  end loop;
  update matches set status = 'void'
    where status = 'open' and report_host is null and report_guest is null and created_at < now() - interval '30 minutes';
  delete from queue where seen_at < now() - interval '15 seconds';
  update invites set status = 'expired' where status = 'pending' and created_at < now() - interval '90 seconds';
end $$;

-- ---------- profilo ----------
-- chiamata ogni pochi secondi dal gioco: ti segna online e ti dà profilo, inviti e richieste d'amicizia
create or replace function public.heartbeat() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me();
begin
  update profiles set last_seen = now() where id = u;
  perform _tidy();
  return json_build_object(
    'profile', (select json_build_object('id', id, 'username', username, 'trophies', trophies, 'wins', wins, 'losses', losses) from profiles where id = u),
    'invites', coalesce((
      select json_agg(json_build_object('id', i.id, 'from', p.username, 'code', i.code) order by i.created_at desc)
      from invites i join profiles p on p.id = i.from_id
      where i.to_id = u and i.status = 'pending'), '[]'::json),
    'requests', (select count(*) from friends where b = u and not accepted)
  );
end $$;

create or replace function public.set_username(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); n text := btrim(p_name);
begin
  if n !~ '^[A-Za-z0-9_.]{3,12}$' then raise exception 'bad_name'; end if;
  if exists (select 1 from profiles where lower(username) = lower(n) and id <> u) then raise exception 'name_taken'; end if;
  update profiles set username = n where id = u;
  return json_build_object('username', n);
end $$;

-- classifica di tutti quelli che hanno un nome (visibile anche senza accesso)
create or replace function public.leaderboard() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x), '[]'::json) from (
    select username, trophies, wins, losses, (last_seen > now() - interval '20 seconds') as online from profiles
    where username is not null order by trophies desc, wins desc, lower(username) limit 1000
  ) x
$$;

-- elimina l'account e tutti i suoi dati (profilo, amici, partite, inviti: a cascata)
create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not_logged'; end if;
  delete from auth.users where id = u;
end $$;

-- ---------- amici ----------
create or replace function public.friend_list() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me();
begin
  return coalesce((select json_agg(x order by x.status, x.online desc, lower(x.username)) from (
    select p.id, p.username, p.trophies,
      (p.last_seen > now() - interval '20 seconds') as online,
      case when f.accepted then 'friend' when f.a = u then 'outgoing' else 'incoming' end as status
    from friends f join profiles p on p.id = case when f.a = u then f.b else f.a end
    where (f.a = u or f.b = u) and p.username is not null
  ) x), '[]'::json);
end $$;

create or replace function public.friend_add(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); o uuid;
begin
  select id into o from profiles where lower(username) = lower(btrim(p_name));
  if o is null then raise exception 'no_user'; end if;
  if o = u then raise exception 'self'; end if;
  if exists (select 1 from friends where a = o and b = u) then
    update friends set accepted = true where a = o and b = u;   -- ti aveva già chiesto lui: ora siete amici
    return json_build_object('status', 'friend');
  end if;
  insert into friends (a, b) values (u, o) on conflict do nothing;
  return json_build_object('status', (select case when accepted then 'friend' else 'outgoing' end from friends where a = u and b = o));
end $$;

create or replace function public.friend_accept(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := _me();
begin
  update friends set accepted = true where a = p_id and b = u;
end $$;

-- rifiuta, annulla o toglie un amico
create or replace function public.friend_remove(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := _me();
begin
  delete from friends where (a = u and b = p_id) or (a = p_id and b = u);
end $$;

-- ---------- coda ranked ----------
create or replace function public.queue_join(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); o queue; mid uuid;
begin
  if _name(u) is null then raise exception 'no_username'; end if;
  perform _tidy();
  delete from queue where user_id = u;
  select * into o from queue where user_id <> u order by joined_at limit 1 for update skip locked;
  if found then
    delete from queue where user_id = o.user_id;
    insert into matches (kind, host, guest, code) values ('queue', o.user_id, u, o.code) returning id into mid;
    return json_build_object('match', mid, 'code', o.code, 'opp', _name(o.user_id), 'side', 1);
  end if;
  insert into queue (user_id, code) values (u, upper(p_code));
  return json_build_object('waiting', true);
end $$;

-- per chi aspetta in coda: ancora in attesa, trovato un avversario, oppure uscito dalla coda
create or replace function public.queue_poll() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); m matches;
begin
  update queue set seen_at = now() where user_id = u;
  if found then return json_build_object('waiting', true); end if;
  select * into m from matches where host = u and kind = 'queue' and status = 'open'
    and created_at > now() - interval '2 minutes' order by created_at desc limit 1;
  if not found then return json_build_object('gone', true); end if;
  return json_build_object('match', m.id, 'opp', _name(m.guest), 'side', 0);
end $$;

create or replace function public.queue_leave() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from queue where user_id = _me();
end $$;

-- ---------- inviti tra amici ----------
create or replace function public.invite_send(p_to uuid, p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); iid uuid;
begin
  if _name(u) is null then raise exception 'no_username'; end if;
  if not exists (select 1 from friends where accepted and ((a = u and b = p_to) or (a = p_to and b = u))) then
    raise exception 'not_friend';
  end if;
  perform _tidy();
  update invites set status = 'cancelled' where from_id = u and status = 'pending';
  insert into invites (from_id, to_id, code) values (u, p_to, upper(p_code)) returning id into iid;
  return iid;
end $$;

create or replace function public.invite_cancel() returns void
language plpgsql security definer set search_path = public as $$
begin
  update invites set status = 'cancelled' where from_id = _me() and status = 'pending';
end $$;

create or replace function public.invite_status(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); i invites;
begin
  perform _tidy();
  select * into i from invites where id = p_id and from_id = u;
  if not found then return json_build_object('status', 'expired'); end if;
  return json_build_object('status', i.status, 'match', i.match_id);
end $$;

create or replace function public.invite_respond(p_id uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); i invites; mid uuid;
begin
  select * into i from invites where id = p_id and to_id = u for update;
  if not found or i.status <> 'pending' or i.created_at < now() - interval '90 seconds' then
    return json_build_object('error', 'expired');
  end if;
  if not p_accept then
    update invites set status = 'declined' where id = p_id;
    return json_build_object('ok', true);
  end if;
  insert into matches (kind, host, guest, code) values ('invite', i.from_id, u, i.code) returning id into mid;
  update invites set status = 'accepted', match_id = mid where id = p_id;
  return json_build_object('match', mid, 'code', i.code, 'opp', _name(i.from_id), 'side', 1);
end $$;

-- ---------- risultati ----------
create or replace function public._match_info(mid uuid, u uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('status', m.status,
    'winner', case when m.winner is null then null when m.winner = m.host then 0 else 1 end,
    'trophies', (select trophies from profiles where id = u))
  from matches m where m.id = mid
$$;

create or replace function public.match_report(p_id uuid, p_winner int) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); m matches;
begin
  if p_winner not in (0, 1) then raise exception 'bad_winner'; end if;
  select * into m from matches where id = p_id for update;
  if not found or (u <> m.host and u <> m.guest) then raise exception 'no_match'; end if;
  if m.status = 'open' then
    if u = m.host and m.report_host is null then
      update matches set report_host = p_winner, reported_at = coalesce(reported_at, now()) where id = p_id;
    elsif u = m.guest and m.report_guest is null then
      update matches set report_guest = p_winner, reported_at = coalesce(reported_at, now()) where id = p_id;
    end if;
    select * into m from matches where id = p_id;
    if m.report_host is not null and m.report_guest is not null then
      if m.report_host = m.report_guest then perform _finish(p_id, m.report_host);
      else update matches set status = 'disputed', finished_at = now() where id = p_id;
      end if;
    end if;
  end if;
  return _match_info(p_id, u);
end $$;

create or replace function public.match_info(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := _me();
begin
  perform _tidy();
  if not exists (select 1 from matches where id = p_id and (host = u or guest = u)) then raise exception 'no_match'; end if;
  return _match_info(p_id, u);
end $$;

-- rivincita: nuova partita ranked tra gli stessi due (la chiede chi ha la stanza)
create or replace function public.match_again(p_old uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare u uuid := _me(); m matches; mid uuid;
begin
  select * into m from matches where id = p_old and host = u;
  if not found then raise exception 'no_match'; end if;
  insert into matches (kind, host, guest, code) values (m.kind, m.host, m.guest, m.code) returning id into mid;
  return mid;
end $$;

-- ---------- permessi ----------
-- le funzioni interne (con _ davanti) non si possono chiamare dal browser
revoke execute on function public._me() from public, anon, authenticated;
revoke execute on function public._name(uuid) from public, anon, authenticated;
revoke execute on function public._finish(uuid, int) from public, anon, authenticated;
revoke execute on function public._tidy() from public, anon, authenticated;
revoke execute on function public._match_info(uuid, uuid) from public, anon, authenticated;
-- quelle pubbliche solo per chi ha fatto l'accesso
do $$
declare f text;
begin
  foreach f in array array[
    'heartbeat()', 'set_username(text)', 'leaderboard()', 'friend_list()', 'friend_add(text)',
    'friend_accept(uuid)', 'friend_remove(uuid)', 'queue_join(text)', 'queue_poll()', 'queue_leave()',
    'invite_send(uuid, text)', 'invite_cancel()', 'invite_status(uuid)', 'invite_respond(uuid, boolean)',
    'match_report(uuid, int)', 'match_info(uuid)', 'match_again(uuid)', 'delete_account()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
grant execute on function public.leaderboard() to anon;
