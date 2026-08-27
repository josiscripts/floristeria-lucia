import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let envPath = path.join(__dirname, '..', '.env');

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

// Test: Intentar crear un custom field para productos
const testPayload = {
  name: "legacy_catalog_id",
  model: "product",
  dataType: "TEXT",
  placeholder: "Original ID from catalog.ts"
};

console.log('Intentando crear custom field para productos...\n');
console.log('POST /locations/{locationId}/customFields');
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('\n' + '─'.repeat(70) + '\n');

fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload),
  signal: AbortSignal.timeout(10000),
})
  .then(async r => {
    const data = await r.json();
    console.log(`Status: ${r.status}`);
    console.log('Respuesta:', JSON.stringify(data, null, 2));

    if (r.status === 201 || r.status === 200) {
      console.log('\n✅ Custom field para PRODUCTOS PUEDE crearse');
    } else if (r.status === 400 || r.status === 422) {
      console.log('\n❌ Validación fallida - ver detalles arriba');
    } else {
      console.log('\n❌ Error al crear custom field');
    }
  })
  .catch(e => console.error('Error:', e.message));
