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
local demo mode. Records reset on reload. No login, billing service, AI provider,
or API key is needed to explore it.

## Included

- TanStack Router with lazy pages, validated URL filters and navigation protection.
- TanStack Query for scoped server data, cancellation and targeted invalidation.
- TanStack Table with server pagination; React Hook Form and Zod for validated drafts.
- Requests reference module: search, list, detail, create, edit, submit and approve.
- Replaceable action/resource authorization, feature flags, subscription
  entitlements and quotas. Explore personas, plans and workspaces on **Access**.
- Typed remote business configuration with narrow subscriptions and refresh.
- English/Arabic, RTL, localized dates/currency and Arabic numeral input.
- Branding tokens, light/dark/system themes, density and sidebar/top navigation.
- Optional backend-mediated AI streaming with cancel, review, apply and discard.
- 61 installed shadcn source component entries, installed through the CLI.
  Search **Components** or [the source catalog](docs/component-catalog.md).
- Enforced module imports/cycle checks, tests, CI and shared agent instructions.

## Start your own application

1. Copy without `.git`, `node_modules`, `dist` or test output. Initialize your own repo.
2. Edit `src/app/config.ts`, `index.html`, package name and `ai/prd.md`.
3. Set the design tokens in `src/app/styles.css`; add modules using
   [the module guide](docs/enterprise-architecture.md).
4. Agree [the external backend contract](docs/backend-contract.md). Copy
   `.env.example` to `.env.local`, set `VITE_APP_MODE=api` and `VITE_API_BASE_URL`.
5. Implement the real session/authentication integration with that backend.
   Replace the sample grant adapter if its policy model differs.
6. Remove the reference modules and demo transport when they are no longer useful.
   [Customization](docs/customization-and-ux.md) lists the registration points.

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
npm run test:e2e              # desktop/mobile reference flows
npm run format               # format source and scripts
npm run catalog              # refresh catalog after changing installed UI exports
```

Use risk-based checks. Full E2E is for broad UI/auth/routing changes or release;
ordinary changes need focused checks. CI runs `check:dependencies` and `check`; manual workflow runs add
browser tests. [Whole-template review](docs/template-review.md) records the initial integration.
[Agent-efficiency follow-up](docs/agent-efficiency-review.md) records the latest
fixes and verification.

## Provenance

This repository is private while it is tested on a real project. `origin` points
to `ahmedtolan2019/react-ai-powered-template`; `upstream` retains the original
`kston83/react-ai-template` source. No application has been deployed.

The original MIT [LICENSE](LICENSE), including Kristopher Stone's copyright notice,
has been restored verbatim from upstream history. Preserve it when reusing the
template. [Dependency and license maintenance](docs/dependency-maintenance.md)
records the source commit, security override and verification. npm dependencies
and imported component/skill sources retain their respective licenses.
