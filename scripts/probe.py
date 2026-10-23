import io, json, time, urllib.request, urllib.parse
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 rent-buy-invest'}
def get(u, t=120):
    with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
# 1. Fannie Mae LLPA matrix
for u in ['https://singlefamily.fanniemae.com/media/9391/display', 'https://singlefamily.fanniemae.com/media/9391/display?']:
    try:
        b = get(u); print('LLPA bytes', len(b), b[:8])
        import pypdf; r = pypdf.PdfReader(io.BytesIO(b))
        for i, pg in enumerate(r.pages[:3]): print(f'--- page {i}\n' + pg.extract_text()[:3500])
        break
    except Exception as e: print('LLPA', u, e)
# 2. FEMA penetration rates
try:
    b = get('https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates.csv'); t = b.decode('utf-8', 'replace').splitlines()
    print('PEN rows', len(t)); print('\n'.join(t[:4]))
    for l in t:
        if l.split(',')[0].strip('"') in ('12086', '22071', '48201'): print('PEN', l)
except Exception as e: print('PEN', e)
# 3. FEMA policies API, one county
for county in ('12086', '22071'):
    try:
        q = {'$filter': f"countyCode eq '{county}' and policyEffectiveDate ge '2025-09-01' and (occupancyType eq 1 or occupancyType eq 11)",
             '$select': 'countyCode,reportedZipCode,occupancyType,primaryResidenceIndicator,totalInsurancePremiumOfThePolicy,policyCount,ratedFloodZone,policyEffectiveDate',
             '$top': '1000', '$count': 'true', '$format': 'json', '$metadata': 'off'}
        t0 = time.time(); b = get('https://www.fema.gov/api/open/v2/FimaNfipPolicies?' + urllib.parse.urlencode(q), 180); dt = time.time() - t0
        d = json.loads(b); rows = d.get('FimaNfipPolicies') or d.get('data') or []
        print('API', county, f'{dt:.1f}s', 'keys', list(d)[:5], 'count', (d.get('metadata') or {}).get('count'), 'rows', len(rows)); print(rows[:3])
        prem = sorted(r['totalInsurancePremiumOfThePolicy'] for r in rows if r.get('totalInsurancePremiumOfThePolicy'))
        if prem: print('median premium', prem[len(prem) // 2])
    except Exception as e: print('API', county, e)
