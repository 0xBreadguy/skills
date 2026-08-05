# Public Release Information Audit

Audit date: 2026-08-04

Baseline: repository commit `4c240bd33f0edfb18082d1697891bb94c2b7deb4`
plus the release-audit changes in this working tree.

## Verdict

The audit found factual errors and stale operational guidance in the baseline.
Those items were corrected or, where an authoritative source could not be
found, replaced with an explicit verification boundary. No known false claim
remains in the repo's actionable guidance after this pass.

This is an information-integrity review, not a smart-contract audit. It did not
submit state-changing transactions, prove every deployed bytecode image from
source, or independently reproduce private security-review reports. The
unresolved items are cataloged below and are not silently promoted to
executable instructions.

## Audit Method

The review used the following evidence, in descending order of authority:

1. current protocol-owned or MegaETH-owned documentation and repositories;
2. current deployment manifests, package types, generated ABIs, and token
   lists;
3. read-only endpoint, RPC, explorer, and deployed-code checks;
4. inherited skill text and ecosystem indexes, used only for discovery.

For actionable addresses and calls, the review compared the destination text
with the current ABI or source signature. For volatile network and API claims,
it checked the current documentation and, where practical, made a read-only
request. No private key was used and no write was broadcast.

## Source Snapshots

### Public and protocol-owned sources

| Source | Audited snapshot |
| --- | --- |
| MegaETH documentation source | `dc68b9cd014d6b9fd8f5e3ec22982fd11de71deb` |
| `megaeth-labs/mega-evm` | `396b0ca91c7d5bb141c305c4c320db99211c2bac` |
| `megaeth-labs/mega-tokenlist` | `87fe2b010afdc08c9fd03f82310b681b1080a4ca` |
| `megaeth-labs/wallet-cli` release artifact | `v0.1.5`, published 2026-07-06 |
| `megaeth-labs/awesome-megaeth-ai` | `5ccdc4421777fbff98fb9d0dc1c649a0615553b9` |
| `0xBreadguy/megaeth-ai-developer-skills` | `896919cf2fd247f37c5e62572395ca19630e9da6` |
| `megaeth-labs/payment-demo` | `fd9bd8d4c3b95ebfe194ea4b736448a1fca256ef` |
| Aave address book | `@aave-dao/aave-address-book@4.62.4` |
| Kumbaya integrator kit | `afdefe422699833c7c7c79c36eccc411701e1724` |
| Kumbaya agent kit | `8af4c76860cda2b2bd79ad1b65727ad652fcb224` |
| SIR skill | `4b8528637beade60ab851a46f1cd93173f0b7c0d` |
| SIR Core / Periphery / docs | `e526d8a`, `b230b4e`, `f537c99` |
| MegaNames | `e0e7985c88f74492603f3b96458d18ff2708b536` |
| Warren tools | `7d568bd0145831c6cb18a5a0e06fda7044ce8438` |
| ERC-8004 contracts | `68fc6765761a10fb26f0692df21c8a6f9d12b1be` |
| KyberSwap Aggregator | current official EVM API specification on 2026-08-04 |
| x402 | current x402 v2 packages/specification and MegaETH payment demo |

### MOSS first-party sources

The MOSS packages were checked against their published latest versions and
access-restricted first-party source snapshots available to the reviewer:

| Package or source | Version or snapshot |
| --- | --- |
| `@megaeth-labs/wallet-sdk` | npm `0.1.28`; source `8c9410b219b47b77bc788db231c77d6996b0ed1d` |
| `@megaeth-labs/wallet-sdk-react` | npm `0.1.27`; source `bd92cbea81ba208476a0c5179ddbc0b644370612` |
| `@megaeth-labs/wallet-server-verify` | npm `0.1.9`; source `036945c639f4fbe0c4da37f42d88f7a9f9664d5f` |
| `@megaeth-labs/wallet-wagmi-connector` | npm `0.3.1`; source `80a77a80d84eca908451720cac7c467404c7d1f3` |
| MOSS wallet implementation | `240329cc44473b2ae5bef8a32b65fee2d9737c2b` |
| MOSS documentation | `45673a2ce61a0e28188fb867abb58d1bc116f89c` |

The package registry is public evidence for versions and distributed types.
The access-restricted source snapshots are not independently reproducible by a
reader without repository access; that limitation is recorded in the
unverified catalog.

## Coverage Map

| Destination | Primary evidence | Result |
| --- | --- | --- |
| `README.md`, build, ZIPs, skill frontmatter | Skills CLI behavior and local install | structurally verified |
| `network.md`, `rpc.md`, `realtime-api.md` | current MegaETH docs and RPC source | corrected and verified |
| `gas-model.md`, `storage-model.md`, `deploy-contracts.md` | MegaETH execution docs and MegaEVM specs/source | extensively corrected |
| `foundry.md`, `mega-evme.md`, `testing.md` | Foundry docs, MegaETH docs, `mega-evm` CLI source | corrected and verified |
| `frontend-patterns.md`, `security.md`, `resources.md` | current network behavior and referenced standards/tools | corrected and source-qualified |
| `tokenlist.md`, `usdm.md` | canonical MegaETH token list and published token interfaces | corrected and verified, with one CLI divergence noted |
| `vrf-drand.md` | MegaETH VRF docs and DrandVerifier source | corrected and verified |
| `erc8004-agents.md` | EIP-8004, registry contracts, package APIs, deployment data | corrected and verified to current deployed registries |
| `x402-payments.md` | x402 v2 packages/specification and MegaETH payment demo | replaced stale flow with current v2 guidance |
| `awesome-megaeth-ai.md`, `protocol-directory.md` | Awesome index, partner skill, each linked primary source | represented as discovery, not endorsement |
| Aave developer and MOSS CLI references | Aave address book and ABI | verified |
| Kyber developer and MOSS CLI references | current Kyber Aggregator API docs and endpoint probe | corrected and verified within API-key limits |
| Kumbaya developer and MOSS CLI references | protocol-owned integrator kit, ABIs, SDKs | corrected and verified |
| Prism developer and MOSS CLI references | live Prism read endpoints and code-presence checks | intentionally read-only; writes unverifiable |
| SIR developer and MOSS CLI references | live build data, deployed ABI, SIR source and skill | corrected and source-qualified |
| MegaNames developer and MOSS CLI references | MegaNames source, deployment data, deployed code | mainnet verified; testnet withheld |
| Warren developer and MOSS CLI references | Warren scripts and source | script behavior represented; raw MOSS writes withheld |
| `moss-wallet-cli` | latest stable `wallet-cli` release artifact | synced to `v0.1.5` and adapted only for name/routing |
| `moss-wallet-sdk` references and scripts | current MOSS docs, package types, implementation source | corrected and synchronized |
| `moss-wallet-security-review` | same first-party sources plus recorded audit metadata | corrected; report-evidence limitation disclosed |

The original MOSS skill content, Awesome MegaETH AI entries, and partner
developer skill topics are represented in the destination either as primary
guidance, a protocol reference, or an explicit discovery pointer. Material was
omitted from execution recipes only when it was stale, contradicted a current
source, duplicated a stronger current source, or could not meet the verification
bar for a value-bearing action.

## Corrected Factual Errors

These were errors or materially misleading claims in the baseline, not merely
editorial changes.

| Area | Baseline problem | Current correction |
| --- | --- | --- |
| USDm | Testnet USDm used `0xFd168...`, which is BLU, and cUSD was labeled Circle USDC | canonical USDm is `0x72d4...77cF4` on testnet; cUSD is Cap USD |
| USDm backing | asserted an Ethena/USDtb/BUIDL/sequencer-cost structure without a current issuer source | retained only the publicly supportable Treasury-reserve description and forbids inventing backing composition |
| RPC methods | instructed agents to use undocumented `eth_callAfter` and `eth_getLogsWithCursor` | removed both; current public methods and limits are documented instead |
| RPC limits | used stale log caps, retention windows, request limits, and an old RPC version | replaced with current public gateway limits; archive retention is provider-specific |
| Realtime submission | blurred timeout semantics and method preference | documents `realtime_sendRawTransaction`, the 3000 ms public timeout ceiling, inconclusive timeouts, and the supported sync alias |
| WebSocket behavior | omitted or misstated subscription and connection constraints | records current connection, subscription, message, idle, payload, filter, and keepalive limits |
| Gas and storage | claimed roughly 2M gas per new slot and fixed dollar costs | uses the current dynamic SALT-bucket storage formula and removes dollar estimates |
| Gas detention | described an absolute or retroactive 20M penalty | explains current usage plus up to 20M additional compute gas, bounded by the effective limit |
| Events | claimed LOG cost becomes quadratic above 4 KiB | uses the documented linear MegaETH storage charge and explicitly rejects the old rule |
| Resource limits | mixed old transaction/block caps and encoded-size behavior | replaced with current total gas, compute, data, KV, state-growth, and encoded-transaction limits |
| EVM behavior | described `SELFDESTRUCT` as disabled and used old code-size/forwarding assumptions | records EIP-6780 semantics, current code limits, and 98/100 forwarding |
| Foundry | treated local simulation as authoritative MegaETH gas and used ambiguous flags | remote estimation is authoritative; `--skip-simulation` and local `--gas-limit` behavior are clarified |
| `mega-evme` | stale hardfork/default and replay assumptions | current Rex7/default and replay auto-detection behavior comes from current CLI source |
| drand VRF | used an incomplete verifier return shape and too-tight future-round selection | corrected the tuple and adds a two-round inclusion margin |
| ERC-8004 deployment | said CREATE2 meant identical addresses on all chains | lists the distinct MegaETH mainnet and testnet registry addresses |
| ERC-8004 metadata | treated recommended registration fields as universally required | distinguishes EIP requirements from recommendations and package conventions |
| ERC-8004 registration | treated a wallet-client write result as the new `agentId` | treats it as a transaction hash and decodes the registration event for the ID |
| x402 | used legacy `X-PAYMENT` headers and a hand-rolled settlement/proxy path | replaced with the current x402 v2 middleware/client model and MegaETH payment-demo pattern |
| Kumbaya pools | used packed encoding for the CREATE2 pool salt | uses `keccak256(abi.encode(token0, token1, fee))`, matching the protocol source |
| KyberSwap | treated the legacy public gateway as the primary endpoint | uses `https://api.kyberswap.com/swap` with `X-Api-Key`; legacy gateway is labeled rate-limited |
| SIR minting | described the fifth mint argument as a generic minimum output | direct collateral requires zero; debt-token funding requires a quoted nonzero collateral minimum |
| MegaNames | used `setWarrenContenthash(uint256,uint256,bool)` | corrected to `setWarrenContenthash(uint256,uint32,bool)` in developer and CLI recipes |
| Prism | turned inherited addresses and ABIs into executable swap/liquidity guidance | write recipes removed; only read discovery and a verification gate remain |
| MOSS transfer example | omitted native transfer type and passed a display amount | now passes `type: 'native'` and an 18-decimal base-unit string |
| MOSS result handling | implied all SDK methods resolve status unions | limits that rule to documented action methods and notes setup/read rejection paths |
| Secure contexts | treated all private-LAN HTTPS as invalid | trusted HTTPS can be secure; HTTP LAN origins and untrusted certificates remain invalid |
| Permission script | accepted weak addresses, unsafe numeric TTLs, and ambiguous amount units | validates exact 20-byte addresses, integer-safe TTL input, and base-unit strings |
| Migration script | accepted unsafe numeric amounts and could emit NFT entries without `tokenId` | rejects unsafe numbers, validates allowlists/token IDs, and skips zero-amount ERC-1155 entries |
| Sponsor example | allowed a separately supplied `target` to stand in for the opaque signed operation | fails closed until the real operation is decoded and verifies every inner target/selector on the expected chain |
| Paymaster availability | said Alchemy support was coming soon and a MegaETH managed service was in progress | records current Alchemy MegaETH support, does not claim direct MOSS compatibility, and marks the managed offering unverified |
| MOSS roadmap | published a time-sensitive social-login roadmap statement as guidance | removed; release guidance documents only shipped public interfaces |
| Wallet CLI | copied an older release's device-auth and fee model | build now syncs latest stable release; current content is `v0.1.5` |
| Wallet CLI packaging | trusted a downloaded tarball without checking its published digest and copied only one known reference | verifies the release SHA-256, rejects unsafe archive paths, and syncs the complete released `references/` tree |
| Public references | linked Smart Approvals to an inaccessible `wallet-sdk` GitHub tag and a preview-only demo | points to the published npm package and stable demo URL |
| Source URL | cited the MegaETH RPC reference index, which returned `404` | links the exact live method pages used by the guide |

## Unverified Or Not Publicly Reproducible

The following items could not be established to the same standard. Their
current handling is part of the release decision.

| ID | Item | What was not verifiable | Repository treatment |
| --- | --- | --- | --- |
| U1 | Prism writes | no protocol-owned public ABI, deployment manifest, init-code hash, tax-router semantics, or write API contract was found | candidate addresses are clearly labeled; all write and delegated-key recipes are withheld |
| U2 | MTRKR MCP | uptime, data provenance/quality, auth, payment requirements, privacy, read-only guarantees, schemas, and maintenance status | discovery-only pointer; never recommended or required without separate due diligence |
| U3 | MegaNames testnet | source files contain conflicting deployment sets, and code exists at all candidates | no static testnet write addresses; users must resolve the current canonical deployment first |
| U4 | MOSS audit reports | SlowMist and BlockSec engagements are recorded in first-party docs, but reports, scopes, findings, and deployed-code mapping are not public here | claims are attributed and qualified; no independent certification claim is made |
| U5 | MOSS source reproducibility | several authoritative implementation/doc snapshots were access-restricted during the audit | public npm versions are recorded; implementation-level claims should be re-audited when public sources or generated API artifacts are available |
| U6 | Wallet CLI test USDm | the CLI release uses `0x15e9...` for its test environment while the public canonical token list uses `0x72d4...77cF4` | both contexts are stated; the CLI constant is not presented as canonical token metadata |
| U7 | USDm reserve composition | details beyond a Treasury-based reserve description were not supported by a current issuer source | detailed asset-manager, rail, yield, and sequencer claims were removed |
| U8 | Warren runtime/privacy | no independent audit was performed for script privacy claims, registration API behavior, current service availability, or contract labels assigned to EOAs | claims are explicitly attributed to Warren source; users are told how to disable metadata registration and protect keys |
| U9 | SIR inherited Treasury | an inherited address labeled Treasury was absent from live build data | omitted; live build data and deployed ABI take precedence |
| U10 | SIR source/deployment parity | Core and Periphery source can lag the deployed MegaETH six-argument `mint` interface | guide prioritizes live build data and deployed ABI and flags the version boundary |
| U11 | Provider guarantees | no universal archive-retention, geography, latency, caching, or paid-tier guarantees exist in MegaETH public gateway docs | all such historical claims were removed; users must consult their provider |
| U12 | Kyber commercial/runtime policy | a valid API key was not available to verify account-specific quotas, pricing, or service guarantees on the preferred gateway | request schema and auth come from official docs; runtime policy is left to the user's Kyber account |
| U13 | x402 facilitators | third-party facilitator availability, auth, pricing, supported assets, and confirmation policy vary by operator | guide requires capability discovery and explicit server policy instead of naming an unverified managed service |
| U14 | Ecosystem indexes | Awesome MegaETH AI and the partner skill contain discovery claims and historically broken/missing linked detail files | every safety-critical claim is re-sourced; remaining entries are explicitly an index, not endorsement |
| U15 | Kumbaya MCP tooling | the protocol-owned agent kit exists, but its signer custody, API auth, deployment, and operational security were not audited here | linked as separately installable tooling, not bundled or required by these markdown skills |
| U16 | Temporal deployment state | protocol addresses and APIs can change after the snapshot date | each value-bearing protocol guide requires a fresh source/bytecode/ABI check before execution |
| U17 | Managed MOSS paymaster | no current public source established availability, API contract, eligibility, or pricing | not promised as available; partner teams must confirm directly with MegaETH Labs |

## Release Follow-Ups

These are not blockers for the current markdown-skill release because the repo
already fails closed around them:

- obtain publication permission for MOSS audit reports and map reviewed commits
  to deployed account implementations;
- ask Prism for a protocol-owned deployment manifest and ABIs before restoring
  write guidance;
- resolve and publish one canonical MegaNames testnet deployment record;
- perform a separate MTRKR product/security/operations review before any
  recommendation;
- publish stable generated MOSS API/type documentation so public verification
  does not depend on access-restricted source;
- reconcile the wallet CLI test USDm constant with the canonical token list or
  document why the environments intentionally differ.

## Release Validation Record

The release gate covers:

- YAML frontmatter and skill-name matching;
- all local Markdown links;
- bundled JavaScript syntax;
- ZIP integrity and expected skill contents;
- Skills CLI discovery;
- a real copy-mode install into an isolated temporary project;
- smoke tests for bundled MOSS helper scripts;
- `git diff --check`.

Final results on 2026-08-04:

| Check | Result |
| --- | --- |
| `npm run validate` | passed; synced wallet CLI `v0.1.5`, built 6 archives, validated 4 skills and 71 Markdown files, ran helper smoke tests, and listed 4 skills |
| upstream `quick_validate.py` | all 4 skills passed using an isolated `PyYAML` runtime |
| `npx skills@1.5.21` copy-mode install | installed all 4 skills into an isolated Git project |
| installed payload comparison | recursive comparison matched the source `skills/` tree exactly |
| public Markdown links | all directly linked public references returned HTTP 200; npm pages were version-checked through the registry API |
| protocol endpoints | Prism reads, SIR build data, drand, Kyber docs, MOSS demo, and wallet installer responded; Warren's bodyless GET returned the expected client error for its POST-oriented endpoint |
| read-only deployed-code sample | code present at sampled USDm, Aave, Kumbaya, SIR, MegaNames, ERC-8004, Prism-candidate, and Warren contract addresses; the Warren treasury/relayer address had no code, consistent with an EOA |

Run the reproducible repository checks with:

```bash
npm run validate
```
