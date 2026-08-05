<!-- AUTO-GENERATED from wallet/core-sdk/permissions.md by skills/scripts/build-skills.mjs. Do not edit here — edit the source doc and re-run the script. -->

# Smart Approvals (Policy Engine)

Smart Approvals is MOSS's name for permissions and session grants. A user approves a scoped policy once, then the app can run matching contract calls with `callContract({ silent: true })` until the grant expires, is revoked, or hits its spend cap.

Use app permissions when you want better UX for repeated actions: contract calls, recurring spends, checkout flows, or automated agent flows.

## Permission Model

The published [`@megaeth-labs/wallet-sdk`](https://www.npmjs.com/package/@megaeth-labs/wallet-sdk)
package exposes the policy shape through `GrantPermissionsRequest`. Check the
types in the installed package because the public API can change between
releases. The SDK sends permission requests to the embedded wallet; the
wallet/account layer creates and enforces the scoped session key.

```ts
interface Permission {
  id?: string
  expiry: number
  /** @deprecated No longer used - the gas token is taken from the granted session permissions. */
  feeToken?: {
    limit: string
    symbol?: string
  }
  permissions: {
    calls: {
      signature: string
      to: string
    }[]
    spend: {
      limit: bigint
      period: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
      token?: `0x${string}`
    }[]
  }
}
```

```ts
grantPermissions({ permissions, externalAddress?, sponsor? })
getPermissions(address?)
revokePermissions()
```

## How It Works

1. Your app requests a policy with `mega.grantPermissions()`.
2. The wallet shows the requested expiry, allowed calls, spend caps, and gas/payment settings to the user.
3. If the user approves, the wallet creates a scoped session key for that policy.
4. Later `mega.callContract({ silent: true })` requests use that session key instead of showing another approval prompt.
5. The wallet/account enforcement rejects silent execution if the grant is expired, revoked, missing the required call scope, or over the spend cap.

`calls[]` and `spend[]` are separate gates. `calls[]` says which contract/function pairs may execute. `spend[]` says how much native ETH or a specific ERC-20 token the session may spend during the selected accounting period. A spend row does not replace the call row: ERC-20 workflows usually need both the token spend cap and call permissions for the token/protocol functions they invoke.

## Policy Parameters

| Field | Purpose | Notes |
| --- | --- | --- |
| `expiry` | Session expiration time. | Unix timestamp in seconds. Use short windows. |
| `permissions.calls[].to` | Contract address that may be called. | Match the exact target contract used in `callContract()`. |
| `permissions.calls[].signature` | Function that may be called. | Use canonical signatures like `transfer(address,uint256)` or `deposit()`. |
| `permissions.spend[].limit` | Spend cap for the row. | `bigint` in integer base units. For native ETH this is wei; for ERC-20 tokens use that token's decimals. |
| `permissions.spend[].period` | Budget period for the spend cap. | One of `minute`, `hour`, `day`, `week`, `month`, or `year`. |
| `permissions.spend[].token` | Token covered by the spend cap. | Omit for native ETH. Set an ERC-20 contract address for token spend. |
| `externalAddress` | Bind the grant to a delegated external account. | Advanced; omit for the common app-session flow. |
| `sponsor` | Request explicit sponsorship policy. | Only relevant when your sponsorship mode uses explicit app requests. |
| `feeToken` | Deprecated gas-token metadata. | Omit in new grants. |

For token amounts, prefer `viem` helpers so decimals are explicit:

```ts
import { parseEther, parseUnits } from 'viem';

parseEther('0.005'); // 5000000000000000n wei
parseUnits('25', 18); // 25 USDm when USDm has 18 decimals
```

## Examples

### 1. Contract-Call Permission

Use this when the call itself does not need an app-level spend cap.

```ts
const expiry = Math.floor(Date.now() / 1000) + 60 * 10;

await mega.grantPermissions({
  permissions: {
    expiry,
    permissions: {
      calls: [
        {
          to: '0xRewardsContractAddress',
          signature: 'claim()',
        },
      ],
      spend: [],
    },
  },
});
```

### 2. Native ETH Permissions

Omit `token` for native ETH. The `limit` is in wei, so `parseEther('0.005')` grants a 0.005 ETH cap for the selected period.

This example grants a payable `deposit()` call on a vault contract plus a native ETH spend cap. Silent execution must match the same contract/function scope.

```ts
import { parseEther } from 'viem';

const vault = '0xVaultContractAddress';
const expiry = Math.floor(Date.now() / 1000) + 60 * 60;

await mega.grantPermissions({
  permissions: {
    expiry,
    permissions: {
      calls: [
        {
          to: vault,
          signature: 'deposit()',
        },
      ],
      spend: [
        {
          limit: parseEther('0.005'),
          period: 'day',
          // token omitted for native ETH
        },
      ],
    },
  },
});
```

### 3. ERC-20 USDm Permissions

Set `token` to the ERC-20 contract address. USDm uses 18 decimals, so `parseUnits('25', 18)` grants a 25 USDm cap for the selected period.

Known USDm addresses:

| Network | USDm address | Decimals |
| --- | --- | --- |
| Mainnet | `0xfafddbb3fc7688494971a79cc65dca3ef82079e7` | 18 |
| Testnet | `0x15e9f2b0a747ac05c7446559306687085d161e5c` | 18 |

```ts
import { parseUnits } from 'viem';

const USDm = '0xfafddbb3fc7688494971a79cc65dca3ef82079e7';
const expiry = Math.floor(Date.now() / 1000) + 60 * 60;

await mega.grantPermissions({
  permissions: {
    expiry,
    permissions: {
      calls: [
        {
          to: USDm,
          signature: 'transfer(address,uint256)',
        },
      ],
      spend: [
        {
          token: USDm,
          limit: parseUnits('25', 18),
          period: 'day',
        },
      ],
    },
  },
});
```

For protocol flows that move USDm through another contract, include each required call permission, such as USDm `approve(address,uint256)` plus the downstream protocol function. A token spend cap without the matching call scope still fails silent execution.

### 4. Call + Spend in One Session

```ts
import { parseUnits } from 'viem';

const USDm = '0xfafddbb3fc7688494971a79cc65dca3ef82079e7';
const router = '0xRouterAddress';
const expiry = Math.floor(Date.now() / 1000) + 60 * 30;

await mega.grantPermissions({
  permissions: {
    expiry,
    permissions: {
      calls: [
        {
          to: USDm,
          signature: 'approve(address,uint256)',
        },
        {
          to: router,
          signature: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
        },
      ],
      spend: [
        {
          token: USDm,
          limit: parseUnits('25', 18),
          period: 'day',
        },
      ],
    },
  },
  // Advanced: bind the grant to a delegated external account if needed.
  externalAddress: '0xExternalDelegateAddress',
});
```

### 5. Use Silent Execution

```ts
const result = await mega.callContract({
  address: '0xRouterAddress',
  abi: routerAbi,
  functionName: 'swapExactTokensForTokens',
  args: [amountIn, amountOutMin, path, recipient, deadline],
  silent: true,
});

if (result.status === 'cancelled') {
  // User dismissed wallet flow or request was not approved.
}
```

`silent: true` only works when a valid session grant exists for the exact action scope. If the grant is missing or expired, the call resolves with `status: 'error'` unless you set `silentUIApproveFallback: true`, which falls back to wallet UI approval.

## Managing App Permissions

### Read Current Permissions

```ts
const current = await mega.getPermissions(); // active subject
const forAddress = await mega.getPermissions('0xDelegatedAddress'); // explicit subject
```

`getPermissions()` returns the approved grant shape. Always check for `null` or `undefined` before reading nested fields.

### Revoke Permissions from the App

```ts
await mega.revokePermissions();
```

### Revoke Permissions from Wallet Settings

Users can revoke permissions per app in wallet/account settings. App revocation is not global-only.

## Security Defaults (Recommended)

- Keep session grants narrow and feature-specific.
- Use the shortest practical expiry window.
- Use minimal spend limits and tighten by token where possible.
- Request grants only when the next workflow needs them.
- Treat `externalAddress?` as an advanced integration field with extra review.
- Branch on `result.status`; user cancellation is neutral and should not be treated as an error.

## Troubleshooting

### Missing Session Permission

- Re-check that a grant exists for the exact `to` + `signature` pair.
- Verify `silent: true` is only used after a successful `grantPermissions` flow.
- Use `silentUIApproveFallback: true` only if a UI approval fallback is acceptable.

### Permission Expired

- Compare current Unix time with `permissions.expiry`.
- Re-request a fresh grant with a new expiry.

### Spend Limit Exhausted

- Confirm the amount is in integer base units, not a decimal string.
- Confirm native ETH spend omits `token`, and ERC-20 spend sets the token contract address.
- Request a new grant with an updated limit only when needed.

### Wrong Contract/function Permission

- Confirm the target address matches `calls[].to`.
- Confirm the called function signature matches `calls[].signature`.
- If either differs, request a grant for the exact action.
