# Loading, errors and recovery

## Use the shared patterns

| Situation | Pattern |
| --- | --- |
| Route chunk or initial data loading | `PageSkeleton`, `DetailSkeleton` or a shape-matched skeleton with a status label; route loaders prefetch to avoid it |
| Background data refresh | Keep current data (`keepPreviousData`), dim it, set `aria-busy`; `DataTable` shows a thin progress bar |
| Empty collection/search | `Empty` with an `Illustration` (`empty` or `no-results`) and a create/clear action |
| Failed API request | `Failure` inline in panels and forms; `layout="page"` (illustrated by error kind) when it replaces page content |
| Mutation in progress | Disable duplicate actions, retain draft, show saving status |
| Invalid fields | RHF field errors, error summary and focus on first invalid field |
| Conflict | Retain draft/base version; explicit reload before discarding |
| Successful write | Toast (sonner, live region) and invalidate affected queries; bulk results report partial failures |
| Unauthorized/unavailable capability | `AccessBoundary`: page skeleton while loading, illustrated denial with the reason |
| Unexpected React render failure | Router error component; root `AppErrorBoundary` for uncaught render errors |

`shared/api/error-feedback.ts` maps stable error categories to translation keys.
It handles HTTP 401/403/404/409/422/429, network, timeout, cancellation and invalid
response contracts. Raw server/provider messages are not rendered. A retry button
is offered only when appropriate; it does not automatically repeat a write.
A 401 from any request ends the session scope: bootstrap reloads the session and
shows sign-in with a "session ended" notice and the current URL as the return path.
Identity screens map stable codes (`invalid_credentials`, `rate_limited`,
`invalid_code`, `expired_token`) to text; they never show backend wording.

Unexpected failures go through `shared/observability/report.ts`: render crashes,
route errors, uncaught errors, unhandled rejections and query/mutation failures.
Expected answers (cancellation, offline, 401/403/404/409/422/429) are skipped.
Development logs to the console; production sends nothing until `main.tsx` calls
`configureErrorReporting(sink)` with a redacting adapter for your error service.
After a release, a stale tab whose lazy chunk is gone reloads once
(`stale-deploy.ts`, guarded against loops). `AppErrorBoundary`
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
401/403 removes the session scope (401 then shows sign-in). These boundaries intentionally prevent
retaining a previous user's editable UI.

## New feature checklist

Exercise initial loading, background refresh, empty result, success, failed read,
failed write, invalid response, forbidden action, version conflict and offline
behavior where relevant. Add the smallest useful regression test and one targeted
browser flow for meaningful navigation changes. Never suppress a failure just to
keep a screen looking successful. Backend enforcement remains authoritative.
