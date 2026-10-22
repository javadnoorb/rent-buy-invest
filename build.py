#!/usr/bin/env python3
"""Assemble index.html from src/ and data/."""
import json, glob, os, math, sys
PWA = '--pwa' in sys.argv
ROOT = os.path.dirname(os.path.abspath(__file__))
D = lambda *p: os.path.join(ROOT, *p)

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

D0 = {'close': 3, 'maint': 1.0, 'sell': 6.5, 'dy': round(res_raw['div_yield']['value'] * 100, 2), 'spread': 1.5,
      'hz': round(hz * 100, 1), 'idio': 12}

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
                   'hpi': {'values': vals, 'basis': h.get('basis')} if vals else None,
                   'hpiSrc': {'t': f"{h.get('series_id')} ({'Case-Shiller' if 'XRNSA' in (h.get('series_id') or '') else 'FHFA all-transactions'}, {h.get('basis')} values)", 'u': h.get('source_url')} if h.get('source_url') else None,
                   'src': {k: s(k) for k in ('price', 'rent', 'ptax', 'ins')}})
    METROS[-1]['src']['hpi'] = METROS[-1]['hpiSrc']

# ---------- monthly ----------
MONTHLY = None
mf = D('data', 'monthly_processed.json')
if os.path.exists(mf):
    MONTHLY = json.load(open(mf))

data_js = ("const SNAP=JSON.parse(document.getElementById('snapshot-data').textContent);\n"
           f"const RES={json.dumps(RES)};\nconst D0={json.dumps(D0)};\nconst MORT_OVERRIDE={json.dumps(MORT_OVERRIDE)};\n"
           f"const METROS={json.dumps(METROS, separators=(',', ':'))};\nconst MONTHLY={json.dumps(MONTHLY, separators=(',', ':'))};\n")

css = open(D('src', 'style.css')).read()
body = open(D('src', 'body.html')).read()
model = open(D('src', 'model.js')).read()
app = open(D('src', 'app.js')).read()
head = '''<title>Rent, Buy or Invest</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
'''
mj = '''<script>
window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]']]},options:{enableMenu:false},svg:{fontCache:'global'},startup:{typeset:false}};
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js" async></script>
'''
if PWA:
    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="description" content="Compare buying a home, renting and investing, with sourced market data, backtests and Monte Carlo.">\n'
            '<link rel="manifest" href="manifest.webmanifest">\n'
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
       '<script>\n' + data_js + model + '\n' + app + '\n</script>\n' + tail)
open(D('index.html'), 'w').write(out)
print('built', len(out), 'bytes; metros', len(METROS), '; monthly', bool(MONTHLY))
