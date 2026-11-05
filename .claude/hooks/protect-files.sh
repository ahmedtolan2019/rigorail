#!/usr/bin/env bash
# Hook: protect-files.sh
# Blocks edits to files that should not be modified directly by an agent.
# Receives tool input as JSON on stdin.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')

# Normalize path separators
FILE_PATH=$(echo "$FILE_PATH" | sed 's|\\|/|g')

# Public template environment presets are editable; local/secret overrides are not.
if [[ "$FILE_PATH" =~ (^|/)(package-lock\.json|node_modules|dist|\.claude/hooks)(/|$) ]] ||
   [[ "$FILE_PATH" =~ (^|/)\.env($|\.) && ! "$FILE_PATH" =~ (^|/)\.env\.(example|development|demo)$ ]]; then
  echo "Protected generated or secret file. Use the owning tool for generated files." >&2
  exit 2
fi
