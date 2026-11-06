# Reports module

Read `contract.md` first. Reports render server-side aggregates only; never fetch
raw records to compute totals in the browser. Charts use `shared/ui/chart.tsx`
(Recharts) with `--chart-*` tokens, and every chart has a text summary or table
equivalent for screen readers. Keep this module lazy: Recharts must stay out of
the initial bundle. Focused test: the reports flow in `tests/e2e/template.spec.ts`.
