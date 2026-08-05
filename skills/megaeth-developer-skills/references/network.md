# MegaETH Network Reference

Use this file for chain parameters, RPC endpoints, and explorer links. Verify
live endpoint status against `https://docs.megaeth.com/user/connect` when a
deployment depends on the exact current URL.

## Networks

| Network | Chain ID | RPC | Explorer |
| --- | --- | --- | --- |
| Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` | `https://mega.etherscan.io`, `https://megaeth.blockscout.com/` |
| Testnet | `6343` | `https://carrot.megaeth.com/rpc` | `https://testnet-mega.etherscan.io/` |

Native token is ETH with 18 decimals. Base fee adjustment is effectively
disabled; do not add Ethereum-style priority-fee assumptions without checking
the current docs.

## Wallet Configuration

For EVM wallets, add a custom network with the chain ID and RPC URL above.
Use the mainnet explorers for production links and testnet Etherscan for test
deployments.

## Implementation Notes

- Use explicit chain IDs in all viem/wagmi/Foundry config.
- Keep mainnet and testnet token addresses separate.
- Managed RPC providers may expose higher rate limits; do not assume public
  endpoints can handle production indexing or high-frequency bots.
- For MOSS hosted wallet flows, route to `moss-wallet-sdk` or
  `moss-wallet-cli`.
