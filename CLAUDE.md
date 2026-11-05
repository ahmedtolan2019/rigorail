@AGENTS.md

## Claude Code

Project hooks in `.claude/settings.json` require Bash and jq. They provide limited
edit/command checks, not a security sandbox. See `docs/agent-compatibility.md`.
Use `npm run check` for verification; lint-on-edit is advisory.
