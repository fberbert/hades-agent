#!/usr/bin/env bash
set -euo pipefail

echo "platform=$(uname -s)"
echo "arch=$(uname -m)"
echo "xdg_session_type=${XDG_SESSION_TYPE:-unknown}"
echo "desktop=${XDG_CURRENT_DESKTOP:-${DESKTOP_SESSION:-unknown}}"

command -v node >/dev/null && node --version
command -v npm >/dev/null && npm --version

npm run build 2>&1 | head -c 4000
npm test 2>&1 | head -c 4000
