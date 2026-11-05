# Account

Read `contract.md` first. This module owns the signed-out screens (sign in, second
factor, forgot and reset password), the `/account` page and the sign-out request.
The external backend owns credentials, cookies, MFA, lockout and password policy.
Never store tokens or passwords in browser storage, logs or `VITE_*` values.
Focused tests: `npm test -- src/modules/account src/app` and
`npx playwright test --grep "sign"`.
