# Remove Watermark Skill

Official skill project for calling the Airemovewatermark API from claw-style
agent runtimes.

This repository subtree is designed to be:

- maintained inside the main product repository for easier local development
- packaged directly for website downloads
- synced later to a standalone public GitHub repository
- published to ClawHub when ready

Naming strategy:

- package name stays capability-focused: `@airemovewatermark/remove-watermark`
- local project directory stays platform-neutral:
  `remove-watermark-skill`
- install directory and ClawHub slug stay globally unique:
  `airemovewatermark-remove-watermark`

## What It Does

- checks credits through `GET /api/v1/credits`
- removes watermarks through `POST /api/v1/watermark/remove`
- polls tasks through `GET /api/v1/watermark/tasks/:id`

## Install

The skill folder that users install should be named:

- `airemovewatermark-remove-watermark`

You can install it in either:

- the current workspace under `./skills`
- the global OpenClaw user directory under `~/.openclaw/skills`

For website distribution, the packaged archive should extract to:

```text
airemovewatermark-remove-watermark/
  SKILL.md
  scripts/
    remove_watermark.mjs
```

## Required Environment Variables

Preferred:

- `API_BASE_URL`
- `API_KEY`

Legacy fallback variables are also supported:

- `REMOVE_WATERMARK_BASE_URL`
- `REMOVE_WATERMARK_API_KEY`

Example:

```env
API_BASE_URL=https://your-domain.com
API_KEY=rwm_xxx
```

## Recommended Endpoints

- `GET /api/v1/credits`
- `POST /api/v1/watermark/remove`
- `GET /api/v1/watermark/tasks/:id`

## Local Layout

```text
remove-watermark-skill/
  skill/
    airemovewatermark-remove-watermark/
      SKILL.md
      scripts/
        remove_watermark.mjs
```

## Build

From the root repository:

```bash
pnpm skill:build
```

This command will:

- refresh `skills/airemovewatermark-remove-watermark`
- create `public/skills/airemovewatermark-remove-watermark/latest.zip`
- create a versioned package under `remove-watermark-skill/dist/`

## Open Source Sync

This project is designed so the whole `remove-watermark-skill/` directory can
be copied or synced into a standalone public GitHub repository without
including the private product code from the main app repository.

Root-level files intended for the public repository:

- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- `package.json`
- `skill/airemovewatermark-remove-watermark/**`

## ClawHub Readiness

Suggested future ClawHub slug:

- `airemovewatermark-remove-watermark`

Suggested future public repository name:

- `remove-watermark-skill`

Recommended publish flow:

1. Sync this subtree to a standalone public repository
2. Tag a version
3. Publish the skill to ClawHub from the standalone repository or local clone

## Publish Later

When you are ready to publish independently, this subtree can be copied to a
standalone public repository with very little cleanup.
