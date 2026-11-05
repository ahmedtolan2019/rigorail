# Customization and user experience

## Application identity

Edit `src/app/config.ts` for app ID, name, two-decimal currency and initial visual
preferences. The app ID namespaces theme, locale and preference persistence.
Edit `index.html` metadata and `package.json` when creating a new project.

`src/app/styles.css` owns application semantic colors, density, responsive shell
and light/dark brand presets. `src/index.css` maps Tailwind/shadcn tokens. Add a
brand at the tokens and validated preference options, not at every button.
The Appearance screen demonstrates live theme, brand, density, shell and locale.

Navigation is composed in `src/app/shell.tsx`; lazy routes live in `app/router.tsx`.
The Requests example can be removed by removing its routes, navigation entry,
permission registration, demo transport dependency and module folder. Access,
Appearance and Components are independent modules; keep only what a real app needs.

## English, Arabic and RTL

`shared/i18n` owns current translations and language persistence. The shell supplies
both Radix and Base UI direction providers, and document lang/dir change together.
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

Reference drafts are in memory. Persistent draft recovery, attachment queues,
bulk undo, notifications and global search require application-specific behavior;
see the future decisions in `enterprise-architecture.md`.
