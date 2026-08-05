# Storage Design On MegaETH

MegaETH does not charge a blanket fixed price per new storage slot. A
zero-to-nonzero SSTORE pays normal EVM compute gas plus dynamic storage gas:

```text
20,000 * (SALT bucket multiplier - 1)
```

At multiplier 1 the additional storage charge is zero. At larger multipliers
it rises with bucket capacity. Each new slot also counts toward data size, KV
updates, and the 1,000-entry state-growth limit.

## Design Rules

1. Use a MegaETH RPC for `eth_estimateGas`; do not estimate the SALT multiplier
   yourself.
2. Avoid unbounded state growth. Bound loops, arrays, batch sizes, and
   user-created records even when the current gas estimate is cheap.
3. Reuse an existing nonzero slot when the data model naturally permits it.
   Deleting a slot and later setting it nonzero can incur a fresh storage-gas
   charge, and storage gas from the earlier write is not refunded.
4. Use transient storage for transaction-scoped state and memory for
   call-scoped state.
5. Keep large immutable payloads offchain unless onchain availability is an
   explicit product requirement.

Do not replace every mapping with a custom tree merely because it is a mapping.
Mappings are standard and often appropriate. A packed array, free list, ring
buffer, or tree only helps when it matches access patterns and is validated
under realistic churn, deletion, and adversarial workloads.

## Slot-Reuse Example

```solidity
uint256[100] private buffer;
uint256 private head;

function append(uint256 value) external {
    require(value != 0, "zero reserved for empty");
    buffer[head] = value;
    head = (head + 1) % buffer.length;
}
```

This bounds state growth. It does not guarantee a particular gas price; remote
estimation remains required.

## Large Immutable Data

SSTORE2-style storage puts bytes in deployed contract code. It trades storage
slots for code deposit:

- writes pay contract-creation costs plus `10,000` storage gas per deployed
  byte
- reads use `EXTCODESIZE`/`EXTCODECOPY` and still consume onchain compute gas
- runtime code is limited to 512 KiB and initcode to 536 KiB
- deployment also counts toward data-size and state-growth limits

This can be useful for write-once data but is not free or automatically cheaper.
Compare an actual MegaETH RPC estimate against storage, calldata, blobs, IPFS,
or another data-availability design.

## Offchain And Commitment Patterns

For data that contracts do not need directly, store a hash or content URI
onchain and keep the payload in an appropriate external system. For verifiable
state machines, store a commitment and verify proofs onchain. These designs
trade implementation and proof complexity for bounded chain state; they are
not universal defaults.

## Profiling

Use `mega-evme` when a transaction's storage or resource behavior needs
explanation:

```bash
mega-evme replay 0xTransactionHash \
  --rpc https://mainnet.megaeth.com/rpc \
  --trace \
  --tracer opcode \
  --trace.output trace.json
```

Inspect SSTORE, CREATE/CREATE2, LOG, calldata, and state-growth behavior. Do not
use historical claims such as "2M gas per slot," "$0.10 per slot," or planned
state-rent figures as current implementation facts.

## Sources

- `https://docs.megaeth.com/dev/execution/gas-model`
- `https://docs.megaeth.com/dev/execution/resource-limits`
- `https://docs.megaeth.com/spec/megaevm/dual-gas-model`
- `https://docs.megaeth.com/spec/megaevm/resource-accounting`
