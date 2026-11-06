# Work plan and handoff

Updated 2026-11-05. Backend stays external.

## Delivered foundation

- Module ownership: each module owns routes (`routes.ts`), navigation and permissions
  (`ModuleDefinition` in `public.ts`) and strings (`i18n.ts` eager, `messages.ts` lazy);
  `src/app/modules.ts` is the single registration point, checked by `app/modules.test.ts`.
- One stylesheet (`src/index.css` design tokens), Tailwind only, Radix only; audits
  reject other stylesheets and Next.js-only imports from pasted blocks.
- Shell: shadcn Sidebar, top-navigation option, lazy ⌘K palette, toasts, route progress,
  tab titles, self-hosted Inter + Noto Sans Arabic, branded splash, no theme flash.
- Shared kits: `shared/data-table` (table, filters panel + chips, search, pagination,
  view options, cross-page selection, virtualization, grouping, tree, pinning,
  resizing), `shared/export` (XLSX/CSV), date-range picker, combobox, illustrations.
- Illustration library: 18 new neutral transparent WebP assets, 24 total. A lazy
  bilingual gallery at `/design-system?tab=illustrations` has search, usage guidance
  and copyable JSX. Faint workspace artwork sits below sidebar navigation, hidden
  when collapsed or short. Agent rules: `docs/illustrations.md`; exact new-asset
  prompts: `docs/illustration-prompts.json`. Fixed the double RTL flip in the mobile
  sidebar and kept deep-linked reference tabs visible on narrow screens.
- Modules: Requests, Reports, Access, Appearance, Design system, Compositions.
- Compositions: 35 screens with searchable navigation and individual lazy imports:
  the 20 originals plus 15 curated additions the user explicitly requested later
  (onboarding, approval-chain, reconciliation, import-mapping, bulk-edit,
  three-way-match, pivot, permission-matrix, quote-builder, document, org-chart,
  asset-detail, customer-360, bin-map, roster). Record and profile pages were
  rebuilt with visuals on the local record kit `sections/record.tsx`. An
  earlier 60-pattern expansion was rejected and removed; do not restore it.
  Inventory: `docs/pattern-coverage.md`; quality bar ("avoid generic UI") in
  `docs/composition-authoring.md`.
- Existing examples enhanced: visual supplier master-detail with status/actions,
  order progress and mobile focus return; real record-file/CSV downloads; restore
  creates a new local revision; profile messaging preserves an unsent local draft.
- Shared Slider now labels its focusable thumbs, including distinct range labels.
- Agents can reuse, adapt, combine and create compositions within assigned scope.
  `docs/composition-authoring.md` defines section/state ownership, shared extraction,
  gallery evolution and integration acceptance. Root instructions and module
  lookups point to it; existing vendor adapters still use the single root policy.
- `npm run context -- compositions <view>` reads the actual lazy map and returns
  one pattern's route/source/guidance without dumping unrelated screens.
- Business references (REQ-1042) shown instead of internal IDs (rule in AGENTS.md).
- Account module: lazy signed-out screens (sign-in, two-step code, forgot/reset
  password, SSO button) outside the router; `/account` (profile, password,
  signed-in devices); sign-out in the account menu; any 401 returns to sign-in and
  back. Demo identity in `app/demo/identity.ts`; contract in the module.
- Foundation gaps closed (2026-11-06): `npm run module:remove` for starting a real
  project; `contracts/openapi.yaml` with generated types and compile-time Zod
  conformance (`check:api`); per-user saved views; Server-Sent Events live updates
  via module `refreshOn`; presigned uploads with `FileUpload`; print mode; a
  shortcut registry with `?` help; axe WCAG audits (light, dark, mobile, Arabic)
  that drove AA token fixes; Firefox/WebKit core flows in CI. Compositions added
  global search, notifications, audit log, report builder, comments, custom
  dashboard and rules editor.
- Completed the interrupted Claude account/compositions work together. The shell
  now loads lazily when the workspace mounts. The unpaginated reference grids
  disable automatic page resets, fixing a React update-before-mount warning.

## Verification for the curated composition additions

- Each new screen was reviewed in screenshots at 375px, 1000px and 1280px, in
  Arabic and in dark mode; cramped layouts, overflow and RTL issues were fixed.
- Detail pass: `record-tabs` and `profile` rebuilt with a sticky record header,
  lifecycle stepper, metric strips, budget bars, sparklines, file previews and
  comments; added `three-way-match`, `asset-detail` and `customer-360`; fixed inert
  dashboard and import actions and a broken `aria-labelledby` found by tests.
- On the final state `npm run check` passed (42 unit tests, entry JS 188.6 KiB
  gzip) and the full browser suite passed 72/72 on desktop and mobile Chromium.
  `tests/e2e/template.spec.ts` sweeps every registered route and drives the new
  workflows; the gallery count test now derives from `views.ts`.
- No commit or publishing performed.

## Verification for composition removal

- Removed all 60 additional registrations and 13 supporting pattern files.
  Retained all 20 original screen files; only helper import paths changed in
  master-detail, profile and record tabs. Illustrations and other modules remain.
- Updated navigation translations, retained-screen tests, source lookups and docs.
  `npm run check` passed: lint/types, architecture across 228 files, 61 catalog
  entries, 8 tooling tests, 39 unit tests, demo/API builds and bundle budgets.
  Entry JS: 188.0 KiB gzip; CSS: 30.2 KiB gzip.
- `npm run test:e2e -- --workers=2 --output=/tmp/template-compositions-removal-e2e`
  passed 64/64 on desktop/mobile Chromium. This covers the retained screens,
  Arabic/dark layouts, exactly 20 navigation entries, removed-route fallback,
  account/request/report workflows and illustrations. Original screen file hashes
  matched after normalizing only the three helper import paths. Local doc links
  and `git diff --check` passed.
- Current logs: `/tmp/template-compositions-removal-check.log` and
  `/tmp/template-compositions-removal-e2e.log`. No commit or publishing performed.
- Prior illustration evidence remains in `/tmp/template-illustrations-visual/`
  and `/tmp/template-illustrations-check-final.log`. Its 204-case browser run
  predates this removal and is not the current composition count or test result.

## Next action

Define the first real product/domain and agree its backend contract in `ai/prd.md`.
Copy patterns from `/design-system` and `/compositions`; extend shared kits rather
than adding parallel ones. The enterprise guide's future extensions are options.

## Limits and workspace

Real service integrations, other agent clients, non-Chromium browsers and ERP-scale
load remain unverified. Server-side export jobs beyond 5,000 rows are a backend task.
Private repository: https://github.com/ahmedtolan2019/react-ai-powered-template.
`origin` points there; `upstream` preserves the original author repository. The local
`template-agent-readiness` branch targets remote `main`. No application deployment.
