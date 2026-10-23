#!/usr/bin/env python3
"""Assemble index.html from src/ and data/."""
import json, glob, os, math, sys
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
med_tenure = tv.get('redfin_median_tenure_2025') or 12
hz = 1 - 0.5 ** (1 / med_tenure)
RES = {
    'idio': {'u': 'https://academic.oup.com/rfs/article/34/8/3695/5974712' if False else first_url(iv),
             'h': 'Flavin &amp; Yamashita (2002): single-house return s.d. ≈ 14%/yr vs 4–6% for city indexes; Giacoletti (2021): 10–18% one-time resale shock'},
    'hazard': {'u': (ten.get('sources') or [{}])[1].get('url') if len(ten.get('sources') or []) > 1 else first_url(ten),
               'h': f'Redfin: typical owner stays {med_tenure:g} years (implies ≈{hz*100:.1f}%/yr); NAR 2025 median seller tenure {tv.get("nar_median_years_seller_tenure_2025")} yrs'},
    'dy': {'u': res_raw['div_yield']['source_url'], 'h': f'S&amp;P 500 trailing yield {res_raw["div_yield"]["value"]*100:.2f}% ({res_raw["div_yield"]["date"]}, multpl estimate)'},
    'spread': {'u': res_raw['margin_rate']['source_url'], 'h': 'Interactive Brokers Pro margin: benchmark + 1.5% under $100k, + 1.0% to $1M'},
    'mortSpread': {'u': res_raw['mortgage_spread']['source_url']},
    'rMove': {'u': next((s['url'] for s in (ten.get('sources') or []) if 'census.gov' in s.get('url','')), None),
              'h': f'Census CPS 2023: {tv.get("cps_renter_mover_rate_2023",0)*100:.1f}% of renters moved (owners {tv.get("cps_owner_mover_rate_2023",0)*100:.1f}%)'},
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
    for d in (D('data'), os.path.join(os.path.dirname(ROOT), 'rvb', 'data')):
        f = os.path.join(d, name)
        if os.path.exists(f): return json.load(open(f))
    return None
REAL = load('realism.json') or {}
FC = load('forecasts.json')
exec(open(D('build_params.py')).read()) if os.path.exists(D('build_params.py')) else None
D0_EXTRA = globals().get('D0_EXTRA', {'renewGap': 0, 'incGrowth': 3.0, 'stressMult': 2, 'forcedDisc': 3, 'vacR': 7, 'dpR': 25, 'ratePrem': 0.6, 'mgmt': 9})
RES.update(globals().get('RES_EXTRA', {}))
FCST = globals().get('FCST', None)
D0 = {'rMove': round((tv.get('cps_renter_mover_rate_2023') or 0.162)*100,1), 'close': 3, 'maint': 1.0, 'sell': 6.5, 'dy': round(res_raw['div_yield']['value'] * 100, 2), 'spread': 1.5,
      'hz': round(hz * 100, 1), 'idio': 12, **D0_EXTRA}

mort = res_raw['mortgage_annual']['value']
MORT_OVERRIDE = [mort[str(y)] for y in range(1972, 2026)]

# ---------- metros ----------
METROS = [{'slug': 'us', 'name': 'United States', 'P': snap['values']['zhvi'], 'rent': snap['values']['zori'],
           'ptax': snap['values']['ptaxUS'], 'ins': snap['values']['insUS'], 'ptaxCap': 0, 'hpi': None, 'src': {}}]
order = ['boston', 'new-york', 'washington-dc', 'philadelphia', 'raleigh', 'charlotte', 'atlanta', 'tampa', 'miami',
         'chicago', 'minneapolis', 'cleveland', 'detroit', 'dallas', 'austin', 'denver', 'phoenix', 'las-vegas',
         'los-angeles', 'san-diego', 'san-francisco', 'seattle', 'portland']
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
        if k == 'ptax': t = f"{e.get('rate_pct')}% effective, {e.get('geography')}" + (f", {e['year']}" if e.get('year') else '') + f" ({e.get('source_title','').split(':')[0]})"
        if k == 'ins': t = f"${e.get('annual_usd'):,} avg premium, {e.get('geography')}" + (f", {e['coverage']}" if e.get('coverage') else '') + f" ({e.get('source_title','').split(':')[0]})"
        return {'t': t, 'u': e['source_url'], 'd': e.get('date')}
    cap = 2 if slug in ('los-angeles', 'san-diego', 'san-francisco') else 0
    METROS.append({'slug': slug, 'name': m['name'] + (' metro' if False else ''),
                   'P': (m.get('price') or {}).get('value'), 'rent': (m.get('rent') or {}).get('value'),
                   'ptax': (m.get('ptax') or {}).get('rate_pct'), 'ins': (m.get('ins') or {}).get('annual_usd'),
                   'ptaxCap': cap,
                   'acs': ({'rate': (m.get('acs') or {}).get('eff_tax_pct'), 'year': (m.get('acs') or {}).get('year'), 'name': (m.get('acs') or {}).get('name'),
                            'beds': (m.get('acs') or {}).get('rent_ratio_by_bedrooms'), 'u': (m.get('acs') or {}).get('source_url')} if m.get('acs') else None),
                   'rentG': ((m.get('rent_hist') or {}).get('growth_pct')),
                   'rentSrc': ({'t': f"BLS rent index {', '.join(x for x in (m.get('rent_hist') or {}).get('series', {}).values() if x)} (metro years {sum(1 for s in (m.get('rent_hist') or {}).get('source_by_year', {}).values() if s != 'region')}, region otherwise)", 'u': (m.get('rent_hist') or {}).get('source_url')} if m.get('rent_hist') else None),
                   'tt': m.get('transfer_taxes'), 'ttSrc': [{'t': x['name'], 'u': x['source_url']} for x in (m.get('transfer_taxes') or []) if x.get('source_url')],
                   'hpi': {'values': vals, 'basis': h.get('basis'), 'volK': h.get('volK')} if vals else None,
                   'hpiSrc': {'t': f"FHFA purchase-only index, {h.get('area')} ({h.get('basis')}); volatility ratio {h.get('volK')}", 'u': h.get('source_url')} if h.get('source_url') else None,
                   'src': {k: s(k) for k in ('price', 'rent', 'ptax', 'ins')}})
    METROS[-1]['src']['hpi'] = METROS[-1]['hpiSrc']

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
    if e.get('source_url') and e.get('source_title'): RES['sources'][f'lr_{k}'] = {'t': e['source_title'], 'u': e['source_url']}
if ins_: RES['sources']['ppi_ins'] = {'t': 'BLS PPI: homeowners insurance premiums (PCU5241265241262)', 'u': ins_['source_url']}
RES['sources']['acs'] = {'t': f"Census ACS {NATP.get('acs_year')} 1-year summary file (property tax, home value, rent by bedrooms, bedrooms by tenure)", 'u': 'https://www.census.gov/programs-surveys/acs/data/summary-file.html'}

# ---------- monthly ----------
MONTHLY = None
mf = D('data', 'monthly_processed.json')
if os.path.exists(mf):
    MONTHLY = json.load(open(mf))

# the installed (PWA) build serves pinned copies from vendor/; the artifact build can only load from public CDNs
VENDOR = {'plotly': 'vendor/plotly-2.35.2.min.js', 'mathjax': 'vendor/mathjax-3.2.2-tex-svg-full.js'}
data_js = (f"const LOCAL_LIBS={json.dumps([VENDOR['plotly']] if PWA else [])};\n"
           "const SNAP=JSON.parse(document.getElementById('snapshot-data').textContent);\n"
           f"const RES={json.dumps(RES)};\nconst D0={json.dumps(D0)};\nconst FCST={json.dumps(FCST)};\n"
           f"const METROS={json.dumps(METROS, separators=(',', ':'))};\nconst MONTHLY={json.dumps(MONTHLY, separators=(',', ':'))};\n")

css = open(D('src', 'style.css')).read()
body = open(D('src', 'body.html')).read()
model = open(D('src', 'model.js')).read()
app = ''.join(open(f).read() for f in sorted(glob.glob(D('src', 'app', '*.js'))))  # src/app/NN-*.js, concatenated in order
head = '''<title>Rent, Buy or Invest</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
'''
mj = '''<script>
window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]']]},options:{enableMenu:false},svg:{fontCache:'global'},startup:{typeset:false}};
</script>
<script src="MATHJAX_SRC" async></script>
'''
mj = mj.replace('MATHJAX_SRC', VENDOR['mathjax'] if PWA else 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js')
if PWA:
    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="description" content="Compare buying a home, renting and investing, with sourced market data, backtests and Monte Carlo.">\n'
            '<link rel="manifest" href="manifest.webmanifest">\n'
            '<meta name="color-scheme" content="light dark">\n'
            '<meta name="theme-color" content="#f3f5f4" media="(prefers-color-scheme: light)">\n'
            '<meta name="theme-color" content="#0e1312" media="(prefers-color-scheme: dark)">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
            '<meta name="apple-mobile-web-app-title" content="Rent·Buy">\n'
            '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n<link rel="icon" type="image/png" href="icons/favicon-32.png">\n'
            + head +
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'body{margin:0;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%}img{max-width:100%}[hidden]{display:none!important}</style>\n'
            '</head>\n<body>\n')
    tail = ('<script>if("serviceWorker" in navigator&&location.protocol==="https:"){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n'
            '</body>\n</html>\n')
else:
    tail = ''
out = (head + '<style>' + css + '</style>\n' + body +
       '\n<!-- SNAPSHOT: current market figures. Weekly refresh edits only this block. -->\n'
       '<script id="snapshot-data" type="application/json">\n' + json.dumps(snap, indent=1) + '\n</script>\n' + mj +
       '<script id="model-script">\n"use strict";\nconst MORT_OVERRIDE=' + json.dumps(MORT_OVERRIDE) + ';\n' + model + '\n</script>\n<script>\n"use strict";\n' + data_js + app + '\n</script>\n' + tail)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
open(OUT, 'w').write(out)
print('built', len(out), 'bytes; metros', len(METROS), '; monthly', bool(MONTHLY))
