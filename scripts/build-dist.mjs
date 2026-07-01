#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const walletCliSkillDir = join(repoRoot, 'skills', 'moss-wallet-cli');
const walletCliRepo = process.env.WALLET_CLI_REPO || 'megaeth-labs/wallet-cli';
const walletCliReleaseApi =
  process.env.WALLET_CLI_RELEASE_API ||
  `https://api.github.com/repos/${walletCliRepo}/releases/latest`;

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

const walletCliRoutingNote = `For protocol-specific contract addresses, calldata, and workflow recipes, use
\`megaeth-developer-skills\`; use this skill for \`mega moss\` execution and
delegated-key permission rules.`;

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

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'moss-skills-build',
    },
  });
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadFile(url, output) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'moss-skills-build' },
  });
  if (!response.ok) {
    throw new Error(`failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  writeFileSync(output, Buffer.from(await response.arrayBuffer()));
}

function findWalletCliReleaseRoot(root) {
  const queue = [{ dir: root, depth: 0 }];
  while (queue.length > 0) {
    const { dir, depth } = queue.shift();
    if (
      existsSync(join(dir, 'SKILL.md')) &&
      existsSync(join(dir, 'references', 'permissions.md'))
    ) {
      return dir;
    }
    if (depth >= 2) {
      continue;
    }
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') {
        continue;
      }
      const child = join(dir, entry);
      if (statSync(child).isDirectory()) {
        queue.push({ dir: child, depth: depth + 1 });
      }
    }
  }
  throw new Error('wallet-cli release archive did not contain SKILL.md and references/permissions.md');
}

function adaptWalletCliSkill(skillSource) {
  let skill = skillSource.replace(/^name:\s*mega-wallet-cli\s*$/m, 'name: moss-wallet-cli');
  if (!/^name:\s*moss-wallet-cli\s*$/m.test(skill)) {
    throw new Error('wallet-cli SKILL.md frontmatter did not contain expected name');
  }
  if (!skill.includes('For protocol-specific contract addresses')) {
    const marker = '\n## Transfer Funds\n';
    if (!skill.includes(marker)) {
      throw new Error('wallet-cli SKILL.md missing expected Transfer Funds section');
    }
    skill = skill.replace(marker, `\n${walletCliRoutingNote}\n\n## Transfer Funds\n`);
  }
  return skill;
}

async function syncWalletCliSkillFromLatestRelease() {
  const release = await fetchJson(walletCliReleaseApi);
  const asset = release.assets?.find((candidate) =>
    /^mega-wallet-cli-v[^/]+\.tar\.gz$/.test(candidate.name),
  );
  if (!asset) {
    throw new Error(`latest wallet-cli release ${release.tag_name} has no mega-wallet-cli tarball`);
  }

  const stage = mkdtempSync(join(tmpdir(), 'wallet-cli-release-'));
  try {
    const archive = join(stage, asset.name);
    await downloadFile(asset.browser_download_url, archive);
    const result = spawnSync('tar', ['-xzf', archive, '-C', stage], { stdio: 'inherit' });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`tar failed for ${asset.name}`);
    }

    const releaseRoot = findWalletCliReleaseRoot(stage);
    writeFileSync(
      join(walletCliSkillDir, 'SKILL.md'),
      adaptWalletCliSkill(readFileSync(join(releaseRoot, 'SKILL.md'), 'utf8')),
    );
    const referencesDir = join(walletCliSkillDir, 'references');
    rmSync(referencesDir, { recursive: true, force: true });
    mkdirSync(referencesDir, { recursive: true });
    cpSync(
      join(releaseRoot, 'references', 'permissions.md'),
      join(referencesDir, 'permissions.md'),
    );
    console.log(`synced moss-wallet-cli from ${walletCliRepo} ${release.tag_name}`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

const zipCheck = spawnSync('zip', ['-v'], { stdio: 'ignore' });
if (zipCheck.error || zipCheck.status !== 0) {
  throw new Error('zip command is required to build dist archives');
}

await syncWalletCliSkillFromLatestRelease();

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
