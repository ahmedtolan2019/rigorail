# Illustration library

Browse `/design-system?tab=illustrations` for all 24 assets, localized names,
suggested uses, search and copyable JSX. The gallery is lazy-loaded. The shared
registry is [`Illustration`](../src/shared/ui/illustration.tsx); import it directly:

```tsx
import { Illustration } from '@/shared/ui/illustration'

<Illustration name="documents" />
```

These are decorative 400 × 400 transparent WebP files with neutral gray/slate
artwork. They have no baked-in copy or brand color. The component adapts brightness
in dark mode, reserves space, lazy-loads and respects reduced motion. Static imports
resolve to URLs; they do not inline or eagerly download the whole image library.
Existing assets are 7–11 KB; the 18 new assets are 10–23 KB each.

## Choose by purpose

| Purpose | Available names |
| --- | --- |
| Data and recovery states | `empty`, `no-results`, `error`, `offline`, `not-found`, `access-denied` |
| Starting and finishing | `workspace`, `welcome`, `success`, `growth` |
| Files and knowledge | `upload`, `download`, `documents`, `archive` |
| Enterprise workflows | `analytics`, `approvals`, `schedule`, `billing` |
| People and administration | `team`, `security`, `integrations`, `support`, `maintenance`, `notifications` |

## Use in compositions

- Start with an existing asset. Use one illustration to introduce a workflow,
  explain an empty state or mark a meaningful completion. Dense tables and inline
  validation usually need no illustration. Ordinary success feedback stays a toast.
- Keep the heading, explanation and next action in accessible HTML. Images have
  `alt=""` and `aria-hidden`; they must never be the only indication of status,
  authorization, upload progress or a successful operation.
- Artwork is decorative, not clickable. If it introduces an action, render a
  separate named button or link. Keep charts that communicate real data as actual
  charts with accessible labels, never as illustration assets.
- Preserve aspect ratio with `object-contain`. Leave breathing room and use
  semantic background tokens. Neutral artwork supports brand changes, but inspect
  it against the target surfaces in light/dark mode. Do not promise every future
  custom theme will work without review.
- RTL changes layout, not artwork by default. Do not mirror upload/download arrows,
  clocks or other directional meanings automatically. Localize surrounding text.
- Do not import gallery code or its translation fixtures into product modules.
  Reuse the shared component and provide domain-owned copy.

## Ambient sidebar artwork

`src/app/shell.tsx` places `workspace` below the navigation, above the account menu.
Its non-interactive wrapper has 35% opacity in light mode and 25% in dark mode.
The image keeps its own dark-mode opacity adjustment. It occupies normal layout
space, never overlays navigation, and hides in the collapsed rail or at heights
of 650px and below. The mobile navigation sheet uses the same treatment.

To customize it, change the `name` on that one `Illustration`, or remove its
`data-sidebar-illustration` wrapper. Keep navigation and focus rings unobscured.
Do not add random rotation, recurring animation or background asset preloading.

## Extend the set when a feature needs it

1. Check the gallery and this inventory. Reuse or combine existing UI sections
   before generating an almost-identical asset. A new illustration is justified
   by a distinct concept in the assigned feature, not by every new route.
2. Match the neutral transparent style. Use a centered, complete subject with
   clear silhouettes, generous margins and subtle shading. Avoid text, numbers,
   logos, colorful panels and busy scenery. The new batch's exact prompts are in
   [`illustration-prompts.json`](illustration-prompts.json), generated with the
   built-in image-generation tool on 2026-11-05. The six original state assets
   predate this manifest; their prompts are not recorded here.
3. Optimize the selected raster to 400 × 400 WebP with transparency preserved.
   Keep source originals outside the app bundle. Aim below 25 KB; inspect before
   reducing quality further. Do not put base64 payloads or large PNGs in source.
4. Add an explicit import and name to `src/shared/ui/illustration.tsx`. Computed
   imports and glob discovery are not allowed. `IllustrationName` and
   `illustrationNames` derive from the registry.
5. Add the localized name for every locale and suggested use in the Design system module's
   `illustration-messages.ts`; its keyed record requires coverage of every name.
   Update this inventory and prompt manifest. This application-owned component is
   separate from the generated shadcn catalog. Keep the gallery asset-count test
   aligned with intentional additions.
6. Inspect the asset at its actual UI size, in light/dark, both brand palettes and
   Arabic/mobile. Check the alpha edge, image loading, contrast, layout and reduced
   motion. Run the focused illustration browser tests and the normal change gate.

Agents may add or replace artwork needed by the assigned feature within these
boundaries. Do not change the template's design tokens, add an image service or
introduce a dependency just to use an existing illustration.
