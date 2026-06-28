# Kumbaya On MegaETH

Use this for dApp developer integration guidance. For `mega moss` scoped-key
execution recipes, read `moss-wallet-cli/references/protocols/kumbaya.md`.

## Source Status

This file adapts the Kumbaya material from
`megaeth-ai-developer-skills/kumbaya-dex.md` so the Awesome MegaETH AI protocol
coverage is represented here. Treat it as implementation guidance that still
needs verification against official Kumbaya docs, package exports, or the
Kumbaya integrator kit before production or value-bearing writes.

Do not use Awesome MegaETH AI or MTRKR MCP as source-of-truth for executable
Kumbaya calldata. MTRKR, if available, is only an external read-only tooling
candidate and needs due diligence before recommendation or use.

## Network

| Network | Chain ID | RPC |
| --- | ---: | --- |
| MegaETH Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` |
| MegaETH Testnet | `6343` | `https://carrot.megaeth.com/rpc` |

## Mainnet Contracts

Verify these addresses against official Kumbaya sources before executing:

| Contract | Address |
| --- | --- |
| UniswapV3Factory | `0x68b34591f662508076927803c567Cc8006988a09` |
| SwapRouter02 | `0xE5BbEF8De2DB447a7432A47EBa58924d94eE470e` |
| UniversalRouter | `0xAAB1C664CeaD881AfBB58555e6A3a79523D3e4C0` |
| QuoterV2 | `0x1F1a8dC7E138C34b503Ca080962aC10B75384a27` |
| NonfungiblePositionManager | `0x2b781C57e6358f64864Ff8EC464a03Fdaf9974bA` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| WETH9 | `0x4200000000000000000000000000000000000006` |
| Multicall2 | `0xf6f404ac6289ab8eB1caf244008b5F073d59385c` |
| TickLens | `0x9c22f028e0a1dc76EB895a1929DBc517c9D0593e` |
| UniswapV3Staker | `0x9F393A399321110Fb7D85aCc812b8e48A7c569aC` |

## Testnet Contracts

| Contract | Address |
| --- | --- |
| UniswapV3Factory | `0x53447989580f541bc138d29A0FcCf72AfbBE1355` |
| SwapRouter02 | `0x8268DC930BA98759E916DEd4c9F367A844814023` |
| UniversalRouter | `0x7E6c4Ada91e432efe5F01FbCb3492Bd3eb7ccD2E` |
| QuoterV2 | `0xfb230b93803F90238cB03f254452bA3a3b0Ec38d` |
| NonfungiblePositionManager | `0x367f9db1F974eA241ba046b77B87C58e2947d8dF` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| WETH9 | `0x4200000000000000000000000000000000000006` |
| Multicall2 | `0xc638099246A98B3A110429B47B3f42CA037BC0a3` |
| TickLens | `0x6D65B4854944Fd93Cd568bb1B54EE22Fe9BF2faa` |
| UniswapV3Staker | `0x511f4EC90936450152895b2C2FD20AF6DC72663b` |

## Core Tokens

Prefer `mega-tokenlist` for token metadata. Common Kumbaya pairs use:

| Token | Address | Decimals |
| --- | --- | ---: |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| USDm | `0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7` | 18 |

## Architecture

Kumbaya is described as a Uniswap V3 fork. The critical fork-specific detail is
the pool init code hash:

```text
0x851d77a45b8b9a205fb9f44cb829cceba85282714d2603d601840640628a3da7
```

Use Kumbaya's hash for CREATE2 pool address computation. Do not use the
standard Uniswap V3 init code hash.

Recommended packages from the imported material:

```bash
npm install @kumbaya_xyz/sdk-core @kumbaya_xyz/v3-sdk @kumbaya_xyz/smart-order-router
```

Additional Kumbaya packages referenced by the source material include
`@kumbaya_xyz/router-sdk`, `@kumbaya_xyz/universal-router-sdk`, and
`@kumbaya_xyz/default-token-list`.

## Swap Integration

Use `QuoterV2` for quotes and `SwapRouter02` for direct swap execution. Always
quote immediately before a swap and derive slippage bounds from the fresh
quote.

Common direct-router function signatures:

| Operation | Contract | Signature |
| --- | --- | --- |
| quote exact input single | QuoterV2 | `quoteExactInputSingle((address,address,uint256,uint24,uint160))` |
| quote exact output single | QuoterV2 | `quoteExactOutputSingle((address,address,uint256,uint24,uint160))` |
| exact input single swap | SwapRouter02 | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| exact output single swap | SwapRouter02 | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| exact input multi-hop swap | SwapRouter02 | `exactInput((bytes,address,uint256,uint256))` |
| ERC20 approval | ERC20 input token | `approve(address,uint256)` |

For multi-hop swaps, encode paths as alternating token addresses and `uint24`
fees:

```typescript
import { encodePacked } from "viem";

const path = encodePacked(
  ["address", "uint24", "address", "uint24", "address"],
  [WETH, 3000, USDM, 3000, TOKEN_OUT],
);
```

Fee tiers:

| Fee | Use case | Tick spacing |
| ---: | --- | ---: |
| `100` | stablecoin-stablecoin | 1 |
| `500` | stable-correlated pairs | 10 |
| `3000` | standard pairs | 60 |
| `10000` | exotic/volatile pairs | 200 |

## Liquidity Positions

Liquidity positions are NFT based and use `NonfungiblePositionManager`.

Common function signatures:

| Operation | Signature |
| --- | --- |
| mint position | `mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))` |
| increase liquidity | `increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))` |
| decrease liquidity | `decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))` |
| collect fees/tokens | `collect((uint256,address,uint128,uint128))` |

Always sort `token0` and `token1` by address before minting. Set
`amount0Min`, `amount1Min`, and `deadline`; do not use zero minimums in
production unless the user explicitly accepts that risk.

## Pool Discovery

Kumbaya pool address computation uses CREATE2 with the Kumbaya factory and
Kumbaya init code hash. The source material uses packed salt encoding:

```typescript
import { encodePacked, getCreate2Address, keccak256 } from "viem";

const INIT_CODE_HASH =
  "0x851d77a45b8b9a205fb9f44cb829cceba85282714d2603d601840640628a3da7";

function getKumbayaPoolAddress(factory, tokenA, tokenB, fee) {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const salt = keccak256(
    encodePacked(["address", "address", "uint24"], [token0, token1, fee]),
  );

  return getCreate2Address({ from: factory, salt, bytecodeHash: INIT_CODE_HASH });
}
```

After computing a pool address, read `slot0()` and `liquidity()` before
building quotes or liquidity UIs.

## Permit2

Kumbaya's UniversalRouter material references Permit2. For direct
`SwapRouter02` flows, ERC20 approval to `SwapRouter02` is sufficient. For
UniversalRouter/Permit2 flows, verify the current UniversalRouter command
format and Permit2 typed-data payload from Kumbaya SDKs or official docs before
implementation.

## MOSS Integration Notes

- App integration: use `moss-wallet-sdk`.
- CLI execution: use `moss-wallet-cli/references/protocols/kumbaya.md`.
- For agent-operated writes, quote first, set explicit slippage, use exact
  call scopes, and bundle ERC20 approval with the consuming swap or liquidity
  call in one `mega moss execute --calls` batch.

## Safety

- Verify Kumbaya addresses and ABIs against official Kumbaya sources before
  value-bearing execution.
- Do not infer Kumbaya's init code hash from Uniswap.
- Never submit a swap without a fresh quote and explicit slippage bound.
- Keep deadlines short for swaps.
- Treat native ETH and WETH as different spend/value paths.
- Treat MTRKR as unverified external read-only tooling unless due diligence has
  confirmed installation, auth/payment behavior, privacy posture, tool schemas,
  and output reliability.
