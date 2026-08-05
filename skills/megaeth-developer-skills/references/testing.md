# Testing and Debugging

Use this guide for test strategy and first-line troubleshooting. For local
transaction replay and MegaEVM-specific traces, continue with
[`mega-evme.md`](mega-evme.md).

## Test against MegaETH semantics

MegaEVM has multidimensional resource accounting and dynamic storage gas that a
generic local EVM may not reproduce. Keep normal unit tests in Foundry, but run
integration tests and deployment dry runs against the target MegaETH RPC.

```bash
forge test
forge test --fork-url https://carrot.megaeth.com/rpc

# Deployment scripts should use the node's estimate instead of Foundry's local
# simulation when MegaEVM accounting makes the local estimate disagree.
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://carrot.megaeth.com/rpc \
  --broadcast --skip-simulation
```

Do not copy a gas limit from a generic EVM simulation. Use
`eth_estimateGas` on the target network and preserve a reasonable operational
margin.

## Replay a transaction

Build the reference debugger from the MegaEVM repository:

```bash
git clone https://github.com/megaeth-labs/mega-evm
cd mega-evm/bin/mega-evme
cargo build --release
```

Then replay under the hardfork selected from the transaction's chain and block
timestamp:

```bash
mega-evme replay <TX_HASH> \
  --rpc https://mainnet.megaeth.com/rpc

mega-evme replay <TX_HASH> \
  --rpc https://mainnet.megaeth.com/rpc \
  --trace --tracer opcode \
  --trace.opcode.enable-return-data \
  --trace.output trace.json

mega-evme replay <TX_HASH> \
  --rpc https://mainnet.megaeth.com/rpc \
  --trace --tracer call \
  --trace.output calls.json
```

See [`mega-evme.md`](mega-evme.md) for capture/offline replay and spec
overrides.

## Useful RPC checks

```bash
# Current and pending nonces
cast nonce <ADDRESS> --rpc-url https://mainnet.megaeth.com/rpc --block latest
cast nonce <ADDRESS> --rpc-url https://mainnet.megaeth.com/rpc --block pending

# Remote gas estimate
cast estimate <TO> <SIGNATURE> [ARGS...] \
  --from <SENDER> --rpc-url https://mainnet.megaeth.com/rpc

# Transaction and receipt
cast tx <TX_HASH> --rpc-url https://mainnet.megaeth.com/rpc
cast receipt <TX_HASH> --rpc-url https://mainnet.megaeth.com/rpc

# Decode calldata
cast 4byte-decode <CALLDATA>
```

The public RPC exposes mined-transaction and block tracing methods described in
[`rpc.md`](rpc.md). It does not expose `debug_traceCall`.

## Common failures

### Intrinsic gas too low

Re-estimate against the target MegaETH RPC. If a Foundry script fails during
local simulation but the target node estimates successfully, use
`--skip-simulation` so the broadcast path takes the remote estimate. Do not
solve this by assuming a universal fixed transaction gas limit.

### Nonce too low after real-time submission

`realtime_sendRawTransaction` waits for execution, but a timeout is
inconclusive. Before replacing or resending, query the receipt and both the
latest and pending nonce. The original transaction may already have executed.

### Historical state unavailable

There is no documented public-RPC retention duration. If an old block or state
query fails, use a provider that explicitly offers the required archive data or
run an archive-capable node. Do not rely on an assumed 15-day window.

### WebSocket disconnects

The public WebSocket endpoint has a 60-second idle timeout. Send a cheap request
such as `eth_chainId` every 30 seconds, reconnect with backoff, and recreate
subscriptions after reconnecting.

### Gas detention or resource-limit failure

The first volatile-data access can cap the transaction's *remaining* compute
budget to at most 20 million additional gas under current rules. It does not
retroactively impose a 20-million total-transaction cap. Replay with
`mega-evme`, then inspect compute, data, KV-update, and state-growth usage rather
than treating every failure as ordinary out-of-gas.

## Explorer links

| Network | Explorer |
| --- | --- |
| Mainnet | https://mega.etherscan.io |
| Testnet | https://testnet-mega.etherscan.io |

Explorer indexing can lag chain RPC state. Use the receipt from the RPC as the
primary check for transaction status.

## Escalation bundle

When reporting a reproducible execution problem, include the transaction hash,
network and RPC URL, block number, exact error, minimal reproduction, tool
versions, and any `mega-evme` trace or capture artifact.
