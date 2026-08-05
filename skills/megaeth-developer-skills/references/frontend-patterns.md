# Frontend Patterns

## Chain configuration

```ts
import { defineChain } from "viem";

export const megaeth = defineChain({
  id: 4326,
  name: "MegaETH",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://mainnet.megaeth.com/rpc"],
      webSocket: ["wss://mainnet.megaeth.com/ws"],
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://mega.etherscan.io" },
  },
});

export const megaethTestnet = defineChain({
  id: 6343,
  name: "MegaETH Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://carrot.megaeth.com/rpc"],
      webSocket: ["wss://carrot.megaeth.com/ws"],
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://testnet-mega.etherscan.io" },
  },
});
```

Always check `eth_chainId` after connecting. Do not infer the network from a URL
or token address alone.

## WebSocket topology

The public endpoint limits each IP to five connections, each connection to five
subscriptions, and incoming messages to five per second. A backend fan-out
connection is usually the right architecture for a multi-user application.
Direct browser subscriptions can still be appropriate for low-volume clients,
but budget them explicitly and implement reconnect behavior.

On every connection:

1. subscribe and retain the returned subscription ID;
2. send `eth_chainId` every 30 seconds to stay below the 60-second idle timeout;
3. reconnect with capped exponential backoff;
4. recreate subscriptions after reconnecting;
5. deduplicate events because reconnect boundaries can overlap.

`miniBlocks` is MegaETH-specific. Its timestamp fields are microseconds, not
JavaScript milliseconds, and its transaction rate should be measured over a
time window rather than inferred from a fixed 100-mini-blocks-per-second
constant.

```ts
type MiniBlock = {
  block_number: number;
  block_timestamp: number;
  index: number;
  mini_block_number: number;
  mini_block_timestamp: number;
  gas_used: number;
  transactions: unknown[];
  receipts: unknown[];
};
```

For real-time log subscriptions, set both `fromBlock` and `toBlock` to
`"pending"`. Standard `logs` subscriptions otherwise follow standard Ethereum
semantics. See [`realtime-api.md`](realtime-api.md) for the complete limits and
subscription set.

## Transaction submission

Use the standard wallet flow to prepare and sign a transaction, then submit the
serialized transaction through `realtime_sendRawTransaction` when the product
needs a receipt as soon as execution completes:

```ts
import { createPublicClient, http, type Hex } from "viem";

const client = createPublicClient({
  chain: megaeth,
  transport: http("https://mainnet.megaeth.com/rpc"),
});

export async function submitRealtime(serialized: Hex) {
  return client.request({
    method: "realtime_sendRawTransaction" as never,
    params: [serialized] as never,
  });
}
```

The call can return a receipt or time out. A timeout does not prove failure; look
up the transaction hash before retrying. The public endpoint's explicit timeout
parameter is capped at 3000 milliseconds.

## Gas and fees

Do not hardcode a universal gas limit, intrinsic gas value, base fee, or fee
buffer. Query the target network:

```ts
const request = await walletClient.prepareTransactionRequest({
  account,
  to,
  value,
});

const serialized = await walletClient.signTransaction(request);
```

MegaETH's documented minimum base fee is currently `0.001 gwei`, with base-fee
adjustment effectively disabled, but applications should still read node fee
data and avoid making that deployment setting a correctness assumption.

## Read batching

Choose batching by workload:

- use JSON-RPC batches when independent RPC calls can share one HTTP round trip;
- use Multicall3 when reads must observe one EVM execution context or the
  contract-level aggregation is convenient;
- keep large log and historical queries off latency-critical UI paths;
- honor the public gateway's batch, per-method, and response-size limits.

There is no current first-party guarantee that Multicall is universally faster
or that `eth_call` has a fixed version-specific speedup. Measure the actual
request mix.

## Connection warmup

For a latency-sensitive flow, a cheap startup request can establish DNS, TLS,
and connection-pool state:

```ts
await client.getChainId();
```

The actual cold-start cost depends on user geography, runtime, transport, and
provider. Do not promise a fixed millisecond saving.

## UI state and reconciliation

Keep these states distinct:

- awaiting wallet approval;
- signed locally;
- submitted with known transaction hash;
- receipt returned or found by polling;
- application-defined confirmation/finality reached;
- failed or replaced.

Do not present a real-time request timeout as a failed transaction. Prefer error
codes and structured provider errors over substring-only classification, and
retain the original error for diagnostics.

For historical analytics, load asynchronously or use an indexer whose retention
and freshness guarantees match the product. The public RPC does not document a
fixed historical-state retention period.
