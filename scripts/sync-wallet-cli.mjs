#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  cpSync,
  lstatSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { extract, list } from 'tar';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const walletCliSkillDir = join(repoRoot, 'skills', 'moss-wallet-cli');
const walletCliRepo = process.env.WALLET_CLI_REPO || 'megaeth-labs/wallet-cli';
const walletCliReleaseApi =
  process.env.WALLET_CLI_RELEASE_API ||
  `https://api.github.com/repos/${walletCliRepo}/releases/latest`;
const maxArchiveBytes = 100 * 1024 * 1024;
const maxChecksumBytes = 64 * 1024;
const maxExtractedBytes = 500 * 1024 * 1024;
const maxArchiveEntries = 20_000;
const releaseTagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const walletCliRoutingNote = `For protocol-specific contract addresses, calldata, and workflow recipes, use
\`megaeth-developer-skills\`; use this skill for \`mega moss\` execution and
delegated-key permission rules.`;

if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(walletCliRepo)) {
  throw new Error(`invalid WALLET_CLI_REPO: ${walletCliRepo}`);
}
const parsedReleaseApi = new URL(walletCliReleaseApi);
if (
  parsedReleaseApi.protocol !== 'https:' ||
  parsedReleaseApi.hostname !== 'api.github.com' ||
  parsedReleaseApi.username ||
  parsedReleaseApi.password ||
  parsedReleaseApi.search ||
  parsedReleaseApi.hash ||
  !parsedReleaseApi.pathname.startsWith(`/repos/${walletCliRepo}/releases/`)
) {
  throw new Error(`WALLET_CLI_RELEASE_API must be a GitHub release API URL for ${walletCliRepo}`);
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'megaeth-agent-skills-sync',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadFile(url, output, maxBytes) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`refusing non-HTTPS release asset URL: ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'megaeth-agent-skills-sync',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const advertisedSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(advertisedSize) && advertisedSize > maxBytes) {
    throw new Error(`release asset exceeds ${maxBytes} byte limit`);
  }
  if (!response.body) {
    throw new Error(`release asset response had no body: ${url}`);
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > maxBytes) {
      await response.body.cancel().catch(() => {});
      throw new Error(`release asset exceeds ${maxBytes} byte limit`);
    }
    chunks.push(Buffer.from(chunk));
  }
  writeFileSync(output, Buffer.concat(chunks, total));
}

function verifySha256(file, checksumFile) {
  const checksumText = readFileSync(checksumFile, 'utf8');
  const expected = checksumText.match(/\b[0-9a-fA-F]{64}\b/)?.[0]?.toLowerCase();
  if (!expected) {
    throw new Error(`invalid SHA-256 file: ${checksumFile}`);
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== expected) {
    throw new Error(`SHA-256 mismatch for ${basename(file)}: expected ${expected}, got ${actual}`);
  }
}

function validateArchivePath(entry, archive) {
  if (entry.meta) {
    return;
  }
  if (
    !entry.path ||
    entry.path.startsWith('/') ||
    entry.path.includes('\\') ||
    /[\0-\x1f\x7f]/.test(entry.path) ||
    entry.path.split('/').some((component) => component === '..' || component === '.')
  ) {
    throw new Error(`unsafe path in ${basename(archive)}: ${entry.path}`);
  }
}

function validateSelectedArchiveEntry(entry, archive) {
  validateArchivePath(entry, archive);
  if (!['File', 'OldFile', 'ContiguousFile', 'Directory'].includes(entry.type)) {
    throw new Error(`unsupported ${entry.type} entry in ${basename(archive)}: ${entry.path}`);
  }
}

async function inspectTarEntries(archive) {
  const entries = [];
  let entryCount = 0;
  let archiveBytes = 0;
  await list({
    file: archive,
    strict: true,
    maxDecompressionRatio: 100,
    onReadEntry(entry) {
      validateArchivePath(entry, archive);
      if (!entry.meta) {
        entryCount += 1;
        archiveBytes += entry.size;
        entries.push({ path: entry.path.replace(/\/$/, ''), size: entry.size, type: entry.type });
      }
      if (entryCount > maxArchiveEntries) {
        throw new Error(`${basename(archive)} exceeds ${maxArchiveEntries} entry limit`);
      }
      if (archiveBytes > maxExtractedBytes) {
        throw new Error(`${basename(archive)} exceeds ${maxExtractedBytes} expanded byte limit`);
      }
    },
  });
  return entries;
}

function validateExtractedTree(directory) {
  const entry = lstatSync(directory);
  if (!entry.isDirectory()) {
    throw new Error(`expected extracted directory: ${directory}`);
  }
  for (const child of readdirSync(directory)) {
    const path = join(directory, child);
    const childEntry = lstatSync(path);
    if (childEntry.isDirectory()) {
      validateExtractedTree(path);
    } else if (!childEntry.isFile()) {
      throw new Error(`unsupported extracted entry: ${path}`);
    }
  }
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

function validateRelease(release) {
  if (!releaseTagPattern.test(release.tag_name || '')) {
    throw new Error(`wallet-cli release has invalid tag: ${release.tag_name}`);
  }
  if (release.draft || release.prerelease || !release.published_at) {
    throw new Error(`wallet-cli ${release.tag_name} is not a published stable release`);
  }
}

async function syncWalletCliSkill() {
  const release = await fetchJson(walletCliReleaseApi);
  validateRelease(release);

  const assetName = `mega-wallet-cli-${release.tag_name}.tar.gz`;
  const asset = release.assets?.find((candidate) => candidate.name === assetName);
  if (!asset || asset.state !== 'uploaded') {
    throw new Error(`wallet-cli release ${release.tag_name} has no uploaded ${assetName}`);
  }
  if (!Number.isSafeInteger(asset.size) || asset.size < 1 || asset.size > maxArchiveBytes) {
    throw new Error(`${assetName} exceeds ${maxArchiveBytes} byte limit`);
  }
  const checksumAsset = release.assets?.find(
    (candidate) => candidate.name === `${assetName}.sha256`,
  );
  if (!checksumAsset || checksumAsset.state !== 'uploaded') {
    throw new Error(`wallet-cli release ${release.tag_name} has no SHA-256 for ${assetName}`);
  }
  if (
    !Number.isSafeInteger(checksumAsset.size) ||
    checksumAsset.size < 1 ||
    checksumAsset.size > maxChecksumBytes
  ) {
    throw new Error(`${checksumAsset.name} exceeds ${maxChecksumBytes} byte limit`);
  }

  const stage = mkdtempSync(join(tmpdir(), 'wallet-cli-release-'));
  try {
    const archive = join(stage, asset.name);
    const checksum = join(stage, checksumAsset.name);
    await downloadFile(asset.browser_download_url, archive, maxArchiveBytes);
    await downloadFile(checksumAsset.browser_download_url, checksum, maxChecksumBytes);
    verifySha256(archive, checksum);
    const archiveEntries = await inspectTarEntries(archive);
    const releaseRootName = `mega-wallet-cli-${release.tag_name}`;
    const skillPath = `${releaseRootName}/SKILL.md`;
    const referencesPath = `${releaseRootName}/references`;
    const selectedPath = (path) =>
      path === releaseRootName ||
      path === skillPath ||
      path === referencesPath ||
      path.startsWith(`${referencesPath}/`);

    if (
      !archiveEntries.some((entry) => entry.path === skillPath && entry.type === 'File') ||
      !archiveEntries.some(
        (entry) => entry.path === `${referencesPath}/permissions.md` && entry.type === 'File',
      )
    ) {
      throw new Error(
        `${asset.name} did not contain ${skillPath} and ${referencesPath}/permissions.md`,
      );
    }
    for (const entry of archiveEntries.filter((candidate) => selectedPath(candidate.path))) {
      validateSelectedArchiveEntry(entry, archive);
    }

    await extract({
      file: archive,
      cwd: stage,
      strict: true,
      preservePaths: false,
      unlink: true,
      noChmod: true,
      noMtime: true,
      maxDecompressionRatio: 100,
      filter(path, entry) {
        const normalizedPath = path.replace(/\/$/, '');
        if (!selectedPath(normalizedPath)) {
          return false;
        }
        validateSelectedArchiveEntry(entry, archive);
        return true;
      },
    });
    const releaseRoot = join(stage, releaseRootName);
    validateExtractedTree(releaseRoot);

    writeFileSync(
      join(walletCliSkillDir, 'SKILL.md'),
      adaptWalletCliSkill(readFileSync(join(releaseRoot, 'SKILL.md'), 'utf8')),
    );
    const referencesDir = join(walletCliSkillDir, 'references');
    rmSync(referencesDir, { recursive: true, force: true });
    cpSync(join(releaseRoot, 'references'), referencesDir, {
      recursive: true,
      dereference: true,
    });
    console.log(`synced moss-wallet-cli from ${walletCliRepo} ${release.tag_name}`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

await syncWalletCliSkill();
