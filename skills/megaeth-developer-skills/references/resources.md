# Resources and Source Policy

Use first-party documentation and deployed-chain evidence before inherited skill
text, aggregators, or community examples. A third-party repository can be a
useful discovery source, but its claims still require due diligence.

## Primary MegaETH sources

| Subject | Source |
| --- | --- |
| Developer and user docs | https://docs.megaeth.com |
| MegaEVM specs and implementation | https://github.com/megaeth-labs/mega-evm |
| Canonical token metadata | https://github.com/megaeth-labs/mega-tokenlist |
| Mainnet explorer | https://mega.etherscan.io |
| Testnet explorer | https://testnet-mega.etherscan.io |
| Network status | https://uptime.megaeth.com |
| Skills repository | https://github.com/megaeth-labs/skills |
| MOSS Wallet CLI | https://github.com/megaeth-labs/wallet-cli |

The canonical token list is the default source for public token address,
symbol, decimal, and logo metadata. Keep mainnet and testnet lists separate and
still verify contract code and expected behavior before a value-moving action.

## Network endpoints

| Network | Chain ID | HTTP RPC | WebSocket |
| --- | ---: | --- | --- |
| Mainnet | 4326 | `https://mainnet.megaeth.com/rpc` | `wss://mainnet.megaeth.com/ws` |
| Testnet | 6343 | `https://carrot.megaeth.com/rpc` | `wss://carrot.megaeth.com/ws` |

Managed providers may offer different retention, rate limits, or products. Read
the provider's current documentation rather than assuming geographic coverage,
archive access, or a performance tier.

## Core tooling

- **Foundry:** https://getfoundry.sh
- **mega-evme:** https://github.com/megaeth-labs/mega-evm/tree/main/docs/mega-evme
- **viem:** https://viem.sh
- **OpenZeppelin Contracts:** https://github.com/OpenZeppelin/openzeppelin-contracts
- **Solady:** https://github.com/Vectorized/solady

`mega-evme` is the reference local debugger for MegaEVM-specific replay and
resource accounting. See [`mega-evme.md`](mega-evme.md).

## Relevant standards

- [EIP-1153 transient storage](https://eips.ethereum.org/EIPS/eip-1153) for
  transaction-scoped state such as reentrancy locks.
- [EIP-6909 minimal multi-token interface](https://eips.ethereum.org/EIPS/eip-6909)
  when its authorization and transfer semantics fit the protocol.
- [EIP-6780 SELFDESTRUCT behavior](https://eips.ethereum.org/EIPS/eip-6780),
  which is the relevant post-Cancun model; do not describe `SELFDESTRUCT` as
  globally disabled.

Standards do not become preferable merely because MegaETH supports them. Choose
them from application requirements and verify the target hardfork.

## Common deployed infrastructure

| Contract | Address |
| --- | --- |
| WETH9 | `0x4200000000000000000000000000000000000006` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| High-precision timestamp | `0x6342000000000000000000000000000000000002` |

Resolve application tokens through the canonical token list instead of treating
them as protocol predeploys. Verify bytecode and network before use.

## Bridges and funding

Use the current MegaETH user documentation for bridge and faucet workflows:

- https://docs.megaeth.com/user-guide/bridge
- https://docs.megaeth.com/user-guide/faucet

Do not instruct a user to transfer funds directly to a bridge contract unless
the current bridge documentation explicitly defines that path for the asset and
network.

## Protocol and ecosystem sources

[`protocol-directory.md`](protocol-directory.md) routes to protocol-specific
developer and MOSS CLI guidance. [`awesome-megaeth-ai.md`](awesome-megaeth-ai.md)
records ecosystem-discovery material that has been reviewed for this skill.
Treat Awesome MegaETH AI and the partner skill repository as discovery inputs,
not authorities over a protocol's own docs, repositories, deployed bytecode, or
current API.

## Verification hierarchy

For an address, ABI, API, or operational claim, prefer this order:

1. current protocol-owned docs or repository;
2. current MegaETH-owned docs or registry;
3. verified deployed source and a code check on the specified network;
4. current package types or generated ABI from the implementation;
5. third-party examples, indexes, and inherited skills.

If the sources conflict, state the conflict and require a fresh lookup before a
write. Never convert an unverified address or ABI into executable calldata.
