# Access, flags, subscriptions and business rules

The frontend consumes five distinct backend decisions:

| Concept | Example | Implementation |
| --- | --- | --- |
| Permission | May this user approve this record? | `shared/auth/model.ts` adapter and domain permission catalog |
| Feature flag | Is this module rolled out here? | `capabilities.flags` |
| Entitlement | Does this workspace have this product feature? | `capabilities.entitlements` |
| Quota | How many records may this workspace create? | `capabilities.quotas`, null limit means unlimited |
| Business rule | Maximum request amount | `/configuration`, runtime schema and selector |

`subscription.plan/status` are display data. Do not scatter `plan === 'pro'` or
role-name checks through pages. The backend resolves trial, grace-period, billing,
workspace and user overrides into effective entitlements/quotas/flags. Only the
explicit demo transport contains sample plan-to-entitlement mappings.

## Public frontend contracts

Each domain declares its permission IDs and `labelKey` translation keys. The
Access inspector uses those keys directly; it must not infer labels from action
suffixes or another domain's vocabulary. It displays every supplied quota and
distinguishes missing usage data from an explicit unlimited value.

`AuthorizationAdapter.decide(action, resource?)` returns allowed, denied, loading
or error. The supplied sample adapter supports workspace/own-record grants and
optional amount limits. Unknown actions, absent required records and foreign
workspace records are denied. Replace this adapter for your backend policy model.

`useCapability({ flag, entitlement, quota, action, resource })` composes these
requirements. `AccessBoundary` uses the same flow on routes. Reference navigation,
create buttons, protected pages and AI suggestions share these checks. Record
workflow transitions also check status. A disabled action explains why it cannot run.

Capability/config requests include user/workspace/revision in cache keys and refresh
on focus/interval. Selectors return narrow values. Loading/error states fail closed
for protected actions; a stale successful snapshot may remain visible until the
next refresh, so the server must recheck each operation. A session revision or
workspace change cancels and clears the old query client. The Access refresh action
also invalidates configuration and capabilities.

## Add a configurable business rule

Add its runtime schema and typed selector, then consume that selector in the owning
form or calculation. The Requests amount rule demonstrates local feedback and a
server-side rejection that preserves the draft. A future attendance module might
consume `absenceDaysWithoutDeduction`; its payroll calculations belong in that
module and the external backend, not shared UI or a magic global rule evaluator.

Do not persist authoritative policy in localStorage or treat a browser override
as a real entitlement. Demo controls are only rendered in explicit demo mode.
For large systems, split rule payloads by owning domain while retaining scoped
queries, revision tracking and narrow subscriptions.

## Integration boundaries

Billing checkout, webhooks, quota reservations, role/permission editors and their
privileged writes belong to the backend contract. No fake live billing or auth is
provided. Frontend checks improve UX and are never a security boundary. Quota
races and stale rules must produce useful backend errors. Never automatically
retry a write without an idempotency agreement.
