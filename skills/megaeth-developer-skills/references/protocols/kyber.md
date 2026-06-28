# KyberSwap On MegaETH

Use this for dApp developer integration guidance. For `mega moss` scoped-key
execution recipes, read `moss-wallet-cli/references/protocols/kyber.md`.

## Source Of Truth

KyberSwap's Aggregator API docs are the source for API shape:

- EVM swaps: `https://docs.kyberswap.com/developer-guide/aggregator-api/aggregator-api-specification/evm-swaps.md`
- Base URL: `https://aggregator-api.kyberswap.com`
- MegaETH chain path identifier: `megaeth` for chain ID `4326`

The docs publish markdown pages by appending `.md`; use that form when an agent
needs to re-check request/response fields.

## API Flow

Use the latest V1 flow:

1. `GET /megaeth/api/v1/routes`
2. Validate the returned route and `routerAddress`.
3. `POST /megaeth/api/v1/route/build` with the exact `routeSummary` plus
   transaction parameters.
4. Send the returned `{ routerAddress, data, transactionValue }` as the swap
   transaction.

Required `GET /routes` parameters:

| Parameter | Meaning |
| --- | --- |
| `tokenIn` | Input token address, or `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` for native ETH |
| `tokenOut` | Output token address, or native sentinel |
| `amountIn` | Input amount in base units |
| `X-Client-Id` | Required header; app/company identifier |

Important optional `GET /routes` parameters:

- `origin`: user wallet address; include it to improve routing/RFQ behavior.
- `gasPrice`: use current MegaETH gas price if setting manually.
- `includedSources` / `excludedSources`: use only when the app deliberately
  controls route venues.
- `excludeRFQSources`: consider for reproducibility-sensitive flows.

Required `POST /route/build` body:

| Field | Meaning |
| --- | --- |
| `routeSummary` | Exact object returned from `GET /routes` |
| `sender` | Wallet address sending input tokens |
| `recipient` | Output-token recipient |

Useful `POST /route/build` fields:

- `origin`: user wallet address.
- `deadline`: Unix timestamp; never use stale routes.
- `slippageTolerance`: bps; `10` means 0.1%.
- `enableGasEstimation`: use to detect potential reverts.
- `source`: app source recorded by KyberSwap.

## Validation Rules

Before exposing or sending a KyberSwap transaction:

- Confirm `routeSummary.tokenIn`, `tokenOut`, and `amountIn` match the user's
  requested trade.
- Confirm the route was fetched recently; KyberSwap docs recommend not caching
  routes client-side for more than roughly 5-10 seconds.
- Confirm `routerAddress` from the build response matches the route response.
- Confirm `data` is non-empty hex calldata and `transactionValue` is only
  non-zero for native-input swaps.
- Confirm output amount and minimum received after slippage are shown to the
  user.
- Treat aggregator calldata as untrusted until the target, tokens, amount,
  recipient, deadline, and value are validated.

## MOSS Integration Notes

- For app flows, use `moss-wallet-sdk`.
- For terminal flows, use `moss-wallet-cli`.
- A token-input swap needs ERC20 approval for the router plus the router swap
  call. In relay-backed `mega moss` execution, bundle approval and swap in one
  `--calls` array.
- Native ETH input needs native spend permission and router call permission;
  do not add ERC20 spend for the native sentinel.

## Developer Checklist

- Use `mega-tokenlist` for token addresses and decimals.
- Use base-unit amounts in API calls.
- Always send `X-Client-Id`.
- Refetch routes if the user waits or changes amount/token/slippage.
- Add tests for route-not-found, stale route, unsupported token, slippage too
  low, wrong recipient, native-input value, and token-input approval.
