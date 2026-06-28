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

Protocol-specific guidance is reference material inside a skill, not a
subskill. For example,
`skills/moss-wallet-cli/references/protocols/aave.md` is loaded by the
`moss-wallet-cli` skill when the user needs Aave CLI execution guidance.

## Future Plugins

Do not create Claude/Codex plugin packages for plain markdown recipes. Add a
real plugin package later only when a capability needs plugin behavior: bundled
MCP servers, app manifests, tool binaries, auth/config, marketplace install
units, or independent release cadence. Until then, keep protocol and data
guidance under `skills/*/references/`.

## Updating

After editing skills or references:

```bash
npm run build
npx skills add . --list
```

The MOSS CLI behavior in `moss-wallet-cli` should stay aligned with
`megaeth-labs/wallet-cli`. MegaETH protocol and network guidance should be
checked against `docs.megaeth.com`, `mega-dev.gitbook.io`, and the relevant
canonical repositories before release.
