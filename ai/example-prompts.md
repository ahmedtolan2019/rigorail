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
