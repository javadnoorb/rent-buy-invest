#!/usr/bin/env python3
"""Download public-domain / attribution-only series used by the app and save a raw extract.
Sources: BLS public API (CPI, PPI), Census ACS API, Freddie Mac PMMS history.
Configuration: scripts/public_series.json. Output: JSON file given as argv[1]."""
import csv, io, json, sys, time, urllib.request, urllib.parse, os
HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, 'public_series.json')))
UA = {'User-Agent': 'rent-buy-invest data fetch (https://github.com/javadnoorb/rent-buy-invest)'}
def get(url, data=None, headers=None):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=120) as r: return r.read().decode('utf-8', 'replace')
out = {'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'bls': {}, 'bls_errors': {}, 'acs': {}, 'pmms': None}

# ---- BLS (v1 public API: 25 series and 10 years per request, no key) ----
bls = CFG['bls']; ids = dict(bls['series']); ids.update(bls.get('candidates', {}))
names = list(ids); y0 = bls['start_year']; y1 = int(time.strftime('%Y'))
for i in range(0, len(names), 25):
    chunk = names[i:i + 25]
    for a in range(y0, y1 + 1, 10):
        body = json.dumps({'seriesid': [ids[n] for n in chunk], 'startyear': str(a), 'endyear': str(min(a + 9, y1))}).encode()
        try:
            res = json.loads(get('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json'}))
        except Exception as e:
            out['bls_errors'][f'{chunk[0]}..{a}'] = str(e); continue
        if res.get('status') != 'REQUEST_SUCCEEDED': out['bls_errors'][f'{chunk[0]}..{a}'] = res.get('message')
        for s in (res.get('Results') or {}).get('series', []):
            n = next(k for k in chunk if ids[k] == s['seriesID'])
            d = out['bls'].setdefault(n, {'id': s['seriesID'], 'values': {}})
            for row in s.get('data', []):
                try: d['values'][f"{row['year']}-{row['period']}"] = float(row['value'])
                except ValueError: pass
        time.sleep(1)

# ---- Census ACS 1-year, all metropolitan statistical areas ----
acs = CFG['acs']; vars_ = ','.join(acs['vars'])
for yr in acs['years']:
    url = f"https://api.census.gov/data/{yr}/acs/acs1?get={vars_}&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*"
    try:
        rows = json.loads(get(url)); hdr = rows[0]
        out['acs'] = {'year': yr, 'url': url, 'header': hdr, 'rows': rows[1:]}
        break
    except Exception as e:
        out.setdefault('acs_errors', {})[str(yr)] = str(e)

# ---- Freddie Mac PMMS weekly history ----
try:
    txt = get(CFG['freddie_pmms_csv'])
    rows = list(csv.reader(io.StringIO(txt)))
    out['pmms'] = {'url': CFG['freddie_pmms_csv'], 'header': rows[0], 'rows': rows[1:]}
except Exception as e:
    out['pmms_error'] = str(e)

json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'public_extract.json', 'w'))
print('bls series', len(out['bls']), 'errors', len(out['bls_errors']), '| acs rows', len(out['acs'].get('rows', [])), out['acs'].get('year'), '| pmms', bool(out['pmms']))
