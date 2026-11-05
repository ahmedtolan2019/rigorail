# Design system contract

Route `/design-system?tab=foundations|components|patterns|illustrations|catalog`; `/components`
redirects to the catalog tab. `public.ts` exports the route tree and module
definition. Eager labels are in `i18n.ts`; page strings in `messages.ts`.

- Foundations: live token swatches (read from CSS variables), type scale in both
  scripts, radius/elevation and motion samples.
- Components: interactive variants and states of shared UI, including toasts.
- Patterns: page anatomy, loading/empty/error states and the advanced grid
  (virtualized client-side rows with grouping, tree data, pinning and resizing).
- Catalog: searchable index generated from installed source exports
  (`scripts/catalog.mjs`, checked by `npm run check:catalog`).
- Illustrations: 24 neutral transparent assets with bilingual usage guidance,
  search, copyable JSX and clipboard failure feedback. The shared registry owns
  asset names; `illustration-messages.ts` must describe every registered asset.
  Usage and extension rules: `docs/illustrations.md`.

No business data or backend calls. Every sample works in Arabic/RTL and dark mode.

Illustration behavior checks: `tests/e2e/illustrations.spec.ts` covers actual image
loading, search, clipboard success/failure, narrow RTL tabs and sidebar placement.
