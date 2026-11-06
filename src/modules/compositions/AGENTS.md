# Compositions

Read `contract.md` and `docs/composition-authoring.md` from the repository root. Each view composes shared components into a complete screen
pattern with local sample data. Copy a composition into the owning module and
replace the sample data with that module's queries; do not import from here.
Views are individual lazy chunks; keep them free of backend calls.
The source map (one entry per route) and adaptation checklist live in `docs/pattern-coverage.md`.
Build new screens with the anatomy in `docs/composition-authoring.md` ("Build it the
same way") and meet its quality bar. Record pages reuse `sections/record.tsx`.
Register a new route in `views.ts` and the explicit lazy map in `page.tsx`, provide
copy in every locale, update the inventory and test its actual interaction. Keep local example utilities and fixtures inside Compositions; do not promote
fixtures into a shared business store. Label simulations and produce real local artifacts when an
action promises a download.

Combining gallery examples is allowed within this module. Extract focused local
sections with typed props/callbacks or children; coordinate selection, drafts and
actions in the nearest owner. Do not nest app shells, routes, form elements or
session/query providers. New reusable workflows belong in the inventory with
registration, bilingual copy and integration tests. The catalog is open to growth;
product-specific variations stay in their owning domain.

An earlier 60-pattern expansion was removed at the user's request. Do not restore
it or bulk-generate replacements. Twenty-two curated screens were later added at the
user's explicit request. Any future gallery addition needs explicit user scope
and a visual review against the existing screens.
