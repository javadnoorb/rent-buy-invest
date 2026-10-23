import json, urllib.request
ids = []
for item in ('TENTINSR', 'TENANTIN', '350110', 'RENTINS', 'TENTINS'):
    for c in ('01', '02', '03', '04', '05'):
        ids.append(f'CXU{item}LB09{c}M')
for k in range(0, len(ids), 25):
    body = json.dumps({'seriesid': ids[k:k+25], 'startyear': '2022', 'endyear': '2025'}).encode()
    r = json.loads(urllib.request.urlopen(urllib.request.Request('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json', 'User-Agent': 'rent-buy-invest'}), timeout=60).read())
    print(r.get('status'), r.get('message'))
    for s in r['Results']['series']:
        if s['data']: print(s['seriesID'], [(d['year'], d['value']) for d in s['data']])
# also the CE item code list
try:
    t = urllib.request.urlopen(urllib.request.Request('https://download.bls.gov/pub/time.series/cx/cx.item', headers={'User-Agent': 'Mozilla/5.0 rent-buy-invest (javadnoorb)'}), timeout=60).read().decode()
    for l in t.splitlines():
        if 'nsur' in l: print(l)
except Exception as e: print('item list', e)
