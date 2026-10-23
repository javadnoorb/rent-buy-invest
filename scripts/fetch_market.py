#!/usr/bin/env python3
"""Fetch the figures behind the header cards into data/market.json, so they update with each refresh:

- Treasury yields: 10-year and 3-month constant-maturity rates, latest day (U.S. Treasury daily par yield curve,
  public domain; FRED's copy of the Federal Reserve H.15 series as a fallback).
- CPI: 12-month change of CPI-U and core CPI (BLS public API, public domain).
- Zillow Home Value Index (typical home value, mid tier, smoothed and seasonally adjusted) and Zillow Observed Rent
  Index (typical asking rent, smoothed) for the U.S. and the app's metros. Zillow's research data is free for public
  use with clear attribution to Zillow, which the app shows on every Zillow figure.
Each part is fetched on its own; a part that fails keeps its previous value.
Run: python3 scripts/fetch_market.py [out.json]
"""
import csv, glob, io, json, os, re, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'market.json')
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) rent-buy-invest data refresh'}

def get(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=180) as r: return r.read().decode('utf-8', 'replace')

old = json.load(open(OUT)) if os.path.exists(OUT) else {}
out = dict(old); now = time.gmtime(); out['fetched_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', now)

# ---- Treasury yields ----
def treasury():
    for y in (now.tm_year, now.tm_year - 1):
        url = (f'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{y}/all'
               f'?type=daily_treasury_yield_curve&field_tdr_date_value={y}&page&_format=csv')
        rows = [r for r in csv.DictReader(io.StringIO(get(url))) if r.get('10 Yr') and r.get('3 Mo')]
        if rows:
            r = max(rows, key=lambda r: time.strptime(r['Date'], '%m/%d/%Y'))
            d = time.strftime('%Y-%m-%d', time.strptime(r['Date'], '%m/%d/%Y'))
            return {'date': d, 'y10': float(r['10 Yr']), 'bill3m': float(r['3 Mo']), 'source_title': 'U.S. Treasury daily par yield curve rates',
                    'source_url': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve'}
    raise ValueError('no rows')
def treasury_fred():
    vals = {}
    for sid in ('DGS10', 'DGS3MO'):
        rows = [r for r in csv.reader(io.StringIO(get(f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}')))][1:]
        vals[sid] = [(d, float(v)) for d, v in rows if v not in ('.', '')]
    d = min(vals['DGS10'][-1][0], vals['DGS3MO'][-1][0])
    pick = lambda s: next(v for dd, v in reversed(vals[s]) if dd <= d)
    return {'date': d, 'y10': pick('DGS10'), 'bill3m': pick('DGS3MO'), 'source_title': 'Federal Reserve H.15 via FRED (DGS10, DGS3MO)',
            'source_url': 'https://fred.stlouisfed.org/series/DGS10'}
for fn in (treasury, treasury_fred):
    try: out['treasury'] = fn(); print('treasury', out['treasury']['date'], out['treasury']['y10'], out['treasury']['bill3m']); break
    except Exception as e: print(f'treasury via {fn.__name__}: {e}')

# ---- CPI ----
try:
    body = json.dumps({'seriesid': ['CUUR0000SA0', 'CUUR0000SA0L1E'], 'startyear': str(now.tm_year - 2), 'endyear': str(now.tm_year)}).encode()
    res = json.loads(get('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json'}))
    # a month BLS did not publish (e.g. October 2025, during the shutdown) comes as '-': skip it
    num = lambda v: float(v) if re.fullmatch(r'-?\d+(\.\d+)?', str(v).strip()) else None
    ser = {s['seriesID']: {f"{d['year']}-{d['period'][1:]}": num(d['value']) for d in s['data'] if d['period'].startswith('M') and d['period'] != 'M13'}
           for s in res['Results']['series']}
    head, core = ser['CUUR0000SA0'], ser['CUUR0000SA0L1E']
    py = lambda k: f'{int(k[:4]) - 1}{k[4:]}'
    m = max(k for k in head if all(x.get(y) for x in (head, core) for y in (k, py(k)))); prev = py(m)
    out['cpi'] = {'month': m, 'yoy': round((head[m] / head[prev] - 1) * 100, 1), 'core_yoy': round((core[m] / core[prev] - 1) * 100, 1),
                  'source_title': 'BLS Consumer Price Index (CPI-U and core, not seasonally adjusted)', 'source_url': 'https://www.bls.gov/cpi/'}
    print('cpi', out['cpi'])
except Exception as e: print(f'cpi: {e}')

# ---- Zillow (U.S. and the app's metros, matched by Zillow region name) ----
ZHVI = 'https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'
ZORI = 'https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv'
names = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'metro_*.json'))):
    w = ((json.load(open(f)).get('price') or {}).get('what') or '')
    mm = re.search(r'\),\s*([^,]+,\s*[A-Z]{2})\s+metro', w)
    if mm: names[mm.group(1)] = os.path.basename(f)[6:-5]
def zillow(url):
    rows = list(csv.reader(io.StringIO(get(url)))); hdr = rows[0]
    dates = [i for i, h in enumerate(hdr) if re.fullmatch(r'\d{4}-\d{2}-\d{2}', h)]
    ir = hdr.index('RegionName'); got = {}
    for r in rows[1:]:
        key = 'us' if r[ir] == 'United States' else names.get(r[ir])
        if not key: continue
        vals = [(hdr[i][:7], float(r[i])) for i in dates if i < len(r) and r[i]]
        if vals: got[key] = vals
    return got
try:
    zv, zr = zillow(ZHVI), zillow(ZORI)
    month = zv['us'][-1][0]
    yoy = lambda v: round((v[-1][1] / v[-13][1] - 1) * 100, 1) if len(v) > 12 else None
    out['zillow'] = {'month': month, 'us': {'zhvi': round(zv['us'][-1][1]), 'zori': round(zr['us'][-1][1]), 'zhvi_yoy': yoy(zv['us']), 'zori_yoy': yoy(zr['us'])},
                     'metros': {k: {'zhvi': round(zv[k][-1][1]) if k in zv else None, 'zori': round(zr[k][-1][1]) if k in zr else None} for k in sorted(set(names.values()))},
                     'source_title': 'Zillow Home Value Index (ZHVI, mid tier, smoothed, seasonally adjusted) and Zillow Observed Rent Index (ZORI, smoothed). Data: Zillow Group',
                     'source_url': 'https://www.zillow.com/research/data/', 'files': [ZHVI, ZORI]}
    print('zillow', month, out['zillow']['us'], sum(1 for v in out['zillow']['metros'].values() if v['zhvi'] and v['zori']), 'metros')
except Exception as e: print(f'zillow: {e}')

json.dump(out, open(OUT, 'w'), indent=1); print('wrote', OUT)
