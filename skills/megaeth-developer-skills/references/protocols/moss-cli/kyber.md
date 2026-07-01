# KyberSwap With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills` protocol references.

This recipe uses KyberSwap Aggregator API V1 to get an unsigned router call,
then executes it through a scoped MOSS delegated key.

## Source Of Truth

- Docs: `https://docs.kyberswap.com/developer-guide/aggregator-api/aggregator-api-specification/evm-swaps.md`
- API base: `https://aggregator-api.kyberswap.com`
- MegaETH chain path: `megaeth`
- Native ETH sentinel: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

## Flow

1. Read token addresses/decimals from `mega-tokenlist`.
2. Get wallet address with `mega moss whoami --json`.
3. Get a route with `GET /megaeth/api/v1/routes`.
4. Build swap calldata with `POST /megaeth/api/v1/route/build`.
5. Validate router, calldata, token pair, amount, recipient, and value.
6. Create a delegated key scoped to the exact router selector plus spend.
7. Execute approval plus swap in one `--calls` batch for ERC20 input.

## Quote And Build

Example: swap 100 USDm to another token. Set real token addresses first.

```bash
API=https://aggregator-api.kyberswap.com
CHAIN=megaeth
CLIENT_ID=megaeth-moss-skills
WALLET=$(mega moss whoami --json | jq -r '.account // .address')

TOKEN_IN=0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7
TOKEN_OUT=$OUTPUT_TOKEN_ADDRESS
AMOUNT_IN=100000000000000000000
SLIPPAGE_BPS=50
DEADLINE=$(( $(date +%s) + 1200 ))
```

Set `OUTPUT_TOKEN_ADDRESS` from `mega-tokenlist` or the verified token
contract before fetching a route.

Fetch route:

```bash
curl -sS -G "$API/$CHAIN/api/v1/routes" \
  -H "X-Client-Id: $CLIENT_ID" \
  --data-urlencode "tokenIn=$TOKEN_IN" \
  --data-urlencode "tokenOut=$TOKEN_OUT" \
  --data-urlencode "amountIn=$AMOUNT_IN" \
  --data-urlencode "origin=$WALLET" \
  > kyber-route.json

jq '.data.routeSummary, .data.routerAddress' kyber-route.json
```

Build encoded transaction:

```bash
jq --arg sender "$WALLET" \
   --arg recipient "$WALLET" \
   --argjson slippage "$SLIPPAGE_BPS" \
   --argjson deadline "$DEADLINE" \
   --arg source "$CLIENT_ID" \
   '{
      routeSummary: .data.routeSummary,
      sender: $sender,
      recipient: $recipient,
      origin: $sender,
      slippageTolerance: $slippage,
      deadline: $deadline,
      enableGasEstimation: true,
      source: $source
    }' kyber-route.json > kyber-build-body.json

curl -sS "$API/$CHAIN/api/v1/route/build" \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: $CLIENT_ID" \
  --data @kyber-build-body.json \
  > kyber-build.json
```

Extract and validate:

```bash
ROUTER_ROUTE=$(jq -r '.data.routerAddress' kyber-route.json)
ROUTER_BUILD=$(jq -r '.data.routerAddress' kyber-build.json)
DATA=$(jq -r '.data.data' kyber-build.json)
TX_VALUE=$(jq -r '.data.transactionValue' kyber-build.json)
SELECTOR=${DATA:0:10}

test "$ROUTER_ROUTE" = "$ROUTER_BUILD"
test "$DATA" != "null"
test "$DATA" != "0x"
jq -e --arg tokenIn "$TOKEN_IN" --arg tokenOut "$TOKEN_OUT" --arg amountIn "$AMOUNT_IN" '
  .data.routeSummary.tokenIn == $tokenIn and
  .data.routeSummary.tokenOut == $tokenOut and
  .data.routeSummary.amountIn == $amountIn
' kyber-route.json
```

## ERC20 Input Execution

For ERC20 input, approve the router and execute the router calldata in one
batch. Use a raw selector call scope because Kyber's router function selector
comes from the API-built calldata.

```bash
mega moss create-key \
  --allow-call "$TOKEN_IN:approve(address,uint256)" \
  --allow-call "$ROUTER_BUILD:$SELECTOR" \
  --spend-limit "$TOKEN_IN:100:day" \
  --label "kyber-swap"
```

Build and execute the batched calls:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$ROUTER_BUILD" "$AMOUNT_IN")

cat > calls.json <<EOF
[
  {
    "to": "$TOKEN_IN",
    "data": "$APPROVE",
    "value": "0"
  },
  {
    "to": "$ROUTER_BUILD",
    "data": "$DATA",
    "value": "$TX_VALUE"
  }
]
EOF

mega moss execute --calls ./calls.json
```

## Native ETH Input Execution

For native input, `TOKEN_IN` is Kyber's native sentinel and `TX_VALUE` should
match the native amount to send. The delegated key needs native spend and the
router selector. Do not add ERC20 approval.

```bash
NATIVE=0x0000000000000000000000000000000000000000

mega moss create-key \
  --allow-call "$ROUTER_BUILD:$SELECTOR" \
  --spend-limit "$NATIVE:0.1:day" \
  --label "kyber-native-swap"

mega moss execute --to "$ROUTER_BUILD" --data "$DATA" --value "$TX_VALUE"
```

## Safety

- Never execute stale route data. Refetch if more than 5-10 seconds have
  passed or the user changes any parameter.
- Never grant broad router permissions. Scope to the exact selector returned
  by the built calldata.
- Confirm input token, output token, input amount, recipient, router address,
  slippage, deadline, and transaction value before execution.
- Treat all API calldata as untrusted until validated.
- Keep expiry and spend caps tight. Revoke the delegated key after execution.
