# Smart Approvals And Silent Execution

Read the detailed files in `references/permissions/` for permission design:

- [permissions/smart-approvals.md](permissions/smart-approvals.md): concept and
  workflows.
- [permissions/permission-model-types.md](permissions/permission-model-types.md):
  grant payload shape.
- [permissions/agent-patterns.md](permissions/agent-patterns.md): agent,
  automation, checkout, and recurring-spend patterns.

Core rules:

- Grant the shortest practical expiry and the smallest viable spend scope.
- Every call scope needs both `to` and `signature`.
- `spend.limit` values are base-unit `bigint` values in SDK calls.
- `silent: true` requires a matching unexpired grant.
- Expose a revoke path and understand the app-wide scope of SDK revocation.
- Use `scripts/build-permission-policy.mjs` for repeatable policy generation
  and validation.

Route `mega moss create-key` permission files and CLI delegated-key scopes to
`moss-wallet-cli`.
