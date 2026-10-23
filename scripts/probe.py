import subprocess, sys
subprocess.run([sys.executable, 'scripts/fetch_forecasts.py', '/tmp/fp.json']); print(open('/tmp/fp.json').read())
