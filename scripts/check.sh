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
  python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!; trap 'kill $SERVER' EXIT
  for _ in $(seq 50); do curl -sf -o /dev/null http://127.0.0.1:8765/index.html && break; sleep 0.2; done
fi
# the accessibility check needs axe-core; locally a missing install is a skip, not a failure (CI=true makes it required)
a11y=1; if [ "${CI:-}" != true ] && ! node -e "require.resolve('axe-core')" 2>/dev/null; then a11y=0; echo "SKIPPED a11y: axe-core is not installed (npm i --no-save axe-core@4.10.2)"; fi
log=$(mktemp -d)
node tests/smoke.js >"$log/smoke" 2>&1 & a=$!
node tests/ui.js >"$log/ui" 2>&1 & b=$!
if [ $a11y = 1 ]; then node tests/a11y.js >"$log/a11y" 2>&1 & c=$!; else echo "a11y skipped" >"$log/a11y"; c=; fi
node tests/layout.js >"$log/layout" 2>&1 & d=$!
# the trace check is the slowest (about 5 min alone): split it into shards run in parallel, more on bigger machines
ns=$(( $(nproc 2>/dev/null || echo 4) >= 8 ? 3 : 2 )); tr=""
for i in $(seq 0 $((ns-1))); do TRACE_SHARD=$i/$ns node tests/trace.js >"$log/trace$i" 2>&1 & tr="$tr trace$i:$!"; done
fail=0
for t in smoke:$a ui:$b a11y:$c layout:$d$tr; do n=${t%%:*}; if [ -z "${t##*:}" ] || wait "${t##*:}"; then tail -1 "$log/$n"; else echo "FAILED: $n"; tail -20 "$log/$n"; fail=1; fi; done
exit $fail
