# mega-evme Debugging

`mega-evme` is the reference CLI in the MegaEVM repository for executing and
debugging bytecode under MegaETH specifications. Use it for historical replay,
MegaEVM resource accounting, system contracts, gas detention, traces, and
reproducible execution fixtures.

## Install

```bash
git clone https://github.com/megaeth-labs/mega-evm
cd mega-evm/bin/mega-evme
cargo build --release
./target/release/mega-evme --help
```

The repository is under active development. Build from a pinned commit when a
debug artifact must be reproducible.

## Replay on-chain execution

```bash
mega-evme replay \
  --rpc https://mainnet.megaeth.com/rpc \
  <TX_HASH>

mega-evme replay \
  --rpc https://mainnet.megaeth.com/rpc \
  --trace --tracer opcode \
  --trace.opcode.enable-return-data \
  --trace.output trace.json \
  <TX_HASH>

mega-evme replay \
  --rpc https://mainnet.megaeth.com/rpc \
  --trace --tracer call \
  --trace.call.with-log \
  --trace.output calls.json \
  <TX_HASH>
```

Replay auto-detects the MegaEVM spec from the chain ID and target block's
timestamp for recognized chains. Do not force the newest spec when investigating
a historical transaction.

For a deliberate what-if comparison, use `--override.spec`:

```bash
mega-evme replay \
  --rpc https://mainnet.megaeth.com/rpc \
  --override.spec Rex7 \
  <TX_HASH>
```

Current `run` and `tx` commands default to `Rex7`; they do not perform replay's
historical auto-detection.

## Capture and offline replay

Capture every RPC response used by a replay:

```bash
mega-evme replay \
  --rpc https://mainnet.megaeth.com/rpc \
  --rpc.capture-file ./captures/tx.json \
  <TX_HASH>
```

Replay only from that capture, without network access:

```bash
mega-evme replay \
  --rpc.replay-file ./captures/tx.json \
  <TX_HASH>
```

`--rpc.capture-file` requires `--rpc`. `--rpc.replay-file` is mutually exclusive
with live RPC and cache options. These are replay-command workflows, not generic
offline flags for `run` or `tx`.

For a standardized execution fixture with post-state checks, add
`--dump-fixture <PATH>` during capture. Fixture dumping rejects transaction and
spec overrides because those would no longer represent the on-chain execution.

## Other commands

- `run`: execute bytecode or initcode with a controlled local environment.
- `tx`: execute a transaction, optionally forking state from a remote RPC.
- `--prestate` / `--dump`: load and persist local account state.
- `--fork.block`: pin the remote post-state used by `tx`.
- `--tracer opcode|call|pre-state`: choose trace shape.

Check `mega-evme <COMMAND> --help` at the installed commit before scripting
flags.

## Debugging order

1. Confirm calldata, balances, allowances, roles, and the revert payload.
2. Replay under the auto-detected historical spec.
3. Inspect compute, data, KV-update, and state-growth accounting.
4. Check whether volatile-data access triggered gas detention.
5. Check system-contract and dynamic-address assumptions.
6. Capture the RPC inputs before handing the case to another engineer.
7. Turn the isolated behavior into a focused Foundry regression test.

Save the transaction hash, chain ID, block number, `mega-evme` commit, trace,
capture or fixture, and any overrides. A synchronous receipt is evidence of
submission/execution behavior; it does not itself make later replay independent
of the original state and hardfork.

## Primary source

- https://github.com/megaeth-labs/mega-evm/tree/main/docs/mega-evme
- https://github.com/megaeth-labs/mega-evm/tree/main/bin/mega-evme
