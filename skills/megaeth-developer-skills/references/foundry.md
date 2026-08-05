# Foundry On MegaETH

Foundry works for compilation, tests, scripts, broadcasting, and verification.
Its local EVM does not implement MegaETH storage gas or resource accounting, so
do not use local simulation as the source of gas limits.

## Project Baseline

```text
project/
|-- foundry.toml
|-- src/
|-- test/
|-- script/
`-- lib/
```

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
megaeth = "https://mainnet.megaeth.com/rpc"
megaeth_testnet = "https://carrot.megaeth.com/rpc"
```

Choose a Solidity version based on the project's dependencies. `via_ir` is a
normal Solidity compiler option, not a MegaETH-incompatible feature. If it is
needed for stack depth or optimization, test the exact compiler version and
deployed bytecode just as on any EVM chain.

## Testing

Use Foundry unit, fuzz, invariant, and fork tests for contract logic:

```bash
forge test
forge test --fork-url https://carrot.megaeth.com/rpc
```

A Foundry fork reads MegaETH state but executes tests in Foundry's local EVM.
It therefore does not reproduce MegaETH storage gas, gas detention, or all
resource limits. Treat local gas snapshots as comparative development signals,
not deployment limits. Use remote estimation and `mega-evme` for MegaEVM
behavior.

## Deployment Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MyContract} from "../src/MyContract.sol";

contract Deploy is Script {
    function run() external returns (MyContract deployed) {
        vm.startBroadcast();
        deployed = new MyContract();
        vm.stopBroadcast();
    }
}
```

Use a keystore, hardware/external signer, or Foundry's interactive prompt. Do
not commit a raw private key or include it in shell history.

## Broadcast With Remote Estimation

`forge script` normally simulates with its local EVM before broadcasting. Pass
`--skip-simulation`; Foundry then estimates broadcast transactions through the
remote RPC:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url megaeth_testnet \
  --broadcast \
  --skip-simulation \
  --interactives 1
```

For mainnet:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url megaeth \
  --broadcast \
  --skip-simulation \
  --interactives 1
```

Do not use `forge script --gas-limit` as though it were a per-transaction
broadcast limit; in current Foundry it aliases the local block gas-limit option.

`forge create` and `cast send` use remote `eth_estimateGas` by default:

```bash
forge create src/MyContract.sol:MyContract \
  --rpc-url https://carrot.megaeth.com/rpc \
  --interactive

cast send 0xContract 'method(uint256)' 42 \
  --rpc-url https://mainnet.megaeth.com/rpc \
  --interactive
```

If the public estimator's 0.5-second CPU budget cannot handle a valid heavy
transaction, first reproduce it with `mega-evme`. Then either use a provider
with suitable estimation limits or pass a tested manual limit to `forge create`
or `cast send` with `--gas-limit`. Avoid generic 5M/500M constants.

## Verification

MegaETH mainnet is supported by Etherscan V2 under chain ID `4326`:

```bash
forge verify-contract 0xDeployedAddress src/MyContract.sol:MyContract \
  --chain 4326 \
  --etherscan-api-key "$ETHERSCAN_API_KEY"
```

For constructor arguments, compiler settings, proxies, and retry behavior,
follow current Foundry verification documentation. Keep the compiler version,
optimizer settings, libraries, and constructor arguments identical to the
broadcast artifact.

## Debugging Workflow

1. Read the failed receipt and trace the mined transaction through the public
   `debug_traceTransaction` endpoint.
2. Replay it with `mega-evme` when MegaETH accounting or a what-if override is
   needed.
3. Turn the failure into a focused Foundry regression test.
4. Re-estimate against the target MegaETH RPC before rebroadcasting.

## Sources

- `https://docs.megaeth.com/dev/send-tx/gas-estimation`
- `https://docs.megaeth.com/dev/send-tx/debugging`
- `https://getfoundry.sh/forge/deploying`
- `https://getfoundry.sh/reference/forge/forge-script`
- `https://getfoundry.sh/reference/forge/forge-create`
- `https://getfoundry.sh/reference/cast/cast-send`
