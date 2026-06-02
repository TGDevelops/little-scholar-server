const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config();

const proxyPath = process.env.CLOUD_SQL_PROXY_BIN || '/private/tmp/cloud-sql-proxy';
const credentialsPath = '/private/tmp/little-scholar-google-credentials.json';
const port = process.env.CLOUD_SQL_PROXY_PORT || '5432';

if (!process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
  console.error('CLOUD_SQL_INSTANCE_CONNECTION_NAME is not set.');
  process.exit(1);
}

const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
  ? Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8')
  : process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!credentialsJson) {
  console.error('Google credentials are not configured.');
  process.exit(1);
}

if (!fs.existsSync(proxyPath)) {
  console.error(`Cloud SQL Auth Proxy not found at ${proxyPath}.`);
  console.error('Download it from https://cloud.google.com/sql/docs/postgres/connect-auth-proxy');
  process.exit(1);
}

JSON.parse(credentialsJson);
fs.writeFileSync(credentialsPath, credentialsJson, { mode: 0o600 });

const proxy = spawn(
  proxyPath,
  [
    '--address',
    '127.0.0.1',
    '--port',
    port,
    '--credentials-file',
    credentialsPath,
    process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME
  ],
  { stdio: 'inherit' }
);

proxy.on('exit', (code) => {
  process.exit(code ?? 0);
});
