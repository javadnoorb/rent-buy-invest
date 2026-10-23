import json, time, urllib.request, urllib.parse, urllib.error
H = {'User-Agent': 'Mozilla/5.0 rent-buy-invest data refresh', 'Accept': 'application/json'}
def get(u, t=180):
    with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
B = 'https://www.fema.gov/api/open/v3/NfipPolicies'
try: d = json.loads(get(B + '?$top=2', 90)); rows = d.get('NfipPolicies') or [v for k, v in d.items() if isinstance(v, list)][0]; print('KEYS', list(d)); print(json.dumps(rows[0], indent=0)[:3000])
except urllib.error.HTTPError as e: print(e.code, e.read()[:300])
except Exception as e: print('ERR', e)
