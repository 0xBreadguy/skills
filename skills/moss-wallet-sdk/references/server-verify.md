# Server Verification

Read the detailed files in `references/server-verify/`:

- [server-verify/server-verify.md](server-verify/server-verify.md): SIWE
  challenge and `verifySignature` flow.
- [server-verify/authentication.md](server-verify/authentication.md): JWT
  `mega.authenticate()` flow.

Core rules:

- Frontend wallet state is not authentication.
- Verify signatures or JWTs on the backend before issuing an app session.
- Store challenges server-side, make them single-use, and apply a short TTL.
- Match `chainId`, `scheme`, `domain`, `uri`, and `statement` between challenge
  generation and verification.
- Do not import `@megaeth-labs/wallet-server-verify` into client bundles.

Use `scripts/siwe-verify-snippet.ts` and `scripts/jwt-verify-snippet.ts` as
reference snippets.
