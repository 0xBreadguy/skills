# MOSS Wallet Behavioral Rules

This is the canonical reference for wallet-wide semantics shared by MOSS SDK,
React, permissions, paymaster, server verification, migration, CLI, and security
review guidance.

## Result Handling

- Wallet actions return explicit result objects. Do not assume thrown
  exceptions are the only failure path.
- Transaction and signing-style actions commonly return approved/success,
  cancelled, or error statuses.
- Treat `cancelled` as neutral user intent. Reset UI state; do not show an
  error toast.
- Branch on `result.status` before reading hashes, signatures, addresses, or
  error payloads.

## Key Boundaries

- Apps and the CLI never hold the user's passkey, root key, seed phrase, or
  Recovery Code.
- MOSS uses "Recovery Code" or "Account Recovery Code" in user-facing copy.
  Do not call it a seed phrase, backup phrase, or recovery phrase.
- Treat CLI profile files as local secrets. Use CLI inspection commands rather
  than reading profile files directly.

## Authentication Boundary

- Frontend wallet address or `useStatus().address` is not authentication.
- Backend sessions require server-side verification through SIWE/signature or
  partner-auth JWT verification.
- Do not hand-roll MOSS ownership verification by only recovering an address
  client-side.

## Permissions

- Permission call scopes should use `{ to, signature }`.
- Avoid broad, partial, wildcard, or to-only grants unless product docs
  explicitly support that exact matcher.
- `spend.limit` is token movement authority. Convert human amounts into base
  units using token decimals.
- Fee/gas capacity may be represented separately from workflow spend capacity
  depending on the SDK/CLI flow.
- `silent: true` only works when a matching unexpired grant exists. Otherwise
  it errors or falls back to UI only when explicit fallback behavior is enabled.
- SDK `mega.revokePermissions()` and CLI `mega moss revoke` have different
  scopes. Check the owning reference before describing revocation.

## Sponsorship

- Sponsorship policy belongs on the server at `sponsorUrl`.
- Client-side allowlists, budgets, rate limits, or trust decisions are not
  sufficient.
- `sponsorMode: 'everything'` is for testing only. Prefer `app-only` or
  explicit per-call sponsorship.

## Browser And Network Constants

- Browser/passkey flows require secure context and correct origin.
- Mainnet chain ID: `4326`.
- Testnet chain ID: `6343`.
- Wallet host: `https://account.megaeth.com`.

## Migration Rule

Privy migration is an asset migration, not a key migration. MOSS provides the
destination address. Privy signs and broadcasts transfers from the Privy EOA.
Never request, export, log, or move private keys or seed phrases.
