#!/usr/bin/env python3
"""Fetch HUD Fair Market Rents by county into data/county_fmr.json.

FMRs are HUD's estimate of the 40th-percentile gross rent (rent plus tenant-paid utilities) paid by recent movers for
standard-quality units, by bedrooms (0–4), set each fiscal year for every county (New England: by town; those are
averaged per county weighted by population). Public U.S. government data from huduser.gov. The newest fiscal year
that downloads is used; the existing file is kept if nothing usable is found.
Run: python3 scripts/fetch_fmr.py [out.json]
"""
import json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_lite
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'county_fmr.json')
PAGE = 'https://www.huduser.gov/portal/datasets/fmr.html'
BASE = 'https://www.huduser.gov/portal/datasets/fmr/fmr{y}/'

# huduser.gov answers unfamiliar clients with an HTML page instead of the file, so ask like a browser would
HEADERS = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 rent-buy-invest',
           'Accept': 'text/html,application/xhtml+xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8',
           'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.huduser.gov/portal/datasets/fmr.html'}
def get(url, binary=False):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=180) as r: body = r.read(); ctype = r.headers.get('Content-Type', '')
    if binary and body[:2] != b'PK':
        raise ValueError(f'not a spreadsheet ({ctype}, {len(body)} bytes): ' + body[:160].decode('utf-8', 'replace').replace('\n', ' '))
    return body if binary else body.decode('utf-8', 'replace')

def candidates(fy):
    """County-level FMR workbook links for fiscal year fy: from the dataset page, then the usual file names."""
    yy = str(fy)[2:]; urls = []
    try:
        page = get(PAGE)
        links = re.findall(r'href="([^"]+\.xlsx)"', page, re.I)
        print(f'dataset page: {len(page)} characters, {len(links)} .xlsx links, e.g. ' + ', '.join(l.rsplit('/', 1)[-1] for l in links[:12]))
        for href in links:
            u = urllib.request.urljoin(PAGE, href); f = u.rsplit('/', 1)[-1].lower()
            if f'fmr{fy}' in u.lower() and f.startswith(f'fy{yy}_fmr') and not re.search(r'safmr|50|cbsa|zip|hmfa', f): urls.append(u)
    except Exception as e:
        print(f'dataset page: {e}')
    for f in (f'FY{yy}_FMRs.xlsx', f'FY{yy}_FMRs_revised.xlsx', f'FY{yy}_FMRs_Revised.xlsx', f'FY{yy}_FMR.xlsx'):
        urls.append(BASE.format(y=fy) + f)
    return list(dict.fromkeys(urls))

def parse(data):
    """{county FIPS: [0BR, 1BR, 2BR, 3BR, 4BR]} from the workbook; town rows are population-weighted per county."""
    rows = xlsx_lite.rows(data)
    hi = next(i for i, r in enumerate(rows[:20]) if r and any(isinstance(c, str) and re.match(r'fmr_?0$', c.strip(), re.I) for c in r))
    hdr = [str(c or '').strip().lower() for c in rows[hi]]
    ifips = next(i for i, h in enumerate(hdr) if h.startswith('fips'))
    ipop = next((i for i, h in enumerate(hdr) if h.startswith('pop')), None)
    ibr = [next(i for i, h in enumerate(hdr) if re.fullmatch(f'fmr_?{b}', h)) for b in range(5)]
    acc = {}
    for r in rows[hi + 1:]:
        if not r or len(r) <= max(ibr + [ifips]) or r[ifips] is None: continue
        f = r[ifips]; f = str(int(f)) if isinstance(f, float) else str(f).strip()
        f = f.zfill(10) if len(f) > 5 else f.zfill(5)
        try: vals = [float(r[i]) for i in ibr]
        except (TypeError, ValueError): continue
        w = float(r[ipop]) if ipop is not None and isinstance(r[ipop], float) and r[ipop] > 0 else 1.0
        a = acc.setdefault(f[:5], [0.0, [0.0] * 5])
        a[0] += w; a[1] = [s + w * v for s, v in zip(a[1], vals)]
    return {k: [round(s / w) for s in v] for k, (w, v) in sorted(acc.items())}

now = time.gmtime(); fy0 = now.tm_year + (1 if now.tm_mon >= 10 else 0)  # HUD fiscal years start in October
for fy in (fy0, fy0 - 1, fy0 - 2):
    got = None
    for url in candidates(fy):
        try: data = get(url, binary=True)
        except Exception as e: print(f'FY{fy} {url}: {e}'); continue
        try: counties = parse(data)
        except Exception as e: print(f'FY{fy} {url}: could not read ({e})'); continue
        print(f'FY{fy} {url}: {len(counties)} counties')
        if len(counties) >= 3000: got = (url, counties); break
    if got:
        url, counties = got
        json.dump({'fiscal_year': fy, 'source_title': f'HUD Fair Market Rents, FY{fy} (40th-percentile gross rent of recent movers, by bedrooms)',
                   'source_url': url, 'page': PAGE, 'fetched_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', now),
                   'fields': ['0BR', '1BR', '2BR', '3BR', '4BR'], 'rows': counties}, open(OUT, 'w'), separators=(',', ':'))
        print(f'wrote {OUT}: {len(counties)} counties, FY{fy}'); break
else:
    print('no FMR data fetched; keeping the existing file')
