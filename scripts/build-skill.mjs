import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
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
const blockedNamePatterns = [
  /^\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.crt$/i,
  /\.cer$/i,
];

if (!existsSync(skillSourceDir)) {
  throw new Error(`Skill source not found: ${skillSourceDir}`);
}

function walkFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function assertSafePublishedFiles(dir) {
  const files = walkFiles(dir);
  for (const filePath of files) {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    if (blockedNamePatterns.some((pattern) => pattern.test(fileName))) {
      throw new Error(
        `Refusing to package sensitive-looking file: ${filePath}`,
      );
    }

    const size = statSync(filePath).size;
    if (size > 5 * 1024 * 1024) {
      throw new Error(
        `Refusing to package unexpectedly large file: ${filePath}`,
      );
    }
  }
}

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });
cpSync(skillSourceDir, stagedSkillDir, { recursive: true });
assertSafePublishedFiles(stagedSkillDir);

execFileSync(
  'tar',
  ['-a', '-c', '-f', versionedZip, skillSlug],
  { cwd: stageRoot, stdio: 'inherit' },
);
rmSync(stageRoot, { recursive: true, force: true });

console.log(`Built ${versionedZip}`);
