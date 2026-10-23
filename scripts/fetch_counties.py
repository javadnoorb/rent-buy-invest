#!/usr/bin/env python3
"""Fetch county housing figures from the Census ACS 5-year estimates into data/counties.json.

For every U.S. county: median home value (B25077), median contract rent (B25058) and median real-estate taxes paid
(B25103). The national medians are stored too, so the app can scale each county to today's national Zillow figures.
Uses the public Census API (no key needed at this volume). Keeps the existing file if the download fails or looks short.
Run: python3 scripts/fetch_counties.py [out.json]
"""
import json, os, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'counties.json')
VARS = 'NAME,B25077_001E,B25058_001E,B25103_001E'
API = 'https://api.census.gov/data/{y}/acs/acs5?get=' + VARS + '&for={geo}'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data refresh'})
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode('utf-8'))

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
        P, rent, tax = num(r[ix['B25077_001E']]), num(r[ix['B25058_001E']]), num(r[ix['B25103_001E']])
        if not P: continue
        out.append([r[ix['state']] + r[ix['county']], r[ix['NAME']], round(P), round(rent) if rent else None, round(tax) if tax else None])
    u = dict(zip(us[0], us[1]))
    return {'year': year, 'span': f'{year - 4}–{year}',
            'source_title': f'U.S. Census Bureau, American Community Survey 5-year estimates {year - 4}–{year}, tables B25077, B25058, B25103',
            'source_url': API.format(y=year, geo='county:*'),
            'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'us': {'P': num(u['B25077_001E']), 'rent': num(u['B25058_001E']), 'tax': num(u['B25103_001E'])},
            'fields': ['fips', 'name', 'medianValue', 'medianContractRent', 'medianTax'],
            'rows': sorted(out, key=lambda r: r[0])}

this_year = time.gmtime().tm_year
for y in range(this_year - 1, this_year - 5, -1):  # newest release first (5-year data come out each December)
    try:
        d = fetch(y)
    except Exception as e:
        print(f'ACS 5-year {y}: {e}'); continue
    if len(d['rows']) < 3000 or not d['us']['P']:
        print(f'ACS 5-year {y}: only {len(d["rows"])} counties, skipping'); continue
    json.dump(d, open(OUT, 'w'), separators=(',', ':'))
    print(f'wrote {OUT}: {len(d["rows"])} counties, ACS {d["span"]}')
    break
else:
    print('no county data fetched; keeping the existing file'); sys.exit(0)
