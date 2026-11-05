# Appearance contract

Route `/appearance`; public export is the lazy page loader. Uses shared Zustand
preferences, theme context and i18next. Changes apply immediately and persist when
storage is available. Invalid/unavailable storage must never block startup.
New brands need validated preference options and app semantic tokens. Keep Arabic,
RTL, dark mode and compact/mobile layouts working. Defaults live in app config.
