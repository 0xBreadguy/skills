#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMigrationPlan } from '../skills/moss-wallet-sdk/scripts/build-migration-plan.mjs';
import { buildPermissionPolicy } from '../skills/moss-wallet-sdk/scripts/build-permission-policy.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const addressA = '0x1111111111111111111111111111111111111111';
const addressB = '0x2222222222222222222222222222222222222222';
const tokenA = '0x3333333333333333333333333333333333333333';
const nftA = '0x4444444444444444444444444444444444444444';

const policy = buildPermissionPolicy({
  ttlSeconds: 3600,
  calls: [{ to: addressA, signature: 'mint(uint256)' }],
  spend: [{ token: tokenA, limit: '1000000000000000000', period: 'day' }],
});
assert.equal(policy.permissions.permissions.calls[0].to, addressA);
assert.equal(policy.permissions.permissions.spend[0].limit, 1000000000000000000n);
assert.throws(
  () => buildPermissionPolicy({ ttlSeconds: 1.5, calls: [], spend: [{ limit: '1', period: 'day' }] }),
  /positive integer/,
);
assert.throws(
  () => buildPermissionPolicy({ ttlSeconds: 60, calls: [{ to: '0x1234', signature: 'x()' }], spend: [] }),
  /20-byte/,
);
assert.throws(
  () => buildPermissionPolicy({ ttlSeconds: 60, calls: [], spend: [{ limit: 1e21, period: 'day' }] }),
  /unsafe JavaScript number/,
);

const migration = buildMigrationPlan({
  from: addressA,
  to: addressB,
  chainId: 4326,
  gasReserve: '100',
  allowlist: [tokenA, nftA],
  balances: [
    { type: 'native', amount: '1000' },
    { type: 'erc721', contractAddress: nftA, tokenId: '42' },
    { type: 'erc20', contractAddress: tokenA, amount: '500' },
  ],
});
assert.deepEqual(migration.map(({ type }) => type), ['erc20', 'erc721', 'native']);
assert.equal(migration[1].tokenId, '42');
assert.equal(migration[2].amount, '900');
assert.throws(
  () =>
    buildMigrationPlan({
      from: addressA,
      to: addressB,
      chainId: 4326,
      gasReserve: '1',
      allowlist: [nftA],
      balances: [{ type: 'erc721', contractAddress: nftA }],
    }),
  /requires tokenId/,
);
assert.throws(
  () =>
    buildMigrationPlan({
      from: addressA,
      to: addressB,
      chainId: 4326,
      gasReserve: 1e21,
      allowlist: [],
      balances: [],
    }),
  /safe integer/,
);

const secureContextScript = join(
  repoRoot,
  'skills',
  'moss-wallet-sdk',
  'scripts',
  'check-secure-context.mjs',
);

function checkSecureContext(url, expectedStatus, expectedPrefix) {
  const result = spawnSync(process.execPath, [secureContextScript, url], { encoding: 'utf8' });
  assert.equal(result.status, expectedStatus, `${url}: ${result.stdout}${result.stderr}`);
  assert.match(result.stdout, new RegExp(`^${expectedPrefix}:`));
}

checkSecureContext('http://localhost:5173', 0, 'OK');
checkSecureContext('http://192.168.1.50:5173', 1, 'INVALID');
checkSecureContext('https://192.168.1.50:5173', 0, 'WARN');
checkSecureContext('ftp://example.com', 1, 'INVALID');

console.log('validated MOSS helper behavior');
