import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from './env';

const credentialsPath = path.join(os.tmpdir(), 'little-scholar-google-credentials.json');

export const configureGoogleApplicationCredentials = (): void => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return;
  }

  const credentialsJson = env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
    ? Buffer.from(env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8')
    : env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJson) {
    return;
  }

  JSON.parse(credentialsJson);
  fs.writeFileSync(credentialsPath, credentialsJson, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
};
