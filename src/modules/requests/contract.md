# Requests public contract

Reference outcome: find a request, create/edit a draft, submit it, then approve it.
Routes: `/requests` (parent owns search), `/requests/new`, `/requests/:id`,
`/requests/:id/edit`. Search: q, status[], category[], owner[], from/to (created),
sort, dir, page, size; parsed by `requestSearch`, defaults stripped from URLs and
retained on return. Route loaders prefetch list/detail queries.

`public.ts` exposes the route tree, the module definition (navigation, permissions
with `requests:` label keys), `categoryIcons`, API schemas/types and `EXPORT_LIMIT`.
Strings live in the `requests` namespace (`i18n.ts`). Schemas own amounts, status,
category, version, reference and search; queries own workspace-scoped cache keys,
export and bulk calls. Forms own drafts; no global feature store.

The list is the reference for data screens: status tabs with counts, debounced
search, one Filters panel with server facet counts, a single-line chip strip,
column visibility, sortable headers, user-controlled start/end pinning with measured
offsets, Reset columns, page sizes, selection
across pages with "select all matching" bulk submit/approve (partial failures are
reported), and formatted XLSX/CSV export of every matching record. Users see the
business `reference` (REQ-1042), never the internal `id`.

Column visibility/pinning are browser-local UI preferences; selection and action
columns stay pinned. This is not a backend-synchronized saved-view feature.
Owner facets contain top values plus selected owners and `ownerTotal`; debounced
`GET /requests/owners` search respects the other filters. Selection resets when
its filter scope changes and is disabled on placeholder rows during refetch.
The select cell toggles selection without navigating to the record. Bulk submit
and approve use `ConfirmAction` with the scope, count and known references;
single-record approval also asks for confirmation. Bulk failures currently produce
summary feedback, not a per-record recovery screen. Filter/page changes preserve scroll.

Requirements: `requests` flag and entitlement; `requests.create` quota for new
records; action permissions from `permissions.ts`. Edit/submit/approve require a
record and legal workflow status. The backend enforces all rules. Endpoints are in
`docs/backend-contract.md`.

AI suggestions additionally require local opt-in, remote opt-in, `aiSuggestions`
flag/entitlement and `requests.suggest`. Generation does not save or approve.

Acceptance: list/detail/filter return; facets, chips, sort, page size and bulk
flows; export downloads; valid create/edit; invalid amount feedback; 403, version
conflict and draft retention with the leave dialog; viewer/editor/manager
differences; workspace isolation; subscription/quota/flag denials; Arabic digits
and RTL; AI review/cancel/apply; no page-level horizontal overflow on mobile.
