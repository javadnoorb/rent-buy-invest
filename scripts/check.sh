#!/usr/bin/env bash
# Every check, the way CI runs them: build, then the fast checks (a few seconds), then the browser tests in parallel.
# Needs node, python3, typescript (npx fetches it) and Playwright with Chromium; browser tests use a server on :8765,
# started here if none is running. Usage: scripts/check.sh [--fast]   (--fast skips the browser tests)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build.py --pwa
node tests/lint.js
npx -y -p typescript@5.6.3 tsc -p .
node tests/run.js
node tests/validate.js | tail -1
python3 tests/test_scripts.py
[ "${1:-}" = "--fast" ] && exit 0
if ! curl -sf -o /dev/null http://127.0.0.1:8765/index.html; then
  python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!; trap 'kill $SERVER' EXIT; sleep 1
fi
log=$(mktemp -d)
node tests/smoke.js >"$log/smoke" 2>&1 & a=$!
node tests/ui.js >"$log/ui" 2>&1 & b=$!
node tests/a11y.js >"$log/a11y" 2>&1 & c=$!
node tests/layout.js >"$log/layout" 2>&1 & d=$!
node tests/trace.js >"$log/trace" 2>&1 & e=$!
fail=0
for t in smoke:$a ui:$b a11y:$c layout:$d trace:$e; do n=${t%%:*}; if wait "${t##*:}"; then tail -1 "$log/$n"; else echo "FAILED: $n"; tail -20 "$log/$n"; fail=1; fi; done
exit $fail
