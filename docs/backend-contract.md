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
  protection, rate limits and correlation IDs with the backend. Extend the transport
  for agreed CSRF headers. No localStorage bearer-token convention is invented here.
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
Explicit 401/403 failures remove the old workspace state. Add the real identity provider's sign-in/sign-out
UX when its endpoints and redirect contract are agreed.

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

Schemas and search defaults are in `src/modules/requests/schema.ts`.

| Endpoint | Purpose |
| --- | --- |
| `GET /requests?q=&status=all&page=1&sort=updated` | `{items, total}`, one-based pages, sample page size 6 |
| `GET /requests/:id` | One validated record |
| `POST /requests` | `{title, description, amount}` -> new draft, HTTP 201 |
| `PATCH /requests/:id` | Same input plus `version` -> updated draft |
| `POST /requests/:id/submit` | `{version}` -> pending |
| `POST /requests/:id/approve` | `{version}` -> approved |

Amounts arrive as decimal strings and return as two-decimal integer minor units.
Responses include ID, workspace, owner ID/name, status, version and ISO updatedAt.
The backend validates resource scope, permissions, module access, quota, latest
amount limit and legal workflow transitions. HTTP 403 refreshes session access;
409 indicates a conflict, 422 can supply `fields.amount`. Do not expose sensitive
backend error text directly. Expand error-code-to-translation mapping when adding
new domain errors. Versions prevent lost updates; the edit form retains its base
version while the user holds a draft.

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
