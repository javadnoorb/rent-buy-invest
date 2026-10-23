import re, sys, urllib.request, os
sys.path.insert(0, 'scripts'); import xlsx_lite
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120) as r: return r.read()
def show(u, n=8):
    try:
        b = get(u); print('==', u, len(b))
        if b[:2] == b'PK':
            for i, r in enumerate(xlsx_lite.rows(b)):
                if i < n or i % 10 == 0 and i < 200: print(i, r[:16])
        else: print(b[:300])
    except Exception as e: print('ERR', u, e)
for page in ['https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/spf-q1-2026',
             'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/survey-of-professional-forecasters',
             'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/historical-spf-data-files',
             'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/spf-data-files']:
    try:
        t = get(page).decode('utf-8', 'replace'); print('PAGE', page, len(t))
        for h in sorted(set(re.findall(r'href="([^"]+\.(?:xlsx|xls|pdf|csv)[^"]*)"', t, re.I))): print('  ', h)
        for m in re.finditer(r'(?i)(stock|bond|bill)[^<]{0,200}', t): print('  TXT', m.group(0)[:200])
    except Exception as e: print('ERR', page, e)
show('https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/time-series/historic/hst_mig_a_4.xlsx', 12)
show('https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/time-series/historic/tab-a-4.xlsx', 12)
