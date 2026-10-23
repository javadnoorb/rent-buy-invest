import json, urllib.request
ids = [f'CXU{i}LB09{c:02d}M' for i in ('OWNDWELL', 'RNTDWELL', '350110') for c in range(1, 8)]
body = json.dumps({'seriesid': ids, 'startyear': '2024', 'endyear': '2024'}).encode()
r = json.loads(urllib.request.urlopen(urllib.request.Request('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json', 'User-Agent': 'rent-buy-invest'}), timeout=60).read())
for s in r['Results']['series']: print(s['seriesID'], [(d['year'], d['value']) for d in s['data']])
