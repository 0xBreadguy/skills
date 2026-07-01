# Aave With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills` protocol references.

This file is for operating Aave V3 through a scoped MOSS delegated key. It
should tell an agent exactly which function signatures to request, how to build
calldata, and when token spend permission is required.

## Address Source

Use the official Aave address book as the first source of truth and re-check it
before executing value-bearing actions:

```bash
npm view @aave-dao/aave-address-book version
tmp=$(mktemp -d)
cd "$tmp"
npm init -y >/dev/null
npm install @aave-dao/aave-address-book >/dev/null
node -e "const { AaveV3MegaEth } = require('@aave-dao/aave-address-book'); console.log(AaveV3MegaEth.POOL, AaveV3MegaEth.ASSETS)"
```

Current MegaETH mainnet values from `@aave-dao/aave-address-book`:

| Name | Address |
| --- | --- |
| chain ID | `4326` |
| Pool | `0x7e324AbC5De01d112AfC03a584966ff199741C28` |
| PoolAddressesProvider | `0x46Dcd5F4600319b02649Fd76B55aA6c1035CA478` |
| AaveProtocolDataProvider | `0x9588b453A4EE24a420830CB3302195cA7aA3b403` |
| Oracle | `0x421117D7319E96d831972b3F7e970bbfe29C4F21` |
| WETH gateway | `0xa119F84bC1b8083F5061E4cf53705cBf1065bA27` |

Supported reserve underlyings:

| Symbol | Decimals | Underlying |
| --- | ---: | --- |
| WETH | 18 | `0x4200000000000000000000000000000000000006` |
| BTCb | 8 | `0xB0F70C0bD6FD87dbEb7C10dC692a2a6106817072` |
| USDT0 | 6 | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` |
| USDm | 18 | `0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7` |
| wstETH | 18 | `0x601aC63637933D88285A025C685AC4e9a92a98dA` |
| wrsETH | 18 | `0x4Fc44BE15e9B6E30C1E774E2C87A21D3E8b5403F` |
| ezETH | 18 | `0x09601A65e7de7BC8A19813D263dD9E98bFdC3c57` |
| USDe | 18 | `0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34` |

## Function Signatures

Use canonical signatures in MOSS permission scopes:

| Action | Target | Signature |
| --- | --- | --- |
| approve Aave to pull an ERC20 | ERC20 underlying | `approve(address,uint256)` |
| supply collateral/liquidity | Pool | `supply(address,uint256,address,uint16)` |
| withdraw supplied asset | Pool | `withdraw(address,uint256,address)` |
| borrow asset | Pool | `borrow(address,uint256,uint256,uint16,address)` |
| repay variable debt | ERC20 underlying + Pool | `approve(address,uint256)` and `repay(address,uint256,uint256,address)` |
| toggle collateral usage | Pool | `setUserUseReserveAsCollateral(address,bool)` |
| read account health | Pool | `getUserAccountData(address)` |
| read reserve config/data | Pool | `getReserveData(address)` |
| read user reserve data | AaveProtocolDataProvider | `getUserReserveData(address,address)` |

For `borrow` and `repay`, `interestRateMode` is normally `2` for variable
debt. Do not use mode `1` unless the reserve explicitly supports stable debt.

## Preflight

1. Run `mega moss whoami --json` and copy the wallet account address.
2. Run `mega moss list --json` and inspect the active delegated key.
3. If using an existing key, run `mega moss permissions <key> --json` and
   confirm it has exact call scopes and enough remaining spend.
4. Use `mega moss call` or a normal RPC call to inspect balances, allowance,
   reserve data, and account health before writes.

Useful constants for examples:

```bash
POOL=0x7e324AbC5De01d112AfC03a584966ff199741C28
DATA_PROVIDER=0x9588b453A4EE24a420830CB3302195cA7aA3b403
USDM=0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7
WALLET=$(mega moss whoami --json | jq -r '.account // .address')
```

Read account health:

```bash
DATA=$(cast calldata 'getUserAccountData(address)' "$WALLET")
mega moss call --to "$POOL" --data "$DATA"
```

Read user reserve data:

```bash
DATA=$(cast calldata 'getUserReserveData(address,address)' "$USDM" "$WALLET")
mega moss call --to "$DATA_PROVIDER" --data "$DATA"
```

## Supply ERC20

A supply flow needs token spend plus two call permissions: ERC20 approval and
Pool supply. Do not split approval and supply into separate relay-backed
transactions; bundle them in one `--calls` file.

Shorthand key request:

```bash
mega moss create-key \
  --allow-call "$USDM:approve(address,uint256)" \
  --allow-call "$POOL:supply(address,uint256,address,uint16)" \
  --spend-limit "$USDM:100:day" \
  --label "aave-usdm-supply"
```

Permission-file shape when exact base-unit limits or custom expiry are needed:

```json
{
  "expiry": 1800000000,
  "feeToken": {
    "symbol": "USDM",
    "limit": "1"
  },
  "permissions": {
    "calls": [
      {
        "to": "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
        "signature": "approve(address,uint256)"
      },
      {
        "to": "0x7e324AbC5De01d112AfC03a584966ff199741C28",
        "signature": "supply(address,uint256,address,uint16)"
      }
    ],
    "spend": [
      {
        "token": "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
        "limit": "100000000000000000000",
        "period": "day"
      }
    ]
  }
}
```

Build calldata for supplying 100 USDm, where USDm has 18 decimals:

```bash
AMOUNT=100000000000000000000
APPROVE=$(cast calldata 'approve(address,uint256)' "$POOL" "$AMOUNT")
SUPPLY=$(cast calldata 'supply(address,uint256,address,uint16)' "$USDM" "$AMOUNT" "$WALLET" 0)
```

Create `calls.json`:

```bash
cat > calls.json <<EOF
[
  {
    "to": "$USDM",
    "data": "$APPROVE",
    "value": "0"
  },
  {
    "to": "$POOL",
    "data": "$SUPPLY",
    "value": "0"
  }
]
EOF
```

Execute:

```bash
mega moss execute --calls ./calls.json
```

## Withdraw

Withdraw only needs Pool call permission unless the workflow also moves the
withdrawn tokens elsewhere.

```bash
mega moss create-key \
  --allow-call "$POOL:withdraw(address,uint256,address)" \
  --label "aave-withdraw"
```

Build calldata:

```bash
AMOUNT=100000000000000000000
WITHDRAW=$(cast calldata 'withdraw(address,uint256,address)' "$USDM" "$AMOUNT" "$WALLET")
mega moss execute --to "$POOL" --data "$WITHDRAW" --value 0
```

To withdraw the full aToken balance, Aave uses `type(uint256).max` as the
amount:

```bash
MAX_UINT=115792089237316195423570985008687907853269984665640564039457584007913129639935
WITHDRAW_ALL=$(cast calldata 'withdraw(address,uint256,address)' "$USDM" "$MAX_UINT" "$WALLET")
```

## Borrow

Borrow is a high-risk action. Before borrowing, inspect account health and
reserve status. The delegated key needs Pool call permission for `borrow`.

```bash
mega moss create-key \
  --allow-call "$POOL:borrow(address,uint256,uint256,uint16,address)" \
  --label "aave-borrow"
```

Borrow 10 USDm using variable debt mode:

```bash
AMOUNT=10000000000000000000
VARIABLE_RATE_MODE=2
BORROW=$(cast calldata 'borrow(address,uint256,uint256,uint16,address)' "$USDM" "$AMOUNT" "$VARIABLE_RATE_MODE" 0 "$WALLET")
mega moss execute --to "$POOL" --data "$BORROW" --value 0
```

Never pick borrow amounts automatically. Ask the user for the exact asset,
amount, and risk intent, then read account health again after execution.

## Repay

Repay requires ERC20 approval plus Pool repay in the same batch. The key needs
token spend, `approve(address,uint256)`, and
`repay(address,uint256,uint256,address)`.

```bash
mega moss create-key \
  --allow-call "$USDM:approve(address,uint256)" \
  --allow-call "$POOL:repay(address,uint256,uint256,address)" \
  --spend-limit "$USDM:100:day" \
  --label "aave-usdm-repay"
```

Build calldata for repaying 10 USDm variable debt:

```bash
AMOUNT=10000000000000000000
VARIABLE_RATE_MODE=2
APPROVE=$(cast calldata 'approve(address,uint256)' "$POOL" "$AMOUNT")
REPAY=$(cast calldata 'repay(address,uint256,uint256,address)' "$USDM" "$AMOUNT" "$VARIABLE_RATE_MODE" "$WALLET")
```

Execute approval and repay as one `--calls` array:

```bash
cat > calls.json <<EOF
[
  {
    "to": "$USDM",
    "data": "$APPROVE",
    "value": "0"
  },
  {
    "to": "$POOL",
    "data": "$REPAY",
    "value": "0"
  }
]
EOF
mega moss execute --calls ./calls.json
```

## Toggle Collateral

Toggling collateral changes liquidation risk. Confirm the user asked for it,
read account health first, and use a short-lived key.

```bash
mega moss create-key \
  --allow-call "$POOL:setUserUseReserveAsCollateral(address,bool)" \
  --label "aave-collateral-toggle"

DATA=$(cast calldata 'setUserUseReserveAsCollateral(address,bool)' "$USDM" true)
mega moss execute --to "$POOL" --data "$DATA" --value 0
```

## Safety Rules

- Verify every address against the current Aave address book before execution.
- Verify token decimals before turning human amounts into base units.
- Use exact call scopes. Never use wildcard call permissions.
- For supply and repay, bundle `approve` and the Pool call in one
  `mega moss execute --calls` batch.
- Keep spend caps and expiries tight.
- Revoke the delegated key with `mega moss revoke <key>` when finished.
- For WETH/native ETH flows, prefer WETH ERC20 interactions unless the user
  explicitly asks to use the WETH gateway; gateway flows have different
  function signatures and value semantics.
