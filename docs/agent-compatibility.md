# Agent compatibility

One shared instruction file is maintained in `AGENTS.md`. The adapters contain
only tool-specific loading instructions. `npm run context -- <module>` gives
the same scoped handoff to any file-aware agent. Compatibility means documented discovery
and common shell commands, not a guarantee that every model follows instructions.

| Tool | Entry | Verification status |
| --- | --- | --- |
| Codex | Root `AGENTS.md` | Official discovery documentation checked; repo instructions used in this session |
| Claude Code | `CLAUDE.md` imports `@AGENTS.md` | Import/hook formats checked against official docs; no live Claude task run |
| Cursor | Root `AGENTS.md` | Official native support checked; no live Cursor task run |
| GitHub Copilot | `.github/copilot-instructions.md` links to `AGENTS.md` | Repository instructions documented; no live Copilot task run |
| Gemini CLI | `GEMINI.md` imports `@./AGENTS.md` | Official import syntax checked; CLI not installed/tested here |
| Other file-aware agents | Explicitly ask the agent to read `AGENTS.md` | Manual fallback; native discovery varies by tool/version |

## Start a session

Open the repository root and ask: "Read AGENTS.md, identify the current scope and
verification commands, then implement [task and acceptance criteria]." Confirm
the agent recognizes that the backend is external. Use `ai/plan.md` for handoffs;
do not depend on hidden chat memory or a specific vendor's persistent memory.

Agents with restricted network access can work after dependencies and browser
binaries are provisioned. No hosted MCP service or API key is needed for the demo.
Do not copy global machine permissions or credentials into this template.

## Context ownership

- `AGENTS.md`: short entry point and shared working agreements.
- `docs/architecture.md`: durable technical rules and explicit decisions.
- `ai/prd.md`: agreed product requirements and backend contract inputs.
- `ai/plan.md`: completed work, validation, unresolved items, next step.
- `src/modules/<domain>/AGENTS.md` and `contract.md`: scoped domain context.
- `ai/docs/`: optional feature notes, read on demand.
- `.agents/skills/`: optional imported material, not the source of project policy.

Avoid duplicating rules in each agent's format. Prefer source pointers over long
code snippets that drift. The imported skills contain Next.js/server guidance;
only apply sections relevant to this Vite SPA. Do not load the whole skill catalog
for every small task. Skill auto-discovery differs across tools.

## Claude hook limits

The settings use matcher groups with `hooks` arrays and `type: command` handlers.
Hook commands reference `CLAUDE_PROJECT_DIR`, so they work from a nested directory.
Install Bash and jq for these scripts. Windows hook execution requires a suitable
Bash environment and remains unverified; Node/npm app checks are separate.

The file check protects generated output and `.env` files, permitting
the public `.env.example`, `.env.development` and `.env.demo` presets. Local/secret
overrides such as `.env.local` remain protected. The secret check inspects Write content and Edit `new_string`.
The command check only catches some obvious destructive shell forms. It is not a
shell parser and can be bypassed by reordered arguments, scripts, other tools,
or alternative commands. Secret patterns also have false negatives/positives.
Use the agent's actual sandbox/permissions and repository secret scanning as
independent controls. Hook definitions are repository code and may be maintained
when the task explicitly changes this integration; normal feature work should
not weaken them. Lint-on-edit reports issues without silently rewriting files. `check:tooling` tests
the Claude file/secret hooks when Bash and jq are available; it explicitly skips
those optional tests when either tool is unavailable.

## Source references

Checked on 2026-11-05:

- [Codex instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Claude shared instruction imports](https://code.claude.com/docs/en/memory)
- [Claude hook configuration](https://code.claude.com/docs/en/hooks)
- [Cursor AGENTS.md support](https://cursor.com/docs/rules)
- [Copilot repository instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)
- [Gemini context imports](https://geminicli.com/docs/cli/gemini-md/)
