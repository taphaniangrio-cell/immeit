import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '.env');

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const lines = readFileSync(ENV_PATH, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    env[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
  return env;
}

const env = loadEnv();

export const USERNAME = env.AMEN_USERNAME || process.env.AMEN_USERNAME;
export const PASSWORD = env.AMEN_PASSWORD || process.env.AMEN_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('=== ERREUR ===');
  console.error('Credentials Amen.fr non trouvés.');
  console.error('Crée scripts/.env avec:');
  console.error('  AMEN_USERNAME=votre@email.com');
  console.error('  AMEN_PASSWORD=votre-mot-de-passe');
  console.error('Ou définissez les variables d\'environnement AMEN_USERNAME et AMEN_PASSWORD.');
  process.exit(1);
}
