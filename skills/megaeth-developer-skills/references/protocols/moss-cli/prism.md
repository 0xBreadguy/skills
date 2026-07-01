# Prism With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills` protocol references.

## Source Status

This file adapts `megaeth-ai-developer-skills/prism-dex.md` into scoped MOSS
CLI execution patterns. Verify Prism addresses, ABIs, endpoints, taxable-token
rules, and quote behavior against official Prism sources before value-bearing
execution.

Do not use Awesome MegaETH AI or MTRKR MCP as execution source-of-truth. MTRKR,
if present, is an unverified external read-only tooling candidate; do not
recommend or use it unless due diligence confirms installation, auth/payment
requirements, privacy behavior, read-only behavior, tool schemas, and output
reliability.

## Mainnet Constants

Verify before execution:

```bash
CHAIN_ID=4326
FACTORY=0x1adb8f973373505bb206e0e5d87af8fb1f5514ef
QUOTER_V2=0xdd79c72c21f7dcd1d034b55caf9177bc42f5df0c
SWAP_ROUTER=0xb1f38c36249834d8e3cd582d30101ff4b864f234
UNIVERSAL_ROUTER=0x955d56f6391a496231509134e0d2beadf82a223f
PERMIT2=0x56783fbf77a33871892a2d66337677555714ffbb
NFT_MANAGER=0xcb91c75a6b29700756d4411495be696c4e9a576e
SELECTIVE_TAX_ROUTER=0x19956ebe69659c78ad4ee500694287bc6f67c4da
SELECTIVE_TAX_ROUTER_PERMIT2=0x4c2c989f20794fa92d3082a3d49d9a430face555
WETH=0x4200000000000000000000000000000000000006
USDM=0xfafddbb3fc7688494971a79cc65dca3ef82079e7
NATIVE=0x0000000000000000000000000000000000000000
```

Prism pool init code hash:

```text
0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54
```

## Function Scopes

Use these exact signatures in delegated-key call scopes after verifying the ABI:

| Action | Target | Signature |
| --- | --- | --- |
| approve router or NFT manager | ERC20 input token | `approve(address,uint256)` |
| non-tax exact input single | SwapRouter02 | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| non-tax exact output single | SwapRouter02 | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| multi-hop exact input | SwapRouter02 | `exactInput((bytes,address,uint256,uint256))` |
| taxable exact input single | SelectiveTaxRouter | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))` |
| taxable exact output single | SelectiveTaxRouter | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))` |
| mint liquidity position | NonfungiblePositionManager | `mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))` |
| increase liquidity | NonfungiblePositionManager | `increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))` |
| decrease liquidity | NonfungiblePositionManager | `decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))` |
| collect fees/tokens | NonfungiblePositionManager | `collect((uint256,address,uint128,uint128))` |

Use `mega moss call` for `willBeTaxed(address,address,address)` and
`calculateTax(address,address,address,uint256)` before taxable writes.

## Preflight

1. Run `mega moss whoami --json` and copy the wallet account.
2. Verify token metadata with `mega-tokenlist`, Prism tokenlist, or token
   contracts.
3. Quote with `QuoterV2` or a verified Prism quote source.
4. Check whether the route is taxable before choosing a router.
5. Convert human amounts to base units with verified token decimals.
6. Set `amountOutMinimum` or `amountInMaximum`; never use zero in production.
7. Inspect `mega moss list --json` and `mega moss permissions <key> --json`
   before reusing an existing delegated key.

Example variables:

```bash
WALLET=$(mega moss whoami --json | jq -r '.account // .address')
TOKEN_IN=$WETH
TOKEN_OUT=$USDM
FEE=3000
AMOUNT_IN=1000000000000000000
AMOUNT_OUT_MIN=$QUOTE_MINUS_SLIPPAGE_BASE_UNITS
DEADLINE=$(( $(date +%s) + 120 ))
```

Set `QUOTE_MINUS_SLIPPAGE_BASE_UNITS` from a fresh quote before executing.
`AMOUNT_OUT_MIN` must be a decimal integer base-unit amount before encoding.

## Non-Tax ERC20 Exact Input Swap

Use `SwapRouter02` when Prism docs/current checks say the route is not taxable.

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$SWAP_ROUTER:exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))" \
  --spend-limit "$TOKEN_IN:1:day" \
  --label "prism-exact-input"
```

Build calldata:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$SWAP_ROUTER" "$AMOUNT_IN")
SWAP=$(cast calldata \
  'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$AMOUNT_IN,$AMOUNT_OUT_MIN,0)")
```

Create `calls.json` and execute approval plus swap in one batch:

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

## Taxable ERC20 Exact Input Swap

Use `SelectiveTaxRouter` when Prism's current rules indicate the pair/user is
taxable. Do not use a made-up `swapWithTax` function.

Read tax status:

```bash
TAX_CHECK=$(cast calldata 'willBeTaxed(address,address,address)' "$TOKEN_IN" "$TOKEN_OUT" "$WALLET")
mega moss call --to "$SELECTIVE_TAX_ROUTER" --data "$TAX_CHECK"

TAX_QUOTE=$(cast calldata 'calculateTax(address,address,address,uint256)' "$TOKEN_IN" "$TOKEN_OUT" "$WALLET" "$AMOUNT_IN")
mega moss call --to "$SELECTIVE_TAX_ROUTER" --data "$TAX_QUOTE"
```

Create a scoped key for the taxable router:

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$SELECTIVE_TAX_ROUTER:exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))" \
  --spend-limit "$TOKEN_IN:1:day" \
  --label "prism-tax-exact-input"
```

Build calldata and execute in one approval plus swap batch:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$SELECTIVE_TAX_ROUTER" "$AMOUNT_IN")
SWAP=$(cast calldata \
  'exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$DEADLINE,$AMOUNT_IN,$AMOUNT_OUT_MIN,0)")
```

Use the same `calls.json` shape as the non-tax swap, with the second call sent
to `$SELECTIVE_TAX_ROUTER`.

## Native ETH Exact Input Swap

For native ETH input on a non-tax route, use WETH as `tokenIn` in router params
and send native value with the router call. Do not add ERC20 approval.

```bash
TOKEN_IN=$WETH
AMOUNT_IN=100000000000000000

mega moss create-key \
  --allow-call "$SWAP_ROUTER:exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))" \
  --spend-limit "$NATIVE:0.1:day" \
  --label "prism-native-exact-input"

SWAP=$(cast calldata \
  'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))' \
  "($TOKEN_IN,$TOKEN_OUT,$FEE,$WALLET,$AMOUNT_IN,$AMOUNT_OUT_MIN,0)")

mega moss execute --to "$SWAP_ROUTER" --data "$SWAP" --value "$AMOUNT_IN"
```

For taxable native flows, verify Prism's current taxable-router native ETH
semantics before execution.

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
  --label "prism-mint-position"
```

Before minting, sort `token0` and `token1` by address, read pool `slot0()` and
`liquidity()`, set nonzero `amount0Min` and `amount1Min`, and set a short
deadline. Do not choose tick ranges or liquidity amounts for the user.

For remove-liquidity flows, use `decreaseLiquidity` then `collect`. These
actions do not require ERC20 approval, but they change position risk and token
balances; confirm tokenId, liquidity amount, recipient, and minimum outputs.

## Pool Address Warning

Prism pool address computation uses ABI-encoded salt and the Prism init code
hash. Do not reuse Kumbaya or Uniswap pool address computation code without
adjusting salt encoding and hash.

## Safety

- Verify all Prism addresses, router semantics, and signatures before
  execution.
- Check taxable routing before choosing `SwapRouter02` or `SelectiveTaxRouter`.
- Quote immediately before swapping and refetch if token pair, amount,
  recipient, fee tier, tax status, or slippage changes.
- Never set `amountOutMinimum` or `amountInMaximum` from stale data.
- Bundle ERC20 approval and the consuming router/NFT-manager call in one
  `mega moss execute --calls` batch.
- Treat WETH and native ETH as different permission/spend paths.
- Revoke delegated keys with `mega moss revoke <key>` after the workflow.
