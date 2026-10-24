#!/usr/bin/env python3
"""National rent-to-price ratio of owner-occupied homes, yearly, from two public U.S. government series (via FRED):
  rent:  BEA, PCE imputed rental of owner-occupied nonfarm housing, billions of dollars a year (DOWNRC1A027NBEA)
  value: Federal Reserve Z.1, households' owner-occupied real estate incl. vacant land and mobile homes at market
         value, millions of dollars, quarterly (HOOREVLMHMV)
ratio(year) = rent(year) / average value over the year's quarters. This is the construction behind Davis, Lehnert and
Martin's rent-price ratio, from the same public sources. The Backtest's "Historical" starting rent scales the user's
own rent-to-price ratio by ratio(purchase year) / ratio(latest year).
Run: python3 scripts/fetch_rent_price.py   (writes data/rent_price.json; keeps the old file if a download fails)"""
import csv, io, json, os, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'rent_price.json')
RENT, VALUE = 'DOWNRC1A027NBEA', 'HOOREVLMHMV'
URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id={}'
UA = {'User-Agent': 'rent-buy-invest data fetch (https://github.com/javadnoorb/rent-buy-invest)'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r: return r.read().decode('utf-8', 'replace')

def parse_fred(text):
    """FRED graph CSV (date column, then the series) -> [(YYYY-MM-DD, float)], skipping missing values ('.')."""
    rows = list(csv.reader(io.StringIO(text)))
    out = []
    for row in rows[1:]:
        if len(row) < 2: continue
        try: out.append((row[0], float(row[1])))
        except ValueError: pass
    return out

def ratios(rent, value):
    """Yearly rent (billions) and quarterly value (millions) -> {year: rent / mean value of that year's quarters},
    for years with all four quarters."""
    q = {}
    for d, v in value: q.setdefault(int(d[:4]), []).append(v)
    out = {}
    for d, r in rent:
        y = int(d[:4]); vs = q.get(y, [])
        if len(vs) == 4: out[y] = round(r * 1000 / (sum(vs) / 4), 5)
    return out

if __name__ == '__main__':
    try:
        rr = ratios(parse_fred(get(URL.format(RENT))), parse_fred(get(URL.format(VALUE))))
    except Exception as e:
        print(f'rent-to-price fetch failed ({e}); keeping {OUT}', file=sys.stderr); sys.exit(0)
    if len(rr) < 40 or not all(0.02 < v < 0.12 for v in rr.values()):
        print(f'rent-to-price: implausible result ({len(rr)} years); keeping {OUT}', file=sys.stderr); sys.exit(0)
    json.dump({'source_title': 'National rent-to-price ratio of owner-occupied homes: BEA imputed rent of owner-occupied '
                               'housing ÷ Federal Reserve Z.1 market value of owner-occupied real estate (via FRED)',
               'source_url': 'https://fred.stlouisfed.org/series/DOWNRC1A027NBEA',
               'sources': {'rent': f'https://fred.stlouisfed.org/series/{RENT}', 'value': f'https://fred.stlouisfed.org/series/{VALUE}'},
               'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
               'ratio': {str(k): v for k, v in sorted(rr.items())}}, open(OUT, 'w'), indent=1)
    print(f'rent-to-price: {min(rr)}–{max(rr)}, latest {rr[max(rr)]:.4f}')
