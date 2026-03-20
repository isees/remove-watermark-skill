# Remove Watermark Skill

Official skill project for calling the Airemovewatermark API from claw-style
agent runtimes.

## What It Does

- removes watermarks through `POST /api/v1/watermark/remove`
- polls tasks through `GET /api/v1/watermark/tasks/:id`
- can optionally check credits through `GET /api/v1/credits`
- can optionally download the finished image to a local path

## Install

The skill folder that users install should be named:

- `airemove-watermark`

You can install it in either:

- the current workspace under `./skills`
- the global OpenClaw user directory under `~/.openclaw/skills`

Quick install for local testing:

1. Copy `skill/airemove-watermark` into the OpenClaw skills directory.
3. Set `API_KEY` in the runtime environment.
4. Ask the agent to remove a watermark from a local file or image URL.

For website distribution, the packaged archive should extract to:

```text
airemove-watermark/
  manifest.yaml
  SKILL.md
  scripts/
    remove_watermark.mjs
```

## Required Environment Variables

Required:

- `API_KEY`

Optional override:

- `API_BASE_URL`

Legacy fallback variables are also supported:

- `REMOVE_WATERMARK_BASE_URL`
- `REMOVE_WATERMARK_API_KEY`

Example:

```env
API_KEY=rwm_xxx
```

Default API base URL:

- `https://airemovewatermark.net`

Only set `API_BASE_URL` when you need to point the skill at another deployment.

## Recommended Endpoints

- `POST /api/v1/watermark/remove`
- `GET /api/v1/watermark/tasks/:id`
- `GET /api/v1/credits` for optional balance checks

## Agent Usage Pattern

Recommended first call:

```bash
node scripts/remove_watermark.mjs remove --file /absolute/path/to/image.png --wait true --download-to /absolute/path/to/output.png
```

Alternative remote image call:

```bash
node scripts/remove_watermark.mjs remove --image-url https://example.com/image.png --wait true
```

Later polling call:

```bash
node scripts/remove_watermark.mjs task --task-id task_xxx --download-to /absolute/path/to/output.png
```

The bundled script also supports `--help`.

## ClawHub Publish Shape

This project includes a `manifest.yaml` alongside `SKILL.md` inside the
published skill directory so the packaged skill is easier to distribute and
inspect.

Current publish-oriented files inside the skill package:

- `manifest.yaml`
- `SKILL.md`
- `scripts/remove_watermark.mjs`

ClawHub-facing runtime metadata is declared in `SKILL.md` frontmatter:

- `name`
- `description`
- `version`
- `metadata.clawdbot.requires`
- `metadata.clawdbot.primaryEnv`

Supplemental packaging metadata remains in `manifest.yaml`:

- slug: `airemove-watermark`
- display name: `AI Remove Watermark`
- license: `MIT-0`

## Local Layout

```text
remove-watermark-skill/
  skill/
    airemove-watermark/
      SKILL.md
      scripts/
        remove_watermark.mjs
```

## Package

This repository is already the standalone public skill project. For local use,
you can install directly from `skill/airemove-watermark/` or zip that folder
for manual distribution.

Build the distributable archives with:

```bash
pnpm build
```

This creates:

- `dist/remove-watermark-skill-0.1.5.zip`

The archive extracts to `airemove-watermark/`, which matches the current
install directory and marketplace slug.

## ClawHub Readiness

Recommended publish flow:

1. Review the `SKILL.md` frontmatter and `manifest.yaml`
2. Tag a version
3. Publish the skill to ClawHub from the skill root that contains `SKILL.md`
   and supporting text files
4. Accept ClawHub's MIT-0 publish terms in the publish UI when prompted
