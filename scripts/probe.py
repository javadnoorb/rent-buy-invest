import json, time, urllib.request, urllib.parse, urllib.error
H = {'User-Agent': 'Mozilla/5.0 rent-buy-invest data refresh', 'Accept': 'application/json'}
def get(u, t=180):
    with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
for name in ('FimaNfipPolicies', 'FimaNfipRedactedPolicies'):
    for v in ('v2', 'v1'):
        u = f'https://www.fema.gov/api/open/{v}/{name}?$top=2'
        try: b = get(u, 60); print('OK', u, b[:300])
        except urllib.error.HTTPError as e: print(e.code, u, e.read()[:200])
        except Exception as e: print('ERR', u, e)
try:
    d = json.loads(get("https://www.fema.gov/api/open/v1/OpenFemaDataSets?$filter=" + urllib.parse.quote("contains(name,'Nfip')") + "&$select=name,version,lastDataSetRefresh,recordCount", 60))
    for x in d.get('OpenFemaDataSets', []): print('DS', x)
except Exception as e: print('DS', e)
for q in ["countyCode eq '12086'", "countyCode eq '12086' and policyEffectiveDate ge '2025-09-01'", "countyCode eq '12086' and occupancyType eq 1"]:
    u = 'https://www.fema.gov/api/open/v2/FimaNfipPolicies?' + urllib.parse.urlencode({'$filter': q, '$top': '1000', '$select': 'countyCode,occupancyType,totalInsurancePremiumOfThePolicy,policyCount,ratedFloodZone,policyEffectiveDate,primaryResidenceIndicator', '$count': 'true'})
    try:
        t0 = time.time(); d = json.loads(get(u)); rows = d.get('FimaNfipPolicies', [])
        p = sorted(r['totalInsurancePremiumOfThePolicy'] for r in rows if r.get('totalInsurancePremiumOfThePolicy'))
        print('Q', q, f'{time.time()-t0:.1f}s', d.get('metadata', {}).get('count'), len(rows), 'median', p[len(p)//2] if p else None, rows[:2])
    except urllib.error.HTTPError as e: print('Q', e.code, q, e.read()[:300])
    except Exception as e: print('Q ERR', q, e)
