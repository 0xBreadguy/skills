#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(repoRoot, 'skills');
const errors = [];

function walk(directory, predicate = () => true) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path, predicate));
    } else if (predicate(path)) {
      files.push(path);
    }
  }
  return files;
}

function display(path) {
  return relative(repoRoot, path);
}

function validateSkill(skillDir) {
  const skillName = skillDir.split('/').at(-1);
  const skillFile = join(skillDir, 'SKILL.md');
  if (!existsSync(skillFile)) {
    errors.push(`${display(skillDir)}: missing SKILL.md`);
    return;
  }

  const source = readFileSync(skillFile, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) {
    errors.push(`${display(skillFile)}: missing YAML frontmatter`);
    return;
  }

  const name = frontmatter[1].match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
  if (name !== skillName) {
    errors.push(`${display(skillFile)}: frontmatter name must be ${skillName}`);
  }
  if (!name || name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    errors.push(`${display(skillFile)}: name must be 1-64 lowercase letters, numbers, or hyphens`);
  }

  const descriptionLine = frontmatter[1].match(/^description:\s*(.*)$/m);
  if (!descriptionLine) {
    errors.push(`${display(skillFile)}: frontmatter description is required`);
  } else if (!descriptionLine[1].trim()) {
    errors.push(`${display(skillFile)}: frontmatter description is empty`);
  }
}

function localLinkTargets(source) {
  const targets = [];
  const inline = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const definitions = /^\s*\[[^\]]+\]:\s*(\S+)/gm;
  for (const match of source.matchAll(inline)) {
    targets.push(match[1].trim());
  }
  for (const match of source.matchAll(definitions)) {
    targets.push(match[1].trim());
  }
  return targets;
}

function normalizeLinkTarget(rawTarget) {
  if (rawTarget.startsWith('<')) {
    return rawTarget.slice(1, rawTarget.indexOf('>'));
  }
  return rawTarget.split(/\s+/)[0];
}

function validateLinks(markdownFile) {
  const source = readFileSync(markdownFile, 'utf8');
  const prose = source.replace(/^\s*(```|~~~)[^\r\n]*\r?\n[\s\S]*?^\s*\1\s*$/gm, '');
  for (const rawTarget of localLinkTargets(prose)) {
    const target = normalizeLinkTarget(rawTarget);
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) {
      continue;
    }
    if (target.startsWith('/')) {
      errors.push(`${display(markdownFile)}: public markdown link is absolute: ${target}`);
      continue;
    }

    const pathPart = target.split(/[?#]/, 1)[0];
    let decoded;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      errors.push(`${display(markdownFile)}: malformed link target: ${target}`);
      continue;
    }
    const destination = resolve(dirname(markdownFile), decoded);
    if (!existsSync(destination)) {
      errors.push(`${display(markdownFile)}: broken local link: ${target}`);
    }
  }

  for (const forbidden of ['/Users/', '/tmp/moss-release-audit']) {
    if (source.includes(forbidden)) {
      errors.push(`${display(markdownFile)}: contains private local path ${forbidden}`);
    }
  }
}

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    const details = (result.stderr || result.stdout || result.error?.message || '').trim();
    errors.push(`${label}${details ? `: ${details}` : ''}`);
  }
}

const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(skillsDir, entry.name))
  .sort();

for (const skillDir of skillDirs) {
  validateSkill(skillDir);
}

const markdownFiles = [join(repoRoot, 'README.md'), ...walk(skillsDir, (path) => path.endsWith('.md'))];
if (existsSync(join(repoRoot, 'docs'))) {
  markdownFiles.push(...walk(join(repoRoot, 'docs'), (path) => path.endsWith('.md')));
}
for (const markdownFile of markdownFiles) {
  validateLinks(markdownFile);
}

for (const script of walk(join(repoRoot, 'scripts'), (path) => path.endsWith('.mjs'))) {
  run(process.execPath, ['--check', script], `${display(script)}: syntax check failed`);
}
for (const script of walk(skillsDir, (path) => path.endsWith('.mjs'))) {
  run(process.execPath, ['--check', script], `${display(script)}: syntax check failed`);
}

const expectedArchives = new Map([
  ['megaeth-developer-skills.zip', ['megaeth-developer-skills/SKILL.md']],
  ['moss-wallet-sdk.zip', ['moss-wallet-sdk/SKILL.md']],
  ['moss-wallet-cli.zip', ['moss-wallet-cli/SKILL.md']],
  ['moss-wallet-security-review.zip', ['moss-wallet-security-review/SKILL.md']],
  [
    'moss-wallet-skills.zip',
    [
      'moss-wallet-sdk/SKILL.md',
      'moss-wallet-cli/SKILL.md',
      'moss-wallet-security-review/SKILL.md',
    ],
  ],
  [
    'megaeth-skills.zip',
    skillDirs.map((skillDir) => `${skillDir.split('/').at(-1)}/SKILL.md`),
  ],
]);

for (const [archiveName, expectedEntries] of expectedArchives) {
  const archive = join(repoRoot, 'dist', archiveName);
  if (!existsSync(archive)) {
    errors.push(`dist/${archiveName}: missing archive`);
    continue;
  }
  run('unzip', ['-tqq', archive], `dist/${archiveName}: archive integrity failed`);
  const listing = spawnSync('unzip', ['-Z1', archive], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (listing.error || listing.status !== 0) {
    errors.push(`dist/${archiveName}: could not inspect archive contents`);
    continue;
  }
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean);
  for (const entry of entries) {
    if (entry.startsWith('/') || entry.split('/').includes('..') || entry.endsWith('.DS_Store')) {
      errors.push(`dist/${archiveName}: unsafe or unwanted entry: ${entry}`);
    }
  }
  for (const expectedEntry of expectedEntries) {
    if (!entries.includes(expectedEntry)) {
      errors.push(`dist/${archiveName}: missing ${expectedEntry}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`repository validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `validated ${skillDirs.length} skills, ${markdownFiles.length} markdown files, and ${expectedArchives.size} archives`,
);
