# Frontend architecture

This is a React 19 SPA using Vite 8, TypeScript, Tailwind 4 and shadcn source.
The backend is external. `package.json` and the lockfile define exact tooling.

## Ownership and entry points

`main.tsx` initializes locale, then `app/bootstrap.tsx` loads runtime/session and
mounts a workspace-scoped QueryClient and router. `app/shell.tsx` owns navigation.

| Layer | Owns | Allowed internal dependencies |
| --- | --- | --- |
| `src/app/` | Composition, route registration, identity, explicit demo transport | Shared code and module `public.ts` files |
| `src/modules/<domain>/` | Domain UI, schemas, queries, permission vocabulary, tests | Own files, shared code, another module's `public.ts` |
| `src/shared/` | UI, transport, session adapters, capabilities, config, locale, theme | Shared code only |

`npm run check:architecture` resolves TypeScript imports and dynamic imports,
checks boundaries and runtime cycles. It also rejects unknown source layers,
JavaScript, alternate TypeScript extension and symlink bypasses, missing module
AGENTS/contract/public files, unresolved
internal imports, nested private public files, production imports of tests, and
Node-only runtime imports. Static imports, re-exports, type imports and literal
dynamic imports are resolved. CommonJS, computed dynamic imports and import.meta.glob
are rejected; use explicit literal loader maps. Type-only imports must still obey
ownership but do not create runtime cycles. Assets follow the same ownership rules
and must exist. Production source cannot import helpers outside `src`; `main.tsx`
only composes app/shared code and the root `index.css`. TypeScript module resolution
is cached during each audit to avoid repeatedly resolving the same dependencies.
Only app composition imports and wires modules. Modules must not import app config.
Read a module's `AGENTS.md` and `contract.md` before its implementation.

## State ownership

| State | Owner |
| --- | --- |
| API records, business rules, entitlements, quotas | TanStack Query, runtime-validated responses |
| Search, status, sorting, pagination | Validated TanStack Router search parameters |
| Form values/errors/unsaved changes | React Hook Form, local to the workflow |
| Brand/density/shell | Zustand selectors, optional browser persistence |
| Theme and language | Theme provider and i18next, respectively |
| Stream text and generation status | Local AI suggestion component |

Transient session refresh failures hide/inert the current workspace while retaining
drafts for recovery. HTTP 401/403 clears it. A new QueryClient is mounted when user/workspace/session revision changes; the
old client cancels and clears its requests. Never persist business data or copy
query results into Zustand. Query keys include workspace and filters. Remote
configuration and capability hooks use selectors; subscribe only to needed values.
Global context holds stable services/session, not each changing rule or flag.

## React and UI

Use function components and strict types. Avoid whole-store subscriptions in
large feature trees, effects for derived values and eager imports of all modules.
Use shared `cn()` and semantic CSS tokens. Shared UI contains CLI-installed code
with local RTL/locale/theme adaptations. Import individual files, never a catalog
barrel. React Fast Refresh export checking is disabled only for these registry
files because their public APIs include component helpers.

All reference pages use translation keys. i18next controls document `lang`/`dir`
and both Radix and Base UI direction contexts. Use logical spacing, `bdi` for
mixed-direction values and `dir="auto"` for user text. The sample money contract
uses two decimal minor units; agree a different currency precision with the API
before supporting zero/three-decimal currencies. Never parse localized display
strings as business values. Current translation files are small; move new domains
to lazy-loaded namespaces instead of growing one global dictionary indefinitely.

## External backend contract

See [backend-contract.md](backend-contract.md). The HTTP client validates response
schemas, handles structured/non-JSON errors, 204, cancellation and timeouts.
Writes are not retried automatically. The sample uses credentialed requests;
production authentication, CSRF, CORS and workspace binding must be agreed with
the external backend. No token storage or fake login is supplied.

Frontend guards are UX. The server enforces permissions, entitlements, limits,
workflow transitions and record versions. Demo mode is explicit, in-memory and
isolated from the real network. API failures never select a mock response.

## Access and configuration

`shared/auth/model.ts` exposes the replaceable authorization adapter.
`shared/capabilities/` evaluates server-resolved flags, entitlements and quotas.
`AccessBoundary` composes requirements with authorization for routes;
`useCapability` supports navigation/actions. Unknown requirements fail closed.
`shared/config/business.ts` demonstrates typed business rules from `/configuration`.
The form checks the latest loaded limit and the backend rechecks every write.
See [access-control.md](access-control.md) for integration and lifecycle details.

## Loading and failure recovery

Use [error-handling.md](error-handling.md) for shared loading, background refresh,
empty, validation, conflict and crash patterns. Errors map to localized categories;
raw backend exception messages are not UI copy. Temporary capability errors preserve
hidden/inert draft state, but actual denial and session switches clear it.

## Validation and delivery

Use `npm run context -- <module>` for a focused source/contract map. It is navigation
assistance, not an exhaustive affected-test calculation. Run `npm run check:fast`
and focused behavior tests while editing, then `npm run check` for a cohesive change.
Browser tests are risk-based; full suite before broad UI/auth/routing releases.
`check` builds explicit demo mode and separately compiles API mode using an example
URL in a temporary directory. It asserts that API output excludes the demo transport.
CI does not require or contact a live backend.
Production builds require the API URL. Host static assets with SPA route fallback;
`vite preview` is not a production server. Deployment/monitoring are application
integration tasks, not silently provisioned services.

## Decisions

- Frontend only; backend, billing operations, secret keys and privileged AI tools stay external.
- One agent entry point and narrow module contracts. No duplicated vendor-specific policy.
- TanStack Router/Query/Table, RHF/Zod and Zustand each have a distinct state responsibility.
- Subscription status is informative; backend entitlements decide feature access.
- Keep runtime AI optional and human-reviewed; never execute streamed text as actions.
- Preserve readable source and risk-based checks to reduce agent context and validation cost.

The check runs inside `npm run check` and the CI verify job. Configure that job as
a required branch check in the new application repository. This local template
does not change upstream branch protection. Checks detect structural violations;
review still determines whether business logic belongs in the selected domain.
Never weaken the guardrails to complete a normal feature.
