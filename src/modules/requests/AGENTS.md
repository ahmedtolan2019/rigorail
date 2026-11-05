# Requests module

Read `contract.md` before source. This is a removable reference workflow.
Pages use local schemas/queries, shared access/capability hooks and UI. Other
modules consume only `public.ts`. Do not move request business rules into shared UI.

For form changes, check failed-save draft retention, base record version, amount
normalization and unsaved navigation. For actions, check record permissions,
workflow status and backend rejection. Keep English/Arabic keys in sync.
Focused tests: `npm test -- src/modules/requests src/app/demo/transport.test.ts` and the relevant
`tests/e2e/template.spec.ts` test selected with `--grep`.
