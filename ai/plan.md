# Work plan and handoff

Updated 2026-11-06. Backend stays external. The template is ready to start a real
product: define its first domain, agree the API, then build with the tools below.

## Delivered foundation

- Modules: Requests, Reports, Account, Access, Appearance, Design system,
  Compositions. Each owns routes, navigation, permissions and strings
  (`i18n.ts` eager, `messages.ts` lazy); `src/app/modules.ts` registers them.
  `npm run module:create -- <id>` scaffolds a checked module with a browser test;
  `npm run module:remove -- <id>` deletes one and lists leftover references.
- Shell: sidebar or top navigation, lazy ⌘K palette, `?` shortcut help, toasts,
  route progress, tab titles, Inter + Noto Sans Arabic, splash, no theme flash.
- Shared kits: data table (filters, chips, pinning, grouping, tree, resizing,
  virtualization, cross-page selection, saved views), XLSX/CSV export, uploads
  (`FileUpload`), date-range picker, combobox, confirmations, 24 neutral
  illustrations (`docs/illustrations.md`), print mode.
- Account: lazy signed-out screens (sign-in, two-step code, recovery, SSO), account
  page, sign-out, 401 return-to-page and cross-tab session sync.
- Platform: OpenAPI contract with generated types and compile-time Zod conformance
  (`npm run api:types`, `check:api`); SSE live updates via module `refreshOn`;
  workspace time zone for dates; error, analytics and Web Vitals hooks with release
  identity; stale-deploy reload; opt-in CSRF and request-ID headers.
- Compositions: 42 screens (`docs/pattern-coverage.md`), quality bar and authoring
  rules in `docs/composition-authoring.md`. An earlier 60-pattern expansion was
  rejected; do not restore it.
- Quality: architecture audit, catalog check, Arabic plural forms, axe WCAG 2.2 AA
  audits (light, dark, mobile, Arabic), Chromium desktop/mobile suite, Firefox and
  WebKit core flows in CI, bundle budget, Dependabot and a PR checklist.
- Business references (REQ-1042) are shown instead of internal ids (AGENTS.md).

## Verified

On 2026-11-06: `npm run check` (lint, architecture, catalog, API types, types,
tooling and unit tests, demo/API builds, entry bundle under 240 KiB) and the full
Chromium browser suite. WebKit passed the core flows locally. Firefox could not
launch on the macOS development machine (Playwright profile error), so it is
verified only in CI on Linux.

## Next action

Fill in `ai/prd.md` for the first product. Agree its API in `contracts/openapi.yaml`,
scaffold the module with `npm run module:create`, and build screens from the nearest
composition. Remove reference modules with `npm run module:remove` when unused.

## Limits and workspace

Real backend, identity provider, error/analytics services and ERP-scale data are
not connected or load-tested. Export beyond 5,000 rows and import jobs are backend
work. Private repository: https://github.com/ahmedtolan2019/react-ai-powered-template.
`origin` points there; `upstream` preserves the original author's repository. Work
happens on `template-agent-readiness`, targeting `main`. No deployment performed.
