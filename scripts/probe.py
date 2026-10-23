import json, urllib.request
def q(ids):
    body = json.dumps({'seriesid': ids, 'startyear': '2023', 'endyear': '2024'}).encode()
    r = json.loads(urllib.request.urlopen(urllib.request.Request('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json', 'User-Agent': 'rent-buy-invest'}), timeout=60).read())
    return {s['seriesID']: (s['data'][0]['value'] if s['data'] else None) for s in r['Results']['series']}
res = {}
ids = [f'CXUOWNDWELLLB{d:02d}{c:02d}M' for d in (3, 8, 13, 16, 17, 18, 19, 20) for c in range(1, 13)]
for k in range(0, len(ids), 25): res.update(q(ids[k:k+25]))
print({k: v for k, v in res.items() if v})
