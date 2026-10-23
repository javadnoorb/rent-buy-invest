import json, shutil, subprocess, sys
shutil.copy('data/insurance.json', '/tmp/ins.json')
subprocess.run([sys.executable, 'scripts/fetch_insurance.py', '/tmp/ins.json'])
d = json.load(open('/tmp/ins.json')); print('PTAX_JSON ' + json.dumps(d.get('ptax_movers')))
