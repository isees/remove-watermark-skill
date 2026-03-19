#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BASE_URL = 'https://airemovewatermark.net';

function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) {
      args._.push(current);
      continue;
    }

    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/remove_watermark.mjs credits [--api-key <key>] [--base-url <url>]
  node scripts/remove_watermark.mjs remove --file <path> [--wait true] [--download-to <path>] [--api-key <key>] [--base-url <url>]
  node scripts/remove_watermark.mjs remove --image-url <url> [--wait true] [--download-to <path>] [--api-key <key>] [--base-url <url>]
  node scripts/remove_watermark.mjs task --task-id <id> [--download-to <path>] [--api-key <key>] [--base-url <url>]

Defaults:
  base URL defaults to ${DEFAULT_BASE_URL}
`);
}

function getConfig(args) {
  const baseUrl = String(
    args['base-url'] ||
      process.env.API_BASE_URL ||
      process.env.REMOVE_WATERMARK_BASE_URL ||
      DEFAULT_BASE_URL
  ).trim();
  const apiKey = String(
    args['api-key'] ||
      process.env.API_KEY ||
      process.env.REMOVE_WATERMARK_API_KEY ||
      ''
  ).trim();

  if (!apiKey) {
    throw new Error(
      'Missing API key. Set API_KEY, REMOVE_WATERMARK_API_KEY, or --api-key'
    );
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
  };
}

function getHeaders(apiKey, extra = {}) {
  return {
    authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected response (${response.status}): ${text}`);
  }

  if (!response.ok || json?.code !== 0) {
    throw new Error(
      json?.message || `Request failed with status ${response.status}`
    );
  }

  return json;
}

function getTaskOutputUrl(json) {
  return (
    json?.data?.task?.outputUrl ||
    json?.data?.outputUrl ||
    json?.outputUrl ||
    ''
  );
}

function getTaskStatus(json) {
  return String(json?.data?.task?.status || json?.data?.status || '').trim();
}

async function maybeDownloadOutput(json, downloadTo) {
  const targetPath = String(downloadTo || '').trim();
  if (!targetPath) {
    return;
  }

  const status = getTaskStatus(json);
  const outputUrl = String(getTaskOutputUrl(json) || '').trim();

  if (!outputUrl) {
    throw new Error(
      `No outputUrl found in response${status ? ` (status: ${status})` : ''}`
    );
  }

  const response = await fetch(outputUrl);
  if (!response.ok) {
    throw new Error(`Failed to download output: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const absolutePath = path.resolve(targetPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, new Uint8Array(arrayBuffer));
  console.error(`Downloaded output to ${absolutePath}`);
}

async function runCredits(config) {
  const json = await requestJson(`${config.baseUrl}/api/v1/credits`, {
    headers: getHeaders(config.apiKey),
    method: 'GET',
  });

  console.log(JSON.stringify(json, null, 2));
}

async function runTask(config, args) {
  const taskId = String(args['task-id'] || '').trim();
  if (!taskId) {
    throw new Error('Missing --task-id');
  }

  const json = await requestJson(
    `${config.baseUrl}/api/v1/watermark/tasks/${encodeURIComponent(taskId)}`,
    {
      headers: getHeaders(config.apiKey),
      method: 'GET',
    }
  );

  await maybeDownloadOutput(json, args['download-to']);
  console.log(JSON.stringify(json, null, 2));
}

async function runRemove(config, args) {
  const filePath = String(args.file || '').trim();
  const imageUrl = String(args['image-url'] || '').trim();
  const wait = String(args.wait || 'true')
    .trim()
    .toLowerCase();

  if (!filePath && !imageUrl) {
    throw new Error('Provide --file or --image-url');
  }

  if (filePath && imageUrl) {
    throw new Error('Provide only one of --file or --image-url');
  }

  let json;
  if (filePath) {
    const absolutePath = path.resolve(filePath);
    const bytes = await readFile(absolutePath);
    const formData = new FormData();
    formData.set(
      'file',
      new File([bytes], path.basename(absolutePath), {
        type: guessMimeType(absolutePath),
      })
    );
    formData.set('wait', wait);

    json = await requestJson(`${config.baseUrl}/api/v1/watermark/remove`, {
      body: formData,
      headers: getHeaders(config.apiKey),
      method: 'POST',
    });
  } else {
    json = await requestJson(`${config.baseUrl}/api/v1/watermark/remove`, {
      body: JSON.stringify({
        imageUrl,
        wait,
      }),
      headers: getHeaders(config.apiKey, {
        'content-type': 'application/json',
      }),
      method: 'POST',
    });
  }

  await maybeDownloadOutput(json, args['download-to']);
  console.log(JSON.stringify(json, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printHelp();
    return;
  }

  const command = args._[0] || 'remove';

  if (command === 'help') {
    printHelp();
    return;
  }

  const config = getConfig(args);

  switch (command) {
    case 'credits':
      await runCredits(config);
      return;
    case 'task':
      await runTask(config, args);
      return;
    case 'remove':
      await runRemove(config, args);
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
