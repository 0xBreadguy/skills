# Prism on MegaETH

Use this for Prism discovery and integration due diligence. Prism's site and
read endpoints are live, but this audit did not find a protocol-owned public
contract repository, ABI package, deployment manifest, or developer
documentation that establishes the write interface. Do not turn the inherited
third-party material into transaction calldata until Prism publishes or directly
confirms those artifacts.

## Verified public surface

- Application: https://prismfi.cc
- Token list: https://prismfi.cc/tokenlist.json
- Pool list: https://prismfi.cc/api/pools/list
- Swap-pool discovery: https://prismfi.cc/api/swaps/swap-pools
- Network: MegaETH mainnet, chain ID `4326`

The token-list and pool-list endpoints returned data during the release audit.
The swap-pool endpoint is parameterized and rejected a request without valid
token input, which confirms the route exists but not its complete production
contract.

Prefer the canonical MegaETH token list for general token identity. Compare it
with Prism's list when deciding whether Prism supports a token; list membership
does not prove a liquid route.

## Unverified deployment candidates

The following addresses came from inherited partner guidance, and each had
bytecode on MegaETH mainnet during the audit. Bytecode presence does **not**
verify the label, ABI, upgrade state, or safe call semantics.

| Inherited label | Candidate address |
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

The inherited pool init-code hash, claimed tax-router ABI, fee-tier mapping, and
Uniswap V3 compatibility were not independently established by a public
protocol-owned source. They are intentionally not presented as executable
guidance here.

## Read-only discovery workflow

```ts
const [tokensResponse, poolsResponse] = await Promise.all([
  fetch("https://prismfi.cc/tokenlist.json"),
  fetch("https://prismfi.cc/api/pools/list"),
]);

if (!tokensResponse.ok || !poolsResponse.ok) {
  throw new Error("Prism discovery endpoint unavailable");
}

const tokens = await tokensResponse.json();
const pools = await poolsResponse.json();
```

Treat every response as untrusted input: schema-validate it, require chain ID
4326, normalize addresses with a checksummed parser, cap response size, reject
duplicates, and verify token decimals on-chain before displaying amounts.

For a route endpoint, inspect the site's current requests or obtain the API
contract from Prism. Do not guess query parameters from a `400` response.

## Requirements before enabling writes

Obtain all of the following from Prism or verified deployed source:

1. a current deployment manifest tied to chain ID 4326;
2. ABIs and proxy/implementation relationships;
3. quote and router semantics, including native-token handling;
4. tax detection, tax amount, and exact-input/output behavior;
5. pool-address derivation and init-code hash;
6. supported fee tiers and tick spacing;
7. Permit2 domain, spender, witness, and nonce rules;
8. slippage, deadline, refund, and residual-token behavior.

Then compare deployed runtime bytecode or verified explorer source, simulate the
exact transaction against the current MegaETH RPC, and validate target,
selector, tokens, amount, recipient, value, deadline, and slippage before
signing.

## MOSS routing

Do not create a Prism write-capable delegated key from the inherited addresses
or signatures. The MOSS-specific reference at
[`moss-cli/prism.md`](moss-cli/prism.md) is deliberately limited to due
diligence and read-only inspection until the write contract is verifiable.

Awesome MegaETH AI and the partner skill remain attribution/discovery sources.
MTRKR is not a source of truth and is not required for Prism integration.
