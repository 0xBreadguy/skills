# MegaETH Tokenlist

Use `megaeth-labs/mega-tokenlist` as the canonical token metadata source for
MegaETH applications, agents, and wallet workflows.

## Generated Lists

- `megaeth.tokenlist.json`: production token list containing Ethereum and
  MegaETH mainnet entries.
- `megaeth.testnet.tokenlist.json`: MegaETH testnet entries only.

Both follow the Uniswap Token List shape with MegaETH extensions for bridge
mechanism and origin tracking.

## Rules For Agents

- Do not invent token addresses or decimals. Read the tokenlist or protocol
  docs before writing integration code.
- Keep mainnet and testnet token addresses separate.
- Use tokenlist decimals when formatting spend limits, transfer amounts, UI
  balances, or MOSS permission policies.
- For bridged assets, inspect `extensions.originChain`,
  `extensions.originMechanism`, `extensions.bridgeAddress`, and
  `extensions.bridgeType` before drawing supply or backing conclusions.
- For unknown or spam tokens, hide or require explicit user selection.

## MOSS Permission Interaction

When building MOSS Smart Approvals or CLI delegated keys:

- Use the token address from tokenlist for `spend.token`.
- Convert human amounts into base units using token decimals.
- Use the native zero address only for native ETH spend:
  `0x0000000000000000000000000000000000000000`.
- For protocol interactions, route CLI permission recipes to
  `moss-wallet-cli`.

## Source

Canonical repo: `https://github.com/megaeth-labs/mega-tokenlist`.
