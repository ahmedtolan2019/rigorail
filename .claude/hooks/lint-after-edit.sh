#!/usr/bin/env bash
# Advisory only. Final verification is npm run check.
set -euo pipefail
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  cd "${CLAUDE_PROJECT_DIR:-.}"
  if [[ -f "$FILE_PATH" && -f node_modules/eslint/bin/eslint.js ]]; then
    node node_modules/eslint/bin/eslint.js -- "$FILE_PATH" >&2 || true
  fi
fi
