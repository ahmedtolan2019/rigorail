# Contributing

Use the Node/npm versions in `package.json`, then run `npm ci`.
Read [AGENTS.md](AGENTS.md) and [architecture](docs/architecture.md).

Keep each change focused and update the relevant behavior tests and docs.
Before proposing a code change, run `npm run check`. Use targeted browser tests
when user-flow risk warrants them; reserve the full suite for broad changes or
releases. Documentation-only changes need consistency review. Describe what changed, why, validation results, and known gaps.
Use Conventional Commits when committing. Do not hand-edit generated lockfiles.

Husky/lint-staged provides commit-time linting. Claude hooks need Bash and jq.
Neither replaces CI. Do not add a backend to this repository.
