# MegaUSD (USDM / USDm)

MegaUSD is MegaETH's native stablecoin. Use the canonical MegaETH token list for
public token metadata and re-check it before generating production code.

## Canonical token-list deployments

| Network | Chain ID | Address |
| --- | ---: | --- |
| Mainnet | 4326 | `0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7` |
| Testnet | 6343 | `0x72d4db19E3AE6f8ed47B5337ab00D69685277cF4` |

The token name is `MegaUSD`, it has 18 decimals, and the canonical token list
uses symbol `USDM`. Product copy also commonly styles the symbol as `USDm`.

The MOSS Wallet CLI release may configure a different test token for its own
testnet examples. That CLI default is not a replacement for the public canonical
token-list address. Resolve the intended environment explicitly before creating
permissions or calldata.

Source: https://github.com/megaeth-labs/mega-tokenlist

## Backing claims

MegaETH's public material describes MegaUSD as a native stablecoin backed by
U.S. Treasury-based reserves. Do not infer a specific issuer stack, reserve
instrument allocation, yield recipient, or sequencer-cost mechanism unless a
current issuer or MegaETH source states it.

## ERC-20 operations

```ts
import { erc20Abi, formatUnits, parseUnits } from "viem";

const USDM = "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7" as const;

const [balance, allowance] = await Promise.all([
  publicClient.readContract({
    address: USDM,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  }),
  publicClient.readContract({
    address: USDM,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  }),
]);

console.log(formatUnits(balance, 18));

const hash = await walletClient.writeContract({
  account,
  address: USDM,
  abi: erc20Abi,
  functionName: "approve",
  args: [spender, parseUnits("100", 18)],
});
```

Use OpenZeppelin `SafeERC20` in Solidity integrations so tokens with unusual
return behavior do not silently bypass checks:

```solidity
using SafeERC20 for IERC20;

IERC20 public constant USDM =
    IERC20(0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7);

function pay(uint256 amount) external {
    USDM.safeTransferFrom(msg.sender, address(this), amount);
}
```

Check the exact spender, amount, existing allowance, and approval-reset policy.
An unlimited approval is a material grant, not a default optimization.

## ERC-2612 permit

The canonical mainnet and testnet deployments expose EIP-2612 `permit`,
`nonces`, and `DOMAIN_SEPARATOR`. Their current EIP-712 domain uses name
`MegaUSD` and version `1`; verify the domain against the target contract before
signing rather than assuming every token called USDM uses it.

```ts
import { parseSignature, parseUnits } from "viem";

const value = parseUnits("100", 18);
const nonce = await publicClient.readContract({
  address: USDM,
  abi: [{
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  }],
  functionName: "nonces",
  args: [owner],
});

const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
const signature = await walletClient.signTypedData({
  account,
  domain: {
    name: "MegaUSD",
    version: "1",
    chainId: 4326,
    verifyingContract: USDM,
  },
  types: {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "Permit",
  message: { owner, spender, value, nonce, deadline },
});

const { v, r, s } = parseSignature(signature);
```

The consumer contract can call `permit` and perform the authorized action in
one transaction:

```solidity
function payWithPermit(
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    IERC20Permit(address(USDM)).permit(
        msg.sender, address(this), amount, deadline, v, r, s
    );
    USDM.safeTransferFrom(msg.sender, address(this), amount);
}
```

This removes a separate approval transaction; it does not make the downstream
action gasless. Gas sponsorship requires a separately configured wallet or
paymaster flow.

## MegaETH integration notes

- `realtime_sendRawTransaction` is preferred when the caller needs an execution
  receipt quickly, but standard transaction submission remains valid.
- A new allowance slot is subject to current MegaEVM storage-gas pricing. Use
  target-network estimation; do not assume a fixed first-write cost.
- `parseEther(value)` and `parseUnits(value, 18)` produce the same base-unit
  scale, but `parseUnits` communicates token intent more clearly.
- Other stablecoins must be resolved independently. For example, CUSD in the
  MegaETH token list is Cap USD, not Circle USDC. Token-list inclusion alone
  does not prove liquidity depth, oracle coverage, or suitability as collateral.
