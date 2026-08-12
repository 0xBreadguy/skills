# Maintainer Runbooks

This file covers repository release procedures that are not part of the
external contribution workflow.

## Synchronizing Wallet CLI Guidance

The `moss-wallet-cli` skill should stay aligned with stable releases from
`megaeth-labs/wallet-cli`. To refresh from the latest stable release and run the
full validation suite:

```bash
npm run refresh
```

The synchronization verifies the published SHA-256 checksum and rejects
oversized, unsafe, draft, or prerelease artifacts. It preserves this
repository's `moss-wallet-cli` skill name and adds the routing note for
protocol-specific guidance.

For a release update, use a normal review branch and refresh from the exact
published tag. Replace `vX.Y.Z` with the release being synchronized:

```bash
git switch -c chore/sync-wallet-cli-vX.Y.Z origin/main
npm ci
WALLET_CLI_RELEASE_API=https://api.github.com/repos/megaeth-labs/wallet-cli/releases/tags/vX.Y.Z npm run refresh
git diff --check
git status --short
npm run validate
```

Review the updated skill and references together with the generated `dist/`
archives. The second validation run should not introduce additional changes.
Use `WALLET_CLI_REPO` or an exact-tag `WALLET_CLI_RELEASE_API` override only for
release testing.
