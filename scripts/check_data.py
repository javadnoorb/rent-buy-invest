#!/usr/bin/env python3
"""Sanity checks for a data refresh: compares data/ in the working tree with the last commit (HEAD) and exits 1, listing
every problem, if anything looks implausible. The tests catch broken data; this catches data that is well-formed but
wrong (a shifted column, a units change, a source returning a stale or partial file). Run after scripts/apply_public.py.
Run: python3 scripts/check_data.py
"""
import glob, json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
problems = []

def bad(msg): problems.append(msg)

def load(path):
    p = os.path.join(ROOT, path)
    return json.load(open(p)) if os.path.exists(p) else None

def old(path):
    try: return json.loads(subprocess.run(['git', 'show', f'HEAD:{path}'], cwd=ROOT, capture_output=True, check=True, text=True).stdout)
    except (subprocess.CalledProcessError, ValueError): return None

def vals(series):
    v = (series or {}).get('values') or {}
    return v if isinstance(v, dict) else {}

# ---- monthly series: nothing lost, small revisions, plausible new months ----
RATES = {'mort': (1.0, 20.0), 'tbill': (0.0, 20.0), 'gs10': (0.0, 20.0)}  # percent levels
new_m, old_m = load('data/monthly.json') or {}, old('data/monthly.json') or {}
for key, s in new_m.items():
    if not isinstance(s, dict) or 'values' not in s: continue
    v, v0 = vals(s), vals(old_m.get(key))
    if len(v) < len(v0): bad(f'monthly {key}: {len(v0)} months before, {len(v)} now')
    if v0 and max(v) < max(v0): bad(f'monthly {key}: latest month went back from {max(v0)} to {max(v)}')
    months = sorted(v)
    for i, m in enumerate(months):
        x, x0 = v[m], v0.get(m)
        if key == 'sp_ret':
            if abs(x) > 0.35: bad(f'monthly sp_ret {m}: {x:+.1%} in one month')
            if x0 is not None and abs(x - x0) > 0.02: bad(f'monthly sp_ret {m}: revised {x0:+.4f} → {x:+.4f}')
            continue
        if key in RATES:
            lo, hi = RATES[key]
            if not lo <= x <= hi: bad(f'monthly {key} {m}: {x}% outside {lo}–{hi}%')
            if x0 is not None and abs(x - x0) > 0.5: bad(f'monthly {key} {m}: revised {x0} → {x}')
            if m not in v0 and i and abs(x - v[months[i - 1]]) > 1.5: bad(f'monthly {key} {m}: moved {x - v[months[i - 1]]:+.2f} points in a month')
            continue
        # price indexes (CPI, rent CPI, FHFA)
        if x0 is not None and abs(x / x0 - 1) > 0.03: bad(f'monthly {key} {m}: revised {x0} → {x} ({x / x0 - 1:+.1%})')
        if m not in v0 and i and abs(x / v[months[i - 1]] - 1) > 0.05: bad(f'monthly {key} {m}: {x / v[months[i - 1]] - 1:+.1%} in one month')

# ---- snapshot mortgage rates (updated from Freddie Mac by the refresh) ----
sn, sn0 = load('data/snapshot.json') or {}, old('data/snapshot.json') or {}
for k in ('rate30', 'rate15'):
    x, x0 = (sn.get('values') or {}).get(k), (sn0.get('values') or {}).get(k)
    if x is None: continue
    if not 1 <= x <= 20: bad(f'snapshot {k}: {x}% outside 1–20%')
    if x0 is not None and abs(x - x0) > 2: bad(f'snapshot {k}: moved {x0} → {x} in one refresh')

# ---- metro files: home-price index, rent growth, ACS tax rate ----
for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'metro_*.json'))):
    rel = os.path.relpath(f, ROOT); m, m0 = json.load(open(f)), old(rel) or {}
    h, h0 = vals(m.get('hpi')), vals(m0.get('hpi'))
    if len(h) < len(h0): bad(f'{rel}: home-price index lost years ({len(h0)} → {len(h)})')
    for y, x in h.items():
        x0 = h0.get(y)
        if x is not None and x0 and abs(x / x0 - 1) > 0.05: bad(f'{rel}: home-price index {y} revised {x0} → {x}')
    ys = sorted(y for y in h if h[y] is not None)
    for a, b in zip(ys, ys[1:]):
        g = h[b] / h[a] - 1
        if not -0.4 <= g <= 0.6: bad(f'{rel}: home prices {g:+.0%} in {b}')
    for y, g in ((m.get('rent_hist') or {}).get('growth_pct') or {}).items():
        if g is not None and not -30 <= g <= 30: bad(f'{rel}: rent growth {g}% in {y}')
    t = (m.get('acs') or {}).get('eff_tax_pct')
    if t is not None and not 0.05 <= t <= 5: bad(f'{rel}: property-tax rate {t}% outside 0.05–5%')

# ---- counties ----
c, c0 = load('data/counties.json'), old('data/counties.json')
if c:
    rows = c.get('rows') or []
    if len(rows) < 3000: bad(f'counties: only {len(rows)} rows')
    us = c.get('us') or {}
    if not 100000 <= (us.get('P') or 0) <= 1500000: bad(f"counties: U.S. median value {us.get('P')}")
    for fips, name, P, rent, tax, *rest in rows:
        if not 10000 <= P <= 5000000: bad(f'counties {name}: median value {P}')
        if rent is not None and not 100 <= rent <= 6000: bad(f'counties {name}: median rent {rent}')
        if tax is not None and tax / P > 0.06: bad(f'counties {name}: tax {tax} on value {P}')
    if c0:
        prev = {r[0]: r for r in c0.get('rows') or []}
        if len(rows) < 0.95 * len(prev): bad(f'counties: {len(prev)} rows before, {len(rows)} now')
        uP0 = (c0.get('us') or {}).get('P')
        if uP0 and us.get('P') and abs(us['P'] / uP0 - 1) > 0.25: bad(f"counties: U.S. median value {uP0} → {us['P']}")
        both = [(r, prev[r[0]]) for r in rows if r[0] in prev]
        jumps = [r[1] for r, p in both if abs(r[2] / p[2] - 1) > 0.5]
        if both and len(jumps) > 0.02 * len(both): bad(f'counties: {len(jumps)} of {len(both)} median values changed by more than 50% (e.g. {", ".join(jumps[:3])})')

# ---- HUD Fair Market Rents by county ----
fm, fm0 = load('data/county_fmr.json'), old('data/county_fmr.json')
if fm:
    r = fm.get('rows') or {}
    if len(r) < 3000: bad(f'county FMRs: only {len(r)} counties')
    for fips, v in r.items():
        if len(v) != 5 or not all(150 <= x <= 12000 for x in v): bad(f'county FMRs {fips}: {v}')
        elif not v[0] <= v[2] * 1.2 or not v[2] <= v[4] * 1.05: bad(f'county FMRs {fips}: bedroom rents out of order {v}')
    if fm0:
        r0 = fm0.get('rows') or {}
        if len(r) < 0.95 * len(r0): bad(f'county FMRs: {len(r0)} counties before, {len(r)} now')
        both = [k for k in r if k in r0 and r0[k][2]]
        jumps = [k for k in both if abs(r[k][2] / r0[k][2] - 1) > 0.4]
        if both and len(jumps) > 0.02 * len(both): bad(f'county FMRs: {len(jumps)} of {len(both)} 2-bedroom rents changed by more than 40%')

# ---- FHFA county price indexes (one file per state) ----
hp_files = sorted(glob.glob(os.path.join(ROOT, 'data', 'county_hpi', '*.json')))
if hp_files:
    n = 0
    for f in hp_files:
        rel = os.path.relpath(f, ROOT); d, d0 = json.load(open(f)).get('counties') or {}, (old(rel) or {}).get('counties') or {}
        n += len(d)
        if len(d) < 0.95 * len(d0): bad(f'{rel}: {len(d0)} counties before, {len(d)} now')
        for fips, v in d.items():
            ys = sorted(v, key=int)
            for a, b in zip(ys, ys[1:]):
                if int(b) == int(a) + 1 and v[a] and not -0.45 <= v[b] / v[a] - 1 <= 0.7: bad(f'{rel} {fips}: prices {v[b] / v[a] - 1:+.0%} in {b}')
            p = d0.get(fips) or {}
            lost = [y for y in p if y not in v]
            if len(lost) > 2: bad(f'{rel} {fips}: lost years {lost[:5]}')
            # compare yearly changes, not levels, so a new base year is not a revision
            rev = [b for a, b in zip(ys, ys[1:]) if a in p and b in p and p[a] and v[a] and abs((v[b] / v[a]) - (p[b] / p[a])) > 0.05]
            if len(rev) > 3: bad(f'{rel} {fips}: {len(rev)} past yearly changes revised by more than 5 points')
    if n < 2500: bad(f'county price indexes: only {n} counties')

# ---- header-card figures (Treasury, CPI, Zillow) ----
mk, mk0 = load('data/market.json') or {}, old('data/market.json') or {}
t, t0 = mk.get('treasury'), mk0.get('treasury') or {}
if t:
    for k in ('y10', 'bill3m'):
        if not 0 <= t[k] <= 15: bad(f'Treasury {k}: {t[k]}% outside 0–15%')
        if t0.get(k) is not None and abs(t[k] - t0[k]) > 1.5: bad(f'Treasury {k}: moved {t0[k]} → {t[k]}')
    if t0.get('date') and t['date'] < t0['date']: bad(f"Treasury date went back {t0['date']} → {t['date']}")
c_, c0_ = mk.get('cpi'), mk0.get('cpi') or {}
if c_:
    for k in ('yoy', 'core_yoy'):
        if not -5 <= c_[k] <= 20: bad(f'CPI {k}: {c_[k]}% outside -5–20%')
    if c0_.get('month') and c_['month'] < c0_['month']: bad(f"CPI month went back {c0_['month']} → {c_['month']}")
z, z0 = mk.get('zillow'), mk0.get('zillow') or {}
if z:
    u, u0 = z['us'], z0.get('us') or {}
    if not 100000 <= u['zhvi'] <= 2000000 or not 500 <= u['zori'] <= 8000: bad(f'Zillow U.S.: value {u["zhvi"]}, rent {u["zori"]}')
    for k in ('zhvi', 'zori'):
        if u0.get(k) and abs(u[k] / u0[k] - 1) > 0.05: bad(f'Zillow U.S. {k}: {u0[k]} → {u[k]}')
    full = {k: v for k, v in z['metros'].items() if v.get('zhvi') and v.get('zori')}
    if len(full) < 20: bad(f'Zillow: only {len(full)} metros matched')
    for k, v in full.items():
        p = (z0.get('metros') or {}).get(k) or {}
        if not 50000 <= v['zhvi'] <= 5000000 or not 300 <= v['zori'] <= 10000: bad(f'Zillow {k}: value {v["zhvi"]}, rent {v["zori"]}')
        for q in ('zhvi', 'zori'):
            if p.get(q) and abs(v[q] / p[q] - 1) > 0.08: bad(f'Zillow {k} {q}: {p[q]} → {v[q]}')
    if z0.get('month') and z['month'] < z0['month']: bad(f"Zillow month went back {z0['month']} → {z['month']}")

# ---- ZIP codes (one file per first two digits) ----
zf = sorted(glob.glob(os.path.join(ROOT, 'data', 'zip', '*.json')))
if zf:
    n = nr = jumps = both = 0
    for f in zf:
        rel = os.path.relpath(f, ROOT); d, d0 = json.load(open(f)).get('zips') or {}, (old(rel) or {}).get('zips') or {}
        n += len(d)
        if len(d) < 0.9 * len(d0): bad(f'{rel}: {len(d0)} ZIPs before, {len(d)} now')
        for z, (c, val, rent, tax, gross, sa) in d.items():
            if val is not None and not 10000 <= val <= 10000000: bad(f'{rel} {z}: median value {val}')
            if sa:
                nr += 1
                if not all(150 <= x <= 15000 for x in sa): bad(f'{rel} {z}: HUD rents {sa}')
                p = (d0.get(z) or [None] * 6)[5]
                if p and p[2]: both += 1; jumps += abs(sa[2] / p[2] - 1) > 0.4
    if n < 25000: bad(f'ZIP codes: only {n}')
    if nr and nr < 15000: bad(f'ZIP codes: only {nr} with HUD rents')
    if both and jumps > 0.02 * both: bad(f'ZIP codes: {jumps} of {both} 2-bedroom rents changed by more than 40%')

# ---- homeowners insurance by state ----
ic, ic0 = load('data/insurance.json') or {}, old('data/insurance.json') or {}
if ic.get('states'):
    if len(ic['states']) < 48: bad(f"insurance: only {len(ic['states'])} states")
    for n, v in list(ic['states'].items()) + [('U.S.', ic.get('us'))]:
        if not v or not 200 <= v <= 12000: bad(f'insurance {n}: {v}/yr')
        p = (ic0.get('states') or {}).get(n) if n != 'U.S.' else ic0.get('us')
        if p and v and abs(v / p - 1) > 0.4: bad(f'insurance {n}: {p} → {v}')
    pp = ic.get('ppi') or {}
    if pp.get('latest') and pp.get('base_year_avg') and not 0.7 <= pp['latest'] / pp['base_year_avg'] <= 1.8: bad(f"insurance price index ratio {pp['latest'] / pp['base_year_avg']:.2f}")

if problems:
    print(f'data check failed ({len(problems)} problem{"s" if len(problems) > 1 else ""}):')
    for p in problems[:60]: print('  ' + p)
    if len(problems) > 60: print(f'  … and {len(problems) - 60} more')
    for p in problems[:20]: print(f'::error::{p}')
    sys.exit(1)
print('data check passed')
