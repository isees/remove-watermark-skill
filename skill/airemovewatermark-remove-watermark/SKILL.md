---
name: airemovewatermark-remove-watermark
description: Remove image watermarks through the Airemovewatermark API with an API key. Supports local files, remote image URLs, task polling, and credits lookup.
---

# Remove Watermark

Use this skill when the user wants to remove a watermark from an image through
the Airemovewatermark API.

## What this skill does

- Sends a local image file to `POST /api/v1/watermark/remove`
- Sends a remote image URL to `POST /api/v1/watermark/remove`
- Queries credits through `GET /api/v1/credits`
- Polls a task through `GET /api/v1/watermark/tasks/:id`

## Required configuration

Set these before using the bundled script:

- `API_BASE_URL`
- `API_KEY`

Legacy fallback variables are also supported:

- `REMOVE_WATERMARK_BASE_URL`
- `REMOVE_WATERMARK_API_KEY`

Example:

```bash
export API_BASE_URL="https://your-domain.com"
export API_KEY="rwm_xxx"
```

On Windows PowerShell:

```powershell
$env:API_BASE_URL = "https://your-domain.com"
$env:API_KEY = "rwm_xxx"
```

## Bundled script

Use the bundled script for all calls:

- `scripts/remove_watermark.mjs`

Supported commands:

- `credits`
- `remove --file <path>`
- `remove --image-url <url>`
- `task --task-id <id>`

## Execution order

1. If the user asks whether credits are available, run `credits`
2. If the user provides a local image, run `remove --file ...`
3. If the user provides a remote image URL, run `remove --image-url ...`
4. Prefer `--wait true` for normal one-off requests
5. If the task is still processing, run `task --task-id ...`

## Example commands

```bash
node scripts/remove_watermark.mjs credits
```

```bash
node scripts/remove_watermark.mjs remove --file /absolute/path/to/image.png --wait true
```

```bash
node scripts/remove_watermark.mjs remove --image-url https://example.com/image.png --wait true
```

```bash
node scripts/remove_watermark.mjs task --task-id task_xxx
```

## Expected result shape

Successful responses return JSON. For `remove`, pay attention to:

- `data.task.status`
- `data.task.outputUrl`
- `data.pollUrl`
- `data.completed`

## Notes

- The API accepts either `Authorization: Bearer <key>` or `x-api-key`
- Output links are temporary and should be saved promptly
- If the API reports insufficient credits, stop and tell the user clearly
- Only use this skill for images you own or are authorized to edit
