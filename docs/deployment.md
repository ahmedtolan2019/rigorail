# Deployment

The build is static files in `dist/`. Any static host or CDN works; nothing runs
server-side here. The backend is a separate service at `VITE_API_BASE_URL`.

## Build

```sh
VITE_APP_MODE=api \
VITE_API_BASE_URL=https://api.example.com/api \
VITE_APP_RELEASE=$(git rev-parse --short HEAD) \
npm run build
```

`npm run build` fails without a valid API URL. Every `VITE_*` value is public and
compiled into the bundle: never put secrets there. Build once per environment, or
serve a runtime config file if you need one artifact for several environments.

## Routing and caching

- SPA fallback: unknown paths such as `/requests/42` return `index.html` with 200.
  Missing files under `/assets/` must return 404, not `index.html`.
- `/assets/*` are content-hashed: `Cache-Control: public, max-age=31536000, immutable`.
- `index.html`, `theme-init.js` and `favicon.svg`: `Cache-Control: no-cache`, so a
  release is picked up on the next visit. Tabs left open on an old release reload
  once when a lazy chunk is gone (`shared/observability/stale-deploy.ts`).
- Subpath hosting: build with `VITE_BASE_PATH=/your-path/`. Vite's `base`, the
  router `basepath` and the sign-in screens all follow it (`shared/routing/base.ts`).
- GitHub Pages: `.github/workflows/pages.yml` publishes the demo to
  `https://<owner>.github.io/<repository>/` on every push to `main`, with
  `404.html` as the SPA fallback. Enable Pages with "GitHub Actions" as the source.

## Security headers

Set these on `index.html` and adjust the hosts to your API and services:

```text
Content-Security-Policy: default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';
  connect-src 'self' https://api.example.com; frame-ancestors 'none';
  base-uri 'self'; form-action 'self'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- `script-src 'self'` works because the pre-paint theme script is a file
  (`public/theme-init.js`), not inline. Keep it that way.
- `style-src 'unsafe-inline'` is needed for component style attributes (positioning,
  widths). Scripts stay strict.
- Add your upload storage host (presigned URLs) and error/analytics services to
  `connect-src`. Server-Sent Events (`appConfig.api.events`) use the API host.
- Fonts are self-hosted, so no font CDN is required.

## Backend expectations

CORS with credentials for the app origin, `SameSite` session cookies, CSRF
protection (see `appConfig.api.csrf`), rate limits and correlation IDs are agreed
in [the backend contract](backend-contract.md). The frontend never stores tokens.

## Observability

Install your services in `src/main.tsx`: `configureErrorReporting(sink)` for
failures and `configureAnalytics(sink)` for product events and Core Web Vitals.
Both include `release`. Load analytics only after consent where the law requires.

## Release checklist

- `npm run check` and the browser suite pass in CI (Chromium, Firefox, WebKit).
- `npm run check:dependencies` has no moderate or higher advisories.
- Environment values reviewed; no demo mode in production builds.
- Headers above verified on the deployed host; a deep link and a missing asset
  return the right status codes.
- Error and analytics sinks receive events tagged with the new release.
