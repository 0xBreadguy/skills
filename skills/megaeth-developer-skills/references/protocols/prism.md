# Prism On MegaETH

Use this for dApp developer integration guidance. For `mega moss` scoped-key
execution recipes, read `moss-wallet-cli/references/protocols/prism.md`.

## Source Status

This file adapts the Prism material from
`megaeth-ai-developer-skills/prism-dex.md` so the Awesome MegaETH AI protocol
coverage is represented here. Treat it as implementation guidance that still
needs verification against Prism docs, package exports, and deployed contract
state before production or value-bearing writes.

Do not use Awesome MegaETH AI or MTRKR MCP as source-of-truth for executable
Prism calldata. MTRKR, if available, is only an external read-only tooling
candidate and needs due diligence before recommendation or use.

## Network

| Network | Chain ID | RPC |
| --- | ---: | --- |
| MegaETH Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` |
| MegaETH Testnet | `6343` | `https://carrot.megaeth.com/rpc` |

## Mainnet Contracts

Verify these addresses against official Prism sources before executing:

| Contract | Address |
| --- | --- |
| Factory | `0x1adb8f973373505bb206e0e5d87af8fb1f5514ef` |
| QuoterV2 | `0xdd79c72c21f7dcd1d034b55caf9177bc42f5df0c` |
| SwapRouter02 | `0xb1f38c36249834d8e3cd582d30101ff4b864f234` |
| UniversalRouter | `0x955d56f6391a496231509134e0d2beadf82a223f` |
| Permit2 | `0x56783fbf77a33871892a2d66337677555714ffbb` |
| NonfungiblePositionManager | `0xcb91c75a6b29700756d4411495be696c4e9a576e` |
| SelectiveTaxRouter | `0x19956ebe69659c78ad4ee500694287bc6f67c4da` |
| SelectiveTaxRouterPermit2 | `0x4c2c989f20794fa92d3082a3d49d9a430face555` |
| Multicall2 | `0x3064c9b0fd9bf73caf668c9c621bb12ec0cccb0c` |
| WETH9 | `0x4200000000000000000000000000000000000006` |

## Core Tokens

Prefer `mega-tokenlist` or Prism's tokenlist endpoint for current metadata.

| Token | Address | Decimals |
| --- | --- | ---: |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| USDm | `0xfafddbb3fc7688494971a79cc65dca3ef82079e7` | 18 |
| BTC.b | `0xb0f70c0bd6fd87dbeb7c10dc692a2a6106817072` | 8 |
| USDT0 | `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb` | 6 |

## Architecture

Prism is described as Uniswap V3-compatible with a fork-specific pool address
computation rule: use ABI-encoded CREATE2 salt, not packed salt.

Prism pool init code hash:

```text
0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54
```

Default router choice:

| Flow | Router |
| --- | --- |
| non-taxable direct swap | `SwapRouter02` or `UniversalRouter` |
| taxable-token flow | `SelectiveTaxRouter` |
| Permit2 taxable flow | `SelectiveTaxRouterPermit2` |
| quotes | `QuoterV2` |
| NFT liquidity positions | `NonfungiblePositionManager` |

Minimal dApp dependencies:

```bash
npm install viem @uniswap/v3-sdk @uniswap/sdk-core
```

## Swap Integration

Quote with `QuoterV2` only. Execute swaps with router contracts only. Re-quote
right before submit and apply explicit slippage bounds.

Common signatures:

| Operation | Contract | Signature |
| --- | --- | --- |
| quote exact input single | QuoterV2 | `quoteExactInputSingle((address,address,uint256,uint24,uint160))` |
| quote exact output single | QuoterV2 | `quoteExactOutputSingle((address,address,uint256,uint24,uint160))` |
| non-tax exact input single | SwapRouter02 | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| non-tax exact output single | SwapRouter02 | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))` |
| multi-hop exact input | SwapRouter02 | `exactInput((bytes,address,uint256,uint256))` |
| taxable exact input single | SelectiveTaxRouter | `exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))` |
| taxable exact output single | SelectiveTaxRouter | `exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))` |
| tax check | SelectiveTaxRouter | `willBeTaxed(address,address,address)` |
| tax quote | SelectiveTaxRouter | `calculateTax(address,address,address,uint256)` |
| ERC20 approval | ERC20 input token | `approve(address,uint256)` |

For taxable-token flows:

1. Call `willBeTaxed(tokenIn, tokenOut, userAddress)`.
2. If taxable, call `calculateTax(tokenIn, tokenOut, userAddress, amountIn)`.
3. Use `SelectiveTaxRouter` or `SelectiveTaxRouterPermit2`.
4. Use `exactInputSingle` or `exactOutputSingle`; do not invent a
   `swapWithTax` function.
5. Add tax headroom for exact-output flows.

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
| `100` | stablecoin pairs | 1 |
| `500` | stable-correlated pairs | 10 |
| `3000` | standard pairs | 60 |
| `10000` | exotic/volatile pairs | 200 |

## Liquidity Positions

Prism liquidity positions are NFT based.

Common function signatures:

| Operation | Signature |
| --- | --- |
| mint position | `mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))` |
| increase liquidity | `increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))` |
| decrease liquidity | `decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))` |
| collect fees/tokens | `collect((uint256,address,uint128,uint128))` |

Always sort `token0` and `token1` by address before minting. Read pool state,
current tick, and liquidity before proposing a range.

## Pool Discovery

Prism pool address computation uses ABI-encoded salt:

```typescript
import { encodeAbiParameters, getCreate2Address, keccak256 } from "viem";

const INIT_CODE_HASH =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

function getPrismPoolAddress(factory, tokenA, tokenB, fee) {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const salt = keccak256(
    encodeAbiParameters(
      [
        { type: "address", name: "token0" },
        { type: "address", name: "token1" },
        { type: "uint24", name: "fee" },
      ],
      [token0, token1, fee],
    ),
  );

  return getCreate2Address({ from: factory, salt, bytecodeHash: INIT_CODE_HASH });
}
```

Do not use `encodePacked` for Prism pool salts.

## Endpoints

The imported material references these endpoints. Verify availability and
response shape before relying on them:

```typescript
const tokenList = await fetch("https://prismfi.cc/tokenlist.json").then((r) => r.json());
const pools = await fetch("https://prismfi.cc/api/pools/list").then((r) => r.json());
const routes = await fetch("https://prismfi.cc/api/swaps/swap-pools").then((r) => r.json());
```

## MOSS Integration Notes

- App integration: use `moss-wallet-sdk`.
- CLI execution: use `moss-wallet-cli/references/protocols/prism.md`.
- For agent-operated writes, quote first, evaluate taxable-token routing,
  set explicit slippage, use exact call scopes, and bundle ERC20 approval with
  the consuming swap or liquidity call in one `mega moss execute --calls`
  batch.

## Safety

- Verify Prism addresses and ABIs against official Prism sources before
  value-bearing execution.
- Use `SelectiveTaxRouter` for taxable-token flows.
- Do not auto-select leverage, collateral, tick ranges, rebalance parameters,
  or risk settings for users.
- Never submit a swap without a fresh quote and explicit slippage bound.
- Use short deadlines for swaps, commonly 30-120 seconds.
- Treat MTRKR as unverified external read-only tooling unless due diligence has
  confirmed installation, auth/payment behavior, privacy posture, tool schemas,
  and output reliability.
