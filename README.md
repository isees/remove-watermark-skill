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

- removes watermarks through `POST /api/v1/watermark/remove`
- polls tasks through `GET /api/v1/watermark/tasks/:id`
- can optionally check credits through `GET /api/v1/credits`
- can optionally download the finished image to a local path

## Install

The skill folder that users install should be named:

- `airemovewatermark-remove-watermark`

You can install it in either:

- the current workspace under `./skills`
- the global OpenClaw user directory under `~/.openclaw/skills`

Quick install for local testing:

1. Run `pnpm skill:build` in this repository.
2. Copy `skills/airemovewatermark-remove-watermark` into the OpenClaw skills directory.
3. Set `API_KEY` in the runtime environment.
4. Ask the agent to remove a watermark from a local file or image URL.

For website distribution, the packaged archive should extract to:

```text
airemovewatermark-remove-watermark/
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
- `metadata.openclaw.requires`
- `metadata.openclaw.primaryEnv`

Supplemental packaging metadata remains in `manifest.yaml`:

- slug: `airemovewatermark-remove-watermark`
- display name: `Airemovewatermark Remove Watermark`
- license: `MIT-0`

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
3. Publish the skill to ClawHub from the skill root that contains `SKILL.md`
   and supporting text files
4. Accept ClawHub's MIT-0 publish terms in the publish UI when prompted

## Publish Later

When you are ready to publish independently, this subtree can be copied to a
standalone public repository with very little cleanup.
