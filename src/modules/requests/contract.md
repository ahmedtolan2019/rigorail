# Requests public contract

Reference outcome: find a request, create/edit a draft, submit it, then approve it.
Routes: `/requests`, `/requests/new`, `/requests/:id`, `/requests/:id/edit`.
Query state: q/status/page/sort, parsed by `requestSearch` and retained on return.

`public.ts` exposes lazy page loaders, permission definitions with domain-owned `labelKey` translations and API schema/types.
The app demo consumes these contracts. No other module imports pages or queries.
Schemas own amounts/status/version/search. Queries own workspace-specific cache keys.
Forms own drafts; data never lives in a global feature store.

Requirements: `requests` flag and entitlement; `requests.create` quota for new
records; action permissions from `permissions.ts`. Edit/submit/approve require a
record and legal workflow status. The backend enforces all rules. The sample
money model uses two-decimal minor units. API endpoints are documented centrally
in `docs/backend-contract.md` so examples and transport do not drift independently.

AI suggestions additionally require local opt-in, remote opt-in, `aiSuggestions`
flag/entitlement and `requests.suggest`. Generation does not save or approve.

Acceptance: list/detail/filter return; valid create/edit; invalid amount feedback;
403, version conflict and draft retention; viewer/editor/manager differences;
workspace isolation; subscription/quota/flag denials; Arabic digits and RTL;
AI review/cancel/apply; no page-level horizontal overflow on mobile.
