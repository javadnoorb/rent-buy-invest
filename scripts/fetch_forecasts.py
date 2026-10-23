#!/usr/bin/env python3
"""Fetch long-run forecasts and mobility rates from public U.S. government sources into data/forecasts_public.json:

- 10-year annual-average forecasts from the Federal Reserve Bank of Philadelphia's Survey of Professional Forecasters.
  Only first-quarter surveys ask for them: S&P 500 returns, the 10-year Treasury rate, 3-month bill returns, CPI inflation.
- How often owners and renters move: Census Current Population Survey, Table A-4 (annual geographic mobility by tenure).
- What renters spend on tenant's insurance: BLS Consumer Expenditure Survey, table by housing tenure.
Keeps the existing values of any part that fails.
Run: python3 scripts/fetch_forecasts.py [out.json]
"""
import html, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_lite
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'forecasts_public.json')
SPF = 'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/spf-q1-{y}'
CPS = 'https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/time-series/historic/hst_mig_a_4.xlsx'
CE = 'https://www.bls.gov/cex/tables/calendar-year/mean-item-share-average-standard-error/cu-housing-tenure-{y}.xlsx'
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 rent-buy-invest',
     'Accept': 'text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=120) as r: return r.read()
def text(h): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

def parse_spf(page):
    """{'stocks','bond_rate','bills','cpi'} in percent from a first-quarter SPF release page."""
    out = {}
    i = page.find('Median Long-Term (10-Year) Forecasts')
    if i < 0: raise ValueError('no long-term forecast table')
    tbl = page[page.find('<table', i):page.find('</table>', i)]
    for tr in re.findall(r'<tr.*?</tr>', tbl, re.S):
        cells = [text(c) for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr, re.S)]
        if len(cells) < 2: continue
        label, cur = cells[0].lower(), cells[-1]
        try: v = float(cur)
        except ValueError: continue
        if 'stock' in label: out['stocks'] = v
        elif 'treasury' in label or 'bond' in label: out['bond_rate'] = v
        elif 'bill' in label: out['bills'] = v
    m = re.search(r'headline CPI inflation will be an annual-average rate of ([\d.]+) percent', text(page))
    if m: out['cpi'] = float(m.group(1))
    m = re.search(r'Over the next 10 years, (\d{4}) to (\d{4})', text(page))
    if m: out['span'] = f'{m.group(1)}–{m.group(2)}'
    return out

def parse_cps(data):
    """(survey year, owner mover rate, renter mover rate) for the latest year in Table A-4 (numbers in thousands)."""
    year = None; got = {}
    for r in xlsx_lite.rows(data):
        if not r or r[0] is None: continue
        a = str(r[0]).strip()
        m = re.match(r'(\d{4})\b', a)
        if m and all(c is None for c in r[1:4]):
            if year: break
            year = int(m.group(1)); continue
        if year and isinstance(r[1], (int, float)) and isinstance(r[3], (int, float)):
            if 'owner' in a.lower(): got['owner'] = r[3] / r[1]
            elif 'renter' in a.lower(): got['renter'] = r[3] / r[1]
        if len(got) == 2: break
    if year is None or len(got) < 2: raise ValueError('table layout changed')
    return year, got['owner'], got['renter']

def parse_ce(data):
    """Average yearly tenant's insurance of renter households in the CE housing-tenure table."""
    rows = xlsx_lite.rows(data)
    hi = next(i for i, r in enumerate(rows[:40]) if r and any('renter' in str(c or '').lower() for c in r))
    col = next(j for j, c in enumerate(rows[hi]) if 'renter' in str(c or '').lower())
    seen = False
    for r in rows[hi + 1:]:
        a = str((r or [None])[0] or '').strip().lower()
        if "tenant's insurance" in a or 'tenants insurance' in a: seen = True
        if seen and len(r) > col and isinstance(r[col], (int, float)): return float(r[col])
        if seen and len(r) > 1 and str(r[1] or '').strip().lower() == 'mean' and len(r) > col and isinstance(r[col], (int, float)): return float(r[col])
    raise ValueError("no tenant's insurance row")

if __name__ == '__main__':
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    out = dict(old); now = time.gmtime()
    for y in range(now.tm_year, now.tm_year - 3, -1):
        try:
            v = parse_spf(get(SPF.format(y=y)).decode('utf-8', 'replace'))
            if {'stocks', 'bond_rate', 'bills', 'cpi'} <= set(v):
                out['spf'] = {**v, 'year': y, 'url': SPF.format(y=y),
                              'title': f'Federal Reserve Bank of Philadelphia, Survey of Professional Forecasters, first quarter {y}: median 10-year annual-average forecasts'}
                print('SPF', out['spf']); break
            print(f'SPF {y}: incomplete {v}')
        except Exception as e: print(f'SPF {y}: {e}')
    try:
        y, o, r = parse_cps(get(CPS))
        out['movers'] = {'year': y, 'owner': round(o, 4), 'renter': round(r, 4), 'url': CPS,
                         'title': f'Census Current Population Survey, Table A-4: share of people in owner- and renter-occupied homes who moved in the past year ({y})'}
        print('CPS', out['movers'])
    except Exception as e: print(f'CPS: {e}')
    for y in range(now.tm_year - 1, now.tm_year - 4, -1):
        try:
            v = parse_ce(get(CE.format(y=y)))
            if 20 < v < 2000:
                out['renters_ins'] = {'year': y, 'value': round(v), 'url': CE.format(y=y),
                                      'title': f"BLS Consumer Expenditure Survey {y}, by housing tenure: average tenant's insurance of renter households"}
                print('CE', out['renters_ins']); break
            print(f'CE {y}: implausible {v}')
        except Exception as e: print(f'CE {y}: {e}')
    out['fetched_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', now)
    json.dump(out, open(OUT, 'w'), indent=1); print('wrote', OUT)
