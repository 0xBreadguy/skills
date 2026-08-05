# MegaETH Realtime API

Use this when an app needs mini-block-fresh reads, streaming events, or a
transaction receipt returned without a polling loop.

## Realtime Reads

With the `latest` or `pending` block tag, these standard Ethereum methods read
from the latest mini-block automatically:

- `eth_getBalance`, `eth_getStorageAt`, `eth_getTransactionCount`, and
  `eth_getCode`
- `eth_call`, `eth_callMany`, `eth_createAccessList`, and `eth_estimateGas`
- `eth_getTransactionByHash` and `eth_getTransactionReceipt`

Mini-blocks are produced roughly every 10 ms; enclosing EVM blocks are produced
roughly every second.

## Synchronous Submission

Prefer `realtime_sendRawTransaction` for new code. Pass signed transaction
bytes and, optionally, a timeout in milliseconds:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "realtime_sendRawTransaction",
  "params": ["0x...signedTransaction", 3000]
}
```

The public gateway caps an explicit timeout at `3000` ms. A timeout is
inconclusive: the transaction may still execute, so reconcile by transaction
hash and sender nonce before retrying. A streaming receipt may temporarily use
an all-`ff` `blockHash`; refetch after the EVM block seals when a canonical
block hash is required.

The public gateway also supports `eth_sendRawTransactionSync` as a
compatibility alias. It routes through the same handler and has the same
parameters and receipt result. The underlying node's native method remains
`realtime_sendRawTransaction`.

## WebSocket Streams

MegaETH supports these `eth_subscribe` types:

- `newHeads`
- `logs`
- `newPendingTransactions`
- `syncing`
- `miniBlocks`
- `stateChanges`

For mini-block log delivery, set both `fromBlock` and `toBlock` to `pending`.
`miniBlocks` notifications use snake-case fields including
`block_number`, `block_timestamp`, `index`, `mini_block_number`,
`mini_block_timestamp` (microseconds), `gas_used`, `transactions`, `receipts`,
`transaction_root`, `receipt_root`, and `signature`.

Notifications are not replayed after disconnect. Reconnect, recreate
subscriptions, and backfill the missed range.

## Public Gateway Limits

- 5 WebSocket connections per IP
- 5 subscriptions per connection
- 5 client messages per second per connection
- 60-second idle timeout; send `eth_chainId` at least every 30 seconds
- 64 KiB maximum WebSocket message
- Log filters: at most 20 addresses and 4 topic positions

The WebSocket endpoint accepts `eth_subscribe`, `eth_unsubscribe`,
`eth_sendRawTransaction`, `eth_sendRawTransactionSync`,
`realtime_sendRawTransaction`, and `eth_chainId`.

## Sources

- `https://docs.megaeth.com/dev/read/realtime-api`
- `https://docs.megaeth.com/dev/rpc/reference/realtime_sendRawTransaction`
- `https://docs.megaeth.com/dev/rpc/reference/eth_sendRawTransactionSync`
- `https://docs.megaeth.com/dev/rpc/reference/eth_subscribe`
- `https://docs.megaeth.com/dev/rpc/operations-and-limits`
