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
`skills/megaeth-developer-skills/references/protocols/`, not in a separate
installable skill. Keep generic command safety, delegated-key permissions, and
wallet operation mechanics in `moss-wallet-cli`.

Plain Markdown recipes should remain skill references. Add a plugin package only
when a capability needs plugin behavior such as bundled MCP servers, app
manifests, tool binaries, authentication or configuration, a marketplace install
unit, or an independent release cadence.

## Updating Protocol Guidance

Protocol integrations have two distinct documentation surfaces:

- Put dApp and contract integration guidance in
  `skills/megaeth-developer-skills/references/protocols/<protocol>.md`.
- Put protocol-specific `mega moss` interaction recipes in
  `skills/megaeth-developer-skills/references/protocols/moss-cli/<protocol>.md`.
  Add this file only when current deployment and ABI evidence supports concrete
  calls and narrowly scoped delegated-key permissions.

Add or update the protocol's entry in
[`protocol-directory.md`](skills/megaeth-developer-skills/references/protocol-directory.md)
whenever its coverage changes. Keep shared protocol facts in the developer
reference and let the MOSS CLI reference focus on command construction,
permissions, validation, and execution safety rather than duplicating the full
integration guide.

Use the source hierarchy in
[`resources.md`](skills/megaeth-developer-skills/references/resources.md). In
particular:

- Prefer current protocol-owned documentation, repositories, deployment
  manifests, generated ABIs, and package types.
- Use current MegaETH documentation and canonical registries for network and
  token metadata.
- Treat ecosystem indexes, inherited skills, and third-party examples as
  discovery inputs rather than authoritative sources.
- Identify the network and chain ID for every deployment, verify that contract
  code exists, and match addresses and function signatures to a current
  protocol-owned source before documenting a write.
- State source conflicts or missing evidence explicitly. Do not provide
  executable write recipes, approval targets, or delegated-key scopes when the
  deployment or ABI cannot be verified.
- Include amount units, approval targets, slippage and deadline controls, and
  simulation or read-back checks where they apply to a value-moving workflow.

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

## Pull Request Checklist

- Keep the change focused and explain its developer or user impact.
- Follow the flat skill layout and keep supporting guidance with its owning
  skill.
- For protocol changes, update the protocol directory and keep developer and
  MOSS CLI guidance separated as described above.
- Verify technical claims against official or canonical sources and link the
  evidence used.
- Withhold executable write guidance when addresses, deployments, or ABIs
  cannot be verified.
- Run `npm run validate` and include the result in the pull request description.
- Commit regenerated `dist/` archives when source skill content changes.
- Confirm `git diff --check` passes and no unexpected files remain.
