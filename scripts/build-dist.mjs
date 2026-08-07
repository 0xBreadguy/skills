#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  utimesSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const walletCliSkillDir = join(repoRoot, 'skills', 'moss-wallet-cli');
const reproducibleTimestamp = new Date('2000-01-01T00:00:00.000Z');

const skillRoots = [
  join(repoRoot, 'skills', 'megaeth-developer-skills'),
  join(repoRoot, 'skills', 'moss-wallet-sdk'),
  walletCliSkillDir,
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

function normalizeTimestamps(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      normalizeTimestamps(path);
    }
    utimesSync(path, reproducibleTimestamp, reproducibleTimestamp);
  }
  utimesSync(directory, reproducibleTimestamp, reproducibleTimestamp);
}

function listArchiveEntries(directory) {
  const entries = [];

  function visit(current) {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(current, entry.name);
      const archivePath = relative(directory, path);
      if (entry.isDirectory()) {
        entries.push(`${archivePath}/`);
        visit(path);
      } else if (entry.isFile()) {
        entries.push(archivePath);
      } else {
        throw new Error(`unsupported archive entry: ${archivePath}`);
      }
    }
  }

  visit(directory);
  return entries;
}

function buildArchive(output, skills) {
  const stage = mkdtempSync(join(tmpdir(), 'megaeth-agent-skills-dist-'));
  try {
    for (const skillPath of skills) {
      copySkillToStage(skillPath, stage);
    }
    normalizeTimestamps(stage);
    const entries = listArchiveEntries(stage);
    const result = spawnSync('zip', ['-q', '-X', output, ...entries], {
      cwd: stage,
      env: { ...process.env, TZ: 'UTC' },
      stdio: 'inherit',
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`zip failed for ${output}`);
    }
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

const zipCheck = spawnSync('zip', ['-v'], { stdio: 'ignore' });
if (zipCheck.error || zipCheck.status !== 0) {
  throw new Error('zip command is required to build dist archives');
}

for (const skillPath of skillRoots) {
  if (!existsSync(join(skillPath, 'SKILL.md'))) {
    throw new Error(`missing SKILL.md in ${skillPath}`);
  }
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const skillPath of skillRoots) {
  buildArchive(join(distDir, `${basename(skillPath)}.zip`), [skillPath]);
}

for (const group of groups) {
  buildArchive(join(distDir, group.name), group.skills);
}

const archives = readdirSync(distDir).filter((file) => file.endsWith('.zip')).sort();
for (const archive of archives) {
  console.log(`built dist/${archive}`);
}
