#!/usr/bin/env python3
"""Assemble index.html from src/ and data/."""
import json, glob, os, math, re, sys
PWA = '--pwa' in sys.argv
ROOT = os.path.dirname(os.path.abspath(__file__))
D = lambda *p: os.path.join(ROOT, *p)
# --out PATH writes somewhere other than index.html (e.g. dist/artifact.html for the Claude artifact build)
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else D('index.html')
if '--watch' in sys.argv:
    # rebuild whenever anything under src/ or data/ changes (Ctrl-C to stop)
    import subprocess, time
    args = [a for a in sys.argv[1:] if a != '--watch']
    stamp = lambda: max(os.path.getmtime(p) for p in glob.glob(D('src', '**', '*'), recursive=True) + glob.glob(D('data', '*.json')) + [D('build.py')])
    last = None
    while True:
        s = stamp()
        if s != last:
            last = s
            r = subprocess.run([sys.executable, __file__] + args, capture_output=True, text=True)
            print(time.strftime('%H:%M:%S'), (r.stdout or r.stderr).strip().splitlines()[-1])
        time.sleep(0.5)

snap = json.load(open(D('data', 'snapshot.json')))

# ---------- header-card figures fetched by scripts/fetch_market.py (data/market.json) ----------
# Treasury yields, CPI and Zillow's typical value and rent replace the hand-entered snapshot figures when present, each
# with its own date and source; "data as of" becomes the newest automatic date (mortgage rates or Treasury yields).
MARKET = json.load(open(D('data', 'market.json'))) if os.path.exists(D('data', 'market.json')) else {}
import datetime as _dt
def _mon(ym): return _dt.date(int(ym[:4]), int(ym[5:7]), 1).strftime('%b %Y')
def _card(k, **kw):
    for it in snap['items']:
        if it['k'] == k: it.update(kw)
tr, cp, zw = MARKET.get('treasury'), MARKET.get('cpi'), MARKET.get('zillow')
if tr:
    day = _dt.date.fromisoformat(tr['date']).strftime('%b %-d %Y')
    snap['values'].update(tsy10=tr['y10'], tbill=tr['bill3m'])
    _card('10-yr Treasury', v=f"{tr['y10']:.2f}%", s=day, val=tr['y10'])
    snap['sources']['tsy'] = {'t': f"{tr['source_title']}: 10-year {tr['y10']:.2f}%, 3-month {tr['bill3m']:.2f}%, {day}", 'u': tr['source_url']}
if cp:
    snap['values'].update(cpiYoY=cp['yoy'], coreYoY=cp['core_yoy'])
    _card('CPI inflation', v=f"{cp['yoy']}% YoY", s=f"{_mon(cp['month'])}, core {cp['core_yoy']}%", val=cp['yoy'])
    snap['sources']['cpi'] = {'t': f"{cp['source_title']}, 12 months to {_mon(cp['month'])}", 'u': cp['source_url']}
if zw:
    u = zw['us']; snap['values'].update(zhvi=u['zhvi'], zori=u['zori'], zoriYoY=u['zori_yoy'])
    _card('Typical home value', v=f"${u['zhvi']:,}", s=f"{_mon(zw['month'])}, Zillow", val=u['zhvi'])
    _card('Typical rent', v=f"${u['zori']:,}/mo", s=f"{_mon(zw['month'])}, {u['zori_yoy']:+.1f}% YoY", val=u['zori'])
    snap['sources']['zillow'] = {'t': f"{zw['source_title']}, {_mon(zw['month'])}", 'u': zw['source_url']}
_dates = [snap.get('asOf')] + ([tr['date']] if tr else [])
try: _dates.append(_dt.datetime.strptime(snap.get('rateDate', ''), '%b %d %Y').date().isoformat())
except ValueError: pass
snap['asOf'] = max(d for d in _dates if d)
res_raw = json.load(open(D('data', 'research.json')))

# ---------- research -> RES (display) + D0 (defaults) ----------
def first_url(e):
    if not e: return None
    if e.get('source_url'): return e['source_url']
    if e.get('sources'): return e['sources'][0].get('url')
    if e.get('estimates'): return e['estimates'][0].get('source_url')
    return None

iv = res_raw['idio_vol']
ten = res_raw['tenure']
tv = ten['value']
# chance of moving: Census CPS Table A-4 mover rates by tenure (data/forecasts_public.json, from scripts/fetch_forecasts.py)
FP = json.load(open(D('data', 'forecasts_public.json'))) if os.path.exists(D('data', 'forecasts_public.json')) else {}
MV = FP.get('movers') or {'year': 2023, 'owner': tv.get('cps_owner_mover_rate_2023') or 0.041, 'renter': tv.get('cps_renter_mover_rate_2023') or 0.162,
                          'url': 'https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/time-series/historic/hst_mig_a_4.xlsx'}
hz = MV['owner']
med_stay = math.log(2) / -math.log(1 - hz)
RES = {
    'idio': {'u': 'https://academic.oup.com/rfs/article/34/8/3695/5974712' if False else first_url(iv),
             'h': 'Flavin &amp; Yamashita (2002): single-house return s.d. ≈ 14%/yr vs 4–6% for city indexes; Giacoletti (2021): 10–18% one-time resale shock'},
    'hazard': {'u': MV['url'],
               'h': f'Census CPS {MV["year"]}: {hz*100:.1f}% of people in owner-occupied homes moved in the past year (a typical stay of about {med_stay:.0f} years at that rate)'},
    'dy': {'u': res_raw['div_yield']['source_url'], 'h': f'S&amp;P 500 trailing yield {res_raw["div_yield"]["value"]*100:.2f}% ({res_raw["div_yield"]["date"]}, multpl estimate)'},
    'spread': {'u': res_raw['margin_rate']['source_url'], 'h': 'Interactive Brokers Pro margin: benchmark + 1.5% under $100k, + 1.0% to $1M'},
    'mortSpread': {'u': res_raw['mortgage_spread']['source_url']},
    'rMove': {'u': MV['url'], 'h': f'Census CPS {MV["year"]}: {MV["renter"]*100:.1f}% of people in rented homes moved (owners {hz*100:.1f}%)'},
    'sell': {'u': first_url(res_raw['sell_costs']), 'h': 'commissions ≈ 5–5.5% (Redfin via Opendoor) plus 1–3% other seller costs'},
    'close': {'u': None, 'h': 'buyer closing costs typically 2–5%'},
    'maint': {'u': first_url(res_raw['maintenance']), 'h': 'Census AHS 2021: median upkeep + improvements 0.6–1.5% of value; rule of thumb 1–3%'},
    'sources': {},
}
for s in (res_raw['sell_costs'].get('sources') or []):
    if 'closing' in s.get('title', '').lower() or 'mortgage reports' in s.get('title', '').lower():
        RES['close']['u'] = s['url']
if not RES['close']['u']:
    RES['close'] = {'u': None, 'h': '<span class="tag">assumption</span> typically 2–5%'}
z = res_raw['zori']['value']
jy = z.get('january_yoy') or {}
RES['zori'] = {'years': [int(y) for y in sorted(jy)], 'yoy': [round(jy[y] * 100, 2) for y in sorted(jy)],
               'u': first_url(res_raw['zori']) or (res_raw['zori'].get('sources') or [{}])[0].get('url'), 't': 'ZORI, January-to-January'}
# research sources list
for k, e in res_raw.items():
    if k.startswith('_'): continue
    for s in (e.get('sources') or []):
        RES['sources'][f'r_{k}_{len(RES["sources"])}'] = {'t': s.get('title'), 'u': s.get('url')}
    for s in (e.get('estimates') or []):
        RES['sources'][f'r_{k}_{len(RES["sources"])}'] = {'t': s.get('source_title'), 'u': s.get('source_url')}
    if e.get('source_url'):
        RES['sources'][f'r_{k}'] = {'t': e.get('source_title'), 'u': e.get('source_url')}
RES['sources'] = {k: v for k, v in RES['sources'].items() if v.get('u') and v.get('t')}

# ---------- realism parameters and forecasts (optional files) ----------
def load(name):
    f = D('data', name)
    return json.load(open(f)) if os.path.exists(f) else None
REAL = load('realism.json') or {}
exec(open(D('build_params.py')).read()) if os.path.exists(D('build_params.py')) else None
D0_EXTRA = globals().get('D0_EXTRA', {'renewGap': 0, 'incGrowth': 3.0, 'stressMult': 2, 'forcedDisc': 3, 'vacR': 7, 'dpR': 25, 'ratePrem': 0.6, 'mgmt': 9})
RES.update(globals().get('RES_EXTRA', {}))
FCST = globals().get('FCST', None)
D0 = {'rMove': round(MV['renter'] * 100, 1), 'close': 3, 'maint': 1.0, 'sell': 6.5, 'dy': round(res_raw['div_yield']['value'] * 100, 2), 'spread': 1.5,
      'hz': round(hz * 100, 1), 'idio': 12, 'rins': (FP.get('renters_ins') or {}).get('value', 0), **D0_EXTRA}
if FP.get('renters_ins'):
    _ri = FP['renters_ins']
    RES['rins'] = {'u': _ri['url'], 'h': f"BLS Consumer Expenditure Survey {_ri['year']}: renters spent ${_ri['value']}/yr on average, counting those without a policy; a policy typically costs more"}

mort = res_raw['mortgage_annual']['value']
# the yearly 30-year rates the model has (model.js MORT, from 1972): the override must have exactly as many, or the model
# silently keeps its built-in list, so take that count from model.js and say when the data has years the model lacks
_mtxt = open(D('src', 'model.js')).read()
_nm = len(re.search(r'let MORT=\[([^\]]*)\]', _mtxt).group(1).split(','))
_my = [str(y) for y in range(1972, 1972 + _nm)]
assert all(y in mort for y in _my), f'research.json mortgage_annual lacks {[y for y in _my if y not in mort]}'
MORT_OVERRIDE = [mort[y] for y in _my]
_extra = sorted(y for y in mort if int(y) >= 1972 + _nm)
if _extra: print(f'warning: research.json has mortgage rates for {", ".join(_extra)}; extend MORT in src/model.js to use them')

# ---------- metros ----------
# ---------- homeowners insurance by state (data/insurance.json, from scripts/fetch_insurance.py) ----------
# Census ACS microdata medians of what owners of one-family homes pay, brought to today's prices with the BLS homeowners-
# insurance price index. Metros use their state (from the Zillow region name, e.g. "Boston, MA"); counties and ZIPs too.
_ABBR = {'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
         'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
         'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
         'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
         'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
         'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
         'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'}
def _nb(rate, abbr):
    return round(rate * NEWK.get(abbr, 1), 3) if rate is not None else None
def _nbt(abbr):
    k = NEWK.get(abbr, 1)
    return f", × {k:.3f} for a new buyer (owners who moved in within about 4 years vs all owners in {_ABBR.get(abbr, abbr)}, ACS microdata)" if abs(k - 1) >= 0.005 else ''
def _abbr(m):
    import re as _re
    mm = _re.search(r',\s*([A-Z]{2})\s+metro', ((m.get('price') or {}).get('what') or ''))
    return mm.group(1) if mm else None
_ins = json.load(open(D('data', 'insurance.json'))) if os.path.exists(D('data', 'insurance.json')) else {}
INS = {'us': snap['values']['insUS'], 'by_name': {}, 'by_abbr': {}, 'src': lambda a: {'t': 'U.S. average premium', 'u': None}}
if _ins.get('states') and _ins.get('us'):
    pp = _ins.get('ppi') or {}; k = pp['latest'] / pp['base_year_avg'] if pp.get('latest') and pp.get('base_year_avg') else 1
    upto = _mon(pp['latest_month']) if pp.get('latest_month') else str(_ins['year'])
    INS['us'] = round(_ins['us'] * k / 10) * 10
    INS['by_name'] = {n: round(v * k / 10) * 10 for n, v in _ins['states'].items()}
    INS['by_abbr'] = {a: INS['by_name'].get(n) for a, n in _ABBR.items()}
    _t = lambda where, v: (f"median paid by owners of one-family homes, {where}, Census ACS {_ins['year']} microdata (${v:,}/yr then), "
                           f"× {k:.3f} BLS homeowners-insurance price index to {upto}")
    INS['src'] = lambda a: ({'t': _t(_ABBR[a], _ins['states'][_ABBR[a]]), 'u': _ins['source_url']} if a in _ABBR and _ABBR[a] in _ins['states']
                            else {'t': _t('U.S.', _ins['us']), 'u': _ins['source_url']})
    snap['values']['insUS'] = INS['us']
    snap['sources']['ins'] = INS['src'](None)

# state rules applied by a location's state: assessment caps (data/state_rules.json, compiled from official state sources)
STATE_RULES = json.load(open(D('data', 'state_rules.json'))) if os.path.exists(D('data', 'state_rules.json')) else {}
STATE_RULES['names'] = {n: a for a, n in _ABBR.items()}
# property tax for a new buyer: Census rates are averages over all owners, including long-time owners whose taxes caps
# hold down; scale them by recent buyers' rate ÷ all owners' rate in the state (ACS microdata, scripts/fetch_insurance.py)
_pm = (_ins.get('ptax_movers') or {})
NEWK = {a: min(1.6, max(0.85, (_pm.get('states') or {}).get(n, {}).get('ratio', 1))) for a, n in _ABBR.items()
        if ((_pm.get('states') or {}).get(n) or {}).get('n_recent', 0) >= 200}
STATE_RULES['newbuyer'] = {'k': NEWK, 'year': _pm.get('year'), 'u': _ins.get('source_url')}
# flood insurance: average yearly cost across all homes = share with an NFIP policy × typical policy cost
FLOOD = json.load(open(D('data', 'flood.json'))) if os.path.exists(D('data', 'flood.json')) else None
def flood_avg(fips_list):
    """(average cost per home, share insured, share in the high-risk zone) over counties, weighted by homes"""
    if not FLOOD: return None
    rows = [(f, FLOOD['pen'][f]) for f in fips_list if f in FLOOD['pen'] and len(FLOOD['pen'][f]) > 2]
    homes = sum(v[2] for _, v in rows)
    if not homes: return None
    cost = lambda f: FLOOD['cost'].get(f) or FLOOD['state_cost'].get(f[:2]) or 0
    avg = sum(v[0] * v[2] * cost(f) for f, v in rows) / homes
    return round(avg / 10) * 10, round(sum(v[0] * v[2] for _, v in rows) / homes, 4), round(sum(v[1] * v[2] for _, v in rows) / homes, 4)
_cm0 = (json.load(open(D('data', 'county_metro.json'))) if os.path.exists(D('data', 'county_metro.json')) else {}).get('counties') or {}
METROS = [{'slug': 'us', 'name': 'United States', 'P': snap['values']['zhvi'], 'rent': snap['values']['zori'],
           'ptax': snap['values']['ptaxUS'], 'ins': snap['values']['insUS'], 'ptaxCap': 0, 'hpi': None, 'src': {}}]
order = ['boston', 'new-york', 'washington-dc', 'philadelphia', 'raleigh', 'charlotte', 'atlanta', 'tampa', 'miami',
         'chicago', 'minneapolis', 'cleveland', 'detroit', 'dallas', 'austin', 'denver', 'phoenix', 'las-vegas',
         'los-angeles', 'san-diego', 'san-francisco', 'seattle', 'portland']
# every metro file must be in the order list (a new one left out would silently not appear)
_files = {os.path.basename(p)[6:-5] for p in glob.glob(D('data', 'metro_*.json'))}
assert _files <= set(order), f'data/metro_*.json not in the build order: {sorted(_files - set(order))}'
for slug in order:
    f = D('data', f'metro_{slug}.json')
    if not os.path.exists(f): continue
    m = json.load(open(f))
    h = m.get('hpi') or {}
    vals = {int(y): v for y, v in (h.get('values') or {}).items() if v is not None}
    def s(k, what=None):
        e = m.get(k) or {}
        if not e.get('source_url'): return None
        t = e.get('what') or e.get('source_title')
        return {'t': t, 'u': e['source_url'], 'd': e.get('date')}
    _cap = (STATE_RULES.get('caps') or {}).get(_abbr(m)) or {}
    cap = _cap.get('cap', 0)
    METROS.append({'slug': slug, 'name': m['name'] + (' metro' if False else ''),
                   'P': (m.get('price') or {}).get('value'), 'rent': (m.get('rent') or {}).get('value'),
                   'ptax': _nb((m.get('acs') or {}).get('eff_tax_pct'), _abbr(m)), 'ins': INS['by_abbr'].get(_abbr(m)) or INS['us'],
                   'ptaxCap': cap, 'ptaxCapCPI': bool(_cap.get('cpi')), 'st': _abbr(m),
                   'acs': ({'rate': _nb((m.get('acs') or {}).get('eff_tax_pct'), _abbr(m)), 'rateAll': (m.get('acs') or {}).get('eff_tax_pct'), 'k': NEWK.get(_abbr(m), 1), 'year': (m.get('acs') or {}).get('year'), 'name': (m.get('acs') or {}).get('name'),
                            'beds': (m.get('acs') or {}).get('rent_ratio_by_bedrooms'), 'u': (m.get('acs') or {}).get('source_url')} if m.get('acs') else None),
                   'rentG': ((m.get('rent_hist') or {}).get('growth_pct')),
                   'rentSrc': ({'t': f"BLS rent index {', '.join(x for x in (m.get('rent_hist') or {}).get('series', {}).values() if x)} (metro years {sum(1 for s in (m.get('rent_hist') or {}).get('source_by_year', {}).values() if s != 'region')}, region otherwise)", 'u': (m.get('rent_hist') or {}).get('source_url')} if m.get('rent_hist') else None),
                   'tt': m.get('transfer_taxes'), 'ttSrc': [{'t': x['name'], 'u': x['source_url']} for x in (m.get('transfer_taxes') or []) if x.get('source_url')],
                   'hpi': {'values': vals, 'basis': h.get('basis'), 'volK': h.get('volK')} if vals else None,
                   'hpiSrc': {'t': f"FHFA purchase-only index, {h.get('area')} ({h.get('basis')}); volatility ratio {h.get('volK')}", 'u': h.get('source_url')} if h.get('source_url') else None,
                   'src': {**{k: s(k) for k in ('price', 'rent')},
                           'ptax': {'t': f"median tax ÷ median value, {(m.get('acs') or {}).get('name', m['name'])}, Census ACS {(m.get('acs') or {}).get('year', '')}" + _nbt(_abbr(m)), 'u': (m.get('acs') or {}).get('source_url')},
                           'ins': INS['src'](_abbr(m))}})
    METROS[-1]['src']['hpi'] = METROS[-1]['hpiSrc']
    _fl = flood_avg([f for f, sl in _cm0.items() if sl == slug])
    if _fl: METROS[-1]['flood'] = {'avg': _fl[0], 'take': _fl[1], 'sfha': _fl[2]}
    z = ((MARKET.get('zillow') or {}).get('metros') or {}).get(slug) or {}
    if z.get('zhvi') and z.get('zori'):
        mo = _mon(MARKET['zillow']['month']); zs = MARKET['zillow']['source_url']
        METROS[-1].update(P=z['zhvi'], rent=z['zori'])
        METROS[-1]['src'].update(price={'t': f"Zillow typical home value (ZHVI), {m['name']}", 'u': zs, 'd': mo},
                                 rent={'t': f"Zillow typical rent (ZORI), {m['name']}", 'u': zs, 'd': mo})

# ---------- national public data and loan rules ----------
NATP = json.load(open(D('data', 'national_public.json'))) if os.path.exists(D('data', 'national_public.json')) else {}
LR = json.load(open(D('data', 'loan_rules.json'))) if os.path.exists(D('data', 'loan_rules.json')) else {}
ins_ = NATP.get('insurance') or {}
D0['insG'] = ins_.get('excess_long', 0)
D0['bedRatio'] = NATP.get('rent_ratio_by_bedrooms') or {}
arm_v = (LR.get('arm') or {}).get('values') or {}
def _find(d, *keys):
    for k in keys:
        if isinstance(d, dict) and d.get(k) is not None: return d[k]
    return None
cur = arm_v.get('current_5_1_arm_rate') or {}; fx = arm_v.get('mba_30yr_fixed_same_week') or {}
ARM_SPREAD = round((fx.get('rate', 0.075) - cur.get('rate', 0.0654)) * 100, 2)
D0['armRate'] = round(snap['values']['rate30'] - ARM_SPREAD, 2)
D0['armMargin'] = 2.75; D0['ptsCut'] = 0.25
RES['insG'] = {'u': ins_.get('source_url'), 'h': f"homeowners insurance prices (BLS PPI) rose {ins_.get('ppi_cagr_long')}%/yr vs CPI {ins_.get('cpi_cagr_long')}% since 1998: {ins_.get('excess_long')} pts faster ({ins_.get('excess_10y')} pts over the last 10 years)"} if ins_ else {}
def _src(k): e = LR.get(k) or {}; return e.get('source_url')
RES['fha'] = {'u': _src('fha'), 'h': 'HUD ML 2023-05: 1.75% upfront (financed); 0.55% a year at >95% LTV (0.50% at ≤95%), for the full term above 90% LTV, 11 years at ≤90%; 3.5% minimum down'}
RES['arm'] = {'u': _src('arm'), 'h': f"MBA survey: 5/1 ARM {cur.get('rate',0)*100:.2f}% vs 30-yr fixed {fx.get('rate',0)*100:.2f}% (week ending {cur.get('week_ending')}), a {ARM_SPREAD}-pt discount applied to today's Freddie Mac rate. Resets every 6 months to 30-day SOFR + margin; the model uses the T-bill rate as the index"}
RES['armMargin'] = {'u': _src('arm'), 'h': 'Fannie Mae allows up to 3%; 2–3% typical. <span class="tag">assumption</span>'}
RES['pts'] = {'u': _src('points'), 'h': 'CFPB: a point has no fixed value in rate terms; ask lenders. <span class="tag">assumption</span>'}
own_sh = (NATP.get('owner_bedroom_share') or {}).get('3')
RES['beds'] = {'u': 'https://www.census.gov/programs-surveys/acs/data/summary-file.html', 'h': f"{round(own_sh*100) if own_sh else '—'}% of owner-occupied homes have 3 bedrooms (ACS {NATP.get('acs_year')}); rent is scaled by the area's median rent for that size vs. all units"}
for k in ('fha', 'arm', 'points', 'sofr'):
    e = LR.get(k) or {}
    t, u = e.get('source_title'), e.get('source_url')
    if not (t and u): continue
    if isinstance(u, list):  # several documents: titles are '; '-separated in the same order; one source (and link) each
        ts = t.split('; ')
        for i, ui in enumerate(u): RES['sources'][f'lr_{k}_{i}'] = {'t': ts[i] if len(ts) == len(u) else f'{t} ({i + 1})', 'u': ui}
        RES['sources'][f'lr_{k}'] = {'t': t, 'u': u[0]}
    else: RES['sources'][f'lr_{k}'] = {'t': t, 'u': u}
for k, key in (('llpa', 'llpa'), ('pmi_fico', 'pmiFico')):
    e = LR.get(k) or {}
    u = e.get('source_url') or (e.get('reference') or {}).get('url')
    if e.get('source_title') and u: RES['sources'][key] = {'t': e['source_title'], 'u': u}
# national rent-to-price ratio by year (scripts/fetch_rent_price.py): the Backtest's "Historical" starting rent
_rp = D('data', 'rent_price.json')
if os.path.exists(_rp):
    _r = json.load(open(_rp))
    RES['rentPrice'] = {int(k): v for k, v in _r['ratio'].items()}
    RES['sources']['rp_bea'] = {'t': 'BEA: imputed rental of owner-occupied nonfarm housing (PCE), yearly (DOWNRC1A027NBEA)', 'u': _r['sources']['rent']}
    RES['sources']['rp_z1'] = {'t': 'Federal Reserve Z.1: households\' owner-occupied real estate at market value, quarterly (HOOREVLMHMV)', 'u': _r['sources']['value']}
for f, key in (('flood.json', 'fema'), ('county_fmr.json', 'hudFmrFile'), ('county_metro.json', 'cbsa')):
    if os.path.exists(D('data', f)):
        e = json.load(open(D('data', f)))
        if e.get('source_title') and e.get('source_url'): RES['sources'][key] = {'t': e['source_title'], 'u': e['source_url']}
if ins_: RES['sources']['ppi_ins'] = {'t': 'BLS PPI: homeowners insurance premiums (PCU5241265241262)', 'u': ins_['source_url']}
RES['sources']['acs'] = {'t': f"Census ACS {NATP.get('acs_year')} 1-year summary file (property tax, home value, rent by bedrooms, bedrooms by tenure)", 'u': 'https://www.census.gov/programs-surveys/acs/data/summary-file.html'}

# ---------- monthly ----------
MONTHLY = None
mf = D('data', 'monthly_processed.json')
if os.path.exists(mf):
    MONTHLY = json.load(open(mf))

# ---------- national home prices from FHFA (public) ----------
# Yearly (December-to-December) changes of FHFA's U.S. purchase-only index from 1992 on, scaled around their own mean by
# volK (the 1992–2025 ratio of Case-Shiller to FHFA yearly-change s.d.; only that ratio is stored) so the swings keep
# Case-Shiller's size. They replace the 1992+ years of HOME in model.js. The header card shows FHFA's latest 12-month change.
def fhfa_national():
    m = json.load(open(D('data', 'monthly.json'))).get('fhfa') or {}
    v = m.get('values') or {}
    if isinstance(v, str): v = json.loads(v.replace("'", '"'))
    ch = {y: (v[f'{y}-12'] / v[f'{y-1}-12'] - 1) * 100 for y in range(1992, 2100) if v.get(f'{y}-12') and v.get(f'{y-1}-12')}
    if not ch: return None, None
    k = float(m.get('volK') or 1); mean = sum(ch.values()) / len(ch)
    last = max(v); prev = f'{int(last[:4]) - 1}{last[4:]}'
    yoy = round((v[last] / v[prev] - 1) * 100, 1) if v.get(prev) else None
    return {y: round(mean + k * (c - mean), 2) for y, c in ch.items()}, (last, yoy)
HOME_OVERRIDE, (hpi_month, hpi_yoy) = fhfa_national()
if hpi_yoy is not None:
    import calendar
    when = f"{calendar.month_abbr[int(hpi_month[5:])]} {hpi_month[:4]}"
    snap['values']['hpiYoY'] = hpi_yoy
    snap['sources']['fhfaUS'] = {'t': f'FHFA purchase-only house price index, U.S., not seasonally adjusted: change over the 12 months to {when}',
                                 'u': 'https://www.fhfa.gov/data/hpi/datasets'}
    card = {'k': 'Home prices (FHFA)', 'v': f"{hpi_yoy:+.1f}% YoY", 's': when, 'src': 'fhfaUS', 'field': 'gh', 'val': hpi_yoy}
    items = [i for i in snap['items'] if i.get('field') != 'gh']
    snap['items'] = items[:3] + [card] + items[3:]  # after the three rate cards

# ---------- counties (optional, from scripts/fetch_counties.py) ----------
# Each county keeps its level relative to the U.S. median in the ACS, scaled to today's national Zillow figures, so a
# county at 1.5× the U.S. median value starts at 1.5× today's typical U.S. home. Insurance uses the state average when
# a metro file has one for that state, else the U.S. average.
COUNTIES = None
cf = D('data', 'counties.json')
if os.path.exists(cf):
    c = json.load(open(cf))
    us = c['us']; kP = snap['values']['zhvi'] / us['P']; kR = snap['values']['zori'] / us['rent'] if us.get('rent') else 1
    state_ins = {n: [v, _ins.get('source_url')] for n, v in INS['by_name'].items()}
    # the page gets only these scaling figures; the installed build fetches data/counties.json the first time someone
    # picks a county (it is served next to the page), while the artifact build, which cannot fetch files, embeds the rows
    # HUD Fair Market Rents by bedrooms (data/county_fmr.json) and FHFA county price indexes (data/county_hpi/<state>.json)
    # are optional; the installed build fetches them with the county list, the artifact build embeds the rents only.
    # Rents: FMRs include utilities, so each is scaled by the county's ACS contract-to-gross rent ratio (U.S. ratio if
    # missing). Price indexes get the median of the metros' FHFA-to-Case-Shiller volatility ratios.
    ff = D('data', 'county_fmr.json'); fmr = json.load(open(ff)) if os.path.exists(ff) else None
    vks = sorted(x for x in ((json.load(open(f)).get('hpi') or {}).get('volK') for f in sorted(glob.glob(D('data', 'metro_*.json')))) if x)
    hpi_dir = D('data', 'county_hpi'); hpi_meta = None
    if os.path.isdir(hpi_dir) and glob.glob(os.path.join(hpi_dir, '*.json')):
        hpi_meta = json.load(open(sorted(glob.glob(os.path.join(hpi_dir, '*.json')))[0]))['meta']
    COUNTIES = {'t': c['source_title'], 'u': c['source_url'], 'span': c['span'], 'kP': round(kP, 4), 'kR': round(kR, 4),
                'cg': round(us['rent'] / us['gross'], 3) if us.get('rent') and us.get('gross') else 0.85,
                'insU': next((v[1] for v in state_ins.values() if v[1]), None), 'stateIns': {k: v[0] for k, v in state_ins.items()},
                'file': 'data/counties.json' if PWA else None, 'rows': None if PWA else c['rows'],
                'fmr': ({'fy': fmr['fiscal_year'], 'u': fmr['source_url'], 'file': 'data/county_fmr.json' if PWA else None, 'rows': None if PWA else fmr['rows']} if fmr else None),
                'zip': ({'dir': 'data/zip/'} if PWA and glob.glob(D('data', 'zip', '*.json')) else None),
                'hpi': ({'t': hpi_meta['source_title'], 'u': hpi_meta['source_url'], 'dir': 'data/county_hpi/', 'volK': vks[len(vks) // 2] if vks else 1} if hpi_meta and PWA else None)}
    # counties inside one of the app's metros borrow its BLS rent history (data/county_metro.json, scripts/fetch_county_metro.py)
    _cm = json.load(open(D('data', 'county_metro.json'))) if os.path.exists(D('data', 'county_metro.json')) else {}
    COUNTIES['metroOf'] = _cm.get('counties') or {}
    # flood insurance (data/flood.json, scripts/fetch_flood.py): loaded with the county list on the site
    COUNTIES['flood'] = ({'file': 'data/flood.json'} if PWA else FLOOD) if FLOOD else None
    COUNTIES['metroOfU'] = _cm.get('source_url')

# the installed (PWA) build serves pinned copies from vendor/; the artifact build can only load from public CDNs
VENDOR = {'plotly': 'vendor/plotly-cartesian-2.35.2.min.js', 'mathjax': 'vendor/mathjax-3.2.2-tex-svg-full.js'}
# the files must exist, and the service worker must precache the same chart library (a stale name there makes its
# install fail, so the installed app would stay on its old cache)
for _v in VENDOR.values(): assert os.path.exists(D(*_v.split('/'))), f'{_v} is missing'
assert "'./" + VENDOR['plotly'] + "'" in open(D('sw.js')).read(), f'sw.js does not precache {VENDOR["plotly"]}: update its CORE list and bump CACHE'
# state rules embedded in the page: county-only parts (local income taxes, county transfer taxes, county exemptions) load
# with the county list on the site (data/state_rules.json); long notes the page does not show are left out
COUNTY_RULE_KEYS = ('local_income', 'county_transfer', 'homestead_county', 'local_income_city_notes', 'transfer_city_notes', 'transfer_state_typical_local')
def _rules_embed():
    out = {}
    for k, v in STATE_RULES.items():
        if k.startswith('_') or (PWA and k in COUNTY_RULE_KEYS): continue
        if k == 'transfer':
            v = {st: {'taxes': [{f: x[f] for f in x if f not in ('notes', 'exemptions', 'source_title')} for x in e.get('taxes', [])]} for st, e in v.items()}
        if k == 'income':
            v = {st: {f: (x[f].split('. ')[0] if f == 'cg' and x[f] else x[f]) for f in x if f not in ('local', 'exemption_credit', 'notes', 't')} for st, x in v.items()}
        out[k] = v
    if PWA: out['countyFile'] = 'data/state_rules.json'
    return out
data_js = (f"const LOCAL_LIBS={json.dumps([VENDOR['plotly']] if PWA else [])};\n"
           "const SNAP=JSON.parse(document.getElementById('snapshot-data').textContent);\n"
           f"const RES={json.dumps(RES)};\nconst D0={json.dumps(D0)};\nconst FCST={json.dumps(FCST)};\n"
           f"const COUNTIES={json.dumps(COUNTIES, separators=(',', ':'))};\n"
           f"const CREDIT={json.dumps({'llpa': LR.get('llpa'), 'pmi': LR.get('pmi_fico')}, separators=(',', ':'))};\n"
           f"const STATE_RULES={json.dumps(_rules_embed(), separators=(',', ':'))};\n"
           f"const METROS={json.dumps(METROS, separators=(',', ':'))};\nconst MONTHLY={json.dumps(MONTHLY, separators=(',', ':'))};\n")

# JSON embedded in <script> must not contain '</' (it would end the script block); '<\/' means the same in JSON and JS
data_js = data_js.replace('</', '<\\/')
css = open(D('src', 'style.css')).read()
body = open(D('src', 'body.html')).read()
model = open(D('src', 'model.js')).read()
app = ''.join(open(f).read() for f in sorted(glob.glob(D('src', 'app', '*.js'))))  # src/app/NN-*.js, concatenated in order
head = '''<title>Rent, Buy or Invest</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=optional">
'''
# Cloudflare Web Analytics, shared with javadnoorb.github.io and its other project pages (the token is
# public by design). Loaded only on the real host, so local runs and CI smoke tests never count as visits.
CF_BEACON = ('<script>if(location.hostname==="javadnoorb.github.io"){const s=document.createElement("script");'
             's.defer=true;s.src="https://static.cloudflareinsights.com/beacon.min.js";'
             's.setAttribute("data-cf-beacon",\'{"token": "6f290669b842490dbf010fffe3a1cbd2"}\');'
             'document.head.appendChild(s)}</script>\n')
mj = '''<script>
window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]']]},options:{enableMenu:false},svg:{fontCache:'global'},startup:{typeset:false}};
</script>
<script>const MATHJAX_SRC="__MJ_SRC__";</script>
'''
mj = mj.replace('__MJ_SRC__', VENDOR['mathjax'] if PWA else 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js')
if PWA:
    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="description" content="Compare buying a home, renting and investing, with sourced market data, backtests and Monte Carlo.">\n'
            '<link rel="manifest" href="manifest.webmanifest">\n'
            f'<link rel="preload" href="{VENDOR["plotly"]}" as="script">\n'
            '<meta name="color-scheme" content="light dark">\n'
            '<meta name="theme-color" content="#f3f5f4" media="(prefers-color-scheme: light)">\n'
            '<meta name="theme-color" content="#0e1312" media="(prefers-color-scheme: dark)">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
            '<meta name="apple-mobile-web-app-title" content="Rent·Buy">\n'
            '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n<link rel="icon" type="image/png" href="icons/favicon-32.png">\n'
            + head + CF_BEACON +
            # hide what the script builds (settings, market cards, answer) until it has; a 4 s fallback if it never runs
            '<script>document.documentElement.classList.add("pre")</script>\n'
            '<style>html.pre .snap,html.pre .layout{visibility:hidden;animation:rbi-show 0s 4s forwards}@keyframes rbi-show{to{visibility:visible}}</style>\n'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'body{margin:0;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%}img{max-width:100%}[hidden]{display:none!important}</style>\n'
            '</head>\n<body>\n')
    tail = ('<script>if("serviceWorker" in navigator&&location.protocol==="https:"){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n'
            '</body>\n</html>\n')
else:
    tail = ''
out = (head + '<style>' + css + '</style>\n' + body +
       '\n<!-- SNAPSHOT: current market figures. Weekly refresh edits only this block. -->\n'
       '<script id="snapshot-data" type="application/json">\n' + json.dumps(snap, indent=1).replace('</', '<\\/') + '\n</script>\n' + mj +
       '<script id="model-script">\n"use strict";\nconst MORT_OVERRIDE=' + json.dumps(MORT_OVERRIDE) + ';\nconst HOME_OVERRIDE=' + json.dumps(HOME_OVERRIDE) + ';\n' + model + '\n</script>\n<script>\n"use strict";\n' + data_js + app + '\n</script>\n' + tail)
assert len(METROS) >= 20, f'only {len(METROS)} locations: data/metro_*.json missing?'
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
open(OUT, 'w').write(out)
print('built', len(out.encode()), 'bytes; metros', len(METROS), '; monthly', bool(MONTHLY))
