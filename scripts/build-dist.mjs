#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');

const skillRoots = [
  join(repoRoot, 'skills', 'megaeth-developer-skills'),
  join(repoRoot, 'skills', 'moss-wallet-sdk'),
  join(repoRoot, 'skills', 'moss-wallet-cli'),
  join(repoRoot, 'skills', 'moss-wallet-security-review'),
];

const groups = [
  {
    name: 'moss-wallet-skills.zip',
    skills: [
      join(repoRoot, 'skills', 'moss-wallet-sdk'),
      join(repoRoot, 'skills', 'moss-wallet-cli'),
      join(repoRoot, 'skills', 'moss-wallet-security-review'),
    ],
  },
  {
    name: 'megaeth-skills.zip',
    skills: skillRoots,
  },
];

function runZip(output, cwd, entries) {
  const args = ['-qr', output, ...entries];
  const result = spawnSync('zip', args, { cwd, stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`zip failed for ${output}`);
  }
}

function copySkillToStage(skillPath, stageDir) {
  const name = basename(skillPath);
  const target = join(stageDir, name);
  cpSync(skillPath, target, {
    recursive: true,
    dereference: true,
    filter: (source) => !source.includes(`${name}/.DS_Store`),
  });
  return name;
}

const zipCheck = spawnSync('zip', ['-v'], { stdio: 'ignore' });
if (zipCheck.error || zipCheck.status !== 0) {
  throw new Error('zip command is required to build dist archives');
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const skillPath of skillRoots) {
  if (!existsSync(join(skillPath, 'SKILL.md'))) {
    throw new Error(`missing SKILL.md in ${skillPath}`);
  }
  const out = join(distDir, `${basename(skillPath)}.zip`);
  runZip(out, dirname(skillPath), [basename(skillPath)]);
}

for (const group of groups) {
  const stage = mkdtempSync(join(tmpdir(), 'moss-skills-dist-'));
  try {
    const entries = group.skills.map((skillPath) => copySkillToStage(skillPath, stage));
    runZip(join(distDir, group.name), stage, entries);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

const archives = readdirSync(distDir).filter((file) => file.endsWith('.zip')).sort();
for (const archive of archives) {
  console.log(`built dist/${archive}`);
}
