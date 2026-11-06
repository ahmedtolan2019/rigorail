/**
 * The deployment base path, from Vite's `base` (set with VITE_BASE_PATH, for
 * example '/rigorail/' on GitHub Pages). Empty at the site root. Use these
 * helpers for any URL built outside the router (window.history, plain links).
 */
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

/** '/sign-in' -> '/rigorail/sign-in' */
export const withBase = (path: string) => basePath + path

/** '/rigorail/sign-in' -> '/sign-in' */
export function stripBase(path: string) {
  if (!basePath || !path.startsWith(basePath)) return path
  return path.slice(basePath.length) || '/'
}
