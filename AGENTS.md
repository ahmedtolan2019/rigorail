# Agent instructions

## Start here

This template targets large enterprise and ERP frontends. It is currently a
modular frontend-only React SPA. The backend lives in a separate project.
Consume its agreed API contract; do not create servers, database migrations,
server actions, or fake production authentication here.

1. Read `package.json` for installed tools and commands.
2. Read `docs/architecture.md` for boundaries and implementation conventions.
3. Read `ai/prd.md` and `ai/plan.md` for the current scope and progress.
4. Use `npm run context -- <module>` to locate the owning contract and relevant
   files. Read only the feature docs and source needed for the task.

`AGENTS.md` is the shared entry point. Claude and Gemini import it; Copilot points
here; agents supporting AGENTS.md read it directly. Adapters must not duplicate
architecture policy. Optional `.agents/skills/` guidance is secondary to these
project instructions. Skip any server-rendering advice in them; this is a Vite SPA.

## Commands

Use Node from `.nvmrc` and npm with the committed `package-lock.json`.

```sh
npm ci
npm run dev                 # localhost:5173
npm run context -- requests # owning module contract, source map and checks
npm run context -- compositions master-detail # one pattern source and guidance
npm run api:types           # regenerate API types after editing contracts/openapi.yaml
npm run module:create -- <id>  # scaffold a new domain module the template's way
npm run module:remove -- <module> --dry-run # preview removing a module
npm run check:fast           # lint, boundaries, catalog and types while editing
npm run check               # full gate, demo/API builds and bundle budget
npm run test:e2e            # browser tests; starts its own local Vite server
npm run test:watch          # component tests during implementation
npm run preview             # inspect the production build
```

Before the first browser run: `npx playwright install chromium`.
Use risk-based verification. During edits, run lint/typecheck and focused tests
for changed behavior. Run `npm run check` once when a cohesive change is ready.
Use a targeted browser test for a meaningful user-flow change; use the full browser
suite before a release or broad routing/auth/UI change. Documentation-only edits
need link/consistency review, not the app suite. Do not reinstall browsers or rerun
passed checks without a changed input or unresolved concern. Bound investigation
of unrelated flaky infrastructure and report the limitation instead of looping.
Report commands actually run and remaining gaps. Never hide failures.

## Working agreements

- Preserve user changes. Inspect `git status` and relevant code before editing.
- Follow the requested scope. The roadmap is a proposal, not authority to build it all.
- Keep changes cohesive. Add dependencies only for a concrete requirement.
- Architecture checks are required. Do not disable checks, add bypass imports, or
  weaken configuration to make a feature pass. Change a boundary only as part of
  an explicitly requested architecture change, with its decision and regression
  coverage updated.
- Keep business logic inside its owning domain. Avoid giant shared stores,
  components, and services. Follow state ownership and public module contracts.
- For domain work, read its local instructions and contract before its implementation.
  Read another domain only when its public contract is relevant.
- Update lockfiles through npm; do not hand-edit generated files or `dist/`.
- Reproduce bugs, add useful regression coverage, then verify the user flow.
- Keep secrets out of source, logs, and `VITE_*` variables. Vite values reach browsers.
- Frontend route guards are UX only. The external backend enforces authorization.
- Use accessible controls, visible focus, and loading/error/empty/success states.
  Keep the axe audits (`tests/e2e/*accessibility.spec.ts`) passing; the authoring
  guide lists the recurring fixes.
- Before implementing UI workflows, consult `docs/pattern-coverage.md` and
  `docs/composition-authoring.md`. Agents may reuse, adapt, combine or create
  patterns needed by the assigned task; the catalog is not a fixed limit.
- Compose sections under explicit state/action ownership. Keep business logic in
  its domain; never import Compositions fixtures or route pages into product
  modules. Extract shared UI only when it is domain-neutral with real consumers.
- Document new reusable patterns and test interactions between combined sections,
  including dirty work, permissions and recovery. A success toast alone does not
  implement a download, save or restore. Follow the authoring guide for registration.
- Never show internal identifiers (database IDs, UUIDs, technical keys) to users.
  Display business references (`REQ-1042`), names or titles; keep IDs in URLs,
  API calls and data attributes. Ask the backend for a reference when none exists.
- Record enduring architecture decisions in `docs/architecture.md`; record task
  progress and next steps in `ai/plan.md`. Keep both concise and current.
- Do not claim mocks are live backend integrations or generated types are runtime validation.
- Use Conventional Commits when a commit is requested. Do not publish by default.

## Context map

| Need | Read |
| --- | --- |
| Existing structure, React and styling rules | `docs/architecture.md` |
| Product requirements and backend contract inputs | `ai/prd.md` |
| Completed work, next steps, task handoff | `ai/plan.md` |
| Enterprise extension guide and agent scaling | `docs/enterprise-architecture.md` |
| Branding, layout customization, navigation and user feedback | `docs/customization-and-ux.md` |
| Permission vocabulary, action checks and replaceable authorization | `docs/access-control.md` |
| Tool setup and compatibility limits | `docs/agent-compatibility.md` |
| Loading, failures and recovery patterns | `docs/error-handling.md` |
| External API, session, AI and hosting contract | `docs/backend-contract.md` |
| Build, caching, security headers and release checklist | `docs/deployment.md` |
| Installed component source and exports | `docs/component-catalog.md` |
| UI patterns to copy (tokens, data tables, filters, exports, screens) | `/design-system`, `/compositions` routes and their module source |
| Reusable artwork, ambient decoration and adding new illustrations | `/design-system?tab=illustrations`, `docs/illustrations.md` |
| Composition inventory, find-by-need index and backend adaptation | `docs/pattern-coverage.md` |
| Step-by-step list, detail, form, dashboard and settings screens | `docs/screen-recipes.md` |
| Building a screen the template's way, quality bar, combining sections | `docs/composition-authoring.md` |
| Task prompts and acceptance checklist | `ai/example-prompts.md` |

Do not load all skills or copy this map into every adapter. Source and runnable
checks establish current behavior; update stale documentation when it disagrees.
