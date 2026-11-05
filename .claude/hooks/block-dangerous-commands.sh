#!/usr/bin/env bash
# Hook: block-dangerous-commands.sh
# Blocks dangerous shell commands before they execute.
# Receives tool input as JSON on stdin.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Block force push
if echo "$COMMAND" | grep -qE 'git\s+push\s+(-f|--force)'; then
  echo "Force push is blocked. Use normal push or ask the user." >&2
  exit 2
fi

# Block push to main/master without explicit intent
if echo "$COMMAND" | grep -qE 'git\s+push\s+(origin\s+)?(main|master)'; then
  echo "Direct push to main/master is blocked. Create a branch and PR." >&2
  exit 2
fi

# Block destructive commands
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+(/|~|\.\.|[*])'; then
  echo "Destructive rm -rf is blocked." >&2
  exit 2
fi

# Block hard reset
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "Hard reset is blocked. Use soft reset or ask the user." >&2
  exit 2
fi

# Block curl pipe to shell
if echo "$COMMAND" | grep -qE 'curl.*\|\s*(ba)?sh'; then
  echo "Piping curl to shell is blocked for security." >&2
  exit 2
fi
