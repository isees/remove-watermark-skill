#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

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

function getConfig(args) {
  const baseUrl = String(
    args['base-url'] ||
      process.env.API_BASE_URL ||
      process.env.REMOVE_WATERMARK_BASE_URL ||
      ''
  ).trim();
  const apiKey = String(
    args['api-key'] ||
      process.env.API_KEY ||
      process.env.REMOVE_WATERMARK_API_KEY ||
      ''
  ).trim();

  if (!baseUrl) {
    throw new Error(
      'Missing base URL. Set API_BASE_URL, REMOVE_WATERMARK_BASE_URL, or --base-url'
    );
  }

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

  console.log(JSON.stringify(json, null, 2));
}

async function runRemove(config, args) {
  const filePath = String(args.file || '').trim();
  const imageUrl = String(args['image-url'] || '').trim();
  const wait = String(args.wait || 'true').trim().toLowerCase();

  if (!filePath && !imageUrl) {
    throw new Error('Provide --file or --image-url');
  }

  if (filePath && imageUrl) {
    throw new Error('Provide only one of --file or --image-url');
  }

  let response;
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

    response = await requestJson(`${config.baseUrl}/api/v1/watermark/remove`, {
      body: formData,
      headers: getHeaders(config.apiKey),
      method: 'POST',
    });
  } else {
    response = await requestJson(`${config.baseUrl}/api/v1/watermark/remove`, {
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

  console.log(JSON.stringify(response, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'remove';
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
