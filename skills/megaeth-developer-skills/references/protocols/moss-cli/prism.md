# Prism with MegaETH Wallet CLI

Use this only for Prism due diligence through `mega moss`. The release audit
found live Prism web/read endpoints and bytecode at inherited candidate
addresses, but no public protocol-owned ABI or deployment manifest sufficient
to authorize write calldata. Therefore this guide intentionally provides no
`create-key` or `execute` recipe.

## Public discovery sources

```bash
curl -fsS https://prismfi.cc/tokenlist.json > prism-tokenlist.json
curl -fsS https://prismfi.cc/api/pools/list > prism-pools.json

jq 'type' prism-tokenlist.json
jq 'type' prism-pools.json
```

Inspect and schema-validate responses before extracting addresses. Compare token
identity and decimals with `megaeth-labs/mega-tokenlist` and on-chain reads.

## Candidate-address checks

These inherited labels are **unverified**. They are included only to support
investigation, not execution:

```bash
FACTORY=0x1adb8f973373505bb206e0e5d87af8fb1f5514ef
QUOTER_CANDIDATE=0xdd79c72c21f7dcd1d034b55caf9177bc42f5df0c
ROUTER_CANDIDATE=0xb1f38c36249834d8e3cd582d30101ff4b864f234
TAX_ROUTER_CANDIDATE=0x19956ebe69659c78ad4ee500694287bc6f67c4da
NFT_MANAGER_CANDIDATE=0xcb91c75a6b29700756d4411495be696c4e9a576e
```

Confirm the connected wallet and perform bytecode-only inspection:

```bash
mega moss whoami --json

for address in \
  "$FACTORY" \
  "$QUOTER_CANDIDATE" \
  "$ROUTER_CANDIDATE" \
  "$TAX_ROUTER_CANDIDATE" \
  "$NFT_MANAGER_CANDIDATE"
do
  cast code "$address" --rpc-url https://mainnet.megaeth.com/rpc
done
```

Non-empty code proves only that a contract exists. It does not prove any label
or function signature.

## Read-only `mega moss call`

Use `mega moss call` only after obtaining a function signature from a current
Prism-owned ABI or verified deployed source. For example, after independently
verifying a read-only ABI:

```bash
DATA=$(cast calldata '<VERIFIED_VIEW_SIGNATURE>' <VERIFIED_ARGS...>)
mega moss call --to <VERIFIED_CONTRACT> --data "$DATA"
```

Do not probe write selectors, approve candidate spenders, or infer tax behavior
from a reverted call.

## Gate for delegated execution

Before adding a Prism `mega moss create-key` or `mega moss execute` flow, verify:

- deployment manifest and chain ID;
- ABI and any proxy implementation;
- exact router and quote semantics;
- token, native ETH, tax, Permit2, refund, and deadline behavior;
- a fresh quote with explicit slippage;
- successful target-network simulation.

Only then scope the key to the exact verified target and selector, use tight
token/native spend limits and expiry, bundle an ERC-20 approval with its
consuming action, and revoke the key after use.

Do not use Awesome MegaETH AI, the inherited partner skill, or MTRKR as the sole
authority for executable Prism calls.
