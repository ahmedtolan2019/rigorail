# Follow-up whole-template review

Reviewed 2026-11-05 after the initial integration. Scope: working behavior,
architecture enforcement, agent context, extension points, build modes, verification
cost and adapter usability. This report supersedes the initial verification counts
in `template-review.md`.

## Findings and fixes

| Finding | Impact on future applications/agents | Fix and evidence |
| --- | --- | --- |
| Search input did not follow browser history | URL and visible filter disagreed, making navigation bugs difficult to reproduce | Filter draft is scoped to the committed URL query. Desktop/mobile back/forward regression failed before the fix and now passes. |
| Session refresh errors discarded drafts | A temporary backend failure destroyed user work despite the form's own recovery logic | Existing workspace stays hidden/inert during transient failures; 401/403 still removes it. Session integration regression failed before the fix and now passes. Scope keys also use unambiguous tuples. |
| Architecture scanner missed several paths | Main entry imports, alternate TS extensions, private styles or root helpers could escape ownership checks | Expanded resolution/ownership checks, asset existence checks and regression fixtures. Cached module resolution avoids repeated filesystem resolution as the graph grows. |
| API builds retained the demo transport | A production artifact still contained local fixtures and demo backend logic | Statically removable demo branch. `check:production` compiles API mode into a disposable directory and asserts the demo transport is absent, without contacting a backend. |
| API URL validation accepted unusable bases | Credential-bearing URLs, unsupported schemes and query/fragment bases could fail later with confusing network errors | Startup/build validation rejects them. Regression coverage failed before the fix and now passes. |
| AI streams inherited the ordinary request deadline | A valid longer generation could fail after 15 seconds; stalled custom streams needed a reader deadline | Per-request timeout overrides and a configurable 120-second total AI stream deadline. Tests verify ordinary limits, longer operations and reader cancellation on timeout. |
| Permission labels were inferred from action suffixes | A new domain's `invoices.read` displayed the Requests label | Domain permission definitions own `labelKey`; the Access page uses it directly. A second-domain regression proves the behavior. |
| Subscription/usage display conflated unrelated states | A cancelled subscription used AI cancellation text; missing quota data appeared unlimited | Distinct subscription label and generic display of supplied quotas. Only explicit null limits mean unlimited. |
| Claude protected public demo environment presets | Routine template configuration edits could be blocked unnecessarily | Allow only the three public template presets. Secret/local overrides, generated files and secret-pattern checks remain protected and tested. |
| Agents lacked a concise module discovery command | Each task needed repeated broad source searches and could trigger unnecessary full checks | `context` prints one module's instructions, contract and source map; `check:fast` separates structural iteration from the full completion gate. |

## Verification

- `npm run check`: passed, including lint, typecheck, 14 architecture tests,
  checks across 123 TS/TSX files, the 61-entry component catalog, 5 tooling tests,
  22 unit/component tests, demo build, bundle budget and isolated API build.
- `npm run test:e2e`: all 16 desktop/mobile Chromium flows passed. This includes
  the new browser-history case and the existing access, workspace, Arabic/RTL,
  forms, AI review, feedback and navigation cases.
- `npm run context -- requests`: inspected the focused output. Tooling tests also
  cover module listing and rejection of invalid/traversal arguments.
- After the final context wording change, `npm run check:tooling` passed again.
- Initial static entry graph: 171.2 KiB JavaScript gzip and 23.6 KiB CSS gzip,
  within the existing budgets. Lazy route chunks are excluded.
- `git diff --check` and local documentation link checks passed.

Regression failures were retained during investigation, then fixed. The full
passing check above is the final application-code result. No dependencies were
added and no live backend, billing or AI service was contacted.

## Working with agents

Read root AGENTS.md once per task/session, then use `npm run context -- <module>`.
Use the contract and source map to choose files and focused behavior tests.
`check:fast` is a structural check, not a replacement for behavior tests. Run the
full gate at a cohesive completion point, and browser checks according to risk.
The context command is navigation assistance, not exhaustive change-impact analysis.

The architecture checks catch structural drift. They do not prove that business
logic belongs in the chosen domain, make agent instructions tamper-proof, or
replace code review. Required branch checks must be configured in the application's
own repository after publication; this task does not modify the upstream remote.

## Remaining integration limits

The subsequent [dependency/license maintenance](dependency-maintenance.md) closed
the 10 development findings with a tested, scoped minimatch override. Full and
production audits now report zero vulnerabilities. The original upstream MIT
license notice was recovered and restored verbatim.

Real identity/session/CORS/CSRF, billing enforcement, AI providers and product
rules remain external contracts. Other agent clients, non-Chromium browsers,
full ERP-scale workloads and every composed registry component still need their
own acceptance checks. Dependency and license evidence is recorded in the
maintenance note linked above.
