# Task prompts

These prompts work with any coding agent that can read repository files and run
commands. Start a new session from the project root. They do not require a
specific model, subscription, MCP server, or agent platform.

## Start an application

Read AGENTS.md, docs/architecture.md, ai/prd.md, and package.json. Summarize what is
implemented and missing for this product: [brief]. Keep this frontend-only and
consume the backend contract at [source]. Record acceptance criteria and a short
implementation plan. Do not invent endpoints or authentication. Implement the
agreed first feature, run the relevant checks, and update ai/plan.md with results
and the next action.

## Implement a feature

Read AGENTS.md and the owning module's AGENTS.md and contract.md before implementation. Implement [user behavior] against
[API contract]. Include loading, empty, error, success, and applicable permission
states, plus English/Arabic and RTL behavior. Use the shared error/loading patterns
and capability checks. Acceptance criteria: [observable list]. Reuse existing UI conventions,
cover the meaningful behavior with tests, run focused tests and npm run check; use browser tests when the workflow risk warrants them, and document any unmet contract requirements.

## Fix a bug

Read AGENTS.md. Reproduce [steps and observed behavior] in the closest available
user workflow. Expected behavior: [result]. Identify the cause, add a regression
test that fails before the fix, make a focused change, and run the checks. Report
the evidence and any environment limitations.

## Resume or hand off

Read AGENTS.md and ai/plan.md. Inspect git status and the current source. Confirm
which work is implemented, proposed, or blocked. Continue the agreed next task.
Do not treat the roadmap as blanket authorization. Update the plan with changed
files, exact checks/results, unresolved decisions, and one concrete next action.

## Review a generated feature

Review [feature] against its acceptance criteria, API contract, and architecture.
Look for behavior bugs, unhandled response states, inaccessible interactions,
cross-feature coupling, and frontend/backend boundary violations. Give findings
with file/line evidence and impact. Distinguish verified behavior from assumptions.

## Build a feature from a composition

> Implement `<feature>` in `<owning module>` using the nearest pattern in
> `docs/pattern-coverage.md`. Read that module contract and only the relevant
> composition source and `docs/composition-authoring.md`. Adapt the UI structure; do not import Compositions fixtures
> across domains. Connect the agreed API, specify selection/dirty/concurrency
> behavior, and include empty/loading/denied/failure/retry and Arabic/RTL acceptance.
> Verify the actual result of each action (including file bytes for downloads).
> Update the owning contract and `ai/plan.md`; run the required checks.

## Extend the composition library

> Add `<missing workflow>` to Compositions as an interactive local example with
> a distinct URL, bilingual label/hint, accessible controls and useful state
> transitions. Match the retained original screens and review the rendered result.
> Register navigation and the
> explicit lazy import, document its production contract questions, and add a
> behavior test. Do not implement a server or present fixtures as a live service.

## Combine compositions into one workflow

> Implement `<workflow>` in `<owning domain>` using `<candidate compositions>`.
> Read AGENTS.md and `docs/composition-authoring.md`. Use the inventory and
> `npm run context -- compositions <view>` to inspect only relevant references.
> Choose reuse, adaptation, combination or a new pattern based on the task.
> Extract sections rather than embedding route pages. Record who owns selection,
> forms, URL state, queries and mutations, plus dirty/permission/conflict behavior.
> Use public domain contracts and shared UI without importing gallery fixtures.
> Test interactions between sections, especially switching records during pending
> work. If the work produces a distinct reusable workflow, add a local gallery
> example and update its inventory, registration, translations and tests.

## Review a composed workflow

> Review `<workflow>` against `docs/composition-authoring.md` and its module
> contract. Check for duplicate state owners/providers, nested forms, competing
> route updates, stale actions on a new record, permission gaps, focus traps,
> shared-state leaks between instances and eager loading of unrelated examples.
> Reproduce problems, fix them within the task's scope, and add useful regression
> coverage. Do not weaken import boundaries or invent service behavior.
