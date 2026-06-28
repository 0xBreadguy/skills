# MegaETH Realtime API

Use this when an app needs low-latency reads, event streaming, or transaction
receipt return without a polling loop.

## Current Method Names

Use `realtime_sendRawTransaction` for new code. It submits a signed transaction
and returns the receipt in one JSON-RPC round trip when execution completes,
with a timeout path if the transaction is not executed in time.

Older materials may mention `realtime_sendRawTransaction` or Realtime API naming.
Treat those as historical unless the target RPC endpoint explicitly supports
that method. For new examples, prefer the official `realtime_` method name.

## Realtime Reads

Standard Ethereum methods query against the latest mini-block when called with
`latest` or `pending`, including:

- `eth_getBalance`
- `eth_getStorageAt`
- `eth_getTransactionCount`
- `eth_getCode`
- `eth_call`
- `eth_estimateGas`
- `eth_getTransactionByHash`
- `eth_getTransactionReceipt`

## Realtime Extensions

- `realtime_sendRawTransaction`: submit signed transaction and get receipt.
- `eth_subscribe`: WebSocket logs, state changes, mini-blocks, and headers.
- `eth_callAfter`: run a call after a sender nonce reaches a target value.
- `eth_getLogsWithCursor`: page large log queries with cursors.

## Patterns

- For live UIs, use WebSocket subscriptions instead of polling.
- For dashboards and indexers, subscribe to mini-blocks or filtered logs.
- For dependent approval/swap simulations, use `eth_callAfter` instead of a
  race-prone immediate `eth_call`.
- For wallet-agent execution through MOSS CLI, use `moss-wallet-cli`; the CLI
  submits writes through the MOSS/Porto relay rather than raw transaction
  submission.

Source: `megaeth-labs/documentation/docs/dev/read/realtime-api.md` and
`docs/dev/read/rpc/realtime_sendRawTransaction.md`.
