# Screen recipes

How to build the screens enterprise apps need most, the way this template builds
them. Each recipe names the working reference to copy from; read it with
`npm run context -- <module>` before writing. For a screen with no recipe, follow
[compose a screen](#compose-any-screen) and the
[authoring guide](composition-authoring.md).

| Screen | Reference implementation | Gallery variants |
| --- | --- | --- |
| [List](#list-screen) | [Requests list](../src/modules/requests/pages/list.tsx) | `inline-table`, `expandable-table`, `gallery`, `master-detail` |
| [Detail](#detail-screen) | [Request detail](../src/modules/requests/pages/detail.tsx) | `record-tabs`, `customer-360`, `asset-detail`, `profile` |
| [Create and edit form](#create-and-edit-form) | [Request form](../src/modules/requests/pages/form.tsx) | `wizard`, `conditional-form`, `inline-edit`, `line-items` |
| [Dashboard or report](#dashboard-or-report) | [Reports](../src/modules/reports/page.tsx) | `dashboard`, `custom-dashboard`, `report-builder`, `pivot` |
| [Settings](#settings-page) | [Account](../src/modules/account/pages/account.tsx), [Appearance](../src/modules/appearance/page.tsx) | `settings`, `notifications-center` |

## Start a new domain

1. `npm run module:create -- <id>` scaffolds the module, registers it and adds a
   browser smoke test. Every later step happens inside `src/modules/<id>/`.
2. Agree the API with the backend and write it into
   [contracts/openapi.yaml](../contracts/openapi.yaml); run `npm run api:types`.
3. Replace the placeholder in `schema.ts` with Zod schemas for records, list
   responses, inputs and URL search. Assert them against the spec in
   `contract.check.ts` (see [requests](../src/modules/requests/contract.check.ts)).
4. Put **every** API call in `queries.ts`: `queryOptions` for reads with keys that
   start with the module id, plain functions for writes
   (see [requests queries](../src/modules/requests/queries.ts)). Pages never build
   URLs or request bodies.
5. Build the screens below, then update `contract.md` and the module `AGENTS.md`.

## Compose any screen

Work in this order; each step decides the next.

1. **Name the decision.** What does the person finish here (approve, match,
   assign, import)? That action and its consequence must be visible without
   scrolling. Write it down before choosing a layout.
2. **Find the nearest references.** Search [pattern coverage](pattern-coverage.md)
   by need, open the closest one or two with
   `npm run context -- compositions <view>`, and the recipe below if one fits.
3. **Assign state owners** before writing JSX:

   | State | Owner | Example |
   | --- | --- | --- |
   | Anything shareable or restorable: filters, sort, page, tab, selected record | URL search, validated by a Zod schema on the route | `requestSearch` in [schema](../src/modules/requests/schema.ts) |
   | Server data | TanStack Query via `queries.ts` | `listOptions`, `detailOptions` |
   | Unsaved input | React Hook Form in the form component | Request form |
   | Transient UI: open dialog, hover, drag | `useState` in the smallest component | `ConfirmAction` |
   | Per-user UI preferences: columns, layouts | `usePersistentState` (never business data) | Requests column pinning |

4. **Split into sections** with explicit props and callbacks; the parent owns the
   state and passes values down. Sections never fetch the parent's data again.
5. **Wire actions to consequences**: permission check, confirmation or undo,
   mutation, cache invalidation, visible result (see detail recipe).
6. **Cover every state**: loading skeleton, error with retry, empty, no matches,
   permission denied, partial success, and offline/stale data.
7. **Finish**: English and Arabic strings, RTL, dark mode, 375/1000/1280px,
   keyboard path for every pointer action, tab title, and tests (below).

## List screen

Copy from the [Requests list](../src/modules/requests/pages/list.tsx) and
[routes](../src/modules/requests/routes.ts).

1. **URL search schema** in `schema.ts`: every filter, `sort`, `dir`, `page` and
   `size` with `.catch(default)` so bad URLs never crash. Export the parsed
   defaults and use `stripSearchParams(defaults)` on the route to keep URLs short.
2. **Parent route owns search** so the detail and form inherit it and "Back" returns
   to the same filtered page. The list route's `loader` only calls
   `queryClient.prefetchQuery(listOptions(...))`; the page owns errors.
3. **Query** with `placeholderData: keepPreviousData` so paging never blanks the
   table, and `enableRowSelection: !query.isPlaceholderData`.
4. **Columns** in `useMemo` without URL dependencies (cells that need search read it
   themselves, like `TitleCell`), using `DataTableColumnHeader`. Show the business
   reference and title in the first column; never the internal id.
5. **Toolbar in one line**: `SavedViews`, `DataTableSearch` (debounced),
   `DataTableFilters`, then `DataTableViewOptions` and `ExportMenu` at the end.
   Active filters show as chips in `ActiveFilters`. Status tabs, if any, set
   `aria-controls` to the results `role="tabpanel"`.
6. **Table**: `DataTable` with `fitViewport` (sticky header), `loading`,
   `fetching`, `onRowClick` to the detail (keeping `search`), and an `empty` that
   distinguishes "nothing yet" from "no matches" with a clear-filters action.
7. **Selection and bulk actions**: `useServerSelection` supports "select all N
   matching" across pages; bulk actions use `ConfirmAction` with chips of the
   affected references and report partial failures.
8. **Extras when useful**: `useShortcut({ keys: '/', ... })` to focus search and
   `n` to create;
   export through the backend endpoint with the same filters; `refreshOn` topics
   so the list updates live.

## Detail screen

Copy from the [Request detail](../src/modules/requests/pages/detail.tsx).

1. **Route** with a `$id` param and a loader that prefetches `detailOptions`.
   Wrap the page in `AccessBoundary` for read permission.
2. **States**: `DetailSkeleton` while pending; `Failure layout="page"` when the
   record is missing or forbidden; a back link that keeps the list search.
3. **Header**: title (`dir="auto"`), status badge, business reference and dates,
   then the action group on the end (`data-print="hide"`). The next workflow step
   is the primary button; the tab title is set from the record title.
4. **Actions**: decide each with `services.access.decide(action, record)`. Routine
   steps run directly; final or destructive ones use `ConfirmAction` with details.
   On success invalidate the module keys and toast the result; on 403 call
   `refreshSession()`. Show any failure with `Failure` above the content: a 409
   explains that the record changed, and its retry reloads it.
5. **Body**: main content in two thirds (description, attachments with
   `FileUpload`, workflow), context in one third (summary values, owner, dates).
   For richer records follow `record-tabs`: lifecycle stepper, metric strip,
   tabs with counts.
6. **Print**: a Print action plus `print:` grid utilities so the record prints on
   one clean page (see the print browser test).

## Create and edit form

Copy from the [Request form](../src/modules/requests/pages/form.tsx).

1. **One component for create and edit**: load the record when editing, show
   `DetailSkeleton`/`Failure` first, then render the form with
   `key={id ?? 'new'}` so switching records resets it. `AccessBoundary` checks
   create (and quota) or edit on the record.
2. **React Hook Form + Zod** (`zodResolver(input schema)`), default values from the
   record. Amounts are decimal strings in the form and minor units on records;
   normalize Arabic digits with `normalizeNumber`.
3. **Fields**: `Field`, `FieldLabel`, `FieldError`, `FieldDescription`; `Select`
   for short fixed lists and `Combobox` when users search, both through
   `Controller`. Errors are linked with `aria-describedby` and focused on submit.
4. **Concurrency**: keep the record `version` the user started from and send it
   with the update; a 409 keeps the draft and explains the conflict.
5. **Saving**: `saveRequest`-style write from `queries.ts`; map server field errors
   with `form.setError`; invalidate list and detail keys; toast; navigate to the
   detail with `ignoreBlocker: true`.
6. **Leave guard**: `useBlocker` with `withResolver` shows an `AlertDialog` while the
   form is dirty or saving; `enableBeforeUnload` covers closing the tab.
7. **Long forms**: sections in cards with a sticky save bar; multi-step flows use
   `wizard` (validate per step, review before submit).

## Dashboard or report

Copy from [Reports](../src/modules/reports/page.tsx) and its
[widgets](../src/modules/reports/widgets.tsx).

1. **Aggregates come from the backend**; never download raw records to compute.
2. **Date range and comparison in the URL** with presets from
   `@/shared/lib/date-range`; the loader prefetches with resolved dates.
3. **Layout**: KPI strip first (value, delta against the previous period, optional
   sparkline from 1024px up), then a primary trend chart, then breakdowns.
4. **Charts** through `ChartContainer` with translated labels, tooltips and a text
   alternative; decorative sparklines are `aria-hidden` and `inert`.
5. **Drill-down** links open the list with matching filters; **export** produces a
   formatted multi-sheet XLSX.

## Settings page

Copy from [Account](../src/modules/account/pages/account.tsx) or
[Appearance](../src/modules/appearance/page.tsx).

1. Constrain width (`max-w-3xl`) for the header and sections together.
2. Cards of setting rows: label and hint on the start, control on the end;
   segmented `ToggleGroup` for small choice sets, `Switch` for on/off.
3. Save immediately for preferences; use an explicit save bar with discard
   confirmation for business settings (see the `settings` composition).
4. Sensitive changes (password, revoking devices) go through dialogs and
   `ConfirmAction`.

## Test every screen

| Layer | What to cover | Example |
| --- | --- | --- |
| Unit (Vitest) | Schemas, search parsing, pure helpers, permission decisions | [requests form test](../src/modules/requests/pages/form.test.tsx) |
| Browser (Playwright) | The real user flow: filter, open, act, confirm, see the result; failure and recovery | [template spec](../tests/e2e/template.spec.ts) |
| Accessibility (axe) | Add the route to [accessibility spec](../tests/e2e/accessibility.spec.ts) | Product screens are audited in light and dark |

Name module-owned browser specs `<module>*.spec.ts` so `module:remove` finds them.
Run `npm run check:fast` while editing and `npm run check` before finishing.

## Done checklist

- [ ] The decision and its consequence are visible; the primary action is obvious.
- [ ] All API calls live in `queries.ts`; schemas match `contracts/openapi.yaml`.
- [ ] URL holds shareable state; reload and back/forward restore the screen.
- [ ] Loading, empty, no-match, error, denied and partial states exist.
- [ ] Business references and names only; no internal ids on screen.
- [ ] English and Arabic, RTL, dark mode, 375/1000/1280px reviewed in screenshots.
- [ ] Keyboard path for every action; axe audit passes.
- [ ] Browser test for the main flow; `npm run check` passes.
