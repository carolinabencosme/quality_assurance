/**
 * Fix Keycloak inventory-frontend redirect URIs for Vercel.
 * Usage: node scripts/fix-keycloak-vercel-redirects.js
 */
const http = require('https');
const querystring = require('querystring');

const KC = (process.env.CLOUD_KC_URL || 'https://cub-keycloak.onrender.com').replace(/\/$/, '');
const ADMIN_USER = process.env.KC_ADMIN || 'admin';
const ADMIN_PASS = process.env.KC_ADMIN_PASSWORD || 'admin';

const REDIRECTS = [
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/*',
  'http://127.0.0.1:3000/auth/callback',
  'http://127.0.0.1:3000/*',
  'https://cub-inventory-qas.vercel.app/auth/callback',
  'https://cub-inventory-qas.vercel.app/*',
  'https://cub-inventory-qas-prod.vercel.app/auth/callback',
  'https://cub-inventory-qas-prod.vercel.app/*',
  'https://*.vercel.app/auth/callback',
  'https://*.vercel.app/*',
];

const ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://cub-inventory-qas.vercel.app',
  'https://cub-inventory-qas-prod.vercel.app',
  'https://*.vercel.app',
  '+',
];

function request(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode} ${data}`));
            return;
          }
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Fixing redirects on', KC);
  const form = querystring.stringify({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: ADMIN_USER,
    password: ADMIN_PASS,
  });
  const tok = await request(
    'POST',
    `${KC}/realms/master/protocol/openid-connect/token`,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(form),
    },
    form
  );
  const auth = { Authorization: `Bearer ${tok.data.access_token}` };
  const list = await request(
    'GET',
    `${KC}/admin/realms/inventory-realm/clients?clientId=inventory-frontend`,
    auth
  );
  const cid = list.data[0].id;
  const clientRes = await request(
    'GET',
    `${KC}/admin/realms/inventory-realm/clients/${cid}`,
    auth
  );
  const client = clientRes.data;
  client.redirectUris = REDIRECTS;
  client.webOrigins = ORIGINS;
  if (!client.attributes) client.attributes = {};
  client.attributes['post.logout.redirect.uris'] = '+';
  const body = JSON.stringify(client);
  await request(
    'PUT',
    `${KC}/admin/realms/inventory-realm/clients/${cid}`,
    {
      ...auth,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body
  );
  const check = await request(
    'GET',
    `${KC}/admin/realms/inventory-realm/clients/${cid}`,
    auth
  );
  console.log('OK redirectUris:');
  for (const u of check.data.redirectUris) console.log(' ', u);
  console.log('Retry: https://cub-inventory-qas.vercel.app');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
