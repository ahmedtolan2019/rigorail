# Component catalog contract

Route `/components`; public export is the lazy loader. Search metadata by component
name/export, inspect source paths and open official docs. No eager imports of all
UI components. `scripts/catalog.mjs` generates JSON plus docs/component-catalog.md
from actual source exports; `npm run check:catalog` detects drift.
