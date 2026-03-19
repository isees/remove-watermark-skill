import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packageJson = JSON.parse(
  readFileSync(join(rootDir, 'package.json'), 'utf8'),
);
const version = packageJson.version;
const skillSlug = 'airemove-watermark';
const skillSourceDir = join(rootDir, 'skill', skillSlug);
const distDir = join(rootDir, 'dist');
const stageRoot = join(distDir, '__stage__');
const stagedSkillDir = join(stageRoot, skillSlug);
const latestZip = join(distDir, 'latest.zip');
const versionedZip = join(distDir, `remove-watermark-skill-${version}.zip`);

if (!existsSync(skillSourceDir)) {
  throw new Error(`Skill source not found: ${skillSourceDir}`);
}

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });
cpSync(skillSourceDir, stagedSkillDir, { recursive: true });

rmSync(latestZip, { force: true });
rmSync(versionedZip, { force: true });

execFileSync(
  'tar',
  ['-a', '-c', '-f', latestZip, skillSlug],
  { cwd: stageRoot, stdio: 'inherit' },
);
cpSync(latestZip, versionedZip);
rmSync(stageRoot, { recursive: true, force: true });

console.log(`Built ${latestZip}`);
console.log(`Built ${versionedZip}`);
