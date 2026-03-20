# Changelog

This changelog tracks the standalone skill project intended for website
distribution, public GitHub sync, and future ClawHub publication.

## 0.1.7

- Simplified the published skill contract so `API_KEY` is the only required environment variable
- Made local downloads explicit with `--download true` and removed arbitrary output path overrides
- Restricted auto-saved files to the local artifacts directory and trusted HTTPS output hosts
- Added a package-time safety check so `.env`, key, and certificate files cannot be included in the distributed zip

## 0.1.6

- Optimized the CLI output for chat-style runtimes with top-level `status`, `result_file`, and `result_summary`
- Defaulted completed jobs to auto-download into a stable local artifacts directory
- Reworded common API failures into human-readable messages that are easier to relay back to users

## 0.1.5

- Shortened the published skill slug to `airemove-watermark`
- Renamed the display name to `AI Remove Watermark`
- Switched runtime metadata from `metadata.openclaw` to the preferred `metadata.clawdbot`
- Removed old subtree-sync wording so the repository reads as a standalone open-source skill project

## 0.1.0

- Initial standalone remove-watermark skill project for Airemovewatermark
- Supports credits lookup, watermark removal, and task polling
- Includes direct-install packaging for website distribution

## 0.1.1

- Clarified OpenClaw-oriented skill instructions and trigger wording
- Added `--help` support to the bundled script
- Added `--download-to` support so agents can save finished images locally
- Updated install and usage docs for easier local OpenClaw integration

## 0.1.2

- Defaulted the skill to the official production API base URL
- Made `API_BASE_URL` an optional override instead of required setup
- Added a `manifest.yaml` scaffold to the published skill package for ClawHub-style publishing
- Updated README and skill docs to reflect the simpler install flow

## 0.1.3

- Added an explicit display name to the skill manifest for marketplace publishing
- Updated published metadata from MIT to MIT-0 to better match ClawHub publishing requirements
- Documented that the MIT-0 terms still need to be accepted in the ClawHub publish UI

## 0.1.4

- Added explicit runtime declarations to `SKILL.md` frontmatter
- Clarified that ClawHub reads runtime metadata from `SKILL.md` and treats `manifest.yaml` as supplemental packaging metadata
- Documented that `remove --wait true` only does short polling before the caller should continue with task polling
