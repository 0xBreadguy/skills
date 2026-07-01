# Awesome MegaETH AI Index

Use this when the user asks what other MegaETH AI skills, agents, MCP servers,
or ecosystem resources exist. This file mirrors the categories from
`megaeth-labs/awesome-megaeth-ai` so the information is represented in this
skill without treating every listed project as part of this repo.

## Rules For Agents

- Treat Awesome MegaETH AI as a discovery index, not as endorsement, audit
  status, installation proof, or canonical contract documentation.
- Prefer primary sources before using any listed project for addresses, ABI,
  API shape, or safety-critical behavior.
- Do not imply that links from Awesome install automatically through
  `npx skills add`; test each repo with `npx skills add <repo> --list`.
- Keep protocol-specific execution guidance inside this repo only when it is
  backed by source material. If source material is absent, stop and ask for the
  official docs/source instead of inventing calls.

## AI Coding Skills

General:

- `megaeth-dev-skill` (`0xBreadguy/megaeth-ai-developer-skills`): broad
  MegaETH development skill covering Foundry, realtime transaction submission,
  MegaEVM gas/resource behavior, MOSS/MOSS CLI routing, USDm, drand VRF, and
  `mega-evme`.
- `moss-skills` (`megaeth-labs/moss-skills`): this repo; MOSS wallet login,
  delegated-key lifecycle, permission inspection, revocation, and safer wallet
  execution patterns.

Payments:

- `x402-payments-skill`: x402 HTTP payments on MegaETH, seller/server
  middleware, buyer/client signing, Permit2-based settlement, USDm amount
  handling, and realtime transaction submission.
- `usdm-skill`: USDm integration, ERC-2612 permit flows, payments, and usage
  across MegaNames, Kumbaya DEX, and paymaster workflows.

DeFi:

- `sir-trading-skill`
  (`https://github.com/SIR-trading/sir-trading-skill/blob/master/sir-trading.md`):
  Sir Trading integration covering APE/TEA flows, vaults, quoting, MegaSIR
  staking, fee auctions, pair discovery, trading bots, and portfolio tracking
  on MegaETH. First-party summary and routing now live in
  [protocols/sir.md](protocols/sir.md); use the upstream SIR skill and SIR
  repos to verify ABIs before writes.

Identity and content:

- `dotmega-domains-skill`
  (`https://github.com/0xBreadguy/mega-names/tree/main/skill`): `.mega`
  domain registration with USDm payments, forward/reverse resolution, text
  records, subdomains, marketplace behavior, token gating, and Warren
  contenthash linking. First-party summary and routing now live in
  [protocols/meganames.md](protocols/meganames.md).
- `warren-tools` (`https://github.com/planetai87/warren-tools`): WARREN
  on-chain web/CMS tools, content deployment, NFT collection deployment,
  content loader, and browser extension. First-party summary and routing now
  live in [protocols/warren.md](protocols/warren.md); use Warren scripts for
  deployment unless raw calldata coverage is separately verified.

Agents:

- `erc8004-trustless-agents-skill`: ERC-8004 agent identity, reputation, and
  validation registries on MegaETH. This repo also has
  [erc8004-agents.md](erc8004-agents.md) for core guidance.

## Developer Tools

- `mega-tokenlist`: canonical MegaETH token registry. Use this repo for token
  addresses, symbols, decimals, and logo metadata.
- `moss-cli` (`megaeth-labs/wallet-cli`): canonical wallet CLI for local login,
  delegated-key creation, permission inspection, scoped execution, and
  revocation.
- `mtrkr-mcp-server`: external MCP candidate for MTRKR wallet intelligence on
  MegaETH. Its repo claims read-only tools for `.mega` resolution, ERC-20/NFT
  portfolios, liquidity positions, Prism concentrated-liquidity positions,
  approval scans, token risk scans, address inspection, transaction decoding,
  ETH/USD price, and wallet analytics. Treat these claims as unverified until
  due diligence confirms installability, auth/payment requirements, privacy
  behavior, read-only behavior, tool schemas, and output reliability.

## Learning Resources

- MegaETH Docs: official docs for MegaEVM differences, Realtime API,
  mini-blocks, and RPC reference.
- MegaETH Frontier Guide: connecting to and using MegaETH Mainnet.
- `mega-evm`: MegaEVM implementation and `mega-evme` transaction replay,
  tracing, opcode gas profiling, and debugging.
- RedBlackTreeKV Demo: storage-efficient key-value store pattern using
  Red-Black Trees and MegaETH's storage-cost model.

## Routing

- For core network/contract/frontend/MegaEVM behavior, stay in
  `megaeth-developer-skills`.
- For MOSS app integration, use `moss-wallet-sdk`.
- For terminal wallet execution, use `moss-wallet-cli`.
- For read-only wallet intelligence, approvals, token risk, Kumbaya positions,
  or Prism positions, mention MTRKR MCP only as an unverified external
  candidate unless due diligence has already been completed. Never treat it as
  a transaction execution surface.
- For SIR, `.mega`, and Warren implementation requests, start with this repo's
  protocol summaries, then verify executable details against the linked
  upstream source. For other external project-specific requests, route to the
  listed external skill or repo unless this repo adds explicit first-party
  coverage.
