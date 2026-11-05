# Frontend architecture

This is a React 19 SPA using Vite 8, TypeScript, Tailwind 4 and shadcn source.
The backend is external. `package.json` and the lockfile define exact tooling.

## Ownership and entry points

`main.tsx` initializes locale, then `app/bootstrap.tsx` loads runtime/session and
mounts a workspace-scoped QueryClient and router. When `GET /session` answers 401 it
renders the account module's lazy `SignedOutApp` instead: a small screen switcher for
sign-in, second factor and password recovery that mounts without the workspace router.
The shell is a lazy root-route component, so signed-out users do not load navigation
and account-menu UI. Route definitions and permission metadata remain eager.
Sign-in reloads the session in a fresh scope and returns to the requested path. `app/modules.ts` is the single
place that enables modules; `app/shell.tsx` renders the navigation they contribute.

| Layer | Owns | Allowed internal dependencies |
| --- | --- | --- |
| `src/app/` | Module composition, shell, identity, explicit demo transport | Shared code and module `public.ts` files |
| `src/modules/<domain>/` | Routes, UI, strings, schemas, queries, permission vocabulary, tests | Own files, shared code, another module's `public.ts` |
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

## Module composition

A module owns everything it contributes and exposes it through `public.ts`:

| Contribution | Module file | Composed by |
| --- | --- | --- |
| Route tree, attached to `shared/routing/root.ts` | `routes.ts` | `moduleRoutes` in `app/modules.ts` |
| Navigation entry, permissions (`ModuleDefinition`) | `public.ts` | `modules` in `app/modules.ts` |
| Eager strings (navigation, permission labels) | `i18n.ts` | Self-registers via `public.ts` |
| Page strings, when large | `messages.ts` | Imported by the module's lazy pages |

Pages read typed params and search through `getRouteApi('<route id>')`, never
`strict: false` lookups. Search state shared by a workflow lives on a parent route;
validators take `Partial<Search> & SearchSchemaInput` so links set only what they
need, and `stripSearchParams(defaults)` keeps URLs short. Route `loader`s only call
`queryClient.prefetchQuery` (from the router context) with the page's query options,
so hover preloading warms the cache while pages keep owning errors and access.
`composePermissionCatalog` rejects duplicate modules and actions, and actions or
labels outside the module's `<id>.` / `<id>:` prefix. `app/modules.test.ts` fails
when a module is half registered. Removing a module means deleting its folder and
its lines in `app/modules.ts` (plus any demo transport fixtures).

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
drafts for recovery. HTTP 403 clears it; HTTP 401 from any query or mutation
reloads the session and shows sign-in ("session ended"), keeping the URL to return to.
Sign-in and sign-out are broadcast to the app's other tabs (`BroadcastChannel`). A new QueryClient is mounted when user/workspace/session revision changes; the
old client cancels and clears its requests. Never persist business data or copy
query results into Zustand. Query keys include workspace and filters. Remote
configuration and capability hooks use selectors; subscribe only to needed values.
Global context holds stable services/session, not each changing rule or flag.

## React and UI

Use function components and strict types. Avoid whole-store subscriptions in
large feature trees, effects for derived values and eager imports of all modules.
Shared UI contains shadcn registry code built on Radix (`radix-ui`) only, with
local RTL/locale/theme adaptations, plus application primitives: `page.tsx` (page
header, skeletons), `combobox.tsx`, `date-range-picker.tsx` and `illustration.tsx`.
Import individual files, never a catalog barrel. Fast Refresh export checking is
disabled only for `shared/ui` and `shared/data-table` because they export helpers.
Use Select for short fixed lists and Combobox when users need to search; never native
selects in product screens. `/design-system` documents tokens, variants and patterns
and `/compositions` shows complete screens. Start with those references; adapt,
combine or create patterns when the feature needs different behavior.
Compositions contains the 20 original local screens, each loaded individually
through explicit literal imports. `views.ts` owns the route enum/navigation and
`page.tsx` the lazy map. `example-utils.ts` provides module-local translation and
sample-download helpers; it is not a cross-domain API. See
[pattern coverage](pattern-coverage.md) for the current source map and checklist.
[Composition authoring](composition-authoring.md) defines how to combine sections,
choose state owners and decide when to extract shared UI. Gallery sections may
compose locally within Compositions. Product modules adapt them into their own
domain or consume extracted neutral shared UI, never gallery pages/fixtures.
Nested compositions must not mount duplicate app/session/query providers or own
competing route/form state. Existing import boundaries remain unchanged.
The shared Slider forwards accessible names/descriptions to its focusable thumbs;
use `thumbLabels` when a range needs distinct names.

Lists use `shared/data-table`: `DataTable` (sticky header, pinned columns, sorting,
grouping, tree rows, skeleton and refetch states, clickable rows, opt-in
virtualization and resizing), `DataTableFilters` plus `ActiveFilters` (one filter
button and a single-line chip strip; toolbars never wrap), `DataTableSearch`
(debounced), `DataTablePagination`, `DataTableViewOptions` and `useServerSelection`
(selection across server pages, including "all N matching" sent as a filter).
Exports use `shared/export` (formatted XLSX and RFC 4180 CSV, loaded on demand);
large or slow exports belong in a backend job.

User-facing records show business references (`REQ-1042`), names or titles, never
internal IDs. Tab titles come from `PageHeader` (or `useDocumentTitle` for custom
headers); they write `document.title` in an effect without re-rendering.

Performance rules: keep column definitions independent of URL state (read it in
cells), mount progress animations only while active, wrap absolutely positioned
content inside horizontal scrollers with `relative`, keep heavy libraries (charts,
grids, export, palette) in lazy chunks, and respect the bundle budget in `check`.

Style with Tailwind utilities and `cn()` only. `src/index.css` is the single
stylesheet: semantic tokens, brand/density presets and element base styles. Do
not add global class names or per-module CSS files; repeated patterns become a
shared component. Use logical utilities (`ms-`, `pe-`, `border-s`, `start-`) and
Tailwind's default breakpoints.

All reference pages use translation keys. Each module calls
`defineTranslations(id, en, ar)` in its `i18n.ts`; the compiler rejects Arabic
dictionaries with missing or extra keys. Pages call `useTranslation(ns)` and fall
back to the `common` namespace (`shared/i18n/common.ts`) for shared vocabulary.
Read another module's key with its prefix, for example `requests:navigation`.
i18next controls document `lang`/`dir` and the Radix direction context. Use logical spacing, `bdi` for
mixed-direction values and `dir="auto"` for user text. The sample money contract
uses two decimal minor units; agree a different currency precision with the API
before supporting zero/three-decimal currencies. Never parse localized display
strings as business values. Eager `i18n.ts` strings load with the public API; page
strings in `messages.ts` load with the lazy pages (`defineTranslations` deep-merges).
Fonts are self-hosted variable Inter (Latin) and Noto Sans Arabic in one stack.

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
hidden/inert draft state, but actual denial and session switches clear it. Inline
`Failure` alerts sit inside forms and panels; `layout="page"` replaces page content
with an illustration chosen by the error kind (offline, not found, denied, error).
Illustrations are neutral 400px transparent WebP files loaded only when rendered.
The typed shared registry owns all 24 names; the lazy Design system gallery provides
localized usage and copyable examples. Keep meaning in accessible HTML and ambient
artwork outside controls. See [illustrations.md](illustrations.md) for reuse and
extension rules. Success feedback uses toasts; skeletons mirror the final layout;
motion respects reduced motion.

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
- Modules own routes, navigation, strings and permissions; the app only lists enabled modules.
- One styling system (Tailwind + tokens in `index.css`) and one primitive library (Radix).
- One list toolkit (`shared/data-table`) and one export path (`shared/export`).

The check runs inside `npm run check` and the CI verify job, which also runs the
Chromium browser suite on every pull request. Configure that job as
a required branch check in the new application repository. This local template
does not change upstream branch protection. Checks detect structural violations;
review still determines whether business logic belongs in the selected domain.
Never weaken the guardrails to complete a normal feature.
