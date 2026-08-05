# MegaETH Gas Model

MegaETH uses one transaction gas budget with two accounting dimensions:

- **Compute gas** follows standard EVM execution costs.
- **Storage gas** adds charges for persistent data and transaction data.

Receipt `gasUsed` is the combined total. Use a MegaETH RPC endpoint for
estimation; standard local EVMs do not implement MegaETH storage gas or SALT
bucket pricing.

## Current Network Parameters

| Parameter | Value |
| --- | ---: |
| Base fee | `0.001 gwei` (`1,000,000` wei); adjustment effectively disabled |
| Base transaction compute gas | `21,000` |
| Base transaction storage gas | `39,000` |
| Minimum simple transaction total | `60,000` |
| Per-transaction compute ceiling | `200,000,000` |
| Current transaction gas cap | `10,000,000,000` |
| Current block gas limit | `10,000,000,000` |
| Gas forwarding | `98/100` of remaining gas |

Sequencer-configured values can change. Read the current network docs and RPC
instead of hardcoding fee or gas-limit policy in long-lived software.

## Storage Gas Schedule

The current stable schedule includes:

| Operation | Additional storage gas |
| --- | ---: |
| Transaction intrinsic | `39,000` |
| `SSTORE` zero to nonzero | `20,000 * (m - 1)` |
| New account from value transfer | `25,000 * (m - 1)` |
| Contract creation | `32,000 * (m - 1)` |
| Code deposit | `10,000` per deployed byte |
| Log topic | `3,750` per topic |
| Log data | `80` per byte |
| Zero calldata byte | `40` per byte |
| Nonzero calldata byte | `160` per byte |

`m` is the current SALT bucket multiplier. At `m = 1`, the dynamic surcharge
for SSTORE/account/contract creation is zero; at larger multipliers it scales
linearly. The multiplier depends on parent-block state and is not practical for
an application to predict manually.

Storage gas charged for a zero-to-nonzero SSTORE is not refunded if the slot is
later reset. Standard EVM compute-gas refunds still apply to their compute
component.

## Resource Limits

MegaETH also enforces resource dimensions independent of total gas:

| Resource | Transaction | Block |
| --- | ---: | ---: |
| Compute gas | `200,000,000` | no separate limit |
| Data size | `13,107,200` bytes (12.5 MiB) | same |
| KV updates | `500,000` | same |
| State growth | `1,000` | same |
| Encoded transaction size | current config `1 MiB` | no dedicated current cap |
| DA size | adaptive | adaptive |

Gas, encoded transaction size, and DA size are checked before execution.
Compute, data, KV-update, and state-growth limits are measured at runtime. A
transaction that exceeds a runtime transaction limit is included with a failed
receipt and no committed state changes. For block-level runtime dimensions,
the first transaction that reaches or crosses the limit remains included, then
later transactions are skipped.

From Rex4 onward, nested call frames receive `98/100` of the parent's remaining
budget for compute, data, KV updates, and state growth. A child that exceeds a
frame budget reverts with `MegaLimitExceeded(uint8 kind, uint64 limit)`; its
parent may catch the revert.

## Gas Detention

Reading volatile state triggers a **relative** compute budget. At the first
trigger, the effective limit becomes current compute usage plus up to
`20,000,000` additional compute gas, bounded by the existing effective limit.
It is not a retroactive 20M total cap.

Triggers include:

- block-environment opcodes such as `TIMESTAMP`, `NUMBER`, `BLOCKHASH`,
  `COINBASE`, `PREVRANDAO`, `GASLIMIT`, `BASEFEE`, `BLOBBASEFEE`, and
  `BLOBHASH`
- accesses to the block beneficiary account
- SLOAD from native oracle storage

The high-precision timestamp system contract also reads volatile oracle state;
it does not bypass detention. Read volatile data late when possible, or split
work if more than 20M compute is needed after the read.

## Estimation

Use remote `eth_estimateGas` for all value-bearing operations:

```bash
cast estimate 0xContract \
  'method(uint256)' 42 \
  --from 0xSender \
  --rpc-url https://mainnet.megaeth.com/rpc
```

The public estimator has a current CPU-time budget of 0.5 seconds. If it cannot
estimate a valid heavy transaction, reproduce it with `mega-evme` and use a
carefully tested manual gas limit, or use a provider with suitable limits.

Do not use generic fixed limits for ERC20 transfers, approvals, swaps, or
deployments. State, calldata, emitted logs, deployed code size, and SALT bucket
state all affect the result.

## Other EVM Differences

- Runtime code limit: 512 KiB.
- Initcode limit: 536 KiB.
- `SELFDESTRUCT` follows EIP-6780 semantics.
- Logs have linear storage charges of `3,750/topic + 80/byte`; there is no
  documented quadratic-above-4-KiB rule.
- Transient storage (`TSTORE`/`TLOAD`) avoids persistent-storage gas for
  transaction-scoped data.

## Sources

- `https://docs.megaeth.com/dev/execution/gas-model`
- `https://docs.megaeth.com/dev/execution/resource-limits`
- `https://docs.megaeth.com/dev/execution/volatile-data`
- `https://docs.megaeth.com/dev/send-tx/gas-estimation`
- `https://docs.megaeth.com/spec/megaevm/dual-gas-model`
- `https://docs.megaeth.com/spec/megaevm/resource-limits`
- `https://docs.megaeth.com/spec/megaevm/gas-detention`
