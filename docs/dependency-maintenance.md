# Dependency and license maintenance

Verified 2026-11-05 with Node 24.18.0 and npm 11.16.0.

## Development dependency fix

The ten moderate audit entries were one minimatch vulnerability propagated through
ESLint and typescript-eslint. Installed minimatch 10.2.6 is affected by
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The advisory identifies 11.0.1 as the first patched version; the selected release
is 11.0.4.

The current ESLint 10.14.0, @eslint/config-array 0.23.5 and typescript-eslint
8.72.1 dependency ranges still select minimatch 10. The root package therefore
pins only minimatch 10 consumers to 11.0.4 through an npm override. npm regenerated
the lockfile. No ESLint downgrade, audit suppression or `audit fix --force` was used.

This crosses a major-version boundary. Minimatch 11 removed APIs such as makeRe
and AST and changed its matching implementation. The installed lint consumers use
Minimatch matching and the minimatch function. Verification exercised actual
repository linting plus TS/TSX selection, Hook rule enforcement, ignored build
output and the narrowly scoped shared-UI rule exception. Node 24 meets its engine
requirement. Do not assume this override is compatible with unrelated new consumers.

Remove the override when the lint dependency chain declares a patched version
itself, then regenerate the lockfile and rerun the checks. `npm run
check:dependencies` checks all dependency categories and fails on moderate or higher
findings. CI runs it separately from `check`, so the local code-validation gate
remains independent of the registry advisory service. Audit results are a dated
snapshot, not a guarantee against future advisories.

## Upstream license provenance

The upstream current README [declares MIT](https://github.com/kston83/react-ai-template/blob/88087f21b73a48c1225ac2ca457a3017c49f8888/README.md#license),
but its current root has no LICENSE file. Git history contains the original notice:

- Added in [fb4940859016b617e91b2a426aa01919aaead460](https://github.com/kston83/react-ai-template/commit/fb4940859016b617e91b2a426aa01919aaead460).
- [Original LICENSE](https://github.com/kston83/react-ai-template/blob/fb4940859016b617e91b2a426aa01919aaead460/LICENSE) names `Copyright (c) 2025 Kristopher Stone`.
- Removed in [c210d29d05163d6ce191db8ef086447418bfd221](https://github.com/kston83/react-ai-template/commit/c210d29d05163d6ce191db8ef086447418bfd221), during a tooling rework. The commit does not explain the removal.

The added license commit is an ancestor of this template's upstream base.
[Root LICENSE](../LICENSE) was restored directly from that Git object without
inventing an author, year or permission grant. Its Git blob ID matches the original:
`ef495d5ff017e359bc0567921cfa0d448287abd3`. Package metadata now declares MIT.
This closes the missing upstream notice/provenance item. Preserve this notice in
copies or substantial portions of the template; dependency and imported-source
licenses remain separate. This is source provenance verification, not a legal
opinion about every future product or third-party asset.

## Verification

- Clean `npm ci` from the regenerated lockfile.
- `npm run check`, including lint/types, architecture/tooling/component tests,
  catalog verification, demo/API builds and bundle budgets.
- `npm run check:dependencies` and `npm audit --omit=dev`: zero vulnerabilities.
- Lint compatibility probes described above.
- Full desktop/mobile Chromium browser suite: all 16 tests passed.
- Original/restored license blob equality and `git diff --check`.
