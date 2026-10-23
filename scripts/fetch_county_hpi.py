#!/usr/bin/env python3
"""Fetch FHFA's annual county house price indexes into data/county_hpi/<state FIPS>.json.

FHFA's all-transactions county indexes (Bogin, Doerner & Larson 2016, FHFA Working Paper 16-01) are labeled
developmental; small counties have gaps. One file per state keeps what a page loads small: {county FIPS: {year: index}}.
Public data of a U.S. federal agency from fhfa.gov. Existing files are kept if the download fails or looks short.
Run: python3 scripts/fetch_county_hpi.py [out_dir]
"""
import json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_lite
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'county_hpi')
PAGE = 'https://www.fhfa.gov/data/hpi/datasets'
KNOWN = ['https://www.fhfa.gov/hpi/download/annual/hpi_at_bdl_county.xlsx', 'https://www.fhfa.gov/hpi/download/annual/hpi_at_bdl_county.csv']

def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data refresh'})
    with urllib.request.urlopen(req, timeout=180) as r: body = r.read()
    return body if binary else body.decode('utf-8', 'replace')

def candidates():
    urls = []
    try:
        page = get(PAGE)
        for href in re.findall(r'href="([^"]+)"', page):
            if re.search(r'county', href, re.I) and re.search(r'\.(xlsx|csv)$', href, re.I) and re.search(r'at|annual|bdl', href, re.I):
                urls.append(urllib.request.urljoin(PAGE, href))
    except Exception as e:
        print(f'dataset page: {e}')
    return list(dict.fromkeys(urls + KNOWN))

def table(url, data):
    if url.lower().endswith('.csv'):
        import csv, io
        return [[(float(c) if re.fullmatch(r'-?\d+(\.\d+)?', c.strip()) else c) for c in r] for r in csv.reader(io.StringIO(data.decode('utf-8', 'replace')))]
    return xlsx_lite.rows(data)

def parse(rows):
    """{county FIPS: {year: index}} using the HPI column (a missing value is '.')."""
    hi = next(i for i, r in enumerate(rows[:30]) if r and any(isinstance(c, str) and 'fips' in c.lower() for c in r) and any(isinstance(c, str) and c.strip().lower() == 'year' for c in r))
    hdr = [str(c or '').strip().lower() for c in rows[hi]]
    ifips, iyear = next(i for i, h in enumerate(hdr) if 'fips' in h), hdr.index('year')
    ihpi = next(i for i, h in enumerate(hdr) if h == 'hpi')
    out = {}
    for r in rows[hi + 1:]:
        if not r or len(r) <= max(ifips, iyear, ihpi): continue
        f, y, v = r[ifips], r[iyear], r[ihpi]
        if f is None or y is None or not isinstance(v, float): continue
        f = str(int(f)) if isinstance(f, float) else str(f).strip()
        out.setdefault(f.zfill(5), {})[str(int(float(y)))] = round(v, 2)
    return out

for url in candidates():
    try: data = get(url, binary=True)
    except Exception as e: print(f'{url}: {e}'); continue
    try: series = parse(table(url, data))
    except Exception as e: print(f'{url}: could not read ({e})'); continue
    print(f'{url}: {len(series)} counties')
    if len(series) < 2500: continue
    os.makedirs(OUT, exist_ok=True)
    by_state = {}
    for f, s in series.items(): by_state.setdefault(f[:2], {})[f] = s
    meta = {'source_title': 'FHFA House Price Index, annual, counties (all-transactions; developmental index, not seasonally adjusted)',
            'source_url': url, 'page': PAGE, 'cite': 'Bogin, Doerner & Larson (2016), "Local House Price Dynamics: New Indices and Stylized Facts", FHFA Working Paper 16-01',
            'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'last_year': max(int(y) for s in series.values() for y in s)}
    for st, d in by_state.items():
        json.dump({'meta': meta, 'counties': d}, open(os.path.join(OUT, f'{st}.json'), 'w'), separators=(',', ':'))
    print(f'wrote {OUT}: {len(series)} counties in {len(by_state)} state files, through {meta["last_year"]}')
    break
else:
    print('no county price data fetched; keeping the existing files')
