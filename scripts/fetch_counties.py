#!/usr/bin/env python3
"""Fetch county housing figures from the Census ACS 5-year estimates into data/counties.json.

For every U.S. county: median home value (B25077), median contract rent (B25058), median real-estate taxes paid
(B25103) and median gross rent, which adds tenant-paid utilities (B25064). The national medians are stored too, so the app can scale each county to today's national Zillow figures.
Tries the Census API first, then the ACS table-based summary files on www2.census.gov (no key; the API often refuses
requests from shared CI runners). Keeps the existing file if both fail or the result looks short.
Run: python3 scripts/fetch_counties.py [out.json]
"""
import json, os, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'counties.json')
VARS = 'NAME,B25077_001E,B25058_001E,B25103_001E,B25064_001E'
API = 'https://api.census.gov/data/{y}/acs/acs5?get=' + VARS + '&for={geo}'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data refresh'})
    with urllib.request.urlopen(req, timeout=120) as r: body = r.read().decode('utf-8', 'replace')
    try: return json.loads(body)
    except ValueError: raise ValueError('not JSON: ' + body[:200].replace('\n', ' '))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from acs_sf import SF, sf_lines

def fetch_sf(year):
    """Same figures from the 5-year summary files: one file per table, plus the geography file for county names."""
    pre = ('0500000US', '0100000US'); vals = {}
    for t, col in (('b25077', 'B25077_E001'), ('b25058', 'B25058_E001'), ('b25103', 'B25103_E001'), ('b25064', 'B25064_E001')):
        hdr, rows = sf_lines(SF.format(y=year) + f'data/5YRData/acsdt5y{year}-{t}.dat', pre)
        i = hdr.index(col)
        for r in rows: vals.setdefault(r[0], {})[col] = r[i]
    hdr, rows = sf_lines(SF.format(y=year) + f'documentation/Geos{year}5YR.txt', ('0500000US',))
    ig, iname = hdr.index('GEO_ID'), hdr.index('NAME'); names = {r[ig]: r[iname] for r in rows}
    out = []
    for g, v in vals.items():
        if not g.startswith('0500000US') or g not in names: continue
        P, rent, tax, gross = (num(v.get(k)) for k in ('B25077_E001', 'B25058_E001', 'B25103_E001', 'B25064_E001'))
        if P: out.append([g[-5:], names[g], round(P), round(rent) if rent else None, round(tax) if tax else None, round(gross) if gross else None])
    u = vals.get('0100000US', {})
    return {'year': year, 'span': f'{year - 4}–{year}',
            'source_title': f'U.S. Census Bureau, American Community Survey 5-year estimates {year - 4}–{year}, tables B25077, B25058, B25103, B25064 (summary files)',
            'source_url': SF.format(y=year),
            'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'us': {'P': num(u.get('B25077_E001')), 'rent': num(u.get('B25058_E001')), 'tax': num(u.get('B25103_E001')), 'gross': num(u.get('B25064_E001'))},
            'fields': ['fips', 'name', 'medianValue', 'medianContractRent', 'medianTax', 'medianGrossRent'],
            'rows': sorted(out, key=lambda r: r[0])}

def num(x):
    try: v = float(x)
    except (TypeError, ValueError): return None
    return v if v > 0 else None  # the API marks missing estimates with large negative codes

def fetch(year):
    rows = get(API.format(y=year, geo='county:*'))
    us = get(API.format(y=year, geo='us:1'))
    hdr = rows[0]; ix = {k: hdr.index(k) for k in hdr}
    out = []
    for r in rows[1:]:
        P, rent, tax, gross = (num(r[ix[k]]) for k in ('B25077_001E', 'B25058_001E', 'B25103_001E', 'B25064_001E'))
        if not P: continue
        out.append([r[ix['state']] + r[ix['county']], r[ix['NAME']], round(P), round(rent) if rent else None, round(tax) if tax else None, round(gross) if gross else None])
    u = dict(zip(us[0], us[1]))
    return {'year': year, 'span': f'{year - 4}–{year}',
            'source_title': f'U.S. Census Bureau, American Community Survey 5-year estimates {year - 4}–{year}, tables B25077, B25058, B25103, B25064',
            'source_url': API.format(y=year, geo='county:*'),
            'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'us': {'P': num(u['B25077_001E']), 'rent': num(u['B25058_001E']), 'tax': num(u['B25103_001E']), 'gross': num(u.get('B25064_001E'))},
            'fields': ['fips', 'name', 'medianValue', 'medianContractRent', 'medianTax', 'medianGrossRent'],
            'rows': sorted(out, key=lambda r: r[0])}

this_year = time.gmtime().tm_year
for y in range(this_year - 1, this_year - 5, -1):  # newest release first (5-year data come out each December)
    d = None
    for how, fn in (('API', fetch), ('summary files', fetch_sf)):
        try:
            d = fn(y)
        except Exception as e:
            print(f'ACS 5-year {y} via {how}: {e}'); continue
        if len(d['rows']) >= 3000 and d['us']['P']: break
        print(f'ACS 5-year {y} via {how}: only {len(d["rows"])} counties'); d = None
    if not d: continue
    json.dump(d, open(OUT, 'w'), separators=(',', ':'))
    print(f'wrote {OUT}: {len(d["rows"])} counties, ACS {d["span"]}')
    break
else:
    print('no county data fetched; keeping the existing file'); sys.exit(0)
