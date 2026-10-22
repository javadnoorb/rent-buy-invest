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
    body = ''
    try:
        body = get(url); rows = json.loads(body); hdr = rows[0]
        out['acs'] = {'year': yr, 'url': url, 'header': hdr, 'rows': rows[1:]}
        break
    except Exception as e:
        out.setdefault('acs_errors', {})[str(yr)] = f'{e} | response: {body[:400]}'
        # retry with a smaller variable set to isolate unknown variables
        try:
            url2 = url.replace(vars_, 'NAME,B25077_001E')
            b2 = get(url2); out['acs_errors'][f'{yr}_probe'] = b2[:200]
        except Exception as e2:
            out['acs_errors'][f'{yr}_probe'] = str(e2)

# ---- Census ACS table-based summary files (no API key needed) ----
if not out['acs'].get('rows'):
    base = 'https://www2.census.gov/programs-surveys/acs/summary_file/{y}/table-based-SF/data/1YRData/acsdt1y{y}-{t}.dat'
    for yr in acs['years']:
        got = {}
        for t in acs.get('tables', ['b25103', 'b25077', 'b25031', 'b25064']):
            pref = ('310M', '0100000US')
            url = base.format(y=yr, t=t)
            try:
                txt = get(url); lines = txt.splitlines(); hdr = lines[0].split('|')
                rows = [l.split('|') for l in lines[1:] if l.startswith(pref)]
                got[t] = {'url': url, 'header': hdr, 'rows': rows}
            except Exception as e:
                out.setdefault('acs_errors', {})[f'{yr}_{t}'] = str(e)
        if got:
            out['acs_sf'] = {'year': yr, 'tables': got}
            try:
                g = get(f'https://www2.census.gov/programs-surveys/acs/summary_file/{yr}/table-based-SF/documentation/Geos{yr}1YR.txt')
                gl = g.splitlines(); gh = gl[0].split('|')
                ix, iname = gh.index('GEO_ID'), gh.index('NAME')
                out['acs_sf']['names'] = {r.split('|')[ix]: r.split('|')[iname] for r in gl[1:] if r.split('|')[ix].startswith('310M')}
            except Exception as e:
                out.setdefault('acs_errors', {})[f'{yr}_geos'] = str(e)
            break

# ---- Freddie Mac PMMS weekly history ----
try:
    txt = get(CFG['freddie_pmms_csv'])
    rows = list(csv.reader(io.StringIO(txt)))
    out['pmms'] = {'url': CFG['freddie_pmms_csv'], 'header': rows[0], 'rows': rows[1:]}
except Exception as e:
    out['pmms_error'] = str(e)

json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'public_extract.json', 'w'))
print('acs_sf', (out.get('acs_sf') or {}).get('year'), {k: len(v['rows']) for k, v in ((out.get('acs_sf') or {}).get('tables') or {}).items()}, len((out.get('acs_sf') or {}).get('names') or {}));print('bls series', len(out['bls']), 'errors', len(out['bls_errors']), '| acs rows', len(out['acs'].get('rows', [])), out['acs'].get('year'), '| pmms', bool(out['pmms']))
