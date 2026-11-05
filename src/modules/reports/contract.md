# Reports contract

Route `/reports` with search `preset` (7d, 30d, 90d, mtd, qtd, ytd, 12m or custom
with `from`/`to`), `compare`, `category[]`, `owner[]`, `metric` and `breakdown`.
`public.ts` exports the route tree, module definition, permissions and
`requestReportSchema`. Eager labels are in `i18n.ts`; page strings in `messages.ts`.

Endpoint `GET /reports/requests` (see `docs/backend-contract.md`) returns server-side
aggregates only. The route loader prefetches the resolved window; switching metric
or breakdown never refetches. In-page search changes use `resetScroll: false`.

Layout: filter bar (date range with presets, compare toggle, Filters panel, chips),
KPI cards with sparklines and period deltas, trend chart (count or amount, previous
period overlay), status mix, spend by category, top requesters and a sortable
breakdown table with totals. Bars, requesters and breakdown rows drill down to the
request list with the same window and filters. Export writes a workbook (summary,
trend, by category, by owner) or the visible breakdown as CSV.

Requires `reports.read` plus the `requests` flag and entitlement. Acceptance: every
widget follows the filters; empty windows show the empty state; skeletons match the
layout; charts and exports work in Arabic/RTL and dark mode; Recharts stays lazy.
