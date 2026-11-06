# Product brief

Build an application-neutral, frontend-only React template for complex enterprise
apps developed with AI coding agents. The backend is always another project.

## Agreed foundation

Implemented: modular ownership and checks; portable agent context; lazy routing;
API/query/form/table patterns; localization with RTL support; customizable theme/shell;
replaceable resource permissions; remote business configuration; flags,
subscription entitlements and quotas; optional reviewed AI streaming; installed
shadcn source catalog; Requests approval workflow and Reports; account/sign-in,
MFA, recovery and device-management frontend contracts; saved views, live updates,
uploads, print and keyboard shortcuts; an OpenAPI contract with compile-time
conformance; module create/remove scripts; error, analytics and Web Vitals hooks;
42 local compositions; WCAG AA audits and risk-based tests across Chromium, with
Firefox and WebKit core flows in CI. No real identity or reporting backend is connected.

The retained reference catalog helps future coding agents: find the nearest existing example, expose missing contract decisions, and
cover interaction/failure cases before calling a feature complete. Coverage and
implementation status live in [the pattern guide](../docs/pattern-coverage.md).
Agents may reuse, adapt, combine and create patterns required by an assigned
feature. The [authoring guide](../docs/composition-authoring.md) defines ownership,
shared extraction and verification. Catalog entries do not authorize invented
product rules or unrelated roadmap work. The user rejected and requested removal
of the 60 added compositions; do not restore or bulk-replace that expansion.
Future gallery additions need explicit scope and visual review.

A full ERP, pricing model, payroll rules, billing backend, authentication server,
and live AI provider are not part of this template. The reference illustrates
integration contracts without pretending sample data is production infrastructure.

## Fill in for a new application

| Input | Current value |
| --- | --- |
| Product/users/first workflow | Application-neutral reference only |
| Brand, default currency and UI density | Rigorail (demo name) / USD / comfortable; change app config |
| API/schema/auth/session/CORS/CSRF | Sample contract in docs/backend-contract.md; real service unset |
| Permission and resource model | Sample workspace/own-record grants; replace as agreed |
| Entitlements, plans, quotas and business rules | Backend-resolved; demo mappings are illustrative |
| Locales | Localization with RTL support; ships English and Arabic (RTL) |
| Timezone/currency precision/legal reporting | Workspace IANA zone from the session (browser fallback); precision and legal rules per application |
| Browser/accessibility targets | Chromium desktop/mobile, Firefox and WebKit core flows; axe WCAG 2.2 AA on key screens |
| Hosting and observability | `docs/deployment.md`; error/analytics sinks unset until configured in `main.tsx` |
| AI data policy/provider/use cases | Optional, external backend contract; no provider configured |

Record new product acceptance criteria and real API examples here or in the owning
module contract. Keep task progress in `ai/plan.md`.
