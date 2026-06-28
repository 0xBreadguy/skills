# Warren With MegaETH Wallet CLI

Use this only for MOSS CLI routing around Warren. For Warren developer
background, read `megaeth-developer-skills/references/protocols/warren.md`.

## Source Status

Warren's current source material in `https://github.com/planetai87/warren-tools`
is script-oriented. It provides Node.js deployment scripts that manage chunking,
contract deployment, tree construction, access-key checks, and registry
registration. It does not provide a verified `mega moss execute` raw calldata
recipe for Warren deployments.

## Important Routing Rule

Do not try to hand-roll Warren deployment with `mega moss execute` unless you
have verified the exact current Warren contracts, constructors, deployment
calldata, access-key minting behavior, nonces, and registry calls from the
Warren tools repo.

For now:

- Use `mega moss` for ordinary MegaETH wallet identity, delegated-key
  management, and protocol calls that have verified ABI recipes.
- Use Warren's own scripts for Warren website/file/NFT deployment.
- Use `references/protocols/meganames.md` to link a finished Warren token ID to
  a `.mega` name.

## Network And Contracts

```bash
CHAIN_ID=4326
RPC_URL=https://mainnet.megaeth.com/rpc
GENESIS_KEY=0x0d7BB250fc06f0073F0882E3Bf56728A948C5a88
RABBIT_AGENT=0x3f0CAbd6AB0a318f67aAA7af5F774750ec2461f2
MASTER_NFT=0xf299F428Efe1907618360F3c6D16dF0F2Bf8ceFC
WARREN_CONTAINER=0xeF7d9452a7366d36238c10114CBbE62C0EBf70c3
WARREN_RENDERER=0x4586351920A549e573b0ecC15AedEF37dC60aF65
TREASURY=0xcea9d92ddb052e914ab665c6aaf1ff598d18c550
```

## Script Execution Path

Website or file deployment:

```bash
bash setup.sh
PRIVATE_KEY=0x... node deploy.js \
  --file ./my-site.html \
  --name "My Website"
```

HTML string deployment:

```bash
PRIVATE_KEY=0x... node deploy.js \
  --html "<html><body><h1>Hello Warren</h1></body></html>" \
  --name "My First Site"
```

NFT collection deployment:

```bash
bash setup.sh
PRIVATE_KEY=0x... node deploy-nft.js \
  --images-folder ./my-art/ \
  --name "Cool Robots" \
  --symbol "ROBOT" \
  --description "100 unique robot NFTs on-chain" \
  --max-supply 100
```

Generated SVG NFT test:

```bash
PRIVATE_KEY=0x... node deploy-nft.js \
  --generate-svg 10 \
  --name "Generative Art" \
  --symbol "GART"
```

The scripts expect `PRIVATE_KEY`. Do not place this key in repo files, command
logs, shell history, or saved snippets.

## Environment Variables

Shared script variables:

| Variable | Required | Default |
| --- | --- | --- |
| `PRIVATE_KEY` | yes | none |
| `RPC_URL` | no | `https://mainnet.megaeth.com/rpc` |
| `CHAIN_ID` | no | `4326` |
| `GENESIS_KEY_ADDRESS` | no | `0x0d7BB250fc06f0073F0882E3Bf56728A948C5a88` |
| `RABBIT_AGENT_ADDRESS` | no | `0x3f0CAbd6AB0a318f67aAA7af5F774750ec2461f2` |
| `CHUNK_SIZE` | no | `15000` |
| `GROUP_SIZE` | no | `500` |

Website/file variable:

| Variable | Default |
| --- | --- |
| `MASTER_NFT_ADDRESS` | `0xf299F428Efe1907618360F3c6D16dF0F2Bf8ceFC` |

NFT variables:

| Variable | Default |
| --- | --- |
| `CONTAINER_ADDRESS` | `0xeF7d9452a7366d36238c10114CBbE62C0EBf70c3` |
| `RENDERER_ADDRESS` | `0x4586351920A549e573b0ecC15AedEF37dC60aF65` |
| `TREASURY_ADDRESS` | `0xcea9d92ddb052e914ab665c6aaf1ff598d18c550` |
| `REGISTER_API` | `https://thewarren.app/api/container-nfts` |

Set `REGISTER_API` to an empty value if the user does not want optional NFT
collection metadata posted to the Warren dashboard API.

## Access And Costs

The scripts check:

1. Human Genesis Key ownership.
2. 0xRabbit.agent Key ownership.
3. Auto-mint 0xRabbit.agent Key if neither exists.

Users need MegaETH mainnet ETH. The source estimates about 0.001 ETH for a
small site and about 0.03 ETH for a small 10-image NFT collection, but agents
should treat those as rough historical estimates and check current balances and
gas.

## Limits

- Website/file deployment: max 500KB per deployment.
- NFT images: PNG, JPG, JPEG, SVG, GIF, or WebP.
- NFT image size: max 500KB per image.
- NFT image count: 1 to 256 images.
- Default chunk size: 15000 bytes.
- Default tree group size: 500 addresses.

## Linking To MegaNames

After Warren returns a token ID, link it to `.mega` with the MegaNames
execution recipe:

```bash
MEGANAMES=0x5B424C6CCba77b32b9625a6fd5A30D409d20d997
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

Use `IS_MASTER=true` for MasterNFT site deployments and `false` for
WarrenContainer entries.

## Safety

- Do not convert Warren scripts into MOSS raw calls without verified ABI and
  constructor coverage.
- Confirm content permanence before deployment.
- Never deploy secrets or private material.
- Keep private keys out of repo files and persistent shell history.
- Disable `REGISTER_API` when optional collection dashboard registration is
  not wanted.
- Revoke any MOSS delegated key used for the follow-up MegaNames link.
