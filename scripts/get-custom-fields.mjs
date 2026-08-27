import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) envPath = path.join(__dirname, '..', '.env.local');

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = loadEnv(envPath);
const token = env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = env.GHL_LOCATION_ID;

fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
  },
  signal: AbortSignal.timeout(10000),
})
  .then(r => r.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(e => console.error('Error:', e.message));
