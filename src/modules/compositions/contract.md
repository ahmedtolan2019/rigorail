# Compositions contract

Route `/compositions?view=<view>`; the default view is `dashboard`. `views.ts` lists
the views in navigation groups and is the source for the route's search schema.
`public.ts` exports the route tree and module definition. Strings live in the
`compositions` namespace (page strings in `messages.ts`, loaded with the views).

| Group            | Views                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Everyday screens | dashboard (KPIs, waiting work, weekly trend, activity), master-detail, kanban (drag and drop plus a keyboard "Move to" menu, WIP limit), inbox (day groups, unread, bulk mark read/archive with Undo), calendar (month grid, locale week start, day agenda), activity, onboarding (setup checklist with progress and optional steps), global-search (grouped results, highlights, keyboard), custom-dashboard (arrangeable widgets remembered on this device)                                                                      |
| Workflows        | approval-chain (amount-driven route with rule explanations, SLA, remind, reassign), reconciliation (one-to-many matching against a live difference, exact-match suggestions with Undo), import-mapping (column mapping, required fields, error preview, import confirmation), bulk-edit (mixed values, impact counted per record, confirmation with Undo), three-way-match (order, receipt and invoice with tolerance checks and per-line resolution), rules-editor (conditions to approver steps with validation and a live test) |
| Data tables      | line-items (keyboard editing, totals, undo/redo), inline-table (cell editing, changed-cell review, discard confirmation, batch save), expandable-table (rows open into line sub-tables), gallery (cards or DataTable over one sorted, filtered row model), pivot (budget against actual, variance heat, drill-down), permission-matrix (sticky role/permission axes, sensitive-grant review), audit-log (filters, before/after diffs, CSV export)                                                                                  |
| Forms            | wizard (step validation and review), conditional-form (dependent fields validated only when shown, repeatable contacts), inline-edit (click-to-edit fields, Enter/Escape, Undo toast), settings (section nav, dirty save bar), quote-builder (configurable price with a discount approval threshold), notifications-center (delivery matrix, quiet hours, volume preview)                                                                                                                                                          |
| Detail pages     | record-tabs (purchase order header, approval confirmation, tabs with counts), profile (contact, delegation banner, owned records), document (printable invoice with payment confirmation), org-chart (searchable reporting tree), asset-detail (lifecycle, depreciation, utilisation, maintenance), customer-360 (health, aging, credit, interactions), comments-thread (@mentions, edit/delete own, resolved threads)                                                                                                             |
| Distinctive      | triage (J/K/A/R queue with Undo), timeline (Gantt bars positioned with inline-start offsets), compare (version diff with restore confirmation), planner (sliders driving a forecast chart), bin-map (warehouse floor plan with three colour modes and SKU search), roster (shift grid with coverage gaps), report-builder (live chart and table, saved reports)                                                                                                                                                                    |

Each of the 42 views loads individually through an explicit literal import in
`page.tsx`. All use sample data only; no API calls. Desktop navigation and the
compact-screen picker are searchable. See [the current inventory](../../../docs/pattern-coverage.md)
before copying a pattern. `example-utils.ts` contains only local translation and
sample-download helpers used by the retained screens.

Master-detail now has performance visuals, expandable order progress and confirmed
hold/activate actions. Profile messaging saves a visible local draft without
sending. Record tabs download actual text/CSV fixtures; comparison restore creates
a new local revision. These interactions remain local examples. State resets on
leaving the route; local drafts are not reload-persistent.

Slider labels are forwarded to focusable thumbs by shared UI. Labels, state
feedback, non-drag alternatives, dirty-work confirmation and scoped retry are
part of the examples, with primary workflow browser tests.

Views show business references (`REQ-1212`, `PO-2041`), never internal IDs. Every view works in
Arabic/RTL, dark mode and at 375px width.

Record pages share `sections/record.tsx` (sticky `RecordHeader`, `Stepper`,
`Metric`, `Sparkline`, `BudgetBar`, `FilePreview`, `RelatedRecord`). They take
translated labels and plain values and hold no business rules.

## Authoring and combining

See [composition authoring](../../../docs/composition-authoring.md). Gallery
examples may share module-local sections and compose them into new examples.
Separate page/route concerns and fixtures before embedding a section. A parent
owns the combined workflow's selection, draft lifecycle and action coordination;
child sections receive explicit inputs and callbacks. Product modules must not
consume gallery exports as a component library. Shared extraction requires neutral
UI with actual consumers and preserves the existing import checks.

`npm run context -- compositions <view>` resolves the implementation from the
explicit lazy map. No separate source registry needs maintenance. Update the
inventory and relevant counts when adding/removing a view, and test interactions
between sections as well as the standalone pattern.
