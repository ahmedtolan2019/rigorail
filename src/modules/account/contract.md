# Account contract

`public.ts` exports `accountModule`, `accountRoutes`, the lazy `SignedOutApp`,
`signOutRequest`, `safeRedirect` and `loadAccountContract` for loading the contract
schemas on demand. Strings: eager `i18n.ts` (account menu),
lazy `messages.ts` (screens).

## Signed out

`app/bootstrap.tsx` renders `SignedOutApp` when `GET /session` answers 401. It is a
small screen switcher on `/sign-in`, `/forgot-password` and `/reset-password?token=`
that mounts without the workspace router or shell. Any other URL becomes
`/sign-in?redirect=<path>` (dropped after an explicit sign-out); `safeRedirect`
accepts only same-origin application paths. After the backend sets the session
cookie, `onSignedIn(returnTo)` reloads the session and opens `returnTo`.

| Endpoint                              | Body                          | Result                                                                               |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `POST /auth/sign-in`                  | `{email, password, remember}` | `{status: signed_in or mfa_required}`; 401 `invalid_credentials`, 429 `rate_limited` |
| `POST /auth/mfa`                      | `{code, remember}`            | `{status: signed_in}`; 401 `invalid_code` or `mfa_expired`                           |
| `POST /auth/password/forgot`          | `{email}`                     | Empty success for every well-formed email (no account discovery)                     |
| `POST /auth/password/reset`           | `{token, password}`           | Empty; 410 `expired_token`, 422 `fields.password`                                    |
| `POST /auth/sign-out`                 | none                          | Empty; clears the session cookie                                                     |
| `GET {base}/auth/sso/start?returnTo=` | full-page navigation          | Identity provider redirect, back to `returnTo`                                       |

## Signed in

`/account` shows the profile, password, second-factor status and signed-in devices.
Sign-out lives in the account menu and on this page via `services.signOut`.

| Endpoint                                       | Result                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /account`                                 | `accountSchema`: name, email, mfaEnabled, passwordChangedAt, passwordManaged |
| `PATCH /account` `{name}`                      | Updated account; then the session is refreshed for the menu name             |
| `POST /account/password` `{current, password}` | Empty; 422 `fields.current` or `fields.password`                             |
| `GET /account/sessions`                        | `{items: [{id, device, client, location, lastActiveAt, current}]}`           |
| `DELETE /account/sessions/:id`                 | Empty; the current session cannot be revoked here                            |
| `POST /account/sessions/revoke-others`         | Empty                                                                        |

Password rules in `schema.ts` are a UX hint; the backend enforces policy. Identity
errors are shown by stable `code`, never backend text. Keep English/Arabic parity,
RTL (emails, codes and passwords stay left-to-right) and dark mode.
