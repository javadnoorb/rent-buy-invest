#!/usr/bin/env python3
"""Fetch homeowners-insurance costs by state into data/insurance.json, from public U.S. government data:

- What owners pay: the weighted median yearly fire, hazard and flood insurance (INSP) of owner-occupied one-family
  homes, by state and for the U.S., from the Census ACS 1-year Public Use Microdata Sample (public domain). These
  state files are large (about 0.5 GB in all), so they are read only when a new survey year is out.
- Price trend since the survey year: the BLS producer price index for homeowners insurance (PCU5241265241262), so the
  build can bring the medians to today's prices.
- Property tax of new buyers: from the same files, the weighted median of yearly real-estate taxes ÷ value (TAXAMT ÷
  VALP) for owners who moved in within about four years (MV 1–3) and for all owners, by state. In states that cap
  assessments, long-time owners pay less than a new buyer will; the build scales each location's Census tax rate by
  recent ÷ all for its state.
Keeps the existing file if a part fails.
Run: python3 scripts/fetch_insurance.py [out.json]
"""
import csv, io, json, os, re, sys, time, urllib.request, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'insurance.json')
PUMS = 'https://www2.census.gov/programs-surveys/acs/data/pums/{y}/1-Year/csv_h{st}.zip'
STATES = {'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas', 'ca': 'California', 'co': 'Colorado', 'ct': 'Connecticut',
          'de': 'Delaware', 'dc': 'District of Columbia', 'fl': 'Florida', 'ga': 'Georgia', 'hi': 'Hawaii', 'id': 'Idaho', 'il': 'Illinois',
          'in': 'Indiana', 'ia': 'Iowa', 'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
          'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi', 'mo': 'Missouri', 'mt': 'Montana', 'ne': 'Nebraska',
          'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey', 'nm': 'New Mexico', 'ny': 'New York', 'nc': 'North Carolina',
          'nd': 'North Dakota', 'oh': 'Ohio', 'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island',
          'sc': 'South Carolina', 'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah', 'vt': 'Vermont', 'va': 'Virginia',
          'wa': 'Washington', 'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming'}
UA = {'User-Agent': 'rent-buy-invest data refresh'}

def get(url, data=None, headers=None):
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers={**UA, **(headers or {})}), timeout=600) as r: return r.read()

def wmedian(pairs):
    pairs.sort(); tot = sum(w for _, w in pairs); acc = 0
    for v, w in pairs:
        acc += w
        if acc >= tot / 2: return v
    return None

def state_rows(data):
    """From one state's housing file, for owner-occupied one-family homes: [(insurance, weight)] of those paying
    insurance, and [(tax ÷ value, weight, moved in within ~4 years)] of those paying property tax."""
    z = zipfile.ZipFile(io.BytesIO(data)); name = next(n for n in z.namelist() if n.lower().endswith('.csv'))
    ins_out, tax_out = [], []
    with z.open(name) as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding='utf-8', errors='replace')):
            if r.get('TEN') not in ('1', '2') or r.get('BLD') not in ('02', '2', '03', '3'): continue  # owned; one-family detached or attached
            try: ins, w = float(r.get('INSP') or 0), float(r.get('WGTP') or 0)
            except ValueError: continue
            if w <= 0: continue
            if ins > 0: ins_out.append((ins * float(r.get('ADJHSG') or 1e6) / 1e6, w))
            try: tax, val, mv = float(r.get('TAXAMT') or 0), float(r.get('VALP') or 0), int(r.get('MV') or 0)
            except ValueError: continue
            if tax > 0 and val >= 10000 and tax / val < 0.1: tax_out.append((tax / val, w, 1 <= mv <= 3))
    return ins_out, tax_out

def state_values(data): return state_rows(data)[0]

def tax_summary(rows):
    """{'recent','all','ratio','n_recent'} from (rate, weight, recent) rows, or None if too few recent buyers."""
    rec = [(v, w) for v, w, r in rows if r]
    if len(rec) < 60 or len(rows) < 200: return None
    a, b = wmedian(list(rec)), wmedian([(v, w) for v, w, _ in rows])
    return {'recent': round(a * 100, 3), 'all': round(b * 100, 3), 'ratio': round(a / b, 3), 'n_recent': len(rec)}

old = json.load(open(OUT)) if os.path.exists(OUT) else {}
out = dict(old); now = time.gmtime()

# ---- ACS PUMS medians (only when a newer survey year is available) ----
year = None
for y in range(now.tm_year - 1, now.tm_year - 4, -1):
    try:
        urllib.request.urlopen(urllib.request.Request(PUMS.format(y=y, st='vt'), headers=UA, method='HEAD'), timeout=60); year = y; break
    except Exception as e: print(f'PUMS {y}: {e}')
if year and (old.get('year') != year or not old.get('ptax_movers')):
    states, allv, failed, ptax, allt = {}, [], [], {}, []
    for st, nm in STATES.items():
        try:
            v, t = state_rows(get(PUMS.format(y=year, st=st)))
            if len(v) >= 200: states[nm] = round(wmedian(list(v))); allv += v
            else: failed.append(st)
            ts = tax_summary(t)
            if ts: ptax[nm] = ts
            allt += t
        except Exception as e: print(f'PUMS {year} {st}: {e}'); failed.append(st)
    if len(states) >= 48:
        out['ptax_movers'] = {'states': ptax, 'us': tax_summary(allt), 'year': year,
                              'what': 'weighted median of property tax ÷ value, owner-occupied one-family homes: moved in within about 4 years (MV 1-3) vs all owners'}
        print('property tax, recent buyers vs all:', out['ptax_movers']['us'], {k: v['ratio'] for k, v in list(ptax.items())[:8]})
        out.update(year=year, us=round(wmedian(allv)), states=states,
                   source_title=f'Census ACS {year} 1-year Public Use Microdata Sample: median yearly fire, hazard and flood insurance (INSP) of owner-occupied one-family homes, weighted',
                   source_url='https://www.census.gov/programs-surveys/acs/microdata.html')
        print(f'PUMS {year}: {len(states)} states, U.S. median ${out["us"]:,}' + (f'; missing {failed}' if failed else ''))
    else: print(f'PUMS {year}: only {len(states)} states; keeping the existing medians')
elif year: print(f'PUMS {year}: already have it')

# ---- BLS PPI for homeowners insurance: survey-year average and latest month ----
try:
    if out.get('year'):
        body = json.dumps({'seriesid': ['PCU5241265241262'], 'startyear': str(out['year']), 'endyear': str(now.tm_year)}).encode()
        res = json.loads(get('https://api.bls.gov/publicAPI/v1/timeseries/data/', body, {'Content-Type': 'application/json'}))
        pts = {f"{d['year']}-{d['period'][1:]}": float(d['value']) for d in res['Results']['series'][0]['data']
               if d['period'].startswith('M') and d['period'] != 'M13' and re.fullmatch(r'\d+(\.\d+)?', d['value'])}
        base = [v for k, v in pts.items() if k.startswith(str(out['year']))]
        last = max(pts)
        if len(base) >= 6:
            out['ppi'] = {'series': 'PCU5241265241262', 'base_year_avg': round(sum(base) / len(base), 3), 'latest_month': last,
                          'latest': pts[last], 'source_url': 'https://data.bls.gov/timeseries/PCU5241265241262'}
            print('PPI', out['ppi'])
except Exception as e: print(f'PPI: {e}')

out['fetched_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', now)
json.dump(out, open(OUT, 'w'), indent=1); print('wrote', OUT)
