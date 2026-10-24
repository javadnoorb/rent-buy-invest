#!/usr/bin/env python3
"""Flood insurance by county from FEMA's OpenFEMA data (public domain), into data/flood.json:

- How common it is: NFIP Residential Penetration Rates (policies in force ÷ residential structures, and the share of
  structures in the Special Flood Hazard Area, where lenders require flood insurance), one small file.
- What it costs: the median yearly cost (premium plus fees, `policyCost`) of NFIP policies on single-family primary
  residences that took effect in the past year, from the NfipPolicies dataset, queried county by county for counties
  where at least 1% of homes carry a policy (other counties use their state's median).
The app's default flood cost for a location is the average across all homes: share insured × typical cost
(metros: their counties weighted by number of homes). pen = {county: [share insured, share in SFHA, homes]}.
Queries run 8 at a time (about 5 minutes in all). Only re-downloads the policy sample when the file is older than 25 days. Keeps the existing file on failure.
Run: python3 scripts/fetch_flood.py [out.json] [--max-counties N]
"""
import csv, io, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = args[0] if args else os.path.join(ROOT, 'data', 'flood.json')
MAXC = int(sys.argv[sys.argv.index('--max-counties') + 1]) if '--max-counties' in sys.argv else 10 ** 9
PEN = 'https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates.csv'
API = 'https://www.fema.gov/api/open/v3/NfipPolicies'
H = {'User-Agent': 'rent-buy-invest data refresh (github.com/javadnoorb/rent-buy-invest)', 'Accept': 'application/json'}

def get(url, t=120):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=t) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (400, 404) or k == 2: raise
        except Exception:
            if k == 2: raise
        time.sleep(3 * (k + 1))

def parse_pen(text):
    """{county FIPS: {'take': policies ÷ structures, 'sfha': share of structures in the SFHA, 'n': policies}}"""
    out = {}
    for r in csv.DictReader(io.StringIO(text)):
        try: s, c, ss = float(r['totalResStructures'] or 0), float(r['resContractsInForce'] or 0), float(r['totalResStructuresSfha'] or 0)
        except (KeyError, ValueError): continue
        if s > 0: out[r['fipsCode'].zfill(5)] = {'take': round(c / s, 4), 'sfha': round(ss / s, 4), 'n': int(c), 's': int(s), 'state': r.get('state')}
    return out

def median(v): v = sorted(v); return v[len(v) // 2] if v else None

def costs(filt, since):
    """Yearly costs of single-family primary-residence policies effective since `since` matching filt (up to 1,000)."""
    q = {'$filter': f"{filt} and policyEffectiveDate ge '{since}' and primaryResidenceIndicator eq true and (occupancyType eq 1 or occupancyType eq 11)",
         '$select': 'policyCost,policyCount', '$top': '1000'}
    d = json.loads(get(API + '?' + urllib.parse.urlencode(q)))
    rows = d.get('NfipPolicies') or []
    return [r['policyCost'] / max(1, r.get('policyCount') or 1) for r in rows if (r.get('policyCost') or 0) > 0]

if __name__ == '__main__':
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    now = time.gmtime(); since = time.strftime('%Y-%m-%d', time.gmtime(time.time() - 365 * 86400))
    try: pen = parse_pen(get(PEN).decode('utf-8', 'replace'))
    except Exception as e: print('penetration rates:', e); sys.exit(0)
    print('counties with penetration rates:', len(pen))
    fresh = old.get('fetched_utc') and time.time() - time.mktime(time.strptime(old['fetched_utc'], '%Y-%m-%dT%H:%M:%SZ')) < 25 * 86400
    cost, state_cost = dict(old.get('cost') or {}), dict(old.get('state_cost') or {})
    if not fresh or '--force' in sys.argv:
        # one query per state and per county with enough policies, 8 at a time
        states = sorted({k[:2] for k, v in pen.items() if v.get('state')})
        counties = [f for f, v in sorted(pen.items(), key=lambda kv: -kv[1]['n']) if v['take'] >= 0.01 and v['n'] >= 200][:MAXC]
        def median_cost(code):
            try:
                c = costs(f"startswith(censusGeoid,'{code}')", since)
                return code, (round(median(c)) if len(c) >= 30 else None)
            except Exception as e:
                print('query', code, e); return code, None
        with ThreadPoolExecutor(max_workers=8) as ex:
            state_cost = {k: v for k, v in ex.map(median_cost, states) if v}
            cost = {k: v for k, v in ex.map(median_cost, counties) if v}
        print(f'policy costs: {len(cost)} counties, {len(state_cost)} states')
    if len(pen) < 2500 or len(state_cost) < 30: print('flood data incomplete; keeping the existing file'); sys.exit(0)
    json.dump({'source_title': 'FEMA OpenFEMA: NFIP Residential Penetration Rates and NFIP policies (single-family primary residences, median yearly cost incl. fees, policies effective in the past year)',
               'source_url': 'https://www.fema.gov/about/openfema/data-sets', 'since': since, 'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', now),
               'pen': {k: [v['take'], v['sfha'], v['s']] for k, v in sorted(pen.items())}, 'cost': dict(sorted(cost.items())), 'state_cost': dict(sorted(state_cost.items()))},
              open(OUT, 'w'), separators=(',', ':'))
    print('wrote', OUT)
