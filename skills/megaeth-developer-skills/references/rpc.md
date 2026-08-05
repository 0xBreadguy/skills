# MegaETH RPC Reference

## Endpoints

| Transport | Mainnet | Testnet |
| --- | --- | --- |
| HTTP | `https://mainnet.megaeth.com/rpc` | `https://carrot.megaeth.com/rpc` |
| WebSocket | `wss://mainnet.megaeth.com/ws` | `wss://carrot.megaeth.com/ws` |

The public HTTP endpoint does not require an API key. Managed providers can
have different rate, archive, and method policies; verify their documentation
instead of assuming public-gateway behavior.

## Submission Methods

| Method | Result |
| --- | --- |
| `eth_sendRawTransaction` | Transaction hash; poll or subscribe for the receipt. |
| `realtime_sendRawTransaction` | Receipt when execution completes within the wait window. Preferred synchronous method. |
| `eth_sendRawTransactionSync` | Public-gateway compatibility alias for the realtime method. |

For either synchronous method, the optional second parameter is a timeout in
milliseconds. The public gateway caps it at `3000`. Timeout does not prove
failure; reconcile before retrying. Streaming receipts can temporarily contain
an all-`ff` block hash until the enclosing EVM block seals.

## Mini-Block Behavior

Standard reads with `latest` or `pending` query the latest mini-block state.
Use `eth_subscribe` over WebSocket for `newHeads`, `logs`,
`newPendingTransactions`, `syncing`, `miniBlocks`, or `stateChanges`.

For real-time logs, set both `fromBlock` and `toBlock` to `pending`. For full
transactions and receipts at mini-block cadence, subscribe to `miniBlocks`.
Mini-block notifications are streams, not an independently queryable archive;
persist them or backfill from sealed blocks after disconnects.

Do not use undocumented methods such as `eth_callAfter` or
`eth_getLogsWithCursor`. They are not in the current public RPC reference.

## Public HTTP Limits

### Payloads

| Limit | Value |
| --- | ---: |
| Default request body | 128 KiB |
| Transaction-submission body | 2.5 MiB |
| Simulation and large-read body | 1.5 MiB |
| Batch size | 100 requests |
| Expanded batch subrequest budget | 950 |
| Response body | 50 MiB |

The transaction limit applies to all three submission methods. The simulation
limit applies to `eth_call`, `eth_callMany`, `eth_createAccessList`, and
`eth_estimateGas`.

### Method Limits

| Method | Public behavior |
| --- | --- |
| `eth_call` | 60,000,000 compute-gas cap |
| `eth_callMany` | At most 100 bundles, 100 total calls, 60,000,000 compute gas per call, and 25 seconds |
| `eth_estimateGas` | CPU-time limited; current default is 0.5 seconds |
| `eth_feeHistory` | `blockCount` at most 256 |
| `eth_getLogs` | No gateway block-range cap, but backend, time, memory, and response limits still apply |

Bound log ranges and paginate in the application. A missing block-range cap is
not permission to issue unbounded scans.

### Read Rate Limits

Read requests are limited per client IP in fixed ten-second windows:

| Category | Requests / 10 s | Examples |
| --- | ---: | --- |
| Instant | 2,000 | chain ID, block number, balance, storage |
| Simple | 500 | basic block and transaction reads |
| Compute | 200 | call, callMany, estimate, access-list, debug trace |
| IO-heavy | 200 | logs and block receipts |

Submission methods are exempt from these read categories. A rate-limited
request returns HTTP `429` and JSON-RPC code `-32005`. Back off with jitter and
reduce request concurrency or range size.

## Public WebSocket Limits

- 5 connections per IP
- 5 active subscriptions per connection
- 5 client messages per second per connection
- 60-second idle timeout
- 64 KiB message limit
- 20 addresses and 4 topic positions per log filter

Send `eth_chainId` at least every 30 seconds. Recreate subscriptions and
reconcile missed data after reconnect; notifications are not replayed.

## Batching And Read Design

- JSON-RPC batches reduce transport round trips, but one slow item delays the
  whole batch response.
- Contract multicall is useful when calls must share one block context. It is
  not universally preferable to JSON-RPC batching.
- `eth_callMany` is available for multiple simulations; count its inner calls
  against the public batch budget.
- Keep historical log/indexing work off latency-sensitive UI paths.
- Reuse HTTP connections or WebSockets instead of creating a new transport for
  every request.

Do not rely on old version-specific performance claims, fixed geographic
latency tables, or assumed cache behavior. The public gateway has internal
caches with method-specific eligibility; responses carry `Cache-Control:
no-store`, and there is no client cache-bypass parameter.

## Debugging

The public endpoint currently supports tracing mined transactions and blocks:

- `debug_traceTransaction`
- `debug_traceBlockByNumber`
- `debug_traceBlockByHash`

It does not document `debug_traceCall`. Use `mega-evme` for local what-if
simulation or check a managed provider's method list.

```bash
cast rpc debug_traceTransaction 0xTransactionHash \
  '{"tracer":"callTracer"}' \
  --rpc-url https://mainnet.megaeth.com/rpc
```

## Sources

- `https://docs.megaeth.com/dev/rpc/quickstart`
- `https://docs.megaeth.com/dev/rpc/operations-and-limits`
- `https://docs.megaeth.com/dev/rpc/reference/eth_call`
- `https://docs.megaeth.com/dev/rpc/reference/eth_callMany`
- `https://docs.megaeth.com/dev/rpc/reference/eth_getLogs`
- `https://docs.megaeth.com/dev/rpc/reference/debug_traceTransaction`
- `https://docs.megaeth.com/dev/read/realtime-api`
- `https://docs.megaeth.com/dev/send-tx/debugging`
