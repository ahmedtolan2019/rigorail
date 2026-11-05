# Loading, errors and recovery

## Use the shared patterns

| Situation | Pattern |
| --- | --- |
| Route chunk or initial data loading | `LoadingState` or a shape-matched skeleton with a status label |
| Background data refresh | Keep current data, use `aria-busy`, show `LoadingState updating` |
| Empty collection/search | shadcn `Empty` with a useful create/reset action |
| Failed API request | `Failure` with the appropriate retry callback |
| Mutation in progress | Disable duplicate actions, retain draft, show saving status |
| Invalid fields | RHF field errors, error summary and focus on first invalid field |
| Conflict | Retain draft/base version; explicit reload before discarding |
| Successful write | Live status message and invalidate affected queries |
| Unauthorized/unavailable capability | `AccessBoundary` and an explanatory message |
| Unexpected React render failure | Router error component; root `AppErrorBoundary` for uncaught render errors |

`shared/api/error-feedback.ts` maps stable error categories to translation keys.
It handles HTTP 401/403/404/409/422/429, network, timeout, cancellation and invalid
response contracts. Raw server/provider messages are not rendered. A retry button
is offered only when appropriate; it does not automatically repeat a write.
A session-expired message is ready for the real identity integration to supply its
sign-in action. The template deliberately does not fabricate a login endpoint.

`AppErrorBoundary` accepts an optional `onError` callback for an application's
redacted telemetry adapter. No telemetry leaves this template by default. It
catches render/lifecycle failures; rejected async operations still need query,
mutation or explicit event-handler error handling. A crash retry may reset local
drafts, which the fallback explains. It never silently reloads the page.

## Draft lifecycle

Background record refresh errors/status changes retain the form and its original
version. A record that is no longer editable disables saving without erasing the
draft. Navigation is blocked while a save is pending. A failed save keeps values;
a successful save refreshes record/config/capability queries.

A temporary capability-service failure hides and disables already-mounted
protected content while preserving local state for recovery. An actual denial
unmounts it. Changing user/workspace/session revision clears the old session scope.
A transient session request failure also preserves hidden/inert drafts; HTTP
401/403 removes the session scope. These boundaries intentionally prevent
retaining a previous user's editable UI.

## New feature checklist

Exercise initial loading, background refresh, empty result, success, failed read,
failed write, invalid response, forbidden action, version conflict and offline
behavior where relevant. Add the smallest useful regression test and one targeted
browser flow for meaningful navigation changes. Never suppress a failure just to
keep a screen looking successful. Backend enforcement remains authoritative.
