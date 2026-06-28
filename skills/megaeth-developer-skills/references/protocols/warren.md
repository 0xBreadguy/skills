# Warren On MegaETH

Use this for Warren on-chain website, file, and NFT collection deployment
guidance. Warren's source material is script-oriented; for terminal execution
use the Warren scripts rather than inventing raw contract calldata. For MOSS
CLI-specific routing, read `moss-wallet-cli/references/protocols/warren.md`.

## Source Status

This file adapts `https://github.com/planetai87/warren-tools`, especially
`skills/warren-deploy/SKILL.md`, `skills/warren-nft-deploy/SKILL.md`,
`skills/README.md`, and `loader/README.md`. Treat the Warren tools repo as the
source of truth for script behavior, environment variables, limits, and
deployment flow.

## Network

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| MegaETH Mainnet | `4326` | `https://mainnet.megaeth.com/rpc` | `https://megaeth.blockscout.com` |

## Mainnet Contracts

| Contract | Address | Used by |
| --- | --- | --- |
| Genesis Key NFT (0xRabbitNeo) | `0x0d7BB250fc06f0073F0882E3Bf56728A948C5a88` | website and NFT deploy |
| 0xRabbit.agent Key NFT | `0x3f0CAbd6AB0a318f67aAA7af5F774750ec2461f2` | website and NFT deploy |
| MasterNFT Registry | `0xf299F428Efe1907618360F3c6D16dF0F2Bf8ceFC` | website/file deploy |
| WarrenContainer | `0xeF7d9452a7366d36238c10114CBbE62C0EBf70c3` | NFT deploy |
| WarrenContainerRenderer | `0x4586351920A549e573b0ecC15AedEF37dC60aF65` | NFT deploy |
| Treasury / Relayer | `0xcea9d92ddb052e914ab665c6aaf1ff598d18c550` | NFT deploy |

The Warren extension config also references MegaNames at
`0x5B424C6CCba77b32b9625a6fd5A30D409d20d997` for `.mega` integration.

## Architecture

Warren stores content on-chain using SSTORE2-style page contracts. Larger files
are split into chunks, then chunk addresses are grouped into a tree until a
single root represents the deployment. The registry stores the root chunk,
tree depth, and total size.

Default source settings:

| Setting | Default |
| --- | --- |
| Chunk size | `15000` bytes |
| Group size | `500` child addresses per node |
| Website/file max size | 500KB per deployment |
| NFT image max size | 500KB per image |
| NFT image count | 1 to 256 images |

Content deployed through Warren is permanent and immutable. Make users confirm
that the exact content should be public and permanent before deployment.

## Access Requirement

The deployment scripts check access in this order:

1. Human Genesis Key (0xRabbitNeo) ownership.
2. 0xRabbit.agent Key ownership.
3. Auto-mint 0xRabbit.agent Key if neither exists.

The source describes the 0xRabbit.agent key as free apart from gas. Users still
need MegaETH mainnet ETH for deployment gas.

## Environment Variables

Shared variables:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PRIVATE_KEY` | yes | none | Wallet private key for signing |
| `RPC_URL` | no | `https://mainnet.megaeth.com/rpc` | MegaETH RPC |
| `CHAIN_ID` | no | `4326` | MegaETH mainnet chain ID |
| `GENESIS_KEY_ADDRESS` | no | `0x0d7BB250fc06f0073F0882E3Bf56728A948C5a88` | Genesis key NFT |
| `RABBIT_AGENT_ADDRESS` | no | `0x3f0CAbd6AB0a318f67aAA7af5F774750ec2461f2` | Agent key NFT |
| `CHUNK_SIZE` | no | `15000` | Bytes per chunk |
| `GROUP_SIZE` | no | `500` | Addresses per tree node |

Website/file deploy variable:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MASTER_NFT_ADDRESS` | `0xf299F428Efe1907618360F3c6D16dF0F2Bf8ceFC` | MasterNFT registry |

NFT deploy variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CONTAINER_ADDRESS` | `0xeF7d9452a7366d36238c10114CBbE62C0EBf70c3` | WarrenContainer |
| `RENDERER_ADDRESS` | `0x4586351920A549e573b0ecC15AedEF37dC60aF65` | WarrenContainerRenderer |
| `TREASURY_ADDRESS` | `0xcea9d92ddb052e914ab665c6aaf1ff598d18c550` | Treasury/relayer |
| `REGISTER_API` | `https://thewarren.app/api/container-nfts` | Optional collection registration endpoint |

## Website Or File Deployment

Run setup in the Warren deploy skill directory:

```bash
bash setup.sh
```

Deploy an HTML string:

```bash
PRIVATE_KEY=0x... node deploy.js \
  --html "<html><body><h1>Hello Warren</h1></body></html>" \
  --name "My First Site"
```

Deploy a file:

```bash
PRIVATE_KEY=0x... node deploy.js \
  --file ./my-site.html \
  --name "My Website"
```

Deploy from stdin:

```bash
echo "<h1>Hello</h1>" | PRIVATE_KEY=0x... node deploy.js --name "Piped"
```

Supported options from the source:

| Option | Purpose |
| --- | --- |
| `--private-key <key>` | Private key, or use `PRIVATE_KEY` |
| `--html <string>` | HTML content to deploy |
| `--file <path>` | File path to deploy |
| `--name <name>` | Site name |
| `--type <type>` | `file`, `image`, `video`, `audio`, or `script` |

Expected output includes `tokenId`, `rootChunk`, `depth`, and a URL such as:

```text
https://thewarren.app/v/site={TOKEN_ID}
```

The source estimates about 0.001 ETH per small site deployment, but agents
should treat gas cost as variable and check current balance/estimates.

## NFT Collection Deployment

Run setup in the Warren NFT deploy skill directory:

```bash
bash setup.sh
```

Deploy from an image folder:

```bash
PRIVATE_KEY=0x... node deploy-nft.js \
  --images-folder ./my-art/ \
  --name "Cool Robots" \
  --symbol "ROBOT" \
  --description "100 unique robot NFTs on-chain" \
  --max-supply 100
```

Generate SVG art:

```bash
PRIVATE_KEY=0x... node deploy-nft.js \
  --generate-svg 10 \
  --name "Generative Art" \
  --symbol "GART" \
  --description "Generated on-chain art"
```

Common NFT options:

| Option | Required | Meaning |
| --- | --- | --- |
| `--images-folder <path>` | one of image folder or generated SVG | folder with image files |
| `--generate-svg <count>` | one of image folder or generated SVG | generate 1 to 256 SVGs |
| `--name <string>` | yes | collection name |
| `--symbol <string>` | yes | collection symbol |
| `--description <text>` | no | collection description |
| `--max-supply <number>` | no | max mintable supply |
| `--whitelist-price <eth>` | no | whitelist mint price |
| `--public-price <eth>` | no | public mint price |
| `--max-per-wallet <number>` | no | mint limit per wallet |
| `--royalty-bps <number>` | no | royalty, max 1000 bps in source |

The source estimates about 0.03 ETH for a small collection around 10 images.
Check current gas and wallet balance instead of hardcoding this estimate.

## Loader And Viewing

Warren loader tooling can load:

- MasterNFT registry sites by registry address and token ID.
- WarrenContainer files by token ID and path.
- File types including HTML/file, image, audio, video, and script loaders.

Useful source URL patterns include:

```text
https://thewarren.app/v/site={TOKEN_ID}
loader.html?registry=0xf299F428Efe1907618360F3c6D16dF0F2Bf8ceFC&id={TOKEN_ID}
```

## MegaNames Integration

MegaNames can point a `.mega` name at a Warren deployment using
`setWarrenContenthash(tokenId, warrenTokenId, isMaster)`. Use
`protocols/meganames.md` for the MegaNames side.

Use `isMaster = true` for MasterNFT site IDs. Use `isMaster = false` for
WarrenContainer entries.

## Security And Privacy

The source claims:

- Website deploy sends content only as transactions to the configured RPC.
- Website deploy has no intermediary servers, telemetry, analytics, tracking,
  or usage reporting.
- `deploy.js` reads only the explicit `--file`.
- `deploy-nft.js` reads only files inside the explicit `--images-folder`.
- `PRIVATE_KEY` is used for signing and is not logged, stored, or transmitted.
- NFT deployment may POST non-critical collection metadata to
  `REGISTER_API`. No images or private keys are sent. Set `REGISTER_API` to an
  empty value to disable that registration.

Agents should still treat private-key handling as high risk. Prefer isolated
shell sessions, do not echo private keys, and do not persist secrets in repo
files or shell history.

## MOSS Integration Notes

Current Warren source material does not provide a MOSS Wallet CLI raw calldata
recipe. Do not convert the Warren scripts into `mega moss execute` calls unless
you have verified the exact contract ABIs, constructors, deployment calldata,
and access-key minting calls from the current Warren tools.

For MOSS wallet users, the practical integration path is:

1. Use MOSS for ordinary wallet identity and protocol actions.
2. Use Warren tools for Warren deployments when the user can provide a
   deployment private key in the expected script environment.
3. Link the resulting Warren token ID to `.mega` through MegaNames if needed.

## Safety

- Confirm mainnet deployment and permanence before running scripts.
- Confirm file sizes before deployment.
- Never deploy secrets, private content, API keys, or unpublished assets unless
  the user explicitly understands they become public and permanent.
- Disable `REGISTER_API` if the user wants no collection dashboard metadata
  POST.
- Do not treat Warren deployment as available on testnet unless current Warren
  docs say so.
