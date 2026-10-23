import json, urllib.request
def q(ids):
    body = json.dumps({'seriesid': ids, 'startyear': '2024', 'endyear': '2024'}).encode()
    r = json.loads(urllib.request.urlopen(urllib.request.Request('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json', 'User-Agent': 'rent-buy-invest'}), timeout=60).read())
    return {s['seriesID']: (s['data'][0]['value'] if s['data'] else None) for s in r['Results']['series']}
res = {}
ids = [f'CXU{i}LB{d:02d}{c:02d}M' for d in range(2, 16) for c in range(1, 7) for i in ('OWNDWELL', 'RNTDWELL')]
for k in range(0, len(ids), 25): res.update(q(ids[k:k+25]))
for d in range(2, 16):
    print(f'LB{d:02d}', [(res.get(f'CXUOWNDWELLLB{d:02d}{c:02d}M'), res.get(f'CXURNTDWELLLB{d:02d}{c:02d}M')) for c in range(1, 7)])
