<!-- AUTO-GENERATED from wallet/react/wagmi-connector.md by skills/scripts/build-skills.mjs. Do not edit here — edit the source doc and re-run the script. -->

# Wagmi Connector

Add MOSS Wallet to wagmi-based apps and wallet UI kits such as RainbowKit, ConnectKit, and Reown AppKit.

Use `@megaeth-labs/wallet-wagmi-connector` when your app already uses wagmi/viem and you want MOSS as a connector instead of the React hooks wrapper.

Example app: [MOSS Wallet wagmi connector demo](https://wallet-wagmi-connector-demo.vercel.app/).
The demo includes copyable snippets for the standard connector, custom wallet
methods, and each wallet UI kit integration.

## Install

```bash
pnpm add @megaeth-labs/wallet-wagmi-connector wagmi viem @tanstack/react-query
```

For wallet UI kits, add the package for the kit you use:

```bash
# RainbowKit
pnpm add @rainbow-me/rainbowkit

# ConnectKit
pnpm add connectkit

# Reown AppKit
pnpm add @reown/appkit @reown/appkit-adapter-wagmi
```

## Plain wagmi

Use the base `mossWallet` connector when you do not need a wallet UI kit modal.

```ts
import { mossWallet } from '@megaeth-labs/wallet-wagmi-connector';
import { createConfig, http } from 'wagmi';
import { megaethTestnet } from 'viem/chains';

export const config = createConfig({
  chains: [megaethTestnet],
  connectors: [mossWallet({ network: 'testnet' })],
  transports: {
    [megaethTestnet.id]: http(),
  },
});
```

Wrap your app with wagmi and TanStack Query providers:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';

const queryClient = new QueryClient();

export function App({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

Connect with wagmi hooks. The connector id is `mossWallet`.

```tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors.find((c) => c.id === 'mossWallet');

  if (isConnected) {
    return <button onClick={() => disconnect()}>{address}</button>;
  }

  return (
    <button disabled={!connector} onClick={() => connector && connect({ connector })}>
      Connect MOSS Wallet
    </button>
  );
}
```

## RainbowKit

Use `mossWalletRainbowKit` from the `/rainbowkit` subpath. RainbowKit lists wallets registered through its wallet list, so pass MOSS into `connectorsForWallets`.

```bash
pnpm add @rainbow-me/rainbowkit @megaeth-labs/wallet-wagmi-connector wagmi viem @tanstack/react-query
```

```ts
import { mossWalletRainbowKit } from '@megaeth-labs/wallet-wagmi-connector/rainbowkit';
import { connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { megaethTestnet } from 'viem/chains';

const { wallets: defaultWalletGroups } = getDefaultWallets();

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [() => mossWalletRainbowKit({ network: 'testnet' })],
    },
    ...defaultWalletGroups,
  ],
  {
    appName: 'Your App',
    projectId: 'your-walletconnect-project-id',
  },
);

export const config = createConfig({
  chains: [megaethTestnet],
  connectors,
  transports: {
    [megaethTestnet.id]: http(),
  },
});
```

Wrap with RainbowKit after `WagmiProvider` and `QueryClientProvider`:

```tsx
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';

const queryClient = new QueryClient();

export function App({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectButton />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

MOSS does not need to be accepted into RainbowKit's curated defaults. Add MOSS as your own wallet group and merge RainbowKit's default groups when you want MetaMask, Coinbase Wallet, Rainbow, WalletConnect, and similar defaults to remain visible.

## ConnectKit

ConnectKit is wagmi-based, so pass `mossWallet()` through ConnectKit's `getDefaultConfig(...)`. If you pass `connectors`, that list replaces ConnectKit's defaults. Use `getDefaultConnectors(...)` when you want MOSS plus the default wallets.

```bash
pnpm add connectkit @megaeth-labs/wallet-wagmi-connector wagmi viem @tanstack/react-query
```

```tsx
import { mossWallet } from '@megaeth-labs/wallet-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ConnectKitButton,
  ConnectKitProvider,
  getDefaultConfig,
  getDefaultConnectors,
} from 'connectkit';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { megaethTestnet } from 'viem/chains';

const queryClient = new QueryClient();
const appName = 'Your App';
const walletConnectProjectId = 'your-walletconnect-project-id';

export const config = createConfig(
  getDefaultConfig({
    chains: [megaethTestnet],
    transports: {
      [megaethTestnet.id]: http(),
    },
    walletConnectProjectId,
    appName,
    appDescription: 'Your app description',
    appUrl: 'https://yourapp.example',
    appIcon: 'https://yourapp.example/icon.png',
    connectors: [
      mossWallet({ network: 'testnet' }),
      ...getDefaultConnectors({
        app: { name: appName },
        walletConnectProjectId,
      }),
    ],
  }),
);

export function App({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <ConnectKitButton />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Reown AppKit

Use `mossWallet()` as a custom connector for `WagmiAdapter`. AppKit does not accept viem `Chain` objects directly, so use the `/appkit` helpers to build the network definition and connector icon map.

```bash
pnpm add @reown/appkit @reown/appkit-adapter-wagmi @megaeth-labs/wallet-wagmi-connector wagmi viem @tanstack/react-query
```

```tsx
import { mossWallet } from '@megaeth-labs/wallet-wagmi-connector';
import {
  getMossWalletAppKitNetwork,
  getMossWalletConnectorImages,
} from '@megaeth-labs/wallet-wagmi-connector/appkit';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const projectId = 'your-walletconnect-project-id';
const queryClient = new QueryClient();
const megaethTestnetNetwork = getMossWalletAppKitNetwork('testnet');

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [megaethTestnetNetwork],
  connectors: [mossWallet({ network: 'testnet' })],
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [megaethTestnetNetwork],
  metadata: {
    name: 'Your App',
    description: 'Your app description',
    url: 'https://yourapp.example',
    icons: ['https://yourapp.example/icon.png'],
  },
  connectorImages: getMossWalletConnectorImages(),
});

export function App({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <appkit-button />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

Dynamic uses Reown/AppKit internally. Use the same connector shape anywhere Dynamic exposes custom wagmi connector configuration.

## Custom Wallet Methods

Standard wagmi hooks use standard EIP-1193 methods. For MOSS-specific flows such as wallet-managed balances, send, swap, permissions, and batch contract calls, use the connector's custom wallet methods. These methods route through the same SDK paths as native MOSS integrations.

Beyond standard EIP-1193 methods, the provider supports wallet-specific methods through `provider.request()`:

```ts
const provider = await config.connectors[0].getProvider();

const balances = await provider.request({
  method: 'wallet_balances',
  params: [{ tokens: ['0x4200000000000000000000000000000000000006'] }],
});
```

The same SDK methods are also exposed as convenience methods on the provider:

```ts
const balances = await provider.balances({
  tokens: ['0x4200000000000000000000000000000000000006'],
});
```

Supported wallet methods:

- `wallet_authenticate`
- `wallet_balances`
- `wallet_callContract`
- `wallet_deposit`
- `wallet_getFromContract`
- `wallet_getPermissions`
- `wallet_grantPermissions`
- `wallet_manageAccount`
- `wallet_open`
- `wallet_revokePermissions`
- `wallet_send`
- `wallet_signData`
- `wallet_swap`
- `wallet_transfer`

{% hint style="info" %}
Smart Approvals (Policy Engine) still use the same permission shape and guidance. See [Smart Approvals docs](../permissions.md) for canonical `{ to, signature }` matching.
{% endhint %}

## Notes

- `mossWallet` is the connector factory. `megaWallet`, `megaWalletRainbowKit`, `getMegaWalletAppKitNetwork`, and `getMegaWalletConnectorImages` remain as deprecated compatibility aliases.
- The connector registers with id `mossWallet`, type `injected`, name `MOSS Wallet`, and rdns `com.megaeth.account`.
- Connector metadata is available on `mossWallet({ network }).metadata` for wallet-selector UIs.
- EIP-6963 announcement happens automatically when you use the connector.
- Connector instances are fixed-network; programmatic chain switching is not supported.
- Keep one active MegaETH connector configuration per page load because the underlying wallet SDK initializes once.
- `eth_sendTransaction` maps to wallet SDK `callContract()` using `{ address, data, value }`.
- Unsupported `eth_sendTransaction` fields are rejected rather than silently ignored.
- `personal_sign` supports plain text and hex payloads that decode to UTF-8.
