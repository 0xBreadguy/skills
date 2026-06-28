# MegaNames With MegaETH Wallet CLI

Use this only for `mega moss` execution guidance. For dApp developer
integration, read `megaeth-developer-skills/references/protocols/meganames.md`.

## Source Status

This file adapts the MegaNames skill from
`https://github.com/0xBreadguy/mega-names/tree/main/skill` into scoped MOSS
CLI execution patterns. Verify MegaNames addresses and ABIs before
value-bearing writes.

## Mainnet Constants

```bash
CHAIN_ID=4326
MEGANAMES=0x5B424C6CCba77b32b9625a6fd5A30D409d20d997
USDM=0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7
SUBDOMAIN_ROUTER=0xdB5e5Ab907e62714D7d9Ffde209A4E770a0507Fe
SUBDOMAIN_LOGIC=0xf09fB5cB77b570A30D68b1Aa1d944256171C5172
ZERO=0x0000000000000000000000000000000000000000
```

USDM uses 18 decimals in the source material.

## Function Scopes

Use exact function scopes after verifying the ABI:

| Action | Target | Signature |
| --- | --- | --- |
| approve USDM | USDM | `approve(address,uint256)` |
| register name | MegaNames | `register(string,address,uint256)` |
| register with permit | MegaNames | `registerWithPermit(string,address,uint256,uint256,uint8,bytes32,bytes32)` |
| set text record | MegaNames | `setText(uint256,string,string)` |
| create free subdomain | MegaNames | `registerSubdomain(uint256,string)` |
| approve subdomain router | MegaNames | `setApprovalForAll(address,bool)` |
| set subdomain price | SubdomainLogic | `setPrice(uint256,uint256)` |
| configure sales | SubdomainRouter | `configure(uint256,address,bool,uint8)` |
| buy subdomain | SubdomainRouter | `register(uint256,string,address)` |
| batch buy subdomains | SubdomainRouter | `registerBatch(uint256,string[],address)` |
| set token gate | SubdomainLogic | `setTokenGate(uint256,address,uint256)` |
| set Warren contenthash | MegaNames | `setWarrenContenthash(uint256,uint256,bool)` |

Do not grant wildcard scopes.

## Preflight

1. Run `mega moss whoami --json` and copy the wallet account.
2. Normalize labels to lowercase.
3. Validate labels with `[a-z0-9-]`, no leading/trailing hyphen, max 255 chars.
4. Read fees with `calculateFee`; do not compute fees locally for execution.
5. Use base-unit USDM amounts from the contract return.
6. Inspect existing delegated keys before reuse.

## Reads

Use `cast call` or the current project client for reads.

```bash
LABEL=bread
YEARS=1
LABEL_LENGTH=${#LABEL}

cast call "$MEGANAMES" \
  'calculateFee(uint256,uint256)(uint256)' \
  "$LABEL_LENGTH" "$YEARS" \
  --rpc-url https://mainnet.megaeth.com/rpc
```

Other read functions:

| Read | Signature |
| --- | --- |
| forward resolution | `addr(uint256)` |
| reverse resolution | `getName(address)` |
| current premium | `currentPremium(uint256)` |
| owner tokens | `tokensOfOwner(address)` |
| Warren link | `warren(uint256)` |
| subdomain quote | `quote(uint256,string,address)` on SubdomainRouter |

Compute token IDs with the ENS-style hashing described in
`megaeth-developer-skills/references/protocols/meganames.md`. Do not pass raw
labels to `addr`.

## Register Name With Approve Plus Register

Use this CLI flow unless a verified permit flow is available for the current
wallet tooling.

```bash
WALLET=$(mega moss whoami --json | jq -r '.account // .address')
LABEL=yourname
YEARS=1
FEE_BASE_UNITS=$FEE_FROM_CALCULATE_FEE
```

Create a scoped delegated key:

```bash
mega moss create-key \
  --allow-call "$USDM:approve(address,uint256)" \
  --allow-call "$MEGANAMES:register(string,address,uint256)" \
  --spend-limit "$USDM:1:day" \
  --label "meganames-register"
```

Build calldata:

```bash
APPROVE=$(cast calldata 'approve(address,uint256)' "$MEGANAMES" "$FEE_BASE_UNITS")
REGISTER=$(cast calldata \
  'register(string,address,uint256)' \
  "$LABEL" "$WALLET" "$YEARS")
```

Execute approval and registration as one batch. Keep the USDM spend limit at or
near the expected fee, not an unlimited budget.

## Register With Permit

The source recommends `registerWithPermit` for app UX. Only use it in CLI
automation if you have a verified ERC2612 permit payload and signature for
USDM.

```bash
mega moss create-key \
  --allow-call "$MEGANAMES:registerWithPermit(string,address,uint256,uint256,uint8,bytes32,bytes32)" \
  --spend-limit "$USDM:1:day" \
  --label "meganames-register-permit"
```

Do not fabricate `v`, `r`, `s`, nonce, or deadline. If the current workflow
cannot produce a permit, use approve plus register.

## Set Text Records

Only the name owner or authorized account should set records.

```bash
TOKEN_ID=$TOKEN_ID_BASE10
KEY=url
VALUE=https://example.com

mega moss create-key \
  --allow-call "$MEGANAMES:setText(uint256,string,string)" \
  --label "meganames-set-text"

DATA=$(cast calldata 'setText(uint256,string,string)' "$TOKEN_ID" "$KEY" "$VALUE")
mega moss execute --to "$MEGANAMES" --data "$DATA"
```

Standard keys from the source include `avatar`, `url`, `com.twitter`,
`com.github`, `com.discord`, `org.telegram`, and `description`.

## Create Free Subdomain

```bash
PARENT_TOKEN_ID=$PARENT_TOKEN_ID_BASE10
SUBLABEL=blog

mega moss create-key \
  --allow-call "$MEGANAMES:registerSubdomain(uint256,string)" \
  --label "meganames-free-subdomain"

DATA=$(cast calldata 'registerSubdomain(uint256,string)' "$PARENT_TOKEN_ID" "$SUBLABEL")
mega moss execute --to "$MEGANAMES" --data "$DATA"
```

## Configure Subdomain Sales

Seller setup usually needs ERC721 operator approval, price configuration, and
router configuration.

```bash
PAYOUT=$WALLET
PRICE_USDM=1000000000000000000
MODE=0

mega moss create-key \
  --allow-call "$MEGANAMES:setApprovalForAll(address,bool)" \
  --allow-call "$SUBDOMAIN_LOGIC:setPrice(uint256,uint256)" \
  --allow-call "$SUBDOMAIN_ROUTER:configure(uint256,address,bool,uint8)" \
  --label "meganames-subdomain-seller"
```

Use `MODE=0` for open sales and `MODE=1` for token-gated sales. If token
gating is used, also scope and execute:

```bash
mega moss create-key \
  --allow-call "$SUBDOMAIN_LOGIC:setTokenGate(uint256,address,uint256)" \
  --label "meganames-token-gate"
```

Confirm payout address, price, and mode before execution.

## Buy Paid Subdomain

Quote first:

```bash
cast call "$SUBDOMAIN_ROUTER" \
  'quote(uint256,string,address)(bool,uint256,uint256,uint256)' \
  "$PARENT_TOKEN_ID" "$SUBLABEL" "$WALLET" \
  --rpc-url https://mainnet.megaeth.com/rpc
```

Use the returned `total` as the USDM approval amount.

```bash
TOTAL_USDM=$TOTAL_FROM_QUOTE

mega moss create-key \
  --allow-call "$USDM:approve(address,uint256)" \
  --allow-call "$SUBDOMAIN_ROUTER:register(uint256,string,address)" \
  --spend-limit "$USDM:1:day" \
  --label "meganames-buy-subdomain"

APPROVE=$(cast calldata 'approve(address,uint256)' "$SUBDOMAIN_ROUTER" "$TOTAL_USDM")
REGISTER=$(cast calldata \
  'register(uint256,string,address)' \
  "$PARENT_TOKEN_ID" "$SUBLABEL" "$ZERO")
```

Execute approval plus register in one batch.

## Link Warren Content

Use this after a Warren deployment returns a token ID. See
`references/protocols/warren.md` for Warren routing.

```bash
TOKEN_ID=$MEGANAMES_TOKEN_ID_BASE10
WARREN_TOKEN_ID=$WARREN_TOKEN_ID_BASE10
IS_MASTER=true

mega moss create-key \
  --allow-call "$MEGANAMES:setWarrenContenthash(uint256,uint256,bool)" \
  --label "meganames-warren-link"

DATA=$(cast calldata \
  'setWarrenContenthash(uint256,uint256,bool)' \
  "$TOKEN_ID" "$WARREN_TOKEN_ID" "$IS_MASTER")

mega moss execute --to "$MEGANAMES" --data "$DATA"
```

Use `IS_MASTER=true` for a Warren MasterNFT site and `false` for a
WarrenContainer entry.

## Safety

- Use `calculateFee` and `quote` results as source of truth.
- Do not grant unlimited USDM approval or broad router scopes.
- Confirm label, owner, years, and USDM fee before registration.
- Confirm parent token ID before subdomain actions.
- Confirm Warren token ID and `isMaster` before linking content.
- Revoke delegated keys with `mega moss revoke <key>` after execution.
