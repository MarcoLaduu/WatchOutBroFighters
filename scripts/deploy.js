// Deploy su GitHub Pages: build in docs/, commit e push.
// Uso:  npm run deploy                     -> messaggio automatico con data e ora
//       npm run deploy -- "nuovo personaggio" -> messaggio personalizzato
import { execSync } from 'node:child_process';

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

const now = new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
const message = process.argv.slice(2).join(' ').trim() || `Deploy ${now}`;

try {
  run('npm run build');
  run('git add -A');
  run(`git commit -m ${JSON.stringify(message)}`);
  run('git push');
  console.log('\nFatto! Tra circa un minuto GitHub Pages sarà aggiornato.');
} catch {
  console.error('\nDeploy interrotto: controlla il messaggio di errore qui sopra.');
  process.exit(1);
}
