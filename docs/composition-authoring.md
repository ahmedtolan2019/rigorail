# Reuse, combine and create compositions

For the common product screens (list, detail, form, dashboard, settings) start with
[screen recipes](screen-recipes.md); this guide covers composing and extending
patterns.

Agents may adapt, combine and create patterns needed by the assigned feature.
The [composition inventory](pattern-coverage.md) is a starting set, not a closed
list or a requirement to force every feature into an existing screen. Routine
composition choices within the agreed scope do not need separate approval.
Missing product rules or API semantics still need an explicit contract.
[Architecture](architecture.md) remains the authority for imports and state.

## Find a starting point

Read the owning domain contract with `npm run context -- <domain>`. Find candidate
patterns in `/compositions` or the inventory, then request focused source pointers:

```sh
npm run context -- compositions master-detail
npm run context -- compositions record-tabs
```

The lookup reads the actual lazy map. It prints a route, its source file, shared
reference documents and test pointers without loading unrelated screens. Read
the selected implementation and its direct dependencies as needed. For a
combination, look up each constituent separately.

For empty states, workflow introductions or quiet decoration, check
`/design-system?tab=illustrations` and [the illustration guide](illustrations.md).
Reuse its shared typed component; keep meaningful text and actions in the owning
domain. Add new artwork only when the assigned feature needs a distinct concept.

## Choose the smallest useful change

| Situation | Agent action |
| --- | --- |
| The existing behavior fits | Reuse shared UI; adapt the example to the domain's data and vocabulary. |
| The workflow is the same but one part differs | Extract or replace that part locally. Keep the common behavior recognizable. |
| Several examples solve parts of one task | Compose their relevant sections under one owning workflow and explicit state contract. |
| No example fits | Create a focused pattern with the same styling, accessibility, ownership and verification rules. |
| Multiple real consumers need the same UI behavior | Extract a domain-neutral shared component and migrate those consumers together. |
| The proposed abstraction needs many independent mode flags | Split explicit variants or expose slots/children before adding more switches. |

Do not add a gallery entry for every product-specific field or cosmetic variant.
Add an entry when the authorized work produces a distinct reusable interaction
that future features can copy. Keep this decision proportional to the change.

## Composing compositions

Whole pages are reference implementations. Before embedding one inside another,
separate its useful section from page headers, route hooks, fixtures and lifecycle
assumptions. Compose sections, such as a list, record summary, approval panel or
upload queue. A reusable section accepts typed data and callbacks or children.
It does not mount another app shell, router, QueryClient or session provider.

For each combined workflow, record these decisions in the owning module contract:

| Concern | Required decision |
| --- | --- |
| Ownership | Which domain owns the page, business rules and mutations? Which existing public contracts are consumed? |
| Selection | Which parent owns the selected business record? What happens when filters, pagination or permissions remove it? |
| Forms | Which RHF form owns each edit? Avoid nested forms. Define draft preservation, validation and save/discard boundaries. |
| Navigation | Which route owns filters, open tabs and selected records? Define back/forward and direct-link behavior. Child sections must not overwrite each other's search fields. |
| Server data | Reuse scoped query options and keys. Do not copy query results into component context or a shared store. |
| Actions | Which callback performs each mutation? Define in-flight disabling, affected records, invalidation, partial failure and retry. |
| Access | Apply route, record and action checks consistently. A visible parent does not grant access to every child action. The backend enforces access. |
| Lifecycle | Define behavior on record/workspace/session changes, unmount, stale responses and unsaved navigation. Cancel obsolete work. |
| Accessibility | Keep unique control IDs, heading hierarchy, keyboard behavior, focus return and one clear owner for each overlay. |
| Layout | Share a responsive layout and local scroll strategy. Check combined content at narrow widths, with Arabic/RTL and long values. |

Lift local state only to the nearest common owner. A small parent with props and
callbacks is often enough. Use a scoped context/compound component when several
nested parts genuinely need the same state. Context must not become a second
server cache or bypass the existing session/workspace boundary. Prefer explicit
variants and typed actions over loosely related booleans or a universal screen
configuration engine.

## Where reusable code belongs

| Code | Location and boundary |
| --- | --- |
| Business rules, orchestration and domain-specific sections | The owning `src/modules/<domain>/`; sibling features use its deliberate `public.ts` contract where appropriate. |
| Local demonstration sections used by several gallery entries | Inside `src/modules/compositions/`, with local typed props/callbacks; keep fixtures explicit and isolated. |
| Domain-neutral controls or assembled UI with demonstrated consumers | An appropriate existing `src/shared/` area, such as `ui`, `blocks` or an existing kit. No domain imports, fixtures, endpoint assumptions or business policy. |
| App shell and module wiring | `src/app/`; modules cannot import it. |

A gallery entry may reuse another gallery section inside the Compositions module.
It must not embed a route page whose internal state, headers or global shortcuts
conflict with its parent. Extract a local section first when necessary. Several
instances must have independent state and unique IDs; share state only when the
workflow explicitly calls for it.

Product modules must not import Compositions views, helpers or fixtures. Adapt
source into the owning domain, or extract a proven neutral component into shared
code. Public exports are not a workaround for leaking demo code or domain
internals. Cross-domain integration uses agreed public contracts; app wiring
remains in `src/app/`. Do not weaken boundary checks to assemble a screen.

## Example combinations

These are adaptation recipes, not additional implemented gallery routes.

| Need | Candidate references | What the parent must coordinate |
| --- | --- | --- |
| Supplier review workspace | `master-detail`, `record-tabs`, `activity` | Selected supplier, record-scoped queries/actions, dirty record switch and activity refresh. |
| Purchase entry | `wizard`, `line-items` | One form owner, line totals, step validation and final review. |
| Operations overview | `dashboard`, `calendar`, `timeline` | Shared date scope, selected event and drill-down navigation. |
| Change review | `inline-table`, `compare` | Draft edits, revision selection, discard rules and final confirmation. |
| Supplier onboarding | `import-mapping`, `conditional-form`, `rules-editor`, `approval-chain` | Imported rows feeding a review form, then an amount- or risk-driven approval route. |
| Month-end close | `reconciliation`, `pivot`, `document` | Shared period, unmatched lines blocking close, variance drill-down to source documents. |
| Access review | `permission-matrix`, `org-chart`, `bulk-edit`, `audit-log` | Selected team, pending grant changes and one confirmation for the combined change set. |

These combinations need domain-specific integration. Selecting a new record must
not allow an old response to update the new selection. Test focus return and
draft ownership between sections even when each example passes independently.

## Build it the same way

Every composition follows one anatomy, so a new one should read like its neighbours.

1. **One file per screen** in `views/<slug>.tsx`, default export, lazy-loaded.
   View-specific copy goes in `registerCopy({ key: [english, arabic] })` at the top
   of the file with a short view prefix (`rt`, `tw`, `cx`); navigation labels and
   strings shared by several views go in `messages.ts`.
2. **Typed fixtures at the top**: business references, minor-unit amounts, day or
   hour offsets from now. In a product these become the module's queries; nothing
   else in the view should know they are fixtures.
3. **Derive, don't store**: totals, statuses, counts and "what changes" summaries
   are computed in render from the minimum state (selection, drafts, decisions).
4. **Layout recipe for records**: `RecordHeader` (identity, status, primary
   actions) with a `Stepper` for lifecycle, then a metric strip (`Metric` with a
   `Sparkline`, `BudgetBar` or meter), then main content in two thirds and context
   (related records, people, specs) in one third, then tabs for depth. Queues and
   editors put the decision and its consequence beside the list.
5. **Actions**: the primary action lives in the header; consequential ones use
   `ConfirmAction` with details; reversible ones give an Undo toast. A blocked
   action states why. Every action changes visible state, not only a toast.
6. **Visuals carry data**: sparklines, bars and rings show a real value with an
   accessible label and a comparison (target, limit, last period). Build small
   visuals with CSS/SVG and semantic tokens; use `recharts` through
   `@/shared/ui/chart` for axes and tooltips.
7. **Layout safety**: wrap grids that hold cards or lists in
   `grid-cols-[minmax(0,1fr)]`, move side panels below until `2xl` when the main
   content needs the width, scroll only wide data, and mark user or sample text
   that may be English inside Arabic with `dir="auto"`.
8. **Keyboard and persistence**: every pointer gesture (drag, hover) has a button or
   key path and announces its result in an `aria-live` region. Remember only UI
   preferences (layouts, saved report definitions) with `usePersistentState`;
   business data always comes from the backend.
9. **Product states**: compositions show the loaded state. When adapting one, add
   `DetailSkeleton`/`PageSkeleton` from `@/shared/ui/page` while loading and the
   failure and empty patterns in [error handling](error-handling.md).

Reuse a shared component from `@/shared/ui` or a kit (`data-table`, `export`) first,
then a local section from `sections/`, and create something new only when neither
fits. Check `npm run context -- compositions <view>` for the source of the
closest screen before writing.

## Use the platform, don't rebuild it

New domains start with `npm run module:create -- <id>`, which already wires the
contract, permissions, strings, queries, page and a browser test. Then reach for:

| Need | Use | Not |
| --- | --- | --- |
| Server list with filters, sorting, paging, selection | `DataTable` + `DataTableFilters`/`ActiveFilters`/`DataTablePagination` from `@/shared/data-table` (see Requests) | A hand-built `<table>` with local filter state |
| Named filter and column presets | `SavedViews` with the list's non-default search | A custom "favorites" store |
| File attachments | `FileUpload` + `services.upload` (`@/shared/uploads`) | `fetch` with `FormData` to an API route |
| XLSX/CSV export | `ExportMenu` + `@/shared/export` | Building files by string concatenation |
| Consequential action | `ConfirmAction` with details/chips; Undo toast for reversible ones | `window.confirm`, bare dialogs |
| Keyboard shortcut | `useShortcut` (listed in `?` help) | `window.addEventListener('keydown')` |
| Dates and money | `date`, `dateTime`, `relativeDate`, `money` from `@/shared/lib/format` (workspace time zone) | `toLocaleString`, manual formatting |
| Live refresh | Module `refreshOn` topics and query keys starting with the module id | Polling timers |
| Printable record | `print:` utilities, `data-print="hide"` on controls, a Print action | A separate print page |
| Product analytics | `track('event_name', props)` without personal data | Calling an analytics SDK from a view |
| Contract types | `contracts/openapi.yaml` + `contract.check.ts` conformance | Types copied from backend code |

## Accessibility rules learned from the audits

`tests/e2e/composition-accessibility.spec.ts` audits every registered screen with
axe (WCAG 2.2 AA) in light and dark on desktop and mobile; a new screen must pass.
The failures it caught, and the fix each time:

- **Colored text on tints:** use semantic tokens (`text-success` on `bg-success/12`);
  they are tuned for 4.5:1. Chart colors are fills, not text: put dark text on
  chart tints. Highlights (`<mark>`) use `text-foreground`.
- **Text on data colors:** a label over a filled bar sits on a `bg-background/90`
  chip. Heat cells cap intensity per mode (`[--heat:65%] dark:[--heat:35%]`) so one
  text color passes everywhere. Use `text-background` on solid semantic fills.
- **Names:** every `Progress`, meter and icon-only button has a name. Responsive
  labels use `sr-only sm:not-sr-only`, never `hidden sm:inline`. A `Combobox`
  without a visible label gets `aria-label`.
- **Name matches what is visible:** do not override a button's visible text with a
  different `aria-label`; add `sr-only` context inside it instead.
- **Wide content:** a horizontally scrolling region gets `tabIndex={0}`,
  `role="region"` and an `aria-label` so keyboard users can scroll it.
- **Tabs that filter one panel:** every trigger gets `aria-controls` of the shared
  `role="tabpanel"` element.
- **Decorative charts:** `aria-hidden` plus `inert`, so their SVG is not focusable.

## Quality bar: avoid generic UI

Generic, decorative output is the most common failure when agents build screens.
Every gallery entry and every adapted screen must meet these rules.

| Rule | Do | Do not |
| --- | --- | --- |
| Start from the decision | Name what the person decides or completes (approve, match, assign, import) and put that action and its consequence in view. | Start from a layout ("four KPI cards, a chart, a table") and fill it. |
| Real vocabulary | Business references (`REQ-1212`, `PO-2041`, `INV-3301`), plausible amounts, units, names and the domain's own verbs. | Lorem ipsum, "Item 1", "John Doe", raw IDs, emoji, exclamation marks, "Welcome back" banners. |
| Explain blocked actions | Say why an action is unavailable next to it: "Map every required field", a non-zero difference, a disabled reason. | A silently disabled button. |
| Show real impact | Count what will actually change (`bulk-edit` skips records that already match), list affected items as chips, state irreversibility. | "Are you sure?" with no scope. |
| Proportional safety | Undo toast for reversible, low-risk actions; `ConfirmAction` with details for consequential ones; never both for one action. | Confirm dialogs on everything. |
| Colour means something | Semantic tokens (`success`, `warning`, `destructive`, `info`), heat scales mixed from tokens, primary only for selection and the main action. | Decorative gradients, gradient text, glass effects, random accent colours. |
| Numbers read cleanly | `tabular-nums`, end-aligned columns, `<bdi>` for money and references, compact values only where space is tight with the full value in the label. | Mixed alignment or currency strings broken by RTL. |
| Enterprise density | `text-sm` body, `text-xs` metadata, `px-4`/`px-5` cards, one heading level per section. | Hero sections, oversized headings, illustration cards for small data. |
| Real widths | Check 375px, 1000px and 1280px with the sidebar. Move side panels below until `2xl` when the main content needs the width; use `grid-cols-[minmax(0,1fr)]` to stop overflow; scroll only genuinely wide data with a sticky first column. | Assume a 1440px canvas. |
| Every state | Empty, no match, loading, error, partial success and a keyboard or menu path for every pointer action (drag has a "Move to" menu). | Only the happy path. |
| RTL and locale | Logical properties, `inset-inline-start` for positioned bars, mirrored direction icons, `Intl` dates and numbers. | `left`/`right`, hard-coded month names. |
| Nothing invented | Show only data the backend contract can provide. | Fake "AI insights", sparklines in every card, invented metrics. |
| Copy | Sentence case; verbs with scope on buttons ("Apply to 4 records", "Record payment"); help text states a consequence. | "Submit", "OK", text that repeats the label. |

Review screenshots before calling a screen done: truncated key data, wrapped
headers, orphan borders, unbalanced columns and dead space are defects.

## Add or evolve the gallery

The user removed an earlier 60-pattern expansion because its design did not meet
the standard of the original screens. Do not restore it or add bulk replacements.
Curated additions were later made at the user's explicit request, each reviewed
against the quality bar below; `views.ts` is the current inventory. Future gallery additions need explicit
user scope and the same visual review. Product work may still compose sections
within its scope.

1. State the interaction gap and identify the closest existing references.
2. Keep reusable sections local until shared consumers justify extraction. Separate
   fixtures from reusable presentation and state ownership.
3. Implement a complete local interaction with relevant failure/recovery states.
   Label simulated jobs/sessions/AI explicitly. Never claim a toast performs an
   operation or that local grants provide production security.
4. Register the slug/group in `views.ts`, an explicit literal lazy loader in
   `page.tsx`, and labels and hints in every locale. Keep new work lazy. Keep each screen in its own lazy file.
5. Update `docs/pattern-coverage.md`, the module contract and `ai/plan.md` with the
   implementation, integration questions and actual validation results. Keep any
   stated counts current. The context lookup and RTL route sweep derive from source.
6. Add tests for the new behavior and interactions between sections. Cover selection
   changes, dirty work, stale responses, denied actions and partial failure where
   relevant, plus keyboard/focus and mobile/RTL. Test reused shared behavior once
   at its owner, then test the combined workflow's integration.
7. Run the risk-based checks in root `AGENTS.md`. Inspect the result visually; a
   no-overflow assertion cannot detect every cramped or misleading layout.

A new pattern is ready when its actions produce observable results, its state
owners and service boundary are documented, and the relevant checks pass. A
catalog entry does not authorize unrelated product features or a new backend.
