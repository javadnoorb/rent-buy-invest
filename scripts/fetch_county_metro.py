#!/usr/bin/env python3
"""Which of the app's metros each county belongs to, from the Census Bureau's CBSA delineation file (public domain),
into data/county_metro.json: {county FIPS: metro slug}. A county in one of the metros then uses that metro's BLS rent
history, which exists only for metros. The metro's CBSA code comes from its ACS geography in data/metro_<slug>.json.
Keeps the existing file if the download fails or looks short.
Run: python3 scripts/fetch_county_metro.py [out.json]
"""
import glob, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_lite
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'county_metro.json')
URLS = ['https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/{y}/delineation-files/list1_{y}.xlsx'.format(y=y)
        for y in (2025, 2023, 2020)]

def metro_cbsas():
    """{CBSA code: slug} for the app's metros."""
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'metro_*.json'))):
        g = ((json.load(open(f)).get('acs') or {}).get('geo_id') or '')
        m = re.search(r'US(\d{5})$', g)
        if m: out[m.group(1)] = os.path.basename(f)[6:-5]
    return out

def parse(data, cbsas):
    """{county FIPS: slug} from the delineation workbook, for counties in the given CBSAs."""
    rows = xlsx_lite.rows(data)
    hi = next(i for i, r in enumerate(rows[:10]) if r and any(str(c or '').strip().lower() == 'cbsa code' for c in r))
    hdr = [str(c or '').strip().lower() for c in rows[hi]]
    ic, ist, ico = hdr.index('cbsa code'), hdr.index('fips state code'), hdr.index('fips county code')
    out = {}
    for r in rows[hi + 1:]:
        if not r or len(r) <= max(ic, ist, ico) or r[ic] is None or r[ist] is None: continue
        code = str(int(r[ic])) if isinstance(r[ic], float) else str(r[ic]).strip()
        if code in cbsas:
            st = str(int(r[ist])) if isinstance(r[ist], float) else str(r[ist]).strip()
            co = str(int(r[ico])) if isinstance(r[ico], float) else str(r[ico]).strip()
            out[st.zfill(2) + co.zfill(3)] = cbsas[code]
    return out

if __name__ == '__main__':
    cbsas = metro_cbsas(); print('metros with a CBSA code:', len(cbsas))
    for url in URLS:
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data refresh'}), timeout=120) as r: data = r.read()
            got = parse(data, cbsas)
        except Exception as e: print(f'{url}: {e}'); continue
        print(f'{url}: {len(got)} counties in {len(set(got.values()))} metros')
        if len(set(got.values())) >= len(cbsas) - 2 and len(got) >= 100:
            json.dump({'source_title': 'U.S. Census Bureau, CBSA delineation file (counties in each metropolitan area)', 'source_url': url,
                       'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'counties': dict(sorted(got.items()))}, open(OUT, 'w'), indent=0)
            print('wrote', OUT); break
    else: print('no usable delineation file; keeping the existing one')
