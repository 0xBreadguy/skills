# Aave On MegaETH

Use this for dApp developer integration guidance. For `mega moss` scoped-key
execution recipes, read `references/protocols/moss-cli/aave.md`.

## Source Of Truth

Use `@aave-dao/aave-address-book` before shipping or executing. Do not copy an
address from an old chat response when the address book is available.

```bash
tmp=$(mktemp -d)
cd "$tmp"
npm init -y >/dev/null
npm install @aave-dao/aave-address-book >/dev/null
node - <<'NODE'
const { AaveV3MegaEth } = require('@aave-dao/aave-address-book');
console.log({
  chainId: AaveV3MegaEth.CHAIN_ID,
  pool: AaveV3MegaEth.POOL,
  dataProvider: AaveV3MegaEth.AAVE_PROTOCOL_DATA_PROVIDER,
  oracle: AaveV3MegaEth.ORACLE,
  assets: AaveV3MegaEth.ASSETS,
});
NODE
```

Current MegaETH mainnet address-book constants:

| Name | Address |
| --- | --- |
| Chain ID | `4326` |
| Pool | `0x7e324AbC5De01d112AfC03a584966ff199741C28` |
| PoolAddressesProvider | `0x46Dcd5F4600319b02649Fd76B55aA6c1035CA478` |
| ProtocolDataProvider | `0x9588b453A4EE24a420830CB3302195cA7aA3b403` |
| Oracle | `0x421117D7319E96d831972b3F7e970bbfe29C4F21` |
| WETH gateway | `0xa119F84bC1b8083F5061E4cf53705cBf1065bA27` |

Reserve underlyings from the address book:

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
| stcUSD | 18 | `0x88887bE419578051FF9F4eb6C858A951921D8888` |

## Integration Surface

Use the Aave V3 Pool ABI for user actions:

| Action | Signature | Notes |
| --- | --- | --- |
| Supply ERC20 | `supply(address,uint256,address,uint16)` | Needs prior ERC20 approval to Pool. Use `referralCode = 0` unless the app has an approved code. |
| Withdraw | `withdraw(address,uint256,address)` | Use `type(uint256).max` to withdraw full aToken balance. |
| Borrow | `borrow(address,uint256,uint256,uint16,address)` | Use variable rate mode `2` unless stable mode is explicitly supported. |
| Repay | `repay(address,uint256,uint256,address)` | Needs prior ERC20 approval to Pool. |
| Toggle collateral | `setUserUseReserveAsCollateral(address,bool)` | High-risk UX; affects liquidation risk. |
| Account health | `getUserAccountData(address)` | Read before/after borrow/collateral changes. |
| Reserve data | `getReserveData(address)` | Read before displaying asset availability/risk. |

Use `AaveProtocolDataProvider.getUserReserveData(address,address)` for per-user
reserve details where the app needs balances, debt, or collateral state.

## MOSS Integration Notes

- For app flows, use `moss-wallet-sdk`.
- For agent-operated terminal flows, use `moss-wallet-cli`.
- ERC20 approval and the consuming Aave Pool call should be bundled where the
  wallet/smart-account path supports batching.
- If using MOSS CLI relay-backed execution, follow
  `references/protocols/moss-cli/aave.md`; standalone approvals can be
  reset at end-of-transaction and should not be split from supply/repay.

## Implementation Checklist

- Verify the target chain is MegaETH mainnet `4326`.
- Pull market addresses from the Aave address book at build/test time or pin
  the address-book version.
- Pull token metadata from `mega-tokenlist` or the Aave address book; do not
  trust UI-entered decimals.
- Simulate with a MegaETH RPC endpoint before sending.
- Read `getUserAccountData` before risky actions and display health factor
  impact for borrow/collateral changes.
- Add tests for supply, withdraw, borrow rejection, repay, insufficient
  allowance, insufficient balance, and failed collateral toggles.
