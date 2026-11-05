# External backend integration contract

This is a sample contract used by the runnable reference, not a claim about an
existing service. Agree or replace it before connecting a real application.
Schemas in source are authoritative for accepted fields.

## Environment and transport

- Development/demo: `.env.development` / `.env.demo` explicitly select demo mode.
- Real API: `VITE_APP_MODE=api`, `VITE_API_BASE_URL=https://your-api.example/api`.
- Optional AI: `VITE_ENABLE_AI=true`, plus the remote flag, entitlement and permission.
- Production build fails if API mode has no valid URL. No secret belongs in `VITE_*`.
- The client joins leading-slash endpoint paths to the base prefix, sends
  `credentials: include`, JSON headers, cancellation and a 15-second default timeout.
  Individual operations can set `timeoutMs`; AI streams default to a 120-second
  total deadline and cancel a stalled reader. API URLs must use HTTP(S) without
  embedded credentials, query parameters or fragments.
- Default responses are parsed as JSON through Zod; an empty success needs an
  explicit `z.undefined()` contract. Errors accept `{message, code?, fields?}`.
- Agree authentication/session expiry, CORS credentials, cookie settings, CSRF
  protection, rate limits and correlation IDs with the backend. `appConfig.api` in
  `src/app/config.ts` turns on a double-submit CSRF header (copied from a readable
  cookie on unsafe methods) and a per-request correlation header; both are off by
  default. No localStorage bearer-token convention is invented here.
- Mutations do not retry. Add idempotency keys only with corresponding server support.

## Session and workspace

`GET /session` returns `shared/auth/model.ts:sessionSchema`:

```json
{
  "user": { "id": "user-1", "name": "User" },
  "workspace": { "id": "workspace-1", "name": "Workspace" },
  "revision": "policy-revision-1",
  "grants": [{ "action": "requests.read", "scope": "workspace" }]
}
```

The backend binds all requests to the authenticated session/workspace and rejects
foreign resources. Grants support `scope: own` and optional `maxAmountMinor` in the
sample adapter. A production workspace switch must change backend session scope
and refresh session; do not trust a browser-selected tenant ID. User/workspace/
revision changes create a new query cache. Transient session refresh failures hide
and disable the workspace with retry feedback while retaining local drafts.
Explicit 401/403 failures remove the old workspace state. `GET /session` answering
401 shows the sign-in screens; any later 401 is treated as an ended session.

## Authentication and account

The sample identity endpoints (sign-in with an optional second factor, password
recovery, sign-out, SSO redirect, profile, password change and signed-in devices)
are listed in `src/modules/account/contract.md`, with schemas in its `schema.ts`.
The backend owns credentials, the HttpOnly session cookie, CSRF protection, MFA,
lockout/rate limits and password policy. Recovery must not reveal whether an
account exists. The browser never stores tokens or passwords. Replace these
endpoints with the agreed identity provider flow; an SSO-only product can hide the
password form and keep the same signed-out shell.

## Capabilities and configuration

`GET /capabilities` uses `shared/capabilities/model.ts:capabilitySchema`:

```json
{
  "revision": "capabilities-1",
  "flags": { "requests": true, "aiSuggestions": false },
  "entitlements": ["requests"],
  "subscription": { "plan": "starter", "status": "active" },
  "quotas": { "requests.create": { "used": 4, "limit": 10 } }
}
```

Flags are resolved for this user/workspace by the backend. Missing flags,
entitlements and quota keys deny a requested capability. A quota limit of `null`
means unlimited, zero means no usage. The server decides how cancellation, trials,
past-due payments and grace periods affect entitlement access; the frontend never
infers those rules from the displayed plan/status. Billing provider APIs and
webhooks stay outside this project.

`GET /configuration` uses `shared/config/business.ts:configurationSchema`:

```json
{
  "revision": "rules-1",
  "limits": { "requestAmountMinor": 500000 },
  "features": { "aiSuggestions": false }
}
```

The AI configuration field is an additional business opt-in. Rollout flags cannot
override it. Queries select individual values, refresh on focus/interval and can
be invalidated after a backend event or successful mutation. The backend validates
latest rules atomically on writes, even when the frontend snapshot is stale.

## Reference Requests API

Schemas, search defaults and query serialization are in `src/modules/requests/schema.ts`.
List parameters repeat for multiple values (`status=draft&status=pending`); defaults are omitted.

| Endpoint | Purpose |
| --- | --- |
| `GET /requests?q=&status=&category=&owner=&from=&to=&sort=updated&dir=desc&page=1&size=10` | `{items, total, facets}`; `size` is 10, 20 or 50; `from`/`to` filter created date (yyyy-mm-dd, inclusive) |
| `GET /requests/owners?<other active filters>&name=` | `{items: [{id, name, count}]}` for debounced owner lookup; ignore the active owner filter when computing counts |
| `GET /requests/export?<same filters>&sort=&dir=` | `{items, total, truncated}` with every matching record up to 5,000; larger exports belong in a backend job |
| `GET /requests/:id` | One validated record |
| `POST /requests` | `{title, category, description, amount}` -> new draft, HTTP 201 |
| `PATCH /requests/:id` | Same input plus `version` -> updated draft |
| `POST /requests/:id/submit` | `{version}` -> pending |
| `POST /requests/:id/approve` | `{version}` -> approved |
| `POST /requests/bulk` | `{action: submit or approve, target}` -> `{succeeded: id[], failed: [{id, code}]}` |

`facets` counts each status, category and owner with every other active filter applied
(a facet ignores its own filter), so filter options stay discoverable. `facets.owner`
is a bounded list of top owners plus selected owners; `facets.ownerTotal` reports
the total available owners. The demo sends the top eight plus selected values.
Owner lookup uses the other active filters and preserves selected labels in the UI.
The current lookup response has no pagination cursor; agree one before adapting
this pattern to a directory that needs paginated search results.

Bulk `target` is
`{mode: 'ids', ids}` (max 500) or `{mode: 'all', filter, excluded}` for "select all N
matching" across pages; the backend applies the filter itself and reports per-record
`forbidden`, `conflict` or `not_found` failures instead of failing the whole command.

Records carry an internal `id` (URLs and API calls only) and a human-readable
`reference` such as `REQ-1042`, which is what the UI shows, searches and exports.
Amounts arrive as decimal strings and return as two-decimal integer minor units.
Responses include id, reference, workspace, category, owner id/name, status, version,
createdAt and updatedAt. The backend validates resource scope, permissions, module
access, quota, latest amount limit and legal workflow transitions. HTTP 403 refreshes
session access; 409 indicates a conflict, 422 can supply `fields.amount`. Do not expose
sensitive backend error text directly. Versions prevent lost updates; the edit form
retains its base version while the user holds a draft.

## Reports API

`GET /reports/requests?from=&to=&compare=true&category=&owner=` returns server-side
aggregates (see `src/modules/reports/schema.ts`): totals and previous-window totals,
a series bucketed by day (up to 31 days), week (up to 120) or month with previous
values aligned by index, status mix, breakdown rows by category and owner, and owner
filter options. The browser never downloads raw records to compute reports. Invalid
windows return 422.

## Optional AI stream

`POST /ai/suggestions` accepts `{title, language}` and returns
`Content-Type: application/x-ndjson`. Each line is one event:

```json
{"type":"delta","text":"Suggested text"}
{"type":"done"}
```

A failure event is `{"type":"error","message":"..."}`. The frontend bounds
frame/output sizes, rejects malformed/truncated streams and supports abort.
`streamSuggestion` accepts a final `{timeoutMs}` option when the agreed backend
needs a different total deadline; it does not use the ordinary 15-second limit. It
renders text safely and requires review/apply; cancellation never applies partial
output. The backend owns provider keys, model selection, data policy, rate limits,
cost limits, permission checks and cancellation propagation to the provider.
Structured AI actions need separate validated schemas and normal authorization;
plain streamed text is never executable code or an approved command.

## Hosting

Serve `dist/` over HTTPS using a static host with SPA fallback to `index.html` for
application routes. Serve missing asset URLs as 404, not HTML. Give hashed assets
long immutable cache lifetimes and keep `index.html` refreshable. Configure CSP,
API `connect-src`, security headers and error reporting for the chosen host.
Subpath hosting needs Vite `base` and router `basepath` together; current routes
assume the origin root. No public deployment has been performed.
