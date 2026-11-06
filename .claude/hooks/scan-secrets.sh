#!/usr/bin/env bash
# PreToolUse guard for Edit/Write: refuses text that looks like a live credential.
# It reports only the credential type, never the matched value, so secrets do not
# end up in logs. Frontend code must never hold secrets (VITE_* values are public).
set -euo pipefail

text=$(jq -r '[.tool_input.content, .tool_input.new_string, .tool_input.newString] | map(select(. != null)) | join("\n")')
[ -z "$text" ] && exit 0

# Each rule: credential type <TAB> extended regex.
detectors=$(cat <<'DETECTORS'
AWS access key	AKIA[0-9A-Z]{16}
provider secret key (OpenAI, Stripe, Anthropic)	(sk|rk)-(ant-|live_|proj-)?[A-Za-z0-9_-]{20,}
GitHub token	gh[pousr]_[A-Za-z0-9]{36,}
Slack token	xox[abprs]-[A-Za-z0-9-]{10,}
private key block	-----BEGIN ([A-Z]+ )?PRIVATE KEY-----
JSON Web Token	eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.
DETECTORS
)

while IFS=$'\t' read -r kind pattern; do
  [ -z "$pattern" ] && continue
  if printf '%s' "$text" | grep -qE -- "$pattern"; then
    printf 'Blocked: this looks like a %s. Keep credentials out of source and VITE_* values.\n' "$kind" >&2
    exit 2
  fi
done <<< "$detectors"
exit 0
