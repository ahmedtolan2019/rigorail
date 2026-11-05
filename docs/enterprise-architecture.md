# Extending to enterprise scale

The boundaries and state ownership in [architecture.md](architecture.md) are
implemented. Scale has not been benchmarked against a complete ERP; this is a
small reference that establishes repeatable conventions.

## Add a domain

1. Read `AGENTS.md`, the architecture and the active scope in `ai/plan.md`.
   Use `npm run context -- <existing-domain>` to inspect an existing pattern without
   loading every module.
2. Create `src/modules/<domain>/AGENTS.md` and `contract.md` describing routes,
   endpoints, schemas, permission IDs, state ownership and acceptance cases.
3. Implement only folders you need. Keep schemas, queries, forms and workflow
   rules inside that domain. Copy the Requests pattern, not its business assumptions.
4. Expose narrow exports in `public.ts`: route loaders, contract types/schemas and
   permission definitions. Do not export every internal component.
5. Register lazy routes in `app/router.tsx`, navigation in `app/shell.tsx` and
   permissions in `app/runtime.ts`. Backend entitlements/flags must use the agreed IDs.
6. Add English/Arabic namespace resources and RTL acceptance cases. Select only
   the business rules needed by each screen. Paginate large server collections.
7. Run focused tests and boundary/type checks, then the cohesive change gate.
   Missing local contracts, private cross-domain imports and computed import
   loaders fail the check. Do not create alternate src layers to bypass it.

Keep module contracts understandable without opening neighboring implementation.
Contracts describe inputs, outputs and important behavior; they do not duplicate
code. Update `ai/plan.md` for handoff rather than copying a chat transcript.

## When the application grows

- Split navigation into domain-owned manifests composed by the app when the small
  explicit registry becomes hard to scan. Keep visibility and direct-route checks consistent.
- Introduce a domain-specific configuration endpoint/namespace when unrelated
  rules dominate one payload. Reuse the scoped query/selector pattern.
- Use virtualized rows only for measured large client-side grids. Server pagination
  is the default. Do not download an ERP dataset into a global store.
- Use backend bulk commands/jobs for imports, exports and long operations. Show
  partial failures, cancellation and resumable job status using an agreed contract.
- Add explicit workflow/state machines when branching transitions warrant them;
  a three-state approval reference does not need a new framework.
- Profile actual interactions and route bundles before memoizing everything or
  splitting into packages/microfrontends. CI should test affected domains first.

## Future application decisions

These are documented extension needs, not empty packages installed in advance:

| Need | Backend contract and frontend work required |
| --- | --- |
| Organization/workspace switching | Authorized workspace list, session scope and cache reset; current demo proves reset behavior |
| Audit/history | Actor/time/change events, retention/redaction; frontend cannot create authoritative audit evidence |
| Notifications/live updates | Event IDs, reconnect cursor, scoped invalidation, read/unread policy |
| Files/import/export | Signed upload limits, scan status, job progress, partial errors and expiring downloads |
| Complex forms | Field arrays, step validation, server errors, concurrency, optional recoverable drafts with privacy policy |
| Global search/command palette | Permission-filtered backend results, keyboard access, shortcut discoverability |
| Offline operations | Conflict/idempotency/sync contract; current app only reports offline state, never queues writes silently |
| Reporting | Server aggregates, accessible charts, localized time zones and explicit currency units |
| Billing management | Backend-generated management links, invoices and webhook-synchronized entitlements |
| Observability | Error sink, correlation IDs, redaction, release identity and frontend performance budgets |

Do not implement product-specific payroll formulas, subscription pricing or role
editors until that application's rules and backend endpoints are known.

## Research references

- [TanStack Query structural sharing and selectors](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations) informs narrow subscriptions.
- [TanStack Table pagination](https://tanstack.com/table/v8/docs/guide/pagination) informs the server-paginated reference. The installed table is v8.
- [OpenFeature evaluation context](https://openfeature.dev/specification/sections/evaluation-context/) supports explicitly scoped user/workspace targeting. This template consumes resolved backend flags; it does not implement an OpenFeature SDK/provider.
- [Stripe entitlements](https://docs.stripe.com/billing/entitlements) distinguishes access to product features from subscription display. No Stripe dependency or checkout is installed.
- [shadcn RTL guidance](https://ui.shadcn.com/docs/rtl) identifies CLI migration and manual component exceptions.
- [WAI-ARIA patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) provides interaction guidance. Installed components still need feature-specific accessibility checks.
