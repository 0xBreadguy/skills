# MegaETH Protocol Directory

Use this as a routing file for protocol-specific development advice and
protocol-specific `mega moss` execution recipes. Use `moss-wallet-cli` for
command safety, delegated-key permissions, and wallet operation mechanics.

## Current In-Repo Protocol References

- [protocols/aave.md](protocols/aave.md): concrete Aave V3 MegaETH market
  guidance backed by the Aave address book.
- [protocols/kyber.md](protocols/kyber.md): concrete KyberSwap Aggregator API
  guidance backed by KyberSwap docs.
- [protocols/kumbaya.md](protocols/kumbaya.md): Kumbaya V3-style DEX guidance
  adapted from `megaeth-ai-developer-skills/kumbaya-dex.md`; verify official
  Kumbaya sources before production or value-bearing execution.
- [protocols/prism.md](protocols/prism.md): Prism V3-style DEX and
  taxable-router guidance adapted from
  `megaeth-ai-developer-skills/prism-dex.md`; verify official Prism sources
  before production or value-bearing execution.
- [protocols/sir.md](protocols/sir.md): SIR Trading no-liquidation leveraged
  token, TEA liquidity, MegaSIR staking, and fee-auction guidance adapted from
  the SIR Trading skill.
- [protocols/meganames.md](protocols/meganames.md): `.mega` registration,
  resolution, records, subdomains, marketplace, and Warren contenthash
  guidance adapted from the MegaNames skill.
- [protocols/warren.md](protocols/warren.md): Warren on-chain website, file,
  and NFT collection deployment guidance adapted from Warren tools.

Protocol-specific MOSS CLI execution recipes live under
[protocols/moss-cli/](protocols/moss-cli/):

- [protocols/moss-cli/aave.md](protocols/moss-cli/aave.md)
- [protocols/moss-cli/kyber.md](protocols/moss-cli/kyber.md)
- [protocols/moss-cli/kumbaya.md](protocols/moss-cli/kumbaya.md)
- [protocols/moss-cli/prism.md](protocols/moss-cli/prism.md)
- [protocols/moss-cli/sir.md](protocols/moss-cli/sir.md)
- [protocols/moss-cli/meganames.md](protocols/moss-cli/meganames.md)
- [protocols/moss-cli/warren.md](protocols/moss-cli/warren.md)

## Coverage Status

| Protocol | Developer guidance | MOSS CLI execution | Source status |
| --- | --- | --- | --- |
| Aave | actionable | actionable | Aave address book |
| KyberSwap | actionable API pattern | actionable once API returns router/calldata | KyberSwap Aggregator docs |
| Kumbaya | provisional but concrete | scoped templates, verify before writes | imported developer-skill material; official verification required |
| Prism | provisional but concrete | scoped templates, verify before writes | imported developer-skill material; official verification required |
| SIR Trading | actionable, verify upstream before writes | scoped templates, verify before writes | SIR Trading skill and SIR Core/Periphery pointers |
| MegaNames | actionable, verify upstream before writes | scoped templates, verify before writes | MegaNames skill |
| Warren | actionable script workflow | routing guidance; no raw MOSS calldata recipe | Warren tools repo |

## External Ecosystem Index

Use `https://github.com/megaeth-labs/awesome-megaeth-ai` to discover additional
MegaETH AI skills, MCP servers, developer tools, and protocol-specific repos.
Do not imply that links from Awesome install skills automatically.

For the curated in-skill summary, read
[awesome-megaeth-ai.md](awesome-megaeth-ai.md).

Additional ecosystem entries not promoted to protocol guidance:

| Project | Source | Current treatment |
| --- | --- | --- |
| MTRKR MCP | `megaeth-labs/awesome-megaeth-ai` entry | Unverified external read-only tooling candidate; do due diligence before recommendation or use. |

## Promotion Rule

Keep a protocol here while it is only reference material. Create a real plugin
package only when it needs its own installable tool boundary: bundled MCP
server, app manifest, auth/config, scripts/binaries, or independent release
cadence.
