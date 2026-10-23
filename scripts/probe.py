import json, subprocess, sys, time
t0 = time.time(); subprocess.run([sys.executable, 'scripts/fetch_flood.py', '/tmp/flood.json', '--max-counties', '25'])
print('elapsed', round(time.time() - t0))
try:
    d = json.load(open('/tmp/flood.json')); print('state_cost', d['state_cost']); print('cost', d['cost']); print({k: d['pen'][k] for k in ('12086', '22071', '48201', '06037') if k in d['pen']})
except Exception as e: print('no output', e)
