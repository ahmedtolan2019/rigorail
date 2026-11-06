# React AI-powered template

A frontend-only React starter for enterprise applications, based on
[kston83/react-ai-template](https://github.com/kston83/react-ai-template).
The backend lives in another project. This repository includes a working local
reference application and a replaceable API contract, not a production backend.

## Start

Use Node 24.18.0 and npm 11.16.0, matching `.nvmrc` and `package.json`.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The tracked `.env.development` explicitly selects
local demo mode. Records reset on reload. The demo opens signed in; no billing
service, AI provider or API key is needed. To try the sign-in screens, sign out from
the account menu and use any email with password `demo-password-1` (add `+mfa` to
the email for the two-step code `123456`). These exist only in the demo transport.

## Included

- A polished shell: collapsible sidebar or top navigation, ⌘K command palette,
  breadcrumbs, toasts, route progress, tab titles, light/dark/system themes, two
  brands, two densities and self-hosted Inter + Noto Sans Arabic.
- **Account**: sign-in with an optional second factor and SSO button, forgot and
  reset password, sign-out, session-expiry return, and an account page with
  profile, password change and signed-in devices, all against a documented contract.
- Modules own their routes, navigation, strings and permissions; `src/app/modules.ts`
  enables them. Route loaders prefetch data on hover.
- **Requests**: a professional data screen with status tabs, debounced search, a
  Filters panel with server facet counts, a one-line chip strip, sortable/pinned
  columns, column visibility, page sizes, cross-page selection with bulk actions,
  Excel/CSV export, per-user saved views, attachments with upload progress, a
  printable detail page, keyboard shortcuts (`?` lists them), and a sectioned form
  with a leave guard. Lists refresh live when the backend reports changes.
- **Reports**: date-range presets, period comparison, KPI cards with sparklines,
  trend/status/category charts, a breakdown table with totals, drill-down to records
  and a formatted multi-sheet Excel export. Aggregates come from the backend.
- **Design system** (tokens, variants, patterns, advanced 10k-row grid with grouping,
  tree data, pinning and resizing, and the component catalog) and **Compositions**
  (42 screen examples, searchable by name or purpose, each passing WCAG AA audits
  in light and dark). Includes dashboards, master-detail, kanban, inbox, calendar,
  global search, approval and reconciliation workflows, data tables, forms, record
  and customer pages, audit log, report builder and scenario planning. See the
  [full composition inventory](docs/pattern-coverage.md) and
  [agent guide for combining and creating patterns](docs/composition-authoring.md).
- Replaceable action/resource authorization, feature flags, entitlements and quotas.
  Explore personas, plans and workspaces on **Access**.
- English/Arabic with RTL, localized dates/currency and Arabic numeral input.
- 24 neutral transparent illustrations for states and enterprise workflows, a
  searchable gallery with copyable JSX, and faint sidebar artwork. See the
  [illustration guide](docs/illustrations.md). Skeletons match each layout.
- Optional backend-mediated AI streaming with cancel, review, apply and discard.
- 61 shadcn source components (Radix only) and a safe shadcn block intake workflow.
- Enforced module boundaries, single stylesheet and Next.js-import checks, unit and
  browser tests, a bundle budget, CI and shared agent instructions.

## Start your own application

1. Copy without `.git`, `node_modules`, `dist` or test output. Initialize your own repo.
2. Edit `src/app/config.ts`, `index.html`, package name and `ai/prd.md`.
3. Set the design tokens in `src/index.css`; add modules using
   [the module guide](docs/enterprise-architecture.md).
4. Agree [the external backend contract](docs/backend-contract.md). Copy
   `.env.example` to `.env.local`, set `VITE_APP_MODE=api` and `VITE_API_BASE_URL`.
5. Point the account module at your identity backend (sign-in, MFA, recovery,
   sign-out, SSO; see `src/modules/account/contract.md`). Set `auth.sso` in
   `src/app/config.ts`. Replace the sample grant adapter if its policy model differs.
6. Scaffold your first domain with `npm run module:create -- <id>` and build its
   screens from the nearest composition.
7. Remove reference modules you don't need. `npm run module:remove -- reports
   --dry-run` previews the change; without `--dry-run` it deletes the module, its
   registration and its `<module>*.spec.ts` browser specs, then lists remaining
   references and type errors to fix by hand (docs, demo transport endpoints).
   Keep `design-system` and `compositions` while your team still copies from them.
   [Customization](docs/customization-and-ux.md) lists the registration points.
8. Before going live, follow [deployment](docs/deployment.md): headers, caching,
   release ID, and your error/analytics services in `src/main.tsx`.

`npm run build` validates API configuration and builds for your backend.
`npm run build:demo` explicitly builds the standalone demo. Nothing silently falls
back to demo mode when a real API fails. Only enable `VITE_ENABLE_AI=true` after
agreeing the AI endpoint. All `VITE_*` values are public.

## Work with agents

Start with [AGENTS.md](AGENTS.md), then run `npm run context` to list modules or
`npm run context -- requests` to read one module's instructions, contract and source map. Claude and Gemini import the shared instructions; Copilot links to
them; Codex and Cursor can discover AGENTS.md. Other agents can read it explicitly.
See [compatibility limits](docs/agent-compatibility.md) and
[task examples](ai/example-prompts.md). Do not load every module or skill for one task.

## Verify

```sh
npm run check:fast            # structural checks during editing
npm run check                 # full gate, demo/API builds and bundle budget
npm run test:watch            # focused development tests
npx playwright install chromium  # once, before the first browser run
npm run test:e2e              # desktop/mobile flows plus WCAG audits (axe)
E2E_ALL_BROWSERS=1 npm run test:e2e  # also Firefox and WebKit core flows
npm run api:types             # regenerate API types from contracts/openapi.yaml
npm run module:create -- inventory   # scaffold a checked domain module
npm run module:remove -- reports --dry-run  # preview removing a reference module
npm run format               # format source and scripts
npm run catalog              # refresh catalog after changing installed UI exports
```

Use risk-based checks. Full E2E is for broad UI/auth/routing changes or release;
ordinary changes need focused checks. CI runs `check:dependencies`, `check` and the
browser suite (Chromium desktop/mobile, plus Firefox and WebKit core flows) on every
pull request.

## Provenance

This repository is private while it is tested on a real project. `origin` points
to `ahmedtolan2019/react-ai-powered-template`; `upstream` retains the original
`kston83/react-ai-template` source. No application has been deployed.

The original MIT [LICENSE](LICENSE), including Kristopher Stone's copyright notice,
has been restored verbatim from upstream history. Preserve it when reusing the
template. [Dependency and license maintenance](docs/dependency-maintenance.md)
records the source commit, security override and verification. npm dependencies
and imported component/skill sources retain their respective licenses.
