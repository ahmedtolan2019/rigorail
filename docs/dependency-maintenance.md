# Dependency and license maintenance

## Active override

`package.json` overrides minimatch 10 consumers to 11.0.4 to fix
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), which
reaches ESLint and typescript-eslint through their minimatch 10 ranges. Minimatch 11
removed `makeRe` and the AST API; the current lint consumers only call matching APIs.
Do not assume the override suits unrelated new consumers.

Remove it once the lint dependency chain declares a patched minimatch itself, then
regenerate the lockfile through npm and run `npm run check`.
`npm run check:dependencies` fails on moderate or higher findings in any dependency
category. CI runs it separately so the code gate does not depend on the advisory service.

## License and credits

The project is MIT-licensed under Ahmed Tolan's copyright ([LICENSE](../LICENSE)).
[Third-party notices](../THIRD_PARTY_NOTICES.md) credit the original idea,
reproduce its notice for the overlapping tool configuration, and list bundled
agent skills. Keep that file when copying the template. This is provenance, not
legal advice.

## Updates

Dependabot opens weekly grouped minor/patch PRs for npm and monthly GitHub Actions
updates. Merge them when CI passes. Major npm versions are ignored on purpose:
upgrade them deliberately on a branch (read the migration guide, update code and
docs, run `npm run check` and the full browser suite, then visual review). Pending
majors as of 2026-11-06: TypeScript 7, `@tanstack/react-table` 9, lint-staged 17,
`@types/node` 26.
