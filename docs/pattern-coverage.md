# Composition coverage and agent implementation guide

The template contains **42 local compositions**: the 20 original screens plus 22
curated additions the user explicitly requested later (setup checklist, workflows,
three-way match, approval rules, global search, arrangeable dashboard, pivot,
permission matrix, audit log, quote builder, notification preferences, invoice,
org chart, asset and customer records, comment threads, warehouse map, roster
and report builder), each reviewed visually at
phone, 1000px, 1280px, Arabic and dark. An
earlier 60-pattern expansion was removed at the user's request; do not restore it.
Open `/compositions`; desktop navigation and
the compact-screen picker are searchable. Each entry has its own URL. This is a
selected screen reference, not exhaustive enterprise coverage.

For reuse, adaptation, combinations and new patterns, read the
[composition authoring guide](composition-authoring.md). The library can grow;
keep additions within the assigned feature and the existing ownership boundaries.

## How an agent should use these examples

1. Read the destination domain contract and `npm run context -- <domain>`.
2. Find the nearest screen in the inventory below. Open that route and read only
   its view source, plus any shared UI it uses.
   `npm run context -- compositions <view>` locates that source from the lazy map.
3. Reuse, adapt or combine the relevant sections in the owning domain. Create a
   focused new pattern if the existing references do not fit. **Never import sample
   business data or components across domains from Compositions.** Reuse shared
   UI and data-table/export kits. Keep rules and API/query state domain-owned.
4. Agree the backend behavior before replacing fixtures. Local state, timers,
   message drafts and approval history are not service implementations.
   Frontend grants never enforce backend authorization.
5. Define acceptance for empty/loading/failure/retry, dirty work, partial success,
   denied access, Arabic/RTL, narrow screens and keyboard operation as relevant.
   Verify actual state changes and outputs, not just a toast or enabled button.
6. Update the destination contract and `ai/plan.md`. Add useful regressions and run
   the checks required by `AGENTS.md`. Do not copy all examples into a new feature.

## Find a pattern by need

| The screen must... | Start from |
| --- | --- |
| Show one record and act on it | `record-tabs` (transaction), `customer-360` (account), `asset-detail` (physical item), `profile` (person), `document` (printable output), `comments-thread` (discussion) |
| Find anything | `global-search` |
| Work through a queue of decisions | `triage`, `inbox`, `kanban`, `approval-chain` |
| Compare, reconcile or trace changes | `reconciliation`, `three-way-match`, `compare`, `audit-log` |
| Edit many values or records | `inline-table`, `line-items`, `bulk-edit`, `permission-matrix` |
| Browse and drill into a collection | `master-detail`, `expandable-table`, `gallery`, `org-chart` |
| Analyse or forecast | `dashboard`, `custom-dashboard`, `pivot`, `report-builder`, `planner` |
| Plan time, people or space | `calendar`, `timeline`, `roster`, `bin-map` |
| Collect structured input | `wizard`, `conditional-form`, `inline-edit`, `settings`, `notifications-center`, `quote-builder`, `import-mapping`, `onboarding` |
| Let admins configure behaviour | `rules-editor`, `permission-matrix`, `notifications-center` |

Record pages share local building blocks in
`src/modules/compositions/sections/record.tsx`: `RecordHeader` (sticky, compacts on
scroll), `Stepper`, `Metric`, `Sparkline`, `BudgetBar`, `FilePreview` and
`RelatedRecord`. Copy what a feature needs into its module.

## Existing screen patterns

Source: `src/modules/compositions/views/<slug>.tsx`.

| Route view | Composition and behavior |
| --- | --- |
| `dashboard` | KPI cards, work queue, trend and activity |
| `master-detail` | Searchable supplier identities; performance visuals, order progress/details, mobile back navigation, hold/activate confirmation |
| `kanban` | Drag-and-drop plus an accessible Move to menu, work-in-progress limit |
| `inbox` | Grouped messages, unread state, bulk read/archive and undo |
| `calendar` | Month grid, locale week start, selected-day agenda |
| `activity` | Chronological business activity |
| `onboarding` | First-run checklist with progress ring, time estimates, optional steps and skip |
| `global-search` | Grouped records, people and documents; type filters with counts; highlighted matches; arrow/Enter/Escape keyboard model; recent searches and no-results recovery |
| `custom-dashboard` | Widgets added, removed, reordered (drag or buttons with live announcements) and resized; layout remembered on this device; reset with Undo |
| `approval-chain` | Amount-driven approval route, "why this route" rules, SLA, remind and reassign |
| `reconciliation` | Two-sided matching (one-to-many), live difference, exact-match suggestions with undo |
| `import-mapping` | File column mapping with auto-match, required-field checklist, error preview and import confirmation |
| `bulk-edit` | Edit several records with mixed values; summary counts only records that really change |
| `three-way-match` | Order, receipt and invoice chain; tolerance checks per line, amount at risk, per-line resolution before release or return |
| `rules-editor` | Ordered approval rules with conditions and approver steps, live per-condition results against a test request, validation including shadowed rules, publish confirmation |
| `line-items` | Editable rows, totals, keyboard navigation, undo/redo |
| `inline-table` | Cell edits, change review, discard confirmation and batch save |
| `expandable-table` | Row expansion into line-item details |
| `gallery` | Cards and table over the same filtered/sorted collection |
| `pivot` | Budget against actual by quarter, diverging variance heat, totals and cell drill-down |
| `permission-matrix` | Roles by permissions with sticky axes, group/column toggles, sensitive grants and review before save |
| `audit-log` | Actor, action, object and period filters; expandable before/after field diffs; sensitive actions flagged; CSV export of the filtered events |
| `wizard` | Validated steps and review before submit |
| `conditional-form` | Conditional validation and repeatable contacts |
| `inline-edit` | Click-to-edit, Enter/Escape and undo |
| `settings` | Section navigation and dirty save bar |
| `quote-builder` | Plan, seats, term and extras with a live price breakdown and a discount approval threshold |
| `notifications-center` | Event by channel delivery matrix with column toggles and a locked rule, quiet hours, digest time, weekly volume preview, dirty save |
| `record-tabs` | Purchase order with sticky header, lifecycle stepper, metric strip (budget bar, supplier on-time sparkline), budget impact, related records, file previews with real downloads, comments and history |
| `profile` | Person with sticky header, workload metrics and sparklines, working-hours band, reporting line, owned-request progress, capacity chart and a saved local message draft |
| `document` | Printable invoice with record payment confirmation, reminder and history |
| `asset-detail` | Physical asset: lifecycle stepper, depreciation chart with today marker, utilisation heat row, maintenance timeline, transfer and disposal confirmation |
| `customer-360` | Account: health score ring with drivers, revenue sparkline, receivables aging bar, credit use, risk banner, open items, contacts, logged interactions and credit hold |
| `comments-thread` | Threads on a record with an @mention picker, notified-people preview, replies, edit/delete own with Undo, resolve and reopen |
| `org-chart` | Searchable reporting tree with guides, open positions, reporting-line breadcrumb |
| `triage` | J/K/A/R queue actions and undo |
| `timeline` | Gantt with logical positioning for RTL |
| `compare` | Field/line differences; restoring creates a new local revision |
| `planner` | Slider-driven forecast |
| `bin-map` | Warehouse floor plan coloured by fill, idle stock or picks, SKU search and bin detail |
| `roster` | Weekly shift grid with per-cell menus, coverage rows, gap alert and overtime |
| `report-builder` | Group by, measure, chart type and columns with a live chart and table, chart-choice advice, named reports saved on this device |

## Production contract questions

Use these questions to adapt the examples, not as permission to invent a backend.

| Area | Contract and design questions |
| --- | --- |
| Collection queries | Stable sorting, pagination/cursor, filters, count accuracy, saved-view ownership, permissions, selection scope across pages |
| Writes and bulk work | Version preconditions, idempotency keys, per-record outcomes, cancellation semantics, retry only unresolved items, undo windows |
| Forms and drafts | Runtime schemas, field-level errors, server validation, invalidated dependent values, privacy and expiry of persisted drafts, route/unload handling |
| Files and jobs | Type/size checks on server, malware scanning, signed URL expiry, progress states, resumability, retention, cancellation and authenticated downloads |
| Scheduling | Time zones, daylight-saving changes, interval overlap, resource locking, recurrence end/exception rules, late changes |
| Money and reports | Currency/minor units, rounding, date boundaries, server aggregates, zero denominators, negative values, export authorization and spreadsheet injection |
| Access and tenancy | Authoritative grants, entitlements, tenant-scoped cache/query keys, session revocation, switch reset, invitations and last-admin constraints |
| Collaboration | Event identity/order, cursor replay, deduplication, unread watermark, reconnect backoff, edits/deletes, mention privacy |
| Recovery | Request cancellation, stale response protection, recoverable errors, revision conflicts, deliberate offline queue opt-in and secure retention |
| AI-assisted changes | External provider contract, untrusted output, schema validation, provenance, redaction, explicit human apply, cancellation and failures |
| Billing | Authoritative entitlements, usage freshness, plan eligibility, proration preview, hosted management URLs; never browser-side charges |
| Observability | Redacted error capture, correlation references, release identity, accessible failure recovery and performance measurement |

The current examples use small bounded data and local state. They do not establish server-scale
pagination, durable jobs, secure offline storage, a general recurrence engine,
authoritative audit logs or production authentication/billing/AI integrations.
The existing Requests, Reports and Account module contracts define their own
implemented API/demo boundaries; a composition does not silently extend them.

## State and interaction checklist

| Dimension | Cases to decide and verify |
| --- | --- |
| Data | Initial loading, no records, no matches, stale data, refresh, pagination end, malformed response |
| Actions | Disabled reason, in flight, duplicate click, success, field/general error, partial failure, cancellation, retry, undo where feasible |
| Concurrency | Changed revision, stale response, double submission, tenant switch, sign-out, tab close, unmount |
| Permissions | Hidden navigation vs direct-route denial, action grants, field restrictions, revoked session, server rejection |
| Accessibility | Labels, focus order/return, summary-to-field focus, keyboard/pointer alternatives to drag, error association, live feedback, non-color status |
| Internationalization | English/Arabic, RTL logical styles, localized formatting, long names, business references in bidi isolation |
| Layout | 375px phone, intermediate width, desktop, overflowing tables, long values, empty cards and dense rows |
| Output | Actual downloaded bytes/type/filename, print content, selected columns, no secrets or internal IDs |
| Maintenance | Owning contract, public imports, lazy boundaries, fixtures replaced deliberately, useful test and current handoff |

## Regression source map

- `tests/e2e/composition-patterns.spec.ts`: retained master-detail, attachment
  downloads, version restore, profile drafts, navigation and removed-route fallback.
- `tests/e2e/compositions-rtl.spec.ts`: every registered route grouped by its
  navigation section, in Arabic dark mode on desktop and mobile.
- `tests/e2e/composition-screens.spec.ts`: renders every registered route without
  errors or page overflow, and drives line items (undo/redo), conditional form,
  triage, kanban, inline table, reconciliation, import mapping, bulk edit,
  approval route, permission matrix and the record pages.
  `tests/e2e/composition-patterns.spec.ts` also covers the workspace screens: global
  search, comment threads, notification preferences, audit log, report builder,
  arrangeable dashboard and approval rules.
- Composition specs follow the `composition-*.spec.ts` / `compositions-*.spec.ts`
  naming so removing the module removes its browser tests. Other specs
  (`template.spec.ts`, `account.spec.ts`) must not import composition source.
- `src/shared/ui/slider.test.tsx`: accessible names/descriptions on actual slider
  thumbs, including separately named range controls.

Run `npm run test:e2e -- tests/e2e/composition-patterns.spec.ts --grep <slug>` for a
focused workflow while editing. Use the root instructions for the cohesive gate.
A browser pass is not a substitute for visual review or a real backend contract.

## Adding a new pattern

Follow the [authoring guide](composition-authoring.md) for ownership, combining
sections and shared extraction. New gallery additions need explicit user scope
and visual review against the retained original screens. Add a working route,
bilingual labels/hint, real local interaction and relevant failure/recovery
behavior. Keep the screen individually lazy-loaded. Add it to `views.ts`, the explicit
lazy map and this inventory, with meaningful browser coverage. Extend an existing
pattern when the difference is only data or wording. Do not make empty cards or
success toasts stand in for the promised interaction.
