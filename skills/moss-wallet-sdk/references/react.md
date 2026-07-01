# React, Hooks, And Wagmi

Read the detailed files in `references/react/` for React-specific integration:

- [react/provider-setup.md](react/provider-setup.md): `<MegaProvider>` setup.
- [react/hooks-at-a-glance.md](react/hooks-at-a-glance.md): hook list and use
  cases.
- [react/react-reference.md](react/react-reference.md): full React reference.
- [react/react-flows.md](react/react-flows.md): common flows.
- [react/ux-guidance.md](react/ux-guidance.md): UX and copy guidance.
- [react/wagmi-connector.md](react/wagmi-connector.md): MOSS wagmi connector.

Core rules:

- Mount `<MegaProvider>` once at a stable client boundary.
- Do not nest another `QueryClientProvider` under `MegaProvider`.
- Gate wallet-aware UI on `useStatus().initialised`.
- Use `mutateAsync` from explicit user actions and branch on returned status.
- Provider/hooks are client-only in SSR/Next.js.
- Keep wagmi/viem connector work here; route terminal execution to
  `moss-wallet-cli`.
