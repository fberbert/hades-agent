#!/usr/bin/env bash
set -euo pipefail

npx kill-port 3000 >/dev/null 2>&1 || true

log_file="$(mktemp -t hades-linux-runtime-smoke.XXXXXX.log)"

cleanup() {
  if [[ -n "${vite_pid:-}" ]] && kill -0 "$vite_pid" >/dev/null 2>&1; then
    kill "$vite_pid" >/dev/null 2>&1 || true
    wait "$vite_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

npm run dev:react >"$log_file" 2>&1 &
vite_pid=$!
npx wait-on http://localhost:3000

set +e
HADES_LINUX_RUNTIME_SMOKE=1 electron --no-sandbox . >>"$log_file" 2>&1
status=$?
set -e

head -c 20000 "$log_file"

if grep -q "\\[LINUX_SMOKE\\] complete" "$log_file"; then
  exit 0
fi

exit "$status"
