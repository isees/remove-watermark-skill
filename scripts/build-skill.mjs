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
const versionedZip = join(distDir, `remove-watermark-skill-${version}.zip`);

if (!existsSync(skillSourceDir)) {
  throw new Error(`Skill source not found: ${skillSourceDir}`);
}

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });
cpSync(skillSourceDir, stagedSkillDir, { recursive: true });

execFileSync(
  'tar',
  ['-a', '-c', '-f', versionedZip, skillSlug],
  { cwd: stageRoot, stdio: 'inherit' },
);
rmSync(stageRoot, { recursive: true, force: true });

console.log(`Built ${versionedZip}`);
