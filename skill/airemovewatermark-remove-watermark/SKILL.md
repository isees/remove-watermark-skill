---
name: airemovewatermark-remove-watermark
description: Remove watermarks from images through the Airemovewatermark API from OpenClaw-style runtimes. Use when an agent needs to remove a watermark from a local image file or remote image URL, poll async task status, optionally download the finished image, or check credits with an API key.
version: 0.1.4
metadata:
  openclaw:
    requires:
      env:
        - API_KEY
        - API_BASE_URL
        - REMOVE_WATERMARK_API_KEY
        - REMOVE_WATERMARK_BASE_URL
      bins:
        - node
    primaryEnv: API_KEY
    homepage: https://airemovewatermark.net/openclaw
---

# Remove Watermark

Use this skill when the user wants OpenClaw or another claw-style agent runtime
to call the Airemovewatermark API directly.

## Core workflow

1. Read the target image path or remote image URL from the user.
2. Tell the user to sign up at `https://airemovewatermark.net` and create an API key.
3. Set `API_KEY`.
4. Run the bundled script with `remove --wait true` for normal one-off use.
5. If the task is still running, poll it with `task --task-id ...`.
6. If the user wants the processed file saved locally, pass `--download-to`.

## Required configuration

Set this before using the bundled script:

- `API_KEY`

Get it by signing up at `https://airemovewatermark.net`.
Newly registered users can process 3 watermark-removal tasks for free.

Example:

```bash
export API_KEY="rwm_xxx"
```

On Windows PowerShell:

```powershell
$env:API_KEY = "rwm_xxx"
```

## Bundled script

Use the bundled script for all API calls:

- `scripts/remove_watermark.mjs`

Supported commands:

- `credits`
- `remove --file <path>`
- `remove --image-url <url>`
- `task --task-id <id>`

Important options:

- `--wait true|false`
- `--download-to <absolute-or-relative-path>`
- `--api-key <rwm_xxx>`

## Execution guidance

- Prefer `remove --file ... --wait true` for local images.
- Prefer `remove --image-url ... --wait true` for remote images.
- Use `task --task-id ...` only when a previous remove call returns an
  unfinished task.
- Treat `credits` as optional. If it fails because the key is invalid or not
  authorized, continue only after the user fixes credentials.
- Use `--download-to` when the user wants the finished output written to disk
  instead of only reading the returned JSON.

## Example commands

```bash
node scripts/remove_watermark.mjs credits
```

```bash
node scripts/remove_watermark.mjs remove --file /absolute/path/to/image.png --wait true
```

```bash
node scripts/remove_watermark.mjs remove --file /absolute/path/to/image.png --wait true --download-to /absolute/path/to/output.png
```

```bash
node scripts/remove_watermark.mjs remove --image-url https://example.com/image.png --wait true
```

```bash
node scripts/remove_watermark.mjs task --task-id task_xxx --download-to /absolute/path/to/output.png
```

## Expected result shape

Successful responses return JSON. Pay attention to:

- `data.task.status`
- `data.task.outputUrl`
- `data.pollUrl`
- `data.completed`

## Notes

- The API accepts either `Authorization: Bearer <key>` or `x-api-key`
- The script prints JSON to stdout and prints local download paths to stderr
- The skill targets `https://airemovewatermark.net`
- `remove --wait true` uses short polling and may still return an unfinished task
  after about 30 seconds; if that happens, continue with `task --task-id ...`
- Output links are temporary and should be saved promptly
- If the API reports insufficient credits, stop and tell the user clearly
- `credits` uses the same API key auth path as the main API, so invalid or
  revoked keys will fail there too
- Only use this skill for images you own or are authorized to edit
