#!/usr/bin/env python3
"""Convert data/monthly.json (raw levels) into aligned monthly returns for the app."""
import json, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
raw = json.load(open(os.path.join(ROOT, 'data', 'monthly.json')))

def series(k):
    s = raw.get(k) or {}
    v = s.get('values') or {}
    return {d[:7]: x for d, x in v.items() if x is not None}

cs, cpi, rent, mort, tb, g10 = (series(k) for k in ('fhfa', 'cpi', 'rent', 'mort', 'tbill', 'gs10'))
sp = series('sp')
sp_ret = series('sp_ret') if raw.get('sp_ret') else {}

def months(a, b):
    y, m = map(int, a.split('-')); out = []
    while f'{y:04d}-{m:02d}' <= b:
        out.append(f'{y:04d}-{m:02d}'); m += 1
        if m > 12: y, m = y + 1, 1
    return out

def prev(d):
    y, m = map(int, d.split('-')); m -= 1
    if m == 0: y, m = y - 1, 12
    return f'{y:04d}-{m:02d}'

def sp_total(d):
    if sp_ret and d in sp_ret: return sp_ret[d] / 100 if abs(sp_ret[d]) > 1 else sp_ret[d]
    p = prev(d)
    if d in sp and p in sp:
        cur, pr = sp[d], sp[p]
        price, div = (cur[0], cur[1]) if isinstance(cur, list) else (cur, 0)
        pprice = pr[0] if isinstance(pr, list) else pr
        return (price + (div or 0) / 12) / pprice - 1
    return None

out = {k: [] for k in ('dates', 'gh', 'gr', 'rs', 'rb', 'rc', 'inf', 'mkt')}
missing = {}
for d in months('1987-01', '2026-12'):
    p = prev(d)
    vals = {
        'gh': cs[d] / cs[p] - 1 if d in cs and p in cs else None,
        'gr': rent[d] / rent[p] - 1 if d in rent and p in rent else None,
        'inf': cpi[d] / cpi[p] - 1 if d in cpi and p in cpi else None,
        'rs': sp_total(d),
        'rc': tb[p] / 1200 if p in tb else None,
        'rb': (g10[p] / 1200 - 7.5 * (g10[d] - g10[p]) / 100) if d in g10 and p in g10 else None,
        'mkt': mort[d] / 100 if d in mort else None,
    }
    bad = [k for k, v in vals.items() if v is None]
    if bad:
        missing[d] = bad
        if len(out['dates']) and d > out['dates'][-1]:
            # stop at the first gap after data begins
            break
        continue
    out['dates'].append(d)
    for k, v in vals.items(): out[k].append(round(v, 7))
print('months', len(out['dates']), out['dates'][:1], out['dates'][-1:], 'first gap', list(missing.items())[:3])
if len(out['dates']) < 120:
    print('too short; not writing'); sys.exit(1)
out['ghK'] = (raw.get('fhfa') or {}).get('volK') or 1
out['ghSource'] = 'FHFA purchase-only (U.S., monthly NSA)'
json.dump(out, open(os.path.join(ROOT, 'data', 'monthly_processed.json'), 'w'))
