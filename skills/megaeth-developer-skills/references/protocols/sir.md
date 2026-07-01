# SIR Trading On MegaETH

Use this for dApp developer integration guidance for SIR Trading. For
agent-operated `mega moss` execution recipes, read
`references/protocols/moss-cli/sir.md`.

## Source Status

This file adapts the SIR Trading skill from
`https://github.com/SIR-trading/sir-trading-skill/blob/master/sir-trading.md`.
Treat that upstream skill and the SIR Core/Periphery repositories as the
project source material. Verify addresses, ABIs, and UI terminology against
current SIR sources before production or value-bearing execution.

## Network

| Network | Chain ID | RPC |
| --- | ---: | --- |
| MegaETH Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` |

## Mainnet Contracts

| Contract | Address |
| --- | --- |
| Vault | `0x8d694D1b369BdE5B274Ad643fEdD74f836E88543` |
| MegaSIR Token / Staker | `0x9367A0c482703d8d9bda995B03f8E71056a72500` |
| Oracle | `0x4edF071a7dEe52fBE663DF7873994725ba91Cdc7` |
| SystemControl | `0x549618c8E4b74f9eB519e459698b2CaF53dA0453` |
| Contributors | `0x686748764c5C7Aa06FEc784E60D14b650bF79129` |
| Assistant | `0xB91AE2c8365FD45030abA84a4666C4dB074E53E7` |
| Treasury | `0xf1Db8f4D2543c2C881a3dC90754CEDf549cD362d` |

SIR depends on Kumbaya liquidity and pricing. The source lists these Kumbaya
contracts:

| Contract | Address |
| --- | --- |
| Factory | `0x68b34591f662508076927803c567Cc8006988a09` |
| SwapRouter | `0xE5BbEF8De2DB447a7432A47EBa58924d94eE470e` |
| QuoterV2 | `0x1F1a8dC7E138C34b503Ca080962aC10B75384a27` |
| WETH | `0x4200000000000000000000000000000000000006` |

## Core Model

- A vault is a pair identified by
  `VaultParameters { debtToken, collateralToken, leverageTier }`.
- APE is the ERC20 leveraged position token for one vault. Each vault has its
  own APE clone. Read it with `Assistant.getAddressAPE(vaultId)`.
- TEA is the ERC1155 liquidity provider token. The Vault contract is the token
  contract and `vaultId` is the token ID.
- SIR positions are designed with no liquidation.
- Leverage is `1 + 2^tier`, with tiers from `-4` to `2`.
- MegaSIR uses 12 decimals, not 18.
- SIR's oracle uses a 30-minute TWAP from Kumbaya pools.

UI terms map to contracts as follows:

| UI term | Contract concept |
| --- | --- |
| Pair | Vault |
| Go long | Mint APE |
| Close/reduce | Burn APE |
| Provide liquidity | Mint TEA |
| Withdraw liquidity | Burn TEA |
| Stake / unstake | MegaSIR staking |
| Claim rewards | `lperMint`, `claim`, or related reward functions |

## Read Path

Use the Assistant for quoting, status, prices, and portfolio reads. It is the
read-oriented periphery contract.

| Operation | Contract | Signature |
| --- | --- | --- |
| quote APE or TEA mint with collateral | Assistant | `quoteMint(bool,(address,address,int8),uint144)` |
| quote mint funded by debt token | Assistant | `quoteMintWithDebtToken(bool,(address,address,int8),uint256)` |
| quote APE or TEA burn | Assistant | `quoteBurn(bool,(address,address,int8),uint256)` |
| read APE price | Assistant | `priceOfAPE((address,address,int8))` |
| read TEA price | Assistant | `priceOfTEA((address,address,int8))` |
| read vault reserves by IDs | Assistant | `getReserves(uint48[])` |
| read user balances across vaults | Assistant | `getUserBalances(address,uint256,uint256)` |
| check vault status | Assistant | `getVaultStatus((address,address,int8))` |
| get APE token address | Assistant | `getAddressAPE(uint48)` |

Vault status values from the source:

| Value | Meaning |
| ---: | --- |
| `0` | InvalidVault |
| `1` | NoUniswapPool |
| `2` | VaultCanBeCreated |
| `3` | VaultAlreadyExists |

Discover existing vaults with `Vault.numberOfVaults()` and
`Vault.paramsById(uint48)`. Vault IDs start at 1 in the source examples.

## Write Path

Use the Vault for mint, burn, initialize, and TEA ERC1155 actions.

| Operation | Contract | Signature |
| --- | --- | --- |
| initialize vault | Vault | `initialize((address,address,int8))` |
| mint APE or TEA | Vault | `mint(bool,(address,address,int8),uint256,uint144,uint40,uint8)` |
| burn APE or TEA | Vault | `burn(bool,(address,address,int8),uint256,uint40)` |
| read vault params | Vault | `paramsById(uint48)` |
| read vault count | Vault | `numberOfVaults()` |
| read TEA balance | Vault | `balanceOf(address,uint256)` |
| transfer TEA | Vault | `safeTransferFrom(address,address,uint256,uint256,bytes)` |
| approve TEA operator | Vault | `setApprovalForAll(address,bool)` |
| read TEA lock end | Vault | `lockEnd(address,uint256)` |
| read LP rewards | Vault | `unclaimedRewards(uint256,address)` |

### Creating A Vault

Only initialize when `Assistant.getVaultStatus(vaultParams)` returns `2`.
SIR requires the corresponding Kumbaya pool to exist. If status is `1`, do not
try to initialize until the Kumbaya pool exists.

### Minting APE

For collateral-token funding:

1. Read or compute `vaultParams`.
2. Call `Assistant.quoteMint(true, vaultParams, amountCollateral)`.
3. Approve the Vault to spend the collateral ERC20, unless the input is native
   ETH/WETH through the native path.
4. Call `Vault.mint(true, vaultParams, amountToDeposit, minTokensOrCollateral,
   deadline, portionLockTime)`.

For debt-token funding, quote with `quoteMintWithDebtToken`. The Vault swaps
debt token to collateral through Kumbaya; use the returned collateral amount to
set the minimum.

When native ETH is used for a vault whose collateral or debt token is WETH, the
source examples send native value to `mint` and pass `amountToDeposit = 0`.
Verify the active ABI and path before using native value.

### Minting TEA

Use the same `mint` function with `isAPE = false`. TEA is an LP position, not a
leveraged long. Track the returned amount as ERC1155 balance under the Vault
contract and the corresponding `vaultId`.

### Burning APE Or TEA

1. Quote with `Assistant.quoteBurn(isAPE, vaultParams, amountTokens)`.
2. For TEA, read `Vault.lockEnd(user, vaultId)` and do not burn while locked.
3. Call `Vault.burn(isAPE, vaultParams, amountTokens, deadline)`.

`quoteBurn` accounts for burn-side fees in the source material.

## MegaSIR Staking And Rewards

MegaSIR token and staker logic share the MegaSIR contract address. Use 12
decimals for MegaSIR amounts.

| Operation | Contract | Signature |
| --- | --- | --- |
| stake MegaSIR | MegaSIR | `stake(uint80)` |
| unstake unlocked MegaSIR | MegaSIR | `unstake(uint80)` |
| claim ETH dividends | MegaSIR | `claim()` |
| unstake and claim | MegaSIR | `unstakeAndClaim(uint80)` |
| read unlocked/locked stake | MegaSIR | `stakeOf(address)` |
| read unclaimed dividends | MegaSIR | `unclaimedDividends(address)` |
| claim LP rewards | MegaSIR | `lperMint(uint256)` |
| claim and stake LP rewards | MegaSIR | `lperMintAndStake(uint256)` |
| start fee auction | MegaSIR | `collectFeesAndStartAuction(address)` |
| bid in fee auction | MegaSIR | `bid(address,uint96)` payable |
| claim auction lot | MegaSIR | `getAuctionLot(address,address)` |
| read auction state | MegaSIR | `auctions(address)` |

Staked MegaSIR unlocks progressively with a 30-day half-life in the source
material. Do not call `unstake` for more than the current unlocked amount.

Fee auctions last 24 hours and have a 247-hour cooldown for the same token in
the source material. `bid` is payable and uses native ETH as `msg.value`.

## Fees And Risk Notes

- APE mint and burn each charge fees. The source gives examples around tier
  `-2` near 2.4%, tier `0` near 9.1%, tier `1` near 16.7%, and tier `2` near
  28.6%, with fees depending on the configured base fee and tier.
- SIR has no liquidations, but APE can still lose value based on pair movement,
  fees, and leverage tier.
- Kumbaya liquidity and TWAP availability are prerequisites for valid pricing.
- Do not use 18-decimal helpers for MegaSIR balances.

## MOSS Integration Notes

- For app UX, use `moss-wallet-sdk` Smart Approvals with narrow call and spend
  scopes.
- For terminal execution, use
  `references/protocols/moss-cli/sir.md`.
- Bundle ERC20 approval and the consuming Vault call when possible.
- Use `eth_sendRawTransactionSync` only for direct wallet or SDK submission
  paths where the chosen client supports it; the MOSS CLI handles relay-backed
  execution through its own commands.

## Safety

- Verify SIR contract addresses and ABIs before writes.
- Quote immediately before minting or burning.
- Do not initialize vaults unless status is `VaultCanBeCreated`.
- Use explicit deadlines.
- Distinguish APE ERC20 balances from TEA ERC1155 balances.
- Recheck TEA lock state before withdrawals.
- Keep delegated keys short-lived and function-scoped for agent execution.
