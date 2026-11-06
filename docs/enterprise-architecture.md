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
4. Add `routes.ts` (lazy pages attached to `shared/routing/root.ts`), `i18n.ts`
   (`defineTranslations('<domain>', en, ar)`) and permissions named `<domain>.<action>`
   with `<domain>:` label keys. Pages use `getRouteApi` and `useTranslation(ns)`.
5. Export the route tree and a `ModuleDefinition` (id, navigation, permissions)
   from `public.ts`, plus contract types/schemas other modules need. Do not export
   every internal component. Add both to `app/modules.ts`; nothing else in `app/`
   changes. Backend entitlements/flags must use the agreed IDs.
6. Style with Tailwind utilities and shared components; add RTL acceptance cases.
   Select only the business rules needed by each screen. Paginate large server collections.
7. Run focused tests and boundary/type checks, then the cohesive change gate.
   Missing local contracts, private cross-domain imports and computed import
   loaders fail the check. Do not create alternate src layers to bypass it.

Keep module contracts understandable without opening neighboring implementation.
Contracts describe inputs, outputs and important behavior; they do not duplicate
code. Update `ai/plan.md` for handoff rather than copying a chat transcript.

## When the application grows

- Group navigation entries into sections when the flat module list becomes hard to
  scan. Keep visibility and direct-route checks consistent.
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

The [composition examples](pattern-coverage.md) provide screen references. The
table lists product decisions that still need a real backend contract. Where the
template already ships the frontend side, extend it instead of rebuilding it:

| Need | Backend contract and frontend work required |
| --- | --- |
| Organization/workspace switching | Authorized workspace list, session scope and cache reset; current demo proves reset behavior |
| Audit/history | Actor/time/change events, retention/redaction; frontend cannot create authoritative audit evidence |
| Notifications/live updates | Shipped: SSE invalidation by module `refreshOn`. Needed: event IDs, reconnect cursor (`Last-Event-ID`), read/unread policy |
| Files/import/export | Shipped: presigned uploads with progress, XLSX/CSV export. Needed: scan status, import/export jobs, expiring downloads |
| Complex forms | Field arrays, step validation, server errors, concurrency, optional recoverable drafts with privacy policy |
| Global search/command palette | Shipped: palette and shortcut help. Needed: permission-filtered backend search |
| Offline operations | Conflict/idempotency/sync contract; production app reports offline state; the separate composition queues only explicit demo writes |
| Reporting | Server aggregates, accessible charts, localized time zones and explicit currency units |
| Billing management | Backend-generated management links, invoices and webhook-synchronized entitlements |
| Observability | Shipped: error and analytics hooks, Web Vitals, release tag, request-ID header, bundle budget. Needed: the actual services and redaction policy |

Do not turn the local role/plan previews into product-specific policy, payroll
formulas or subscription pricing until the application rules and backend endpoints
are known. Navigation grouping, recoverable forms, reports and a shell command
palette already exist; extend their owning contracts rather than rebuilding them.

## Research references

- [TanStack Query structural sharing and selectors](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations) informs narrow subscriptions.
- [TanStack Table pagination](https://tanstack.com/table/v8/docs/guide/pagination) informs the server-paginated reference. The installed table is v8.
- [OpenFeature evaluation context](https://openfeature.dev/specification/sections/evaluation-context/) supports explicitly scoped user/workspace targeting. This template consumes resolved backend flags; it does not implement an OpenFeature SDK/provider.
- [Stripe entitlements](https://docs.stripe.com/billing/entitlements) distinguishes access to product features from subscription display. No Stripe dependency or checkout is installed.
- [shadcn RTL guidance](https://ui.shadcn.com/docs/rtl) identifies CLI migration and manual component exceptions.
- [WAI-ARIA patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) provides interaction guidance. Installed components still need feature-specific accessibility checks.
