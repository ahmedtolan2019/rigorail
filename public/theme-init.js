// Applies the saved theme and direction before first paint (no flash).
// A separate file so a strict CSP (script-src 'self') needs no inline hash.
// Keys use appConfig.id ("foundation") from src/app/config.ts; keep them in sync.
try {
  var root = document.documentElement
  var theme = localStorage.getItem('foundation:theme') || 'light'
  if (theme === 'system')
    theme = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  root.classList.add(theme)
  root.style.colorScheme = theme
  var language = localStorage.getItem('foundation:language')
  if (language === 'ar') {
    root.lang = 'ar'
    root.dir = 'rtl'
  }
} catch (error) {}
