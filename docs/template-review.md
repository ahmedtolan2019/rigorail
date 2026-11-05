# Whole-template review

Reviewed 2026-11-05 after integration, then fixed the review findings. Upstream:
`kston83/react-ai-template`, imported commit
`88087f21b73a48c1225ac2ca457a3017c49f8888`.

For the later review and current verification, see
[agent-efficiency-review.md](agent-efficiency-review.md). The counts below record
the initial integration checkpoint, not the latest source state.

## Result

Usable as a local frontend application foundation with working reference flows,
scoped agent context and explicit external integration contracts. It is not a
complete ERP or a deployed application, and no live backend/AI/billing connection
is claimed. See README for setup and docs/backend-contract.md before API integration.

## Areas reviewed

| Area | Implemented result |
| --- | --- |
| Agent context | Shared AGENTS entry, thin adapters, module-local instructions/contracts, concise handoff |
| Architecture | App/module/shared ownership, public exports, layer/contract/import/cycle checks |
| Data and forms | Query cache, URL state, form drafts and UI preferences have separate owners |
| Enterprise flow | Server-paginated table, detail, create/edit, submit/approve, conflict handling |
| Access | Replaceable record-aware grants plus flags, entitlements and quotas |
| Business configuration | Runtime-validated, workspace-scoped queries and narrow selectors |
| AI | Optional external NDJSON stream, bounded output, cancel, review/apply, no provider keys |
| Customization | App identity, currency, semantic themes, density, two shell layouts |
| Localization | English/Arabic, document direction, both UI-library direction contexts, Arabic numerals |
| Component inventory | 61 CLI-installed source entries with generated searchable catalog |
| Feedback | Loading/refresh/empty/success states, typed failure messages, retry and crash recovery |
| Runtime cost | Lazy pages, paginated data and a checked entry bundle budget |
| Verification | Unit/component checks, boundary tests, browser workflows and optional browser CI |

## Findings fixed during the final review

- A background status transition unmounted a dirty form. A failing regression test
  reproduced it. The form now keeps its draft/base version and disables invalid saves.
- A transient capability failure discarded child state. A failing regression test
  reproduced it. Previously allowed content is now hidden/inert until recovery;
  actual denial still removes it.
- Creating a request did not refresh usage data immediately. Successful saves now
  invalidate capabilities as well as domain/configuration data.
- Arabic mobile tables could clip the start of mixed-direction titles. Bounded
  first-column content fixes this, with browser geometry checks and visual review.
- A language-switch accessible name obscured the target language. It now exposes
  the actual visible language name and appropriate language metadata.
- The route pending fallback was visually empty. It now shows localized loading.
- Common failures shared a generic message. Stable failure categories now provide
  localized guidance; raw backend exception text stays out of product UI.
- Timeout classification assumed DOMException inherited Error in every environment.
  A failing test caught the assumption; classification now uses the exception name.
- Registry integration needed compatible button sizes/dialog props, the existing
  theme provider, both direction providers, localized labels and manual RTL fixes.
- Registry catalog generation included a new test file. Tests/application-only
  feedback components are now excluded, and generated JSON is excluded from formatting.
- Strict layer enforcement found the obsolete empty `src/features` directory.
  It was removed after the module migration. Regression fixtures verify aliases,
  relative/re-export/dynamic imports, private contracts, cycles and common bypasses.
- Old docs described an unimplemented homepage-only design. They now document the
  working structure, current contracts and explicit remaining integration decisions.

## Verification evidence

Commands run on this workspace:

- `npm run check`: passed. Zero lint warnings; 9 architecture rule tests; import/
  cycle checks across 121 TS/TSX files; 61 catalog entries; typecheck; 17 unit/component
  tests; optimized demo build; bundle budget.
- `npm run test:e2e`: 14 passed in desktop/mobile Chromium. Covers create/AI review/
  submit/approve, filter return, unsaved navigation, permissions, subscription,
  quotas/flags, workspace/limit isolation, Arabic amount entry/RTL, appearance
  persistence, storage failure, empty searches and missing pages/records.
- English desktop and Arabic desktop/mobile screenshots inspected. The final UI
  retains the reviewed concept's neutral sidebar, teal actions and table hierarchy;
  the Arabic mobile title-clipping issue was corrected and rechecked.
- `npm run build` without API configuration: rejected as expected with a missing
  API URL error. A configured API-mode build to `/tmp/template-api-build` passed
  using an example URL; no request to a live backend was performed.
- Initial static entry graph: **170.9 KiB JS gzip**, **23.6 KiB CSS gzip**. Lazy route
  chunks are excluded. The checked budgets are 240 KiB JS and 40 KiB CSS.
- `npm audit --omit=dev`: zero vulnerabilities. Full audit: 10 moderate development
  dependency findings in the minimatch/ESLint chain, zero high/critical. No forced
  downgrade or unverified major override was applied at this checkpoint. The later
  [maintenance pass](dependency-maintenance.md) closed these findings.
- `git diff --check`: passed. Changes are local and uncommitted; no deployment/push.

Earlier failing browser selectors and regression tests were corrected and the
relevant checks rerun. The final passing results above supersede those failures.

## Limits and application onboarding

- Real identity/session/CSRF/CORS, billing, quotas and AI provider contracts still
  need the separate backend. The current adapters/fixtures are documented samples.
- Full ERP-scale load/performance, all 61 composed UI components, Safari/Firefox,
  Windows and assistive-technology acceptance have not been exhaustively tested.
- Codex used the repository context here. Claude/Cursor/Copilot/Gemini adapters
  were reviewed, not exercised through live sessions in those clients.
- Role editors, audit history, notifications, uploads/import jobs, offline sync,
  global search and observability are application extensions documented in
  enterprise-architecture.md, not fake working modules.
- The missing upstream MIT notice was subsequently recovered from Git history and
  restored. See [provenance and verification](dependency-maintenance.md).

References for library and future-extension research are in
[enterprise-architecture.md](enterprise-architecture.md). Agent-tool references
are in [agent-compatibility.md](agent-compatibility.md).
