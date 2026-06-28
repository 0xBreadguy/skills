# Privy Asset Migration

Read [privy-migration/privy-migration.md](privy-migration/privy-migration.md)
for the full wizard design.

Core rules:

- This is an asset migration, not a key migration.
- Never request, export, log, or move private keys or seed phrases.
- MOSS only provides the destination address.
- Privy signs and broadcasts transfers from the Privy EOA.
- Transfer ERC-20s first, NFTs next, and native token last minus a gas reserve.
- Track each transfer independently and make the flow resumable.
- Wait for destination receipts before marking migration complete.

Use `scripts/build-migration-plan.mjs` to build or validate transfer plans.
