# Paymaster Sponsorship

Read the detailed files in `references/paymaster/`:

- [paymaster/paymaster-setup.md](paymaster/paymaster-setup.md): client config
  and server sponsor endpoint.
- [paymaster/deposit-flows.md](paymaster/deposit-flows.md): wallet funding
  with `mega.deposit()`, separate from sponsorship.

Core rules:

- Start with `sponsorMode: 'app-only'` and `sponsorToken: 'native'`.
- Use `sponsorMode: 'explicit'` for onboarding-only sponsorship.
- Keep allowlists, budgets, rate limits, and approval decisions server-side.
- Never ship `sponsorMode: 'everything'` to production.
- Funding a wallet is not sponsoring gas.

Use `scripts/sponsor-endpoint-snippet.ts` as an Express skeleton to adapt, not
as a complete production endpoint.
