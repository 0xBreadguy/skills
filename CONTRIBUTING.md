# Contributing

Thanks for helping improve MegaETH Skills. This guide covers the repository
conventions and checks required for a pull request.

## Repository Conventions

Installable skills use a flat, namespaced layout:

```text
skills/<skill-name>/SKILL.md
```

Each skill directory is a complete installable unit. Its `SKILL.md` frontmatter
name must match the directory name, and supporting material belongs in that
skill's `references/` or `scripts/` directory.

Protocol-specific guidance belongs under
`skills/megaeth-developer-skills/references/`, not in a separate installable
skill. Keep command safety, delegated-key permissions, and wallet operation
mechanics in `moss-wallet-cli`.

Plain Markdown recipes should remain skill references. Add a plugin package only
when a capability needs plugin behavior such as bundled MCP servers, app
manifests, tool binaries, authentication or configuration, a marketplace install
unit, or an independent release cadence.

## Making Changes

1. Create a focused branch from the current default branch.
2. Update the source files under `skills/`.
3. Check MegaETH protocol and network guidance against the official
   documentation and relevant canonical repositories.
4. Install dependencies and validate the full repository:

   ```bash
   npm ci
   npm run validate
   ```

5. Review the generated `dist/` archives and include them in the pull request
   whenever source skill content changes.

`npm run validate` rebuilds the archives from the checked-in sources, checks
skill frontmatter and local links, tests bundled script syntax and behavior,
verifies archive integrity, and runs Skills CLI discovery. It does not fetch or
replace skill content, so it validates the proposed checkout exactly as
submitted.

Before committing, also check for whitespace errors and confirm that validation
did not leave unexpected changes:

```bash
git diff --check
git status --short
```

## Synchronizing Wallet CLI Guidance

The `moss-wallet-cli` skill should stay aligned with stable releases from
`megaeth-labs/wallet-cli`. To refresh from the latest stable release and run the
full validation suite:

```bash
npm run refresh
```

The synchronization verifies the published SHA-256 checksum and rejects
oversized, unsafe, draft, or prerelease artifacts. It preserves this repository's
`moss-wallet-cli` skill name and adds the routing note for protocol-specific
guidance.

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

## Pull Request Checklist

- Keep the change focused and explain its developer or user impact.
- Follow the flat skill layout and keep supporting guidance with its owning
  skill.
- Verify technical claims against official or canonical sources.
- Run `npm run validate` and include the result in the pull request description.
- Commit regenerated `dist/` archives when source skill content changes.
- Confirm `git diff --check` passes and no unexpected files remain.
