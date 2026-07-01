# MegaNames On MegaETH

Use this for `.mega` / MegaNames developer integration. For agent-operated
`mega moss` execution recipes, read
`references/protocols/moss-cli/meganames.md`.

## Source Status

This file adapts the MegaNames skill from
`https://github.com/0xBreadguy/mega-names/tree/main/skill`. Treat that source
and MegaNames contract code/docs as the project source material. Verify
addresses and ABI signatures before production writes.

## Networks

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| MegaETH Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` | `https://mega.etherscan.io` |
| MegaETH Testnet | `6343` | `https://carrot.megaeth.com/rpc` | `https://testnet-mega.etherscan.io` |

Main frontend: `https://dotmega.domains`.

## Mainnet Contracts

| Contract | Address |
| --- | --- |
| MegaNames | `0x5B424C6CCba77b32b9625a6fd5A30D409d20d997` |
| USDM | `0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7` |
| Renderer | `0x8d206c277E709c8F4f8882fc0157bE76dA0C48C4` |
| SubdomainRouter | `0xdB5e5Ab907e62714D7d9Ffde209A4E770a0507Fe` |
| SubdomainLogic | `0xf09fB5cB77b570A30D68b1Aa1d944256171C5172` |
| Fee Recipient | `0x25925C0191E8195aFb9dFA35Cd04071FF11D2e38` |

## Testnet Contracts

| Contract | Address |
| --- | --- |
| MegaNames | `0x8F0310eEDcfB71E5095ee5ce4f3676D9cEA65101` |
| MockUSDM | `0xa8a7Ea151E366532ce8b0442255aE60E0ff2F833` |

## Defaults And Invariants

- Use `eth_sendRawTransactionSync` for direct write submissions when the client
  supports it.
- Use `registerWithPermit` where the app can obtain an ERC2612 USDM permit;
  otherwise approve USDM and call `register`.
- Calculate fees with `calculateFee(labelLength, numYears)` instead of
  duplicating pricing and discount logic.
- Resolve names by token ID, not by passing raw labels to read functions.
- Normalize labels to lowercase.
- Valid labels use `[a-z0-9-]`, no leading/trailing hyphen, and max 255 chars.
- USDM uses 18 decimals and supports ERC2612 permit in the source material.
- MegaNames registration has no commit-reveal step in the source material.

## Token ID Derivation

MegaNames uses ENS-style namehashing. The `.mega` node from the source is:

```text
0x892fab39f6d2ae901009febba7dbdd0fd85e8a1651be6b8901774cdef395852f
```

Derive a root `.mega` token ID as `keccak256(MEGA_NODE, keccak256(label))`.
For subdomains, use the parent token ID as the node and hash the sublabel.

```typescript
import { encodePacked, keccak256, toBytes } from "viem";

const MEGA_NODE =
  "0x892fab39f6d2ae901009febba7dbdd0fd85e8a1651be6b8901774cdef395852f";

export function getTokenId(label: string): bigint {
  const normalized = label.toLowerCase();
  const labelHash = keccak256(toBytes(normalized));
  return BigInt(keccak256(encodePacked(["bytes32", "bytes32"], [MEGA_NODE, labelHash])));
}
```

## Registration

| Operation | Contract | Signature |
| --- | --- | --- |
| calculate fee | MegaNames | `calculateFee(uint256,uint256)` |
| approve USDM | USDM | `approve(address,uint256)` |
| register name | MegaNames | `register(string,address,uint256)` |
| register with permit | MegaNames | `registerWithPermit(string,address,uint256,uint256,uint8,bytes32,bytes32)` |

Basic flow:

1. Validate and normalize the label.
2. Read fee with `calculateFee(label.length, numYears)`.
3. If not using permit, approve MegaNames to spend exactly that USDM amount.
4. Call `register(label, ownerAddress, numYears)`.

Registration pricing from the source:

| Label length | Base annual price |
| ---: | ---: |
| 1 | USD 1000 |
| 2 | USD 500 |
| 3 | USD 100 |
| 4 | USD 10 |
| 5 or more | USD 1 |

Multi-year discounts from the source:

| Term | Discount |
| ---: | ---: |
| 2 years | 5% |
| 3 years | 10% |
| 5 years | 15% |
| 10 years | 25% |

Always treat the contract's `calculateFee` result as authoritative.

## Resolution And Records

| Operation | Contract | Signature |
| --- | --- | --- |
| forward resolution | MegaNames | `addr(uint256)` |
| reverse resolution | MegaNames | `getName(address)` |
| set text record | MegaNames | `setText(uint256,string,string)` |
| list owner tokens | MegaNames | `tokensOfOwner(address)` |
| total registrations | MegaNames | `totalRegistrations()` |
| total volume | MegaNames | `totalVolume()` |

Standard text keys from the source:

```text
avatar
url
com.twitter
com.github
com.discord
org.telegram
description
```

## Subdomains

Subdomains are ERC721 tokens with their own resolution and records. The source
states nested subdomains are supported up to 3 levels.

| Operation | Contract | Signature |
| --- | --- | --- |
| create free subdomain | MegaNames | `registerSubdomain(uint256,string)` |
| approve marketplace router | MegaNames ERC721 | `setApprovalForAll(address,bool)` |
| set subdomain price | SubdomainLogic | `setPrice(uint256,uint256)` |
| configure sales | SubdomainRouter | `configure(uint256,address,bool,uint8)` |
| quote buyer registration | SubdomainRouter | `quote(uint256,string,address)` |
| register paid subdomain | SubdomainRouter | `register(uint256,string,address)` |
| set token gate | SubdomainLogic | `setTokenGate(uint256,address,uint256)` |
| batch register | SubdomainRouter | `registerBatch(uint256,string[],address)` |

Marketplace economics from the source:

- 97.5% of sale proceeds to the parent name owner.
- 2.5% protocol fee.
- Minimum price is USD 0.01 in USDM.
- `configure` mode `0` is open sales.
- `configure` mode `1` is token-gated sales.
- `registerBatch` supports up to 50 subdomains in the source example.

## Warren Contenthash

MegaNames can link a `.mega` token to a Warren on-chain website or container.

| Operation | Contract | Signature |
| --- | --- | --- |
| set Warren contenthash | MegaNames | `setWarrenContenthash(uint256,uint256,bool)` |
| read Warren link | MegaNames | `warren(uint256)` |

`isMaster = true` identifies a MasterNFT site. `isMaster = false` identifies a
WarrenContainer entry. The source describes the contenthash format as:

```text
0xe9 + 01(master)/02(container) + 4-byte warrenTokenId
```

For Warren deployment guidance, use `protocols/warren.md`.

## Expiry And Premiums

Names expire after their registration period. The source describes a 90-day
grace period, followed by a Dutch-auction premium that decays linearly from
USD 10000 to zero over 21 days.

| Operation | Contract | Signature |
| --- | --- | --- |
| current post-grace premium | MegaNames | `currentPremium(uint256)` |

Read contract state before telling users a name is available, expired, or safe
to register.

## MOSS Integration Notes

- For a registration app, use `moss-wallet-sdk` and Smart Approvals scoped to
  USDM approval plus the exact MegaNames action.
- For terminal execution, use
  `references/protocols/moss-cli/meganames.md`.
- Prefer permit UX in apps. In CLI workflows, use explicit approve plus
  register unless the current wallet tooling supports a verified permit flow.

## Safety

- Never duplicate pricing as source of truth. Use `calculateFee`.
- Normalize labels before token ID derivation and writes.
- Confirm owner and recipient addresses before registration.
- Avoid unlimited USDM approvals.
- Do not assume a reverse name exists just because forward resolution works.
- Check expiry and premium state for expired names.
- Verify subdomain sale configuration before asking a buyer to approve USDM.
