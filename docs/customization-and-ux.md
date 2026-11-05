# Customization and user experience

## Application identity

Edit `src/app/config.ts` for app ID, name, two-decimal currency and initial visual
preferences. The app ID namespaces theme, locale and preference persistence.
Edit `index.html` metadata and `package.json` when creating a new project.

`src/index.css` owns semantic colors, density tokens, light/dark brand presets and
the Tailwind/shadcn token mapping. Add a brand at the tokens and validated
preference options, not at every button. Components use Tailwind utilities only.
The Appearance screen demonstrates live theme, brand, density, shell and locale.

Modules contribute their own routes, navigation entry, strings and permissions;
`src/app/modules.ts` lists the enabled ones. Remove the Requests example by deleting
its folder, its lines in `app/modules.ts`, the start-page redirect in
`app/router.tsx` and the demo transport fixtures. Reports consumes the Requests
public contract, so remove or adapt Reports at the same time. The catalog now lives
in Design system at `/design-system?tab=catalog`; `/components` is a compatibility
redirect. Keep only the modules the product needs, and search for public-contract
consumers before removal. Account is also wired into bootstrap and the user menu.

## Shell, typography and states

The lazy shell (`src/app/shell.tsx`) is the shadcn Sidebar: collapsible icon rail, mobile
sheet, sticky header with breadcrumb, a ⌘K command palette (lazy, prefetched when
idle), language and theme toggles and an account menu. Modules add entries through
`ModuleDefinition.navigation` (`section: 'main' | 'system'`); empty sections hide.
Fonts are self-hosted variable Inter and Noto Sans Arabic in one stack (`index.css`).
The 24 illustrations in `src/shared/assets/illustrations` are neutral transparent
WebP. Browse `/design-system?tab=illustrations`; replace files with the same names
to restyle their consumers. The expanded sidebar uses faint workspace artwork
below navigation, hidden in the icon rail and at short heights. See
[illustrations.md](illustrations.md) for placement, accessibility and extension rules.

## Composing screens from shadcn blocks

`components.json` sends block composites to `src/shared/blocks/<block>/` for review.
1. Preview with `npx shadcn@latest add <block> --dry-run` and read the files.
2. Decline overwrites of `src/shared/ui/*`: those files carry RTL, locale and theme
   adaptations. Add missing primitives individually.
3. Adapt the block: lucide icons, translation keys, semantic tokens, `Link` from
   TanStack Router, no `next/*` or `next-themes` (the architecture check rejects them).
4. Move domain-specific parts into the owning module and delete the staging copy.
   Use `/compositions` for patterns already adapted to this stack.

## English, Arabic and RTL

`shared/i18n` owns shared strings and language persistence; each module owns its
namespace. The shell supplies the Radix direction provider, and document lang/dir change together.
Registry styles were migrated with the shadcn CLI. Calendar locale/direction,
pagination arrows, carousel direction, sidebar offsets and common accessible
labels have local adaptations. Keep these changes when refreshing registry files.

Use logical spacing and direction-aware controls, not CSS transforms that mirror
all content. Isolate numbers/IDs with `bdi`; user text can use `dir="auto"`.
Amounts accept Arabic/Persian digits, then normalize before validation. Display
values through `Intl`; domain identifiers and server enums stay stable across locales.

The installed catalog is not a claim that all 61 components have exhaustive
Arabic/browser coverage. Test the particular calendar, chart, popover or composed
workflow when introducing it into an application. Product text supplied by a
backend is data, not automatically translated UI copy.

## Working interaction patterns

- URL filters, sorting and pagination survive list/detail/back navigation.
- Form validation identifies fields, focuses invalid input and accepts paste.
- Unsaved navigation asks before discarding; failed saves retain values.
- Version conflicts offer explicit reload/discard, avoiding silent overwrite.
- Pending mutations disable duplicate actions; completion has a live status message.
- Empty/error states expose reset/retry; offline state is visible. Shared error
  categories and crash recovery are documented in `error-handling.md`.
- Keyboard-native links/buttons, skip navigation, focus styles, reduced motion,
  responsive layout and localized money/dates are included.
- AI output remains plain text until reviewed and explicitly applied to a draft.

Reference drafts are in memory. The retained compositions demonstrate local
undo/redo, inbox actions and record editing. They do not implement a notification
service or durable upload/sync jobs. The shell command palette searches navigation. Record attachments and exports
produce actual local files; comparison restore creates a new in-memory revision.
Persistent drafts, backend downloads and authoritative version restoration still
need their own contracts. See the [pattern coverage guide](pattern-coverage.md)
before copying an example into a domain.
