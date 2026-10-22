#!/usr/bin/env python3
"""Merge the public-data extract (scripts/fetch_public.py) and FHFA extract (scripts/fetch_fhfa.py) into data/*.json.
Usage: python scripts/apply_public.py public_extract.json [fhfa_extract.json]
Updates: metro rent histories (BLS), ACS property tax and rent-by-bedrooms (Census), homeowners-insurance trend (BLS PPI),
latest Freddie Mac rates in the snapshot, national CPI/rent/mortgage monthly series, and FHFA indexes when given."""
import json, math, os, sys, statistics as st
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
pub = json.load(open(sys.argv[1])); fh = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None
B = pub['bls']
REG = {'boston':'northeast','new-york':'northeast','philadelphia':'northeast','washington-dc':'south','raleigh':'south','charlotte':'south','atlanta':'south','tampa':'south','miami':'south','chicago':'midwest','minneapolis':'midwest','cleveland':'midwest','detroit':'midwest','dallas':'south','austin':'south','denver':'west','phoenix':'west','las-vegas':'west','los-angeles':'west','san-diego':'west','san-francisco':'west','seattle':'west','portland':'west'}
ACS_NAME = {'boston':'Boston-Cambridge','new-york':'New York-Newark','washington-dc':'Washington-Arlington','philadelphia':'Philadelphia-Camden','raleigh':'Raleigh','charlotte':'Charlotte-Concord','atlanta':'Atlanta-Sandy Springs','tampa':'Tampa-St. Petersburg','miami':'Miami-Fort Lauderdale','chicago':'Chicago-Naperville','minneapolis':'Minneapolis-St. Paul','cleveland':'Cleveland, OH','detroit':'Detroit-Warren','dallas':'Dallas-Fort Worth','austin':'Austin-Round Rock','denver':'Denver-Aurora','phoenix':'Phoenix-Mesa','las-vegas':'Las Vegas-Henderson','los-angeles':'Los Angeles-Long Beach','san-diego':'San Diego','san-francisco':'San Francisco-Oakland','seattle':'Seattle-Tacoma','portland':'Portland-Vancouver'}
FHFA_CBSA = {'boston':'14454','new-york':'35614','washington-dc':'47764','philadelphia':'37964','raleigh':'39580','charlotte':'16740','atlanta':'12054','tampa':'45294','miami':'33124','chicago':'16984','minneapolis':'33460','cleveland':'17410','detroit':'19804','dallas':'19124','austin':'12420','denver':'19740','phoenix':'38060','las-vegas':'29820','los-angeles':'31084','san-diego':'41740','san-francisco':'41884','seattle':'42644','portland':'38900'}
BLS_URL = 'https://data.bls.gov/timeseries/'
def months(k):
    by = {}
    for key, x in (B.get(k) or {}).get('values', {}).items():
        y, p = key.split('-')
        if p.startswith('M') and p != 'M13': by.setdefault(int(y), {})[p] = x
    return by
def growth(k):
    by = months(k); g = {}
    for y in sorted(by):
        if y - 1 in by:
            c = sorted(set(by[y]) & set(by[y - 1]))
            if c: g[y] = sum(by[y][p] for p in c) / sum(by[y - 1][p] for p in c) - 1
    return g
def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None
# ---------- ACS tables ----------
acs = pub.get('acs_sf') or {}
T = {t: {r[0]: dict(zip(v['header'], r)) for r in v['rows']} for t, v in (acs.get('tables') or {}).items()}
names = acs.get('names') or {}
def acs_row(prefix):
    hits = [g for g, n in names.items() if n.startswith(prefix)]
    return hits[0] if len(hits) == 1 else None
def rent_ratios(geo):
    b = T['b25031'].get(geo); base = num(b and b['B25031_E001'])
    if not base: return None
    return {k: round(num(b[f'B25031_E00{i}']) / base, 3) for i, k in [(2, '0'), (3, '1'), (4, '2'), (5, '3'), (6, '4')] if num(b[f'B25031_E00{i}'])}
year = acs.get('year')
# ---------- per metro ----------
for slug, reg in REG.items():
    f = D(f'metro_{slug}.json'); m = json.load(open(f))
    own, leg, rg = growth(f'rent_{slug}'), growth(f'rent_legacy_{slug}'), growth(f'rent_reg_{reg}_A')
    if len((B.get(f'rent_legacy_{slug}') or {}).get('values', {})) < 50: leg = {}
    ser, src = {}, {}
    for y in range(1987, 2026):
        for g, s in ((own, 'metro'), (leg, 'metro_pre2018'), (rg, 'region')):
            if y in g: ser[str(y)] = round(g[y] * 100, 3); src[str(y)] = s; break
    if ser:
        ids = {'metro': (B.get(f'rent_{slug}') or {}).get('id') if own else None, 'metro_pre2018': (B.get(f'rent_legacy_{slug}') or {}).get('id') if leg else None, 'region': (B.get(f'rent_reg_{reg}_A') or {}).get('id')}
        m['rent_hist'] = {'growth_pct': ser, 'source_by_year': src, 'series': ids,
            'source_title': 'BLS CPI-U rent of primary residence, annual average of published months (public domain)',
            'source_url': BLS_URL + (ids['metro'] or ids['metro_pre2018'] or ids['region']),
            'note': 'Years without a metro series use the BLS regional large-metro (size A) rent index.'}
    if T and acs_row(ACS_NAME[slug]):
        g = acs_row(ACS_NAME[slug]); tax, val = num(T['b25103'][g]['B25103_E001']), num(T['b25077'][g]['B25077_E001'])
        m['acs'] = {'year': year, 'geo_id': g, 'name': names[g], 'median_tax': tax, 'median_value': val, 'eff_tax_pct': round(tax / val * 100, 3) if tax and val else None,
                    'median_gross_rent': num(T['b25064'][g]['B25064_E001']), 'rent_ratio_by_bedrooms': rent_ratios(g),
                    'source_title': f'Census ACS {year} 1-year: B25103 median real estate taxes, B25077 median value, B25031 median gross rent by bedrooms (public domain)',
                    'source_url': 'https://www.census.gov/programs-surveys/acs/data/summary-file.html'}
    if fh:
        q = fh['metro_po_quarterly'].get(FHFA_CBSA[slug], {}).get('q', {})
        vals = {k[:4]: v['nsa'] for k, v in sorted(q.items()) if k.endswith('-04') and v['nsa'] is not None}
        if vals and 'hpi' in m:
            m['hpi']['values'] = vals; last = sorted(q)[-1]; m['hpi']['latest'] = {'period': f"{last[:4]}Q{int(last[5:])}", 'value': q[last]['nsa']}
    json.dump(m, open(f, 'w'), indent=1)
# ---------- national: ACS ratios, owner bedrooms, insurance trend ----------
nat = {}
us = [g for g in T.get('b25031', {}) if g.startswith('0100000US')]
if us:
    nat['rent_ratio_by_bedrooms'] = rent_ratios(us[0]); nat['acs_year'] = year
    b = T['b25042'][us[0]]; tot = num(b['B25042_E002'])
    nat['owner_bedroom_share'] = {k: round(num(b[f'B25042_E00{i}']) / tot, 3) for i, k in [(3, '0'), (4, '1'), (5, '2'), (6, '3'), (7, '4'), (8, '5+')]}
ins, cpi = months('ppi_home_ins'), months('cpi_all_us')
if ins and cpi:
    y1 = max(y for y in ins if 'M12' in ins[y] and 'M12' in cpi.get(y, {}))
    def cagr(s, a, b): return (s[b]['M12'] / s[a]['M12']) ** (1 / (b - a)) - 1
    nat['insurance'] = {'series': B['ppi_home_ins']['id'], 'source_url': BLS_URL + B['ppi_home_ins']['id'], 'through': y1,
        'ppi_cagr_long': round(cagr(ins, 1998, y1) * 100, 2), 'cpi_cagr_long': round(cagr(cpi, 1998, y1) * 100, 2),
        'excess_long': round((cagr(ins, 1998, y1) - cagr(cpi, 1998, y1)) * 100, 2),
        'excess_10y': round((cagr(ins, y1 - 10, y1) - cagr(cpi, y1 - 10, y1)) * 100, 2)}
json.dump(nat, open(D('national_public.json'), 'w'), indent=1)
# ---------- monthly national series ----------
mo = json.load(open(D('monthly.json')))
for key, sid in (('cpi', 'cpi_all_us'), ('rent', 'rent_us')):
    if B.get(sid):
        mo[key]['values'] = {f"{k[:4]}-{k[6:]}": v for k, v in sorted(B[sid]['values'].items()) if k[5] == 'M' and k[5:] != 'M13'}
pm = pub.get('pmms')
if pm:
    h = pm['header']; i30, i15 = h.index('pmms30'), h.index('pmms15'); wk = {}
    for r in pm['rows']:
        try:
            mth, day, yr = r[0].split('/'); v = float(r[i30])
        except (ValueError, IndexError): continue
        wk.setdefault(f'{yr}-{int(mth):02d}', []).append(v)
    mo['mort']['values'].update({k: round(sum(v) / len(v), 3) for k, v in wk.items() if k >= '1986-12'})
    last = pm['rows'][-1]; snap = json.load(open(D('snapshot.json')))
    try:
        mth, day, yr = last[0].split('/'); import datetime
        dt = datetime.date(int(yr), int(mth), int(day)); lab = dt.strftime('%b %-d %Y')
        r30, r15 = float(last[i30]), float(last[i15])
        snap['values']['rate30'], snap['values']['rate15'], snap['rateDate'] = r30, r15, lab
        for it in snap['items']:
            if it['k'] == '30-yr mortgage': it.update(v=f'{r30:.2f}%', s=lab, val=r30)
            if it['k'] == '15-yr mortgage': it.update(v=f'{r15:.2f}%', s=lab, val=r15)
        snap['sources']['pmms'] = {'t': f'Freddie Mac Primary Mortgage Market Survey, {lab}', 'u': 'https://www.freddiemac.com/pmms'}
        json.dump(snap, open(D('snapshot.json'), 'w'), indent=1)
    except (ValueError, IndexError): pass
if fh and fh.get('us_po_monthly'):
    mo['fhfa']['values'] = {k: v['nsa'] for k, v in sorted(fh['us_po_monthly'].items()) if v['nsa'] is not None}
json.dump(mo, open(D('monthly.json'), 'w'))
print('applied: metros', len(REG), '| acs', year, '| insurance', nat.get('insurance', {}).get('excess_long'), '| pmms', bool(pm), '| fhfa', bool(fh))
