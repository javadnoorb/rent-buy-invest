#!/usr/bin/env python3
"""Fetch ZIP-code figures into data/zip/<first two digits>.json, so a page looks up a ZIP with one small file:

- Rent by bedrooms: HUD Small Area Fair Market Rents (40th-percentile gross rent of recent movers, by ZIP code, for
  ZIPs in metropolitan areas), public U.S. government data from huduser.gov.
- Median home value, contract rent, gross rent and real-estate taxes for the ZIP Code Tabulation Area (Census ACS
  5-year summary files, tables B25077, B25058, B25064, B25103), public domain.
- The county each ZIP belongs to: the county holding most of the ZCTA's land (Census 2020 ZCTA-to-county
  relationship file), public domain.
Each row: [county FIPS, value, contract rent, tax, gross rent, [0BR..4BR] or null]. Existing files are kept if the
download fails or looks short.
Run: python3 scripts/fetch_zips.py [out_dir]
"""
import csv, io, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_lite
from acs_sf import SF, sf_lines
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'zip')
PAGE = 'https://www.huduser.gov/portal/datasets/fmr.html'
REL = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt'
HEADERS = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 rent-buy-invest',
           'Accept': 'text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8', 'Referer': PAGE}

def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=300) as r: body = r.read()
    if binary and body[:2] != b'PK': raise ValueError('not a spreadsheet: ' + body[:120].decode('utf-8', 'replace'))
    return body if binary else body.decode('utf-8', 'replace')
num = lambda v: (lambda x: x if x and x > 0 else None)(float(v)) if v not in (None, '', '.') and re.fullmatch(r'-?\d+(\.\d+)?', str(v).strip()) else None
now = time.gmtime()

# ---- ZIP → county (largest land area) ----
rel = csv.DictReader(io.StringIO(get(REL)), delimiter='|')
best = {}
for r in rel:
    z, c, a = r.get('GEOID_ZCTA5_20'), r.get('GEOID_COUNTY_20'), float(r.get('AREALAND_PART') or 0)
    if z and c and (z not in best or a > best[z][1]): best[z] = (c, a)
county = {z: c for z, (c, _) in best.items()}
print('ZIP to county:', len(county))

# ---- ACS by ZCTA ----
acs, span, acs_url = {}, None, None
for y in range(now.tm_year - 1, now.tm_year - 5, -1):
    try:
        vals = {}
        for t, col in (('b25077', 'B25077_E001'), ('b25058', 'B25058_E001'), ('b25103', 'B25103_E001'), ('b25064', 'B25064_E001')):
            hdr, rows = sf_lines(SF.format(y=y) + f'data/5YRData/acsdt5y{y}-{t}.dat', ('860Z200US',))
            i = hdr.index(col)
            for r in rows: vals.setdefault(r[0][-5:], {})[col] = num(r[i])
        if len(vals) > 25000: acs, span, acs_url = vals, f'{y - 4}–{y}', SF.format(y=y); break
        print(f'ACS {y}: only {len(vals)} ZCTAs')
    except Exception as e: print(f'ACS {y}: {e}')
print('ACS ZCTAs:', len(acs), span)

# ---- HUD Small Area FMRs ----
def safmr_links():
    page = get(PAGE); links = []
    for href in re.findall(r'href="([^"]+\.xlsx)"', page, re.I):
        m = re.search(r'fy_?(\d{2,4})_safmrs?(_revised)?\.xlsx$', href.rsplit('/', 1)[-1], re.I)
        if m: fy = int(m.group(1)); links.append((fy + 2000 if fy < 100 else fy, bool(m.group(2)), urllib.request.urljoin(PAGE, href)))
    return [u for *_, u in sorted(set(links), reverse=True)]
def parse_safmr(data):
    rows = xlsx_lite.rows(data)
    norm = lambda c: re.sub(r'\s+', ' ', str(c or '')).strip().lower()
    hi = next(i for i, r in enumerate(rows[:20]) if r and any(norm(c).startswith('zip') for c in r))
    hdr = [norm(c) for c in rows[hi]]
    iz = next(i for i, h in enumerate(hdr) if h.startswith('zip'))
    ib = [next(i for i, h in enumerate(hdr) if re.fullmatch(f'safmr ?{b} ?br', h)) for b in range(5)]
    out = {}
    for r in rows[hi + 1:]:
        if not r or len(r) <= max(ib + [iz]) or r[iz] is None: continue
        z = str(int(r[iz])) if isinstance(r[iz], float) else str(r[iz]).strip()
        try: out[z.zfill(5)] = [round(float(r[i])) for i in ib]
        except (TypeError, ValueError): continue
    return out
safmr, safmr_url = {}, None
try:
    for url in safmr_links():
        try: safmr = parse_safmr(get(url, binary=True)); safmr_url = url
        except Exception as e: print(f'{url}: {e}'); continue
        print(f'{url}: {len(safmr)} ZIPs')
        if len(safmr) > 15000: break
except Exception as e: print(f'SAFMR: {e}')

# ---- write ----
if len(county) < 30000 or len(acs) < 25000:
    print('ZIP data incomplete; keeping the existing files'); sys.exit(0)
if len(safmr) < 15000: safmr, safmr_url = {}, None; print('no usable Small Area FMRs; writing ZIP values without HUD rents')
fy = re.search(r'fy_?(\d{2,4})', (safmr_url or '').rsplit('/', 1)[-1], re.I)
meta = {'acs': {'t': f'Census ACS 5-year {span}, ZIP Code Tabulation Areas, tables B25077, B25058, B25103, B25064', 'u': acs_url},
        'safmr': {'t': f'HUD Small Area Fair Market Rents FY{int(fy.group(1)) + (2000 if len(fy.group(1)) == 2 else 0)}', 'u': safmr_url} if safmr_url else None,
        'rel': {'t': 'Census 2020 ZCTA to county relationship file (county with the most land)', 'u': REL},
        'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', now)}
groups = {}
for z, c in county.items():
    v = acs.get(z) or {}
    if not v.get('B25077_E001') and z not in safmr: continue
    groups.setdefault(z[:2], {})[z] = [c] + [round(v[k]) if v.get(k) else None for k in ('B25077_E001', 'B25058_E001', 'B25103_E001', 'B25064_E001')] + [safmr.get(z)]
os.makedirs(OUT, exist_ok=True)
for p, d in groups.items(): json.dump({'meta': meta, 'zips': d}, open(os.path.join(OUT, f'{p}.json'), 'w'), separators=(',', ':'))
print(f'wrote {OUT}: {sum(len(d) for d in groups.values())} ZIPs in {len(groups)} files, {sum(1 for d in groups.values() for r in d.values() if r[5])} with HUD rents')
