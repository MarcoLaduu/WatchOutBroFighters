// Collegamento a Supabase (account, coppe, amici, ranked). Vedi il README, sezione "Account e ranked".
// Si trovano in Supabase > Project Settings:
//   url     → Project URL (sezione "Data API"), tipo https://abcdefghijkl.supabase.co
//   anonKey → la "Publishable key" (sezione "API Keys"), tipo sb_publishable_...
//             È fatta per stare nel browser. MAI la "Secret key" (sb_secret_...)!
// Lasciati vuoti, il gioco funziona come prima e le voci Ranked/Account dicono che non sono configurate.
export const SUPABASE = {
  url: 'https://shpqxvzgswilnvryjlzx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocHF4dnpnc3dpbG52cnlqbHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMjU2OTgsImV4cCI6MjEwOTgwMTY5OH0.YCkbBOjLoZyjfs6WmKS6tiELaCwRVOr3eDYmgAuL3SA',
};
