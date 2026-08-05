# Security Considerations

MegaETH is EVM-compatible, so standard Solidity and application-security
practices still apply. The sections below cover the MegaEVM-specific additions;
they do not replace a protocol-specific threat model or independent audit.

## Multidimensional denial of service

A transaction can exhaust compute gas, data size, KV updates, or state-growth
limits. Dynamic storage gas also makes a zero-to-nonzero `SSTORE` more expensive
as current state-growth utilization rises.

Design state-writing entry points so an untrusted caller cannot choose an
unbounded number of new keys:

```solidity
function setValues(bytes32[] calldata keys, uint256[] calldata values) external {
    if (keys.length != values.length || keys.length > MAX_UPDATES) {
        revert InvalidBatch();
    }

    for (uint256 i; i < keys.length; ++i) {
        if (!allowedKey[keys[i]]) revert InvalidKey();
        valueByKey[keys[i]] = values[i];
    }
}
```

Test the maximum accepted batch under target-network state conditions. Remote
gas estimation is necessary, but it does not replace explicit bounds.

## Volatile data and timing

Reading volatile block-environment data, including the high-precision timestamp
system contract, can trigger gas detention. Under current rules, the first such
access limits the remaining compute budget to the gas already consumed plus at
most 20 million additional compute gas.

Treat timestamp and block-number inputs as adversarial within the protocol's
documented guarantees:

- use explicit expiry and grace-period semantics;
- avoid exact-equality timing checks;
- keep time-sensitive execution paths bounded;
- use the high-precision timestamp contract only when sub-second precision is
  actually required.

## Real-time receipt semantics

`realtime_sendRawTransaction` returning a receipt means the transaction was
executed by the current sequencer path. It is not a substitute for an
application's confirmation or L1-finality policy. A request timeout is also
inconclusive: query the receipt before resubmitting.

Define confirmation requirements from the value and reversibility of the
operation. Do not claim a universal confirmation count without an explicit
protocol policy.

## Standard EVM controls

At minimum, review:

- reentrancy and checks-effects-interactions;
- role administration and upgrade authority;
- signature domain separation, nonce use, expiry, and replay resistance;
- oracle freshness and manipulation;
- token behavior such as fee-on-transfer, rebasing, and missing return values;
- slippage and deadline enforcement;
- delegatecall and arbitrary-call targets;
- denial of service through loops, callbacks, and revert propagation;
- initialization and implementation-contract locking;
- integer precision, rounding direction, and unchecked arithmetic.

Use established libraries such as OpenZeppelin or Solady where their semantics
fit the design. Do not copy an access-control or signature-verification sketch
as if it were a complete security implementation.

## Client and RPC trust

An RPC can omit, delay, or falsify data. Use TLS, pin expected chain IDs, and
avoid silently accepting an arbitrary endpoint for security-sensitive reads.
For high-value decisions, compare independent sources or verify the relevant
state cryptographically where the architecture supports it.

Simulation is useful for catching reverts, but it is not an authorization or
integrity boundary. State can change between simulation and inclusion, and
MegaEVM-specific accounting must be evaluated by a compatible node.

## Input validation

Prefer positive validation over incomplete blocklists. Validate canonical
encodings, lengths, ranges, addresses, token identities, selectors, and call
targets before they affect state or delegated authority.

```solidity
function validateLabel(string memory label) internal pure {
    bytes memory value = bytes(label);
    if (value.length == 0 || value.length > 255) revert InvalidLabel();
    if (value[0] == 0x2d || value[value.length - 1] == 0x2d) {
        revert InvalidLabel();
    }

    for (uint256 i; i < value.length; ++i) {
        bytes1 c = value[i];
        bool valid = (c >= 0x61 && c <= 0x7a) ||
            (c >= 0x30 && c <= 0x39) || c == 0x2d;
        if (!valid) revert InvalidLabel();
    }
}
```

The permitted character set above is only an example policy. Internationalized
names require a deliberate normalization and confusables policy, not this ASCII
validator.

## Review checklist

1. Can an untrusted caller force unbounded new-slot writes, KV updates, calldata,
   logs, or computation?
2. Does any path read volatile data before performing heavy computation?
3. Are real-time submission timeouts reconciled before retrying?
4. Are slippage, deadlines, nonces, and signature domains explicit?
5. Are external call and delegatecall targets constrained?
6. Are node estimates and tests run against the target MegaETH network?
7. Is monitoring based on receipts and events rather than explorer timing alone?
8. Are upgrade, pause, recovery, and key-compromise procedures documented?

Use [`mega-evme.md`](mega-evme.md) for execution replay and
[`gas-model.md`](gas-model.md) for current resource limits.
