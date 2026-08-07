# MegaETH Agent Skills

Public distribution for MegaETH agent skills. This repo uses the standard
flat skills repository layout:

```text
skills/<skill-name>/SKILL.md
```

Installable skills are namespaced at the skill-name level, not by nested
directories.

## Install

### Skills CLI

List available skills:

```bash
npx skills add megaeth-labs/skills --list
```

Install all skills for the detected agent:

```bash
npx skills add megaeth-labs/skills --skill '*'
```

Install a single skill:

```bash
npx skills add megaeth-labs/skills --skill megaeth-developer-skills
npx skills add megaeth-labs/skills --skill moss-wallet-sdk
```

### Manual Skill Copy

Copy an individual skill directory into your agent's skill path:

```text
skills/megaeth-developer-skills/
skills/moss-wallet-sdk/
skills/moss-wallet-cli/
skills/moss-wallet-security-review/
```

Common destinations:

```text
Codex project-local:       .agents/skills/<skill-name>/
Claude Code project-local: .claude/skills/<skill-name>/
OpenClaw project-local:    skills/<skill-name>/
Hermes project-local:      .hermes/skills/<skill-name>/
```

### ZIP Archives

Download archives from `dist/` or build them locally:

```bash
npm run build
```

The build is local and reproducible: it packages the checked-in skills without
contacting GitHub. To refresh `moss-wallet-cli` from the latest stable
`megaeth-labs/wallet-cli` GitHub release and then rebuild and validate, run:

```bash
npm run refresh
```

The sync verifies the release's published SHA-256 and rejects oversized,
unsafe, draft, or prerelease artifacts. It keeps this repo's `moss-wallet-cli`
skill name and adds a short routing note to use `megaeth-developer-skills` for
protocol-specific guidance. Override the source with `WALLET_CLI_REPO` or an
exact-tag `WALLET_CLI_RELEASE_API` only for release testing.

Then unzip into the target agent's skill directory:

```bash
unzip dist/moss-wallet-skills.zip -d .agents/skills
unzip dist/megaeth-developer-skills.zip -d .agents/skills
```

## Skills

| Skill | Use it when you are... |
| --- | --- |
| `megaeth-developer-skills` | building dApps, smart contracts, protocol integrations, frontends, payments, agents, or debugging workflows on MegaETH |
| `moss-wallet-sdk` | integrating MOSS into an app: core SDK, React hooks, wagmi, Smart Approvals, paymaster, backend verification, or Privy migration |
| `moss-wallet-cli` | operating a MOSS wallet from a terminal or coding agent with `mega moss` delegated keys and scoped execution |
| `moss-wallet-security-review` | auditing an existing MOSS integration before launch |

## Layout

```text
skills/
  megaeth-developer-skills/
    SKILL.md
    references/
  moss-wallet-sdk/
    SKILL.md
    references/
    scripts/
  moss-wallet-cli/
    SKILL.md
    references/
  moss-wallet-security-review/
    SKILL.md
    references/
dist/                                 # generated ZIP archives
scripts/build-dist.mjs                # archive builder
```

Protocol-specific guidance is reference material inside
`megaeth-developer-skills`, not a subskill. For example,
`skills/megaeth-developer-skills/references/protocols/aave.md` covers Aave
developer integration, and
`skills/megaeth-developer-skills/references/protocols/moss-cli/aave.md` covers
Aave `mega moss` execution recipes. Use `moss-wallet-cli` for command safety,
delegated-key permissions, and wallet operation mechanics.

## Future Plugins

Do not create Claude/Codex plugin packages for plain markdown recipes. Add a
real plugin package later only when a capability needs plugin behavior: bundled
MCP servers, app manifests, tool binaries, auth/config, marketplace install
units, or independent release cadence. Until then, keep protocol and data
guidance under `skills/*/references/`.

## Updating

After editing skills or references:

```bash
npm ci
npm run validate
```

Validation rebuilds the ZIP archives from the checked-in sources, checks skill
frontmatter, local links, bundled script syntax and behavior, and archive
integrity, then runs Skills CLI discovery. It intentionally does not fetch or
replace skill content, so pull-request checks validate the proposed commit
exactly as submitted.

The MOSS CLI behavior in `moss-wallet-cli` should stay aligned with
`megaeth-labs/wallet-cli`; `npm run refresh` refreshes the copied CLI skill
content from that repo's latest stable release.
MegaETH protocol and network guidance should be checked against
`docs.megaeth.com`, `mega-dev.gitbook.io`, and the relevant canonical
repositories before release.

### Manual wallet-cli release synchronization

After publishing a stable wallet-cli release, create a normal review branch
and refresh from that exact tag:

```bash
git switch -c chore/sync-wallet-cli-v0.1.6 origin/main
npm ci
WALLET_CLI_RELEASE_API=https://api.github.com/repos/megaeth-labs/wallet-cli/releases/tags/v0.1.6 npm run refresh
git diff --check
git status --short
npm run validate
```

Review the updated `moss-wallet-cli` skill and references together with the
generated `dist/` archives, then commit and open a normal pull request. The
second validation run should not introduce any additional changes.
