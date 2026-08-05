# Kumbaya With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills` protocol references.

## Sources

These constants and ABIs were checked against the protocol-owned
[Kumbaya integrator kit](https://github.com/Kumbaya-xyz/integrator-kit). Re-check
that source and deployed bytecode before value-bearing execution. Kumbaya's
separate [agent kit](https://github.com/Kumbaya-xyz/kumbaya-agent-kit) can be
used when its skills or MCP tools are deliberately installed; it is not bundled
with this Markdown skill.

## Mainnet Constants

Verify before execution:

```bash
CHAIN_ID=4326
FACTORY=0x68b34591f662508076927803c567Cc8006988a09
SWAP_ROUTER=0xE5BbEF8De2DB447a7432A47EBa58924d94eE470e
UNIVERSAL_ROUTER=0xAAB1C664CeaD881AfBB58555e6A3a79523D3e4C0
QUOTER_V2=0x1F1a8dC7E138C34b503Ca080962aC10B75384a27
NFT_MANAGER=0x2b781C57e6358f64864Ff8EC464a03Fdaf9974bA
PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3
WETH=0x4200000000000000000000000000000000000006
USDM=0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7
NATIVE=0x0000000000000000000000000000000000000000
```

Kumbaya pool init code hash:

```text
0x851d77a45b8b9a205fb9f44cb829cceba85282714d2603d601840640628a3da7
```

## Function Scopes

Use these exact signatures in delegated-key call scopes after verifying the ABI:

| Action | Target | Signature |
| --- | --- | --- |
| approve direct router or NFT manager | ERC20 input token | `approve(address,uint256)` |
| exact input single swap | SwapRouter02 | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| exact output single swap | SwapRouter02 | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| exact input multi-hop swap | SwapRouter02 | `exactInput((bytes,address,uint256,uint256))` |
| mint liquidity position | NonfungiblePositionManager | `mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))` |
| increase liquidity | NonfungiblePositionManager | `increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))` |
| decrease liquidity | NonfungiblePositionManager | `decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))` |
| collect fees/tokens | NonfungiblePositionManager | `collect((uint256,address,uint128,uint128))` |

Do not use wildcard scopes. Use raw selectors only if the current ABI differs
from the signatures above and you have recomputed the selector.

## Preflight

1. Run `mega moss whoami --json` and copy the wallet account.
2. Verify token metadata with `mega-tokenlist` or current token contracts.
3. Get a fresh quote from `QuoterV2` or a verified Kumbaya quote source.
4. Convert human amounts to base units with the verified token decimals.
5. Set `amountOutMinimum` or `amountInMaximum`; never use zero in production.
6. Inspect `mega moss list --json` and `mega moss permissions <key> --json`
   before reusing an existing delegated key.

Example variables:

```bash
WALLET=$(mega moss whoami --json | jq -r '.account // .address')
TOKEN_IN=$WETH
TOKEN_OUT=$USDM
FEE=3000
AMOUNT_IN=1000000000000000000
AMOUNT_OUT_MIN=$QUOTE_MINUS_SLIPPAGE_BASE_UNITS
```

Set `QUOTE_MINUS_SLIPPAGE_BASE_UNITS` from a fresh quote before executing.
`AMOUNT_OUT_MIN` must be a decimal integer base-unit amount before encoding.

## ERC20 Exact Input Swap

Create a delegated key scoped to approval plus the router action:

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$SWAP_ROUTER:exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))" \
  --spend-limit "$TOKEN_IN:1:day" \
  --label "kumbaya-exact-input"
```

Build calldata:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$SWAP_ROUTER" "$AMOUNT_IN")
SWAP=$(cast calldata \
  'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$AMOUNT_IN,$AMOUNT_OUT_MIN,0)")
```

Create `calls.json` and execute approval plus swap in one relay-backed batch:

```bash
cat > calls.json <<EOF
[
  {
    "to": "$TOKEN_IN",
    "data": "$APPROVE",
    "value": "0"
  },
  {
    "to": "$SWAP_ROUTER",
    "data": "$SWAP",
    "value": "0"
  }
]
EOF

mega moss execute --calls ./calls.json
```

## Native ETH Exact Input Swap

For native ETH input, use WETH as `tokenIn` in the router params and send
native value with the router call. Do not add ERC20 approval.

```bash
TOKEN_IN=$WETH
AMOUNT_IN=100000000000000000

mega moss create-key \
  --allow-call "$SWAP_ROUTER:exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))" \
  --spend-limit "$NATIVE:0.1:day" \
  --label "kumbaya-native-exact-input"

SWAP=$(cast calldata \
  'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$AMOUNT_IN,$AMOUNT_OUT_MIN,0)")

mega moss execute --to "$SWAP_ROUTER" --data "$SWAP" --value "$AMOUNT_IN"
```

## Exact Output Swap

For exact output, quote first and set `AMOUNT_IN_MAXIMUM` with user-approved
slippage headroom.

```bash
AMOUNT_OUT=100000000000000000000
AMOUNT_IN_MAXIMUM=$QUOTE_PLUS_SLIPPAGE_BASE_UNITS
```

Set `QUOTE_PLUS_SLIPPAGE_BASE_UNITS` from a fresh exact-output quote before
executing.

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$SWAP_ROUTER:exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))" \
  --spend-limit "$TOKEN_IN:1:day" \
  --label "kumbaya-exact-output"

APPROVE=$(cast calldata 'approve(address,uint256)' "$SWAP_ROUTER" "$AMOUNT_IN_MAXIMUM")
SWAP=$(cast calldata \
  'exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$AMOUNT_OUT,$AMOUNT_IN_MAXIMUM,0)")
```

Execute approval and swap in one `--calls` batch. If the router can refund
unused input in the verified ABI, confirm the refund path before using exact
output with large headroom.

## Multi-Hop Swap

Use `exactInput((bytes,address,uint256,uint256))` and a path encoded as
`tokenIn, fee, tokenMid, fee, tokenOut`.

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$SWAP_ROUTER:exactInput((bytes,address,uint256,uint256))" \
  --spend-limit "$TOKEN_IN:1:day" \
  --label "kumbaya-multihop"
```

Build `PATH` with packed encoding, not ABI encoding. Use viem
`encodePacked(["address","uint24","address","uint24","address"], ...)`,
Kumbaya SDK routing helpers, or another verified packed-path encoder, then set
`PATH` to the resulting `0x` hex bytes.

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$SWAP_ROUTER" "$AMOUNT_IN")
SWAP=$(cast calldata 'exactInput((bytes,address,uint256,uint256))' \
  "($PATH,$WALLET,$AMOUNT_IN,$AMOUNT_OUT_MIN)")
```

Bundle approval and swap in one `--calls` array.

## Liquidity Position Actions

For minting or increasing liquidity, the delegated key usually needs:

- `approve(address,uint256)` on token0 for `NFT_MANAGER`.
- `approve(address,uint256)` on token1 for `NFT_MANAGER`.
- the exact `NonfungiblePositionManager` action signature.
- spend limits for both ERC20 input tokens.

Example mint key shape:

```bash
mega moss create-key \
  --allow-call "$TOKEN0:approve(address,uint256)" \
  --allow-call "$TOKEN1:approve(address,uint256)" \
  --allow-call "$NFT_MANAGER:mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))" \
  --spend-limit "$TOKEN0:100:day" \
  --spend-limit "$TOKEN1:1:day" \
  --label "kumbaya-mint-position"
```

Before minting, sort `token0` and `token1` by address, read pool `slot0()` and
`liquidity()`, set nonzero `amount0Min` and `amount1Min`, and set a short
deadline. Do not choose tick ranges or liquidity amounts for the user.

For remove-liquidity flows, use `decreaseLiquidity` then `collect`. These
actions do not require ERC20 approval, but they change position risk and token
balances; confirm tokenId, liquidity amount, recipient, and minimum outputs.

## Safety

- Verify all Kumbaya addresses and signatures before execution.
- Quote immediately before swapping and refetch if token pair, amount,
  recipient, fee tier, or slippage changes.
- Never set `amountOutMinimum` or `amountInMaximum` from stale data.
- Bundle ERC20 approval and the consuming router/NFT-manager call in one
  `mega moss execute --calls` batch.
- Treat WETH and native ETH as different permission/spend paths.
- Revoke delegated keys with `mega moss revoke <key>` after the workflow.
