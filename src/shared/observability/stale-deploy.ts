const KEY = 'app:chunk-reload'
const WINDOW_MS = 60_000

/**
 * After a new release, an open tab can request lazy chunks that no longer exist.
 * Vite emits `vite:preloadError`; reload once to fetch the new `index.html`. A
 * timestamp guard prevents reload loops when the asset host itself is failing.
 */
export function recoverFromStaleDeploys() {
  window.addEventListener('vite:preloadError', (event) => {
    let last = 0
    try {
      last = Number(sessionStorage.getItem(KEY) ?? 0)
    } catch {
      /* Without storage, still try one reload. */
    }
    if (Date.now() - last < WINDOW_MS) return
    event.preventDefault()
    try {
      sessionStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* Reload anyway. */
    }
    window.location.reload()
  })
}
