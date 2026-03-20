import { createHmac, createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

loadEnvFile(path.join(rootDir, '.env.dev'));
loadEnvFile(path.join(rootDir, '.env'));

const packageJson = JSON.parse(
  readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
);

const requiredEnvKeys = [
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_BUCKET',
  'R2_ENDPOINT',
];

function readEnv(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = nextToken;
    index += 1;
  }

  return args;
}

function getArchivePath(args) {
  const customPath = String(args.file || '').trim();
  if (customPath) {
    return path.resolve(rootDir, customPath);
  }

  return path.join(
    rootDir,
    'dist',
    `remove-watermark-skill-${packageJson.version}.zip`,
  );
}

function getObjectKey(args, archivePath) {
  const explicitKey = String(args.key || '').trim();
  if (explicitKey) {
    return explicitKey.replace(/^\/+/, '');
  }

  const prefix = readEnv('R2_UPLOAD_PATH', 'CLOUDFLARE_R2_KEY_PREFIX', 'UPLOAD_PATH')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  const filename = path.basename(archivePath);
  return prefix ? `${prefix}/${filename}` : filename;
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key, value, encoding) {
  return createHmac('sha256', key).update(value).digest(encoding);
}

function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function buildAuthHeaders({ method, url, body, accessKeyId, secretAccessKey }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  const canonicalUri = parsedUrl.pathname;
  const payloadHash = sha256Hex(body);

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n');

  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(
    secretAccessKey,
    dateStamp,
    region,
    service,
  );
  const signature = hmac(signingKey, stringToSign, 'hex');

  return {
    Authorization: [
      'AWS4-HMAC-SHA256 Credential=',
      `${accessKeyId}/${credentialScope}, `,
      `SignedHeaders=${signedHeaders}, `,
      `Signature=${signature}`,
    ].join(''),
    'Content-Length': String(body.length),
    'Content-Type': 'application/zip',
    Host: host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
}

function getPublicUrl(objectKey) {
  const baseUrl = readEnv(
    'R2_DOMAIN',
    'CLOUDFLARE_R2_PUBLIC_BASE_URL',
    'PUBLIC_DOMAIN'
  );
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/+$/, '')}/${objectKey.replace(/^\/+/, '')}`;
}

function getUploadBaseUrl() {
  const endpoint = readEnv('R2_ENDPOINT', 'CLOUDFLARE_R2_ENDPOINT');
  if (!endpoint) {
    return '';
  }

  return endpoint.replace(/\/+$/, '');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const resolvedEnv = {
    R2_ACCESS_KEY: readEnv(
      'R2_ACCESS_KEY',
      'CLOUDFLARE_R2_ACCESS_KEY_ID'
    ),
    R2_SECRET_KEY: readEnv(
      'R2_SECRET_KEY',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY'
    ),
    R2_BUCKET: readEnv('R2_BUCKET', 'CLOUDFLARE_R2_BUCKET'),
    R2_ENDPOINT: getUploadBaseUrl(),
  };

  const missingEnv = requiredEnvKeys.filter((key) => !resolvedEnv[key]);
  if (missingEnv.length > 0) {
    throw new Error(
      `Missing required env vars: ${missingEnv.join(', ')}. Copy .env.example to .env.dev and fill them in.`,
    );
  }

  const archivePath = getArchivePath(args);
  if (!existsSync(archivePath)) {
    throw new Error(
      `Archive not found: ${archivePath}. Run "pnpm build" before uploading.`,
    );
  }

  const objectKey = getObjectKey(args, archivePath);
  const uploadUrl = `${resolvedEnv.R2_ENDPOINT}/${resolvedEnv.R2_BUCKET}/${objectKey}`;
  const publicUrl = getPublicUrl(objectKey);

  if (args['dry-run'] === 'true') {
    console.log(
      JSON.stringify(
        {
          status: 'ready',
          archive_path: archivePath,
          object_key: objectKey,
          upload_url: uploadUrl,
          public_url: publicUrl,
        },
        null,
        2,
      ),
    );
    return;
  }

  const body = readFileSync(archivePath);
  const headers = buildAuthHeaders({
    method: 'PUT',
    url: uploadUrl,
    body,
    accessKeyId: resolvedEnv.R2_ACCESS_KEY,
    secretAccessKey: resolvedEnv.R2_SECRET_KEY,
  });

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `R2 upload failed with status ${response.status}: ${errorText || 'Unknown error'}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        status: 'uploaded',
        archive_path: archivePath,
        object_key: objectKey,
        public_url: publicUrl,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
