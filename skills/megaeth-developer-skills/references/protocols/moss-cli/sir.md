# SIR Trading With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills/references/protocols/sir.md`.

## Source Status

This file adapts the SIR Trading skill from
`https://github.com/SIR-trading/sir-trading-skill/blob/master/sir-trading.md`
into scoped MOSS CLI execution patterns. Verify SIR addresses, ABIs, and quote
behavior against current SIR sources before value-bearing execution.

## Mainnet Constants

```bash
CHAIN_ID=4326
VAULT=0x8d694D1b369BdE5B274Ad643fEdD74f836E88543
SIR=0x9367A0c482703d8d9bda995B03f8E71056a72500
ASSISTANT=0xB91AE2c8365FD45030abA84a4666C4dB074E53E7
WETH=0x4200000000000000000000000000000000000006
NATIVE=0x0000000000000000000000000000000000000000
```

MegaSIR uses 12 decimals. Do not parse MegaSIR with 18-decimal helpers.

## Function Scopes

Use exact function scopes after verifying the ABI:

| Action | Target | Signature |
| --- | --- | --- |
| collateral/debt token approval | input ERC20 | `approve(address,uint256)` |
| initialize vault | Vault | `initialize((address,address,int8))` |
| mint APE or TEA | Vault | `mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)` |
| burn APE or TEA | Vault | `burn(bool,(address,address,int8),uint256,uint40)` |
| TEA transfer | Vault | `safeTransferFrom(address,address,uint256,uint256,bytes)` |
| TEA operator approval | Vault | `setApprovalForAll(address,bool)` |
| stake MegaSIR | MegaSIR | `stake(uint80)` |
| unstake MegaSIR | MegaSIR | `unstake(uint80)` |
| claim staker dividends | MegaSIR | `claim()` |
| unstake and claim | MegaSIR | `unstakeAndClaim(uint80)` |
| claim LP rewards | MegaSIR | `lperMint(uint256)` |
| claim and stake LP rewards | MegaSIR | `lperMintAndStake(uint256)` |
| start fee auction | MegaSIR | `collectFeesAndStartAuction(address)` |
| bid in fee auction | MegaSIR | `bid(address,uint96)` |
| claim auction lot | MegaSIR | `getAuctionLot(address,address)` |

Do not grant wildcard scopes.

## Preflight

1. Run `mega moss whoami --json` and copy the wallet account.
2. Verify token addresses and decimals from `mega-tokenlist` or current token
   contracts.
3. Read `Assistant.getVaultStatus(vaultParams)`.
4. If using an existing vault, discover `vaultId` from `Vault.paramsById` or
   `Vault.vaultStates`.
5. Quote with Assistant immediately before execution.
6. Set a short `deadline`.
7. Inspect existing delegated keys with `mega moss list --json` before reuse.

Example variables:

```bash
WALLET=$(mega moss whoami --json | jq -r '.account // .address')
DEBT_TOKEN=$WETH
COLLATERAL_TOKEN=0xCollateralToken
LEVERAGE_TIER=0
AMOUNT_IN=1000000000000000000
DEADLINE=$(( $(date +%s) + 300 ))
```

Use base-unit integers for all calldata. Replace `0xCollateralToken` with a
verified token address before encoding.

## Read Commands

Use `cast call` or the current project client for reads. Examples:

```bash
cast call "$ASSISTANT" \
  'getVaultStatus((address,address,int8))(uint8)' \
  "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)" \
  --rpc-url https://mainnet.megaeth.com/rpc
```

```bash
cast call "$ASSISTANT" \
  'quoteMint(bool,(address,address,int8),uint144)(uint256)' \
  true "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)" "$AMOUNT_IN" \
  --rpc-url https://mainnet.megaeth.com/rpc
```

For portfolio reads, use:

- `numberOfVaults()` on Vault.
- `paramsById(uint48)` on Vault.
- `getUserBalances(address,uint256,uint256)` on Assistant.
- `getAddressAPE(uint48)` on Assistant, then ERC20 `balanceOf(address)`.
- `balanceOf(address,uint256)` on Vault for TEA.
- `unclaimedRewards(uint256,address)` and `lockEnd(address,uint256)` on Vault.

## Initialize Vault

Only initialize when `getVaultStatus(vaultParams)` returns `2`.

```bash
mega moss create-key \
  --allow-call "$VAULT:initialize((address,address,int8))" \
  --label "sir-initialize-vault"

INIT=$(cast calldata \
  'initialize((address,address,int8))' \
  "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)")

mega moss execute --to "$VAULT" --data "$INIT"
```

If status is `1`, the required Kumbaya pool does not exist according to the
SIR source material. Do not initialize.

## Mint APE Or TEA With ERC20 Collateral

Set `IS_APE=true` for APE and `IS_APE=false` for TEA. Quote first and set the
minimum output or collateral minimum from the verified quote path.

```bash
IS_APE=true
MIN_COLLATERAL_OR_OUTPUT=$QUOTE_DERIVED_MIN
PORTION_LOCK_TIME=0
INPUT_TOKEN=$COLLATERAL_TOKEN
```

Create a key scoped to approval plus mint:

```bash
mega moss create-key \
  --allow-call "$INPUT_TOKEN:approve(address,uint256)" \
  --allow-call "$VAULT:mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)" \
  --spend-limit "$INPUT_TOKEN:1:day" \
  --label "sir-mint"
```

Build and execute approval plus mint:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$VAULT" "$AMOUNT_IN")
MINT=$(cast calldata \
  'mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)' \
  "$IS_APE" \
  "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)" \
  "$AMOUNT_IN" \
  "$MIN_COLLATERAL_OR_OUTPUT" \
  "$DEADLINE" \
  "$PORTION_LOCK_TIME")
```

Execute as a two-call batch with approval first. Keep the spend limit at or
near the user-approved amount and revoke the key after the workflow.

## Mint With Debt Token

When funding with debt token, quote with
`Assistant.quoteMintWithDebtToken(isAPE, vaultParams, amountDebtToken)`.
The Vault swaps through Kumbaya. Use the quote result to set the collateral
minimum.

```bash
INPUT_TOKEN=$DEBT_TOKEN

mega moss create-key \
  --allow-call "$INPUT_TOKEN:approve(address,uint256)" \
  --allow-call "$VAULT:mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)" \
  --spend-limit "$INPUT_TOKEN:1:day" \
  --label "sir-mint-with-debt"
```

Encode the same `mint` signature with `amountToDeposit = amountDebtToken` and
`collateralToDepositMin` from the fresh debt-token quote.

## Native ETH Mint

The source examples use native value when WETH is the relevant debt or
collateral token, passing `amountToDeposit = 0`. Verify the active SIR path
before using native value.

```bash
AMOUNT_VALUE=100000000000000000
AMOUNT_TO_DEPOSIT=0

mega moss create-key \
  --allow-call "$VAULT:mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)" \
  --spend-limit "$NATIVE:0.1:day" \
  --label "sir-native-mint"

MINT=$(cast calldata \
  'mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)' \
  "$IS_APE" \
  "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)" \
  "$AMOUNT_TO_DEPOSIT" \
  "$MIN_COLLATERAL_OR_OUTPUT" \
  "$DEADLINE" \
  "$PORTION_LOCK_TIME")

mega moss execute --to "$VAULT" --data "$MINT" --value "$AMOUNT_VALUE"
```

## Burn APE Or TEA

Quote with `Assistant.quoteBurn(isAPE, vaultParams, amountTokens)` immediately
before burning. For TEA, read `lockEnd(wallet, vaultId)` first and do not burn
while locked.

```bash
IS_APE=true
AMOUNT_TOKENS=1000000000000000000

mega moss create-key \
  --allow-call "$VAULT:burn(bool,(address,address,int8),uint256,uint40)" \
  --label "sir-burn"

BURN=$(cast calldata \
  'burn(bool,(address,address,int8),uint256,uint40)' \
  "$IS_APE" \
  "($DEBT_TOKEN,$COLLATERAL_TOKEN,$LEVERAGE_TIER)" \
  "$AMOUNT_TOKENS" \
  "$DEADLINE")

mega moss execute --to "$VAULT" --data "$BURN"
```

Do not add approval calls unless the current ABI or a verified integration test
shows a separate APE/TEA approval is required for the chosen burn path.

## Stake, Unstake, And Claim MegaSIR

MegaSIR amount values are 12-decimal base units and the staking ABI uses
`uint80`.

```bash
SIR_AMOUNT=1000000000000

mega moss create-key \
  --allow-call "$SIR:stake(uint80)" \
  --spend-limit "$SIR:1:day" \
  --label "sir-stake"

STAKE=$(cast calldata 'stake(uint80)' "$SIR_AMOUNT")
mega moss execute --to "$SIR" --data "$STAKE"
```

Before unstaking, read `stakeOf(address)` and only unstake up to
`unlockedStake`.

```bash
mega moss create-key \
  --allow-call "$SIR:unstake(uint80)" \
  --allow-call "$SIR:claim()" \
  --allow-call "$SIR:unstakeAndClaim(uint80)" \
  --label "sir-staker-actions"
```

LP reward claims are scoped separately:

```bash
mega moss create-key \
  --allow-call "$SIR:lperMint(uint256)" \
  --allow-call "$SIR:lperMintAndStake(uint256)" \
  --label "sir-lp-rewards"
```

## Fee Auctions

Starting an auction is `collectFeesAndStartAuction(token)`. Bidding uses native
ETH value on `bid(token, amount)`.

```bash
AUCTION_TOKEN=$COLLATERAL_TOKEN
BID_AMOUNT_UINT96=100000000000000000
BID_VALUE=$BID_AMOUNT_UINT96

mega moss create-key \
  --allow-call "$SIR:bid(address,uint96)" \
  --spend-limit "$NATIVE:0.1:day" \
  --label "sir-auction-bid"

BID=$(cast calldata 'bid(address,uint96)' "$AUCTION_TOKEN" "$BID_AMOUNT_UINT96")
mega moss execute --to "$SIR" --data "$BID" --value "$BID_VALUE"
```

Read `auctions(token)` before bidding. Auctions last 24 hours and have a
247-hour cooldown for the same token in the source material.

## Safety

- Verify ABIs and addresses before execution.
- Quote immediately before mint or burn.
- Keep deadlines short.
- Do not initialize a vault unless status is `2`.
- Treat APE as ERC20 and TEA as ERC1155.
- Check TEA lock state before burn or transfer.
- Remember MegaSIR has 12 decimals.
- Revoke delegated keys with `mega moss revoke <key>` after execution.
