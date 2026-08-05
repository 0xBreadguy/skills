# Smart Contracts On MegaETH

MegaEVM is EVM-compatible, but gas accounting and resource limits differ from
a standard local EVM. Use ordinary Solidity and audited Ethereum libraries;
account for the differences below when estimating, testing, and designing
large state transitions.

## Current Limits

| Resource | Transaction | Block |
| --- | ---: | ---: |
| Total gas | current config `10,000,000,000` | `10,000,000,000` |
| Compute gas | `200,000,000` | no separate limit |
| Data size | 12.5 MiB | 12.5 MiB |
| KV updates | `500,000` | `500,000` |
| State growth | `1,000` | `1,000` |
| Encoded transaction | current config 1 MiB | no dedicated current cap |
| Runtime contract code | 512 KiB | n/a |
| Initcode | 536 KiB | n/a |

Data, KV-update, and state-growth block limits allow the first transaction that
reaches or crosses a limit to remain included; later transactions are skipped.
Nested call frames receive `98/100` of their parent's remaining multidimensional
budget and revert locally with `MegaLimitExceeded` if they exceed it.

## Gas Estimation

Estimate through the target MegaETH RPC:

```bash
cast estimate 0xContract 'method(uint256)' 42 \
  --from 0xSender \
  --rpc-url https://mainnet.megaeth.com/rpc
```

For Foundry scripts, pass `--skip-simulation` so broadcast transactions use
remote RPC estimation. A Foundry fork is useful for logic and chain state but
does not reproduce MegaETH storage gas or resource accounting.

Do not hardcode one gas limit for all transfers, approvals, swaps, or
deployments. Code size, calldata, logs, state transitions, and dynamic SALT
bucket multipliers affect total gas.

## Volatile Data

Block metadata and native-oracle reads trigger gas detention. At the first
volatile access, a transaction receives up to 20M **additional** compute gas
from its current usage, bounded by its existing effective limit. The cap
persists across parent, child, and sibling frames.

Common triggers include `block.timestamp`, `block.number`, `blockhash`,
`block.prevrandao`, `block.basefee`, `block.gaslimit`, `block.coinbase`, blob
metadata, beneficiary-account access, and native-oracle storage reads.

Read volatile values late when possible:

```solidity
function process(uint256[] calldata items, uint256 deadline) external {
    for (uint256 i; i < items.length; ++i) {
        _process(items[i]);
    }
    require(block.timestamp <= deadline, "expired");
}
```

The high-precision timestamp system contract is at
`0x6342000000000000000000000000000000000002` and returns microseconds, but its
oracle storage read is also volatile; it is not a detention bypass.

MegaAccessControl at `0x6342000000000000000000000000000000000004`
can disable volatile access for a call subtree. A blocked access reverts rather
than applying detention. Use this only after reading the current system-contract
interface and testing the failure path.

## Persistent Storage

Zero-to-nonzero SSTORE adds
`20,000 * (SALT bucket multiplier - 1)` storage gas. The multiplier is often 1
for uncrowded buckets but is dynamic. Storage gas is not refunded when a slot is
reset.

- Bound user-created records and batch state growth.
- Use memory or EIP-1153 transient storage for temporary data.
- Reuse slots where the data model naturally supports it.
- Benchmark custom packed arrays, free lists, ring buffers, or trees under the
  real workload before replacing standard mappings.

## Events And Calldata

MegaETH adds linear storage charges of `3,750` per event topic and `80` per log
data byte. Calldata also has additional per-byte storage gas. Keep events and
calldata bounded, but do not rely on the unsupported historical claim that LOG
becomes quadratic above 4 KiB.

## Contract Creation

Contract creation pays dynamic creation storage gas plus `10,000` storage gas
for each byte of deployed runtime code. Large contracts can therefore need
hundreds of millions of gas even though the code-size ceiling is 512 KiB.

Standard CREATE2, EIP-1967, transparent, UUPS, and immutable-factory patterns
remain available. Verify initialization, upgrade authority, and deterministic
address inputs exactly as on other EVM chains.

```solidity
function deploy(bytes32 salt, bytes memory initcode)
    external
    returns (address deployed)
{
    assembly {
        deployed := create2(0, add(initcode, 0x20), mload(initcode), salt)
    }
    require(deployed != address(0), "CREATE2 failed");
}
```

`SELFDESTRUCT` follows EIP-6780: it destroys code/storage only when the contract
was created in the same transaction. Otherwise it transfers Ether without
removing the pre-existing contract.

## SSTORE2-Style Data

SSTORE2 stores immutable bytes in runtime code and reads them with
`EXTCODECOPY`. On MegaETH:

- deployment pays `10,000` storage gas per code byte
- onchain reads still consume compute gas
- runtime code and initcode limits apply
- creation contributes to data-size and state-growth accounting

It can be appropriate for write-once data, but it is not free. Compare a remote
estimate against persistent storage, calldata, or offchain content with an
onchain commitment. Use a maintained implementation such as Solady rather than
an ad hoc deployment library.

## Multi-Token Contracts

EIP-6909 provides a smaller multi-token interface without mandatory receiver
callbacks; ERC-1155 provides a more widely integrated standard with batch
operations and receiver checks. Choose based on wallet/marketplace
interoperability and product semantics, not a claim that one always uses fewer
storage slots. Solady offers implementations of both patterns.

## OP Stack Contracts

MegaETH exposes standard OP Stack predeploys including:

| Contract | Address |
| --- | --- |
| WETH9 | `0x4200000000000000000000000000000000000006` |
| L2CrossDomainMessenger | `0x4200000000000000000000000000000000000007` |
| L2StandardBridge | `0x4200000000000000000000000000000000000010` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

Use current MegaETH bridge documentation for L1 addresses and deposit or
withdrawal flows. Do not infer a bridge operation from an address alone.

## Onchain Rendering

The 512 KiB code ceiling permits larger rendering contracts than Ethereum's
24 KiB ceiling, but code-deposit gas still scales per byte. Keep renderers
stateless where practical, split complex string assembly into small functions,
and test output and deployment estimates against MegaETH.

A replaceable external renderer can decouple metadata iteration from the main
token contract, but it adds an upgrade/admin trust boundary. Make that authority
explicit and test fallback behavior.

## Verification

MegaETH mainnet is available through Etherscan V2 as chain ID `4326`:

```bash
forge verify-contract 0xAddress src/MyContract.sol:MyContract \
  --chain 4326 \
  --etherscan-api-key "$ETHERSCAN_API_KEY"
```

Match compiler version, optimizer settings, libraries, constructor arguments,
and metadata exactly.

## Release Checklist

- Remote-estimate every write path against the target network.
- Exercise MegaEVM-specific behavior with `mega-evme` when gas detention or
  multidimensional limits matter.
- Bound storage growth, logs, calldata, and loop iterations.
- Test nested calls that can hit frame limits.
- Treat high-precision time as microseconds and as volatile data.
- Test EIP-6780 assumptions if any dependency invokes SELFDESTRUCT.
- Verify deployed code and constructor arguments on the explorer.

## Sources

- `https://docs.megaeth.com/dev/execution/overview`
- `https://docs.megaeth.com/dev/execution/gas-model`
- `https://docs.megaeth.com/dev/execution/resource-limits`
- `https://docs.megaeth.com/dev/execution/volatile-data`
- `https://docs.megaeth.com/dev/send-tx/gas-estimation`
- `https://docs.megaeth.com/spec/megaevm/overview`
