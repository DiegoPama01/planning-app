import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(frontendRoot, '..');
const envPath = path.join(workspaceRoot, '.env');
const templatePath = path.join(frontendRoot, 'public', 'app-config.template.json');
const outputPath = path.join(frontendRoot, 'public', 'app-config.json');

const defaults = {
  FRONTEND_PUBLIC_API_BASE_URL: '/api',
  FRONTEND_PUBLIC_AUTH_ENABLED: 'false',
  FRONTEND_PUBLIC_AUTH_ISSUER_URL: '',
  FRONTEND_PUBLIC_AUTH_CLIENT_ID: '',
  FRONTEND_PUBLIC_AUTH_REDIRECT_URI: '/',
  FRONTEND_PUBLIC_AUTH_POST_LOGOUT_REDIRECT_URI: '/',
  FRONTEND_PUBLIC_AUTH_SCOPES: 'openid profile email',
  FRONTEND_PUBLIC_AUTH_RESPONSE_TYPE: 'code',
};

try {
  const envFile = await readFile(envPath, 'utf8');

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const [key, ...rest] = line.split('=');
    if (!key) {
      continue;
    }

    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // Ignore missing local env file and rely on process environment/defaults.
}

const template = await readFile(templatePath, 'utf8');
const rendered = template.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key) => {
  const value = process.env[key] ?? defaults[key] ?? '';
  return value;
});

await writeFile(outputPath, rendered, 'utf8');
