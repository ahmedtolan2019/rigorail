#!/usr/bin/env bash
# PreToolUse guard for Bash: refuses commands that rewrite shared history, delete
# broadly, bypass review or run unreviewed remote code. Exit 2 shows the reason
# to the agent so it can choose a safe alternative or ask the user.
set -euo pipefail

command_line=$(jq -r '.tool_input.command // ""')

# Each rule: extended regex <TAB> reason shown to the agent.
rules=$(cat <<'RULES'
git[[:space:]]+push([^|;&]*)[[:space:]](-f|--force)([[:space:]]|$)	Force push rewrites shared history. Push normally or ask the user.
git[[:space:]]+push[^|;&]*[[:space:]:](main|master)([[:space:]]|$)	Pushing to main or master skips review. Push a branch and open a pull request.
git[[:space:]]+reset[[:space:]]+--hard	Hard reset discards work. Use git stash or a soft reset, or ask the user.
git[[:space:]]+clean[[:space:]]+-[a-z]*f	git clean -f deletes untracked files. Review with git clean -n and ask the user.
rm[[:space:]]+-[a-z]*r[a-z]*[[:space:]]+(/|~|\$HOME|\.\.|\*)([[:space:]/]|$)	Recursive delete of a root, home, parent or wildcard path is blocked.
(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh	Piping a download into a shell runs unreviewed code. Download, read, then run.
RULES
)

while IFS=$'\t' read -r pattern reason; do
  [ -z "$pattern" ] && continue
  if printf '%s' "$command_line" | grep -qE -- "$pattern"; then
    printf 'Blocked: %s\n' "$reason" >&2
    exit 2
  fi
done <<< "$rules"
exit 0
