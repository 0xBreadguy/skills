# x402 Payments on MegaETH

Use x402 for an HTTP `402 Payment Required` flow in which a client signs a
payment authorization, retries the protected request, and a facilitator verifies
and settles the payment. Use the current x402 v2 packages and schemas instead of
hand-assembling legacy headers or proxy calldata.

## Sources and version boundary

- MegaETH payments guide: https://docs.megaeth.com/developer-docs/payments
- MegaETH payment demo: https://github.com/megaeth-labs/payment-demo
- x402 specification and packages: https://github.com/x402-foundation/x402

The package API, transport headers, extensions, and supported schemes can change.
Pin compatible `@x402/*` package versions, consult that version's documentation,
and let the libraries serialize and parse protocol messages.

MPP is a separate payment-protocol family with one-time and session flows. Do
not mix x402 payloads with MPP credentials merely because both can use HTTP 402.

## MegaETH network identifiers

The x402 v2 EVM network value is CAIP-2:

| Network | Value |
| --- | --- |
| Mainnet | `eip155:4326` |
| Testnet | `eip155:6343` |

Resolve the payment asset from the target network's current token source. The
canonical MegaUSD addresses are in [`usdm.md`](usdm.md), but a demo or managed
facilitator may intentionally support a different test token.

## Roles

1. The **resource server** declares accepted payment requirements and withholds
   the resource until payment verifies and settles under its policy.
2. The **client** reads the 402 response, selects an acceptable requirement,
   signs with the user's wallet, and retries the request.
3. The **facilitator** advertises supported network/scheme combinations,
   verifies payloads, and submits settlement transactions.

A facilitator normally pays settlement gas. This does not mean every arbitrary
facilitator supports MegaETH, the selected token, Permit2, or first-payment gas
sponsorship.

## Check facilitator support first

Before exposing a price or prompting a signature, query the facilitator's
supported-capabilities endpoint through `HTTPFacilitatorClient.getSupported()`
or the equivalent API in the pinned package version. Confirm all of:

- network (`eip155:4326` or `eip155:6343`);
- scheme (`exact` for the flow below);
- asset and transfer method;
- required extensions, including EIP-2612 gas sponsorship if selected;
- authentication, fees, limits, confirmation policy, and availability.

Do not recommend a hosted facilitator solely because it appears in an ecosystem
list. Its MegaETH support, pricing, auth requirements, and operational status
must be checked directly.

## Resource server pattern

The current MegaETH payment demo uses `@x402/next`, `@x402/evm`, and
`@x402/extensions`:

```ts
import { NextResponse } from "next/server";
import { withX402, x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareEip2612GasSponsoringExtension } from "@x402/extensions";

const network = "eip155:6343" as const;
const resourceServer = new x402ResourceServer(facilitatorClient).register(
  network,
  new ExactEvmScheme(),
);

const GET = withX402(
  async () => NextResponse.json({ data: "protected content" }),
  {
    accepts: [{
      scheme: "exact",
      network,
      payTo: recipient,
      price: {
        amount: "1000000000000000000",
        asset: tokenAddress,
        extra: {
          name: tokenDomainName,
          version: tokenDomainVersion,
          assetTransferMethod: "permit2",
        },
      },
    }],
    description: "Protected resource",
    mimeType: "application/json",
    extensions: {
      ...declareEip2612GasSponsoringExtension(),
    },
  },
  resourceServer,
);

export { GET };
```

Read the token's current EIP-712 domain from the contract where possible. Do not
assume that display symbol, EIP-712 name, and version are identical.

The EIP-2612 gas-sponsoring extension is appropriate only for a token that
actually supports the required permit flow and a facilitator that supports the
extension. Permit2 is the asset-transfer method; EIP-2612 is the token-level
authorization that can avoid a separate gas-paid Permit2 approval.

## Client pattern

Let `@x402/fetch` handle the 402 response and payment transport:

```ts
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";

const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(evmSigner));

const httpClient = new x402HTTPClient(client);
const fetchWithPayment = wrapFetchWithPayment(fetch, httpClient);

const response = await fetchWithPayment(url);
if (!response.ok) throw new Error(`payment request failed: ${response.status}`);

const settlement = httpClient.getPaymentSettleResponse(
  (name) => response.headers.get(name),
);
```

Before signing, surface and validate the network, asset, amount, recipient,
resource, expiry, and scheme. Never sign an opaque requirement merely because a
server returned HTTP 402.

## Facilitator operation

The x402 packages expose facilitator-side EVM scheme implementations. The
MegaETH demo adapts a viem signer with `toFacilitatorEvmSigner`, registers
`ExactEvmScheme`, and can submit settlement with
`realtime_sendRawTransaction`.

For production:

- keep signer keys in a managed secret or signing service;
- authenticate private `/verify` and `/settle` routes or keep them behind a
  trusted network boundary;
- serialize or otherwise manage nonces for concurrent settlement;
- rate-limit callers and validate the declared network and asset;
- reconcile real-time timeouts before retrying;
- define the confirmation level required before releasing each resource;
- make verification and crediting idempotent.

The payment demo's local facilitator endpoint is a reference implementation, not
an unauthenticated public service template.

## Settlement and finality

A successful fresh receipt is not an unconditional finality guarantee. Choose a
confirmation policy from payment value and resource reversibility. Ensure the
same authorization or transaction cannot be credited twice across retries,
reorgs, or re-mining.

Do not publish fixed claims such as “under 50 ms” or “under $0.001.” End-to-end
latency and cost depend on wallet interaction, network path, facilitator queue,
transaction execution, confirmation policy, and current fee conditions.

## Amount handling

Use on-chain/token-list decimals:

```ts
const amount = parseUnits("1", tokenDecimals);
```

Canonical MegaUSD currently has 18 decimals. Do not transfer USDC's common
six-decimal assumption to other assets, and do not assume every x402 SDK example
defaults to the desired MegaETH token.

## Avoid these inherited patterns

- legacy `X-PAYMENT` JSON assembled by hand;
- a raw `settle(...)` ABI copied without matching the installed x402 scheme;
- hardcoded proxy addresses treated as sufficient integration evidence;
- a random timestamp used as a Permit2 nonce without collision analysis;
- unlimited token approval as an unquestioned default;
- facilitator support inferred from an aggregator listing.
