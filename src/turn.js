// Server TURN: serve per giocare online tra reti diverse (es. Wi-Fi di casa contro 4G).
// Senza, i due dispositivi si collegano solo se il collegamento diretto riesce, cosa che con molte reti
// (soprattutto quelle dei telefoni) non succede: è per questo che prima funzionava solo sulla stessa Wi-Fi.
//
// Si usa Metered (Open Relay): gratis fino a 20 GB al mese, una partita usa pochi MB.
// Nella dashboard di Metered, sezione del TURN Server, ci sono username e password (credential) e
// l'elenco degli indirizzi (urls): copiali qui sotto, poi npm run deploy.
// (In alternativa, con nome dell'app e API key, compila app e apiKey: le credenziali si chiedono da sole.)
export const TURN = {
  username: '',     // username delle credenziali
  credential: '',   // password delle credenziali
  urls: [           // indirizzi del server: controlla che siano uguali a quelli della dashboard
    'stun:stun.relay.metered.ca:80',
    'turn:global.relay.metered.ca:80',
    'turn:global.relay.metered.ca:80?transport=tcp',
    'turn:global.relay.metered.ca:443',
    'turns:global.relay.metered.ca:443?transport=tcp',
  ],
  app: 'watchoutbrofighters', // nome dell'app (https://watchoutbrofighters.metered.live)
  apiKey: '0548b83b5e5c6e8acff8d6557f07973899cd', // API key
};
