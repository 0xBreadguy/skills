# MegaETH Skills

<img width="2172" height="724" alt="megaeth_devs_mafia" src="https://github.com/user-attachments/assets/1b354884-ccb5-4286-8e19-657a026a4093" />

[Agent Skills](https://agentskills.io) for building on [MegaETH](https://megaeth.com).
These skills give AI coding agents practical guidance for MegaETH development and MOSS wallet workflows.

<!-- Badge row 1 - repo stats -->

[![GitHub contributors](https://img.shields.io/github/contributors/megaeth-labs/skills)](https://github.com/megaeth-labs/skills/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/megaeth-labs/skills)](https://github.com/megaeth-labs/skills/commits/main)
![GitHub repo size](https://img.shields.io/github/repo-size/megaeth-labs/skills)

<!-- Badge row 2 - links and profiles -->

[![Website megaeth.com](https://img.shields.io/badge/website-up-green)](https://www.megaeth.com)
[![Docs](https://img.shields.io/badge/docs-up-green)](https://docs.megaeth.com/)
[![Twitter MegaETH](https://img.shields.io/twitter/follow/megaeth?style=social)](https://x.com/megaeth)
[![Twitter MegaETH_Devs](https://img.shields.io/twitter/follow/megaeth_devs?style=social)](https://x.com/megaeth_devs)

## Available Skills

| Skill                                                                      | Install                                                                  | Description                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [megaeth-developer-skills](skills/megaeth-developer-skills/SKILL.md)       | `npx skills add megaeth-labs/skills --skill megaeth-developer-skills`    | Build and debug MegaETH apps, contracts, protocols, payments, and agents.                              |
| [moss-wallet-sdk](skills/moss-wallet-sdk/SKILL.md)                         | `npx skills add megaeth-labs/skills --skill moss-wallet-sdk`             | Integrate MOSS wallets with core SDK, React, wagmi, permissions, paymasters, and backend verification. |
| [moss-wallet-cli](skills/moss-wallet-cli/SKILL.md)                         | `npx skills add megaeth-labs/skills --skill moss-wallet-cli`             | Operate a MOSS wallet with scoped delegated keys from a terminal or coding agent.                      |
| [moss-wallet-security-review](skills/moss-wallet-security-review/SKILL.md) | `npx skills add megaeth-labs/skills --skill moss-wallet-security-review` | Audit a MOSS integration for unsafe authentication, permissions, sponsorship, and key handling.        |

## Repository Layout

Installable skills use a flat, namespaced layout:

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
dist/                         # generated ZIP archives
scripts/                      # build, sync, and validation tooling
```

Protocol integrations are references inside `megaeth-developer-skills`, not
separate installable skills. Use `moss-wallet-cli` for command safety,
delegated-key permissions, and wallet operation mechanics.

## Installation

The Skills CLI requires Node.js 22.20 or newer. Repository builds require `zip`;
full validation also requires `unzip`.

Install all skills with the [Skills CLI](https://skills.sh):

```bash
npx skills add megaeth-labs/skills --skill "*"
```

List the available skills before installing:

```bash
npx skills add megaeth-labs/skills --list
```

For a manual project-local install, copy an individual skill into the
appropriate agent path:

```text
Codex:       .agents/skills/<skill-name>/
Claude Code: .claude/skills/<skill-name>/
OpenClaw:    skills/<skill-name>/
Hermes:      .hermes/skills/<skill-name>/
```

Prebuilt archives are available in `dist/`. To rebuild them from the checked-in
skill sources without fetching remote skill content:

```bash
npm ci
npm run build
```

## Usage

Skills are automatically available once installed.
Your agent selects the relevant skill when it recognizes a matching task.

```text
Deploy a contract to MegaETH with Foundry
Add MOSS wallet authentication to my React app
Create a scoped delegated key with the MOSS CLI
Review this MOSS integration before launch
```

## Development

Install dependencies and validate the repository before opening a pull request:

```bash
npm ci
npm run validate
```

Validation rebuilds the ZIP archives, checks skill frontmatter and local links,
tests bundled script syntax and behavior, verifies archive integrity, and runs
Skills CLI discovery. It validates the proposed checkout without fetching or
replacing skill content.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for repository
conventions, validation requirements, Wallet CLI synchronization, and pull
request guidelines.
