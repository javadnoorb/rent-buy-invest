import subprocess, sys, urllib.request
sys.path.insert(0, 'scripts'); import xlsx_lite
subprocess.run([sys.executable, 'scripts/fetch_forecasts.py', '/tmp/fp.json']); print(open('/tmp/fp.json').read())
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'}
for y in (2024, 2023):
    try:
        b = urllib.request.urlopen(urllib.request.Request(f'https://www.bls.gov/cex/tables/calendar-year/mean-item-share-average-standard-error/cu-housing-tenure-{y}.xlsx', headers=H), timeout=60).read()
        rows = xlsx_lite.rows(b); print(y, len(rows))
        for i, r in enumerate(rows):
            s = str(r)
            if i < 6 or 'nsurance' in s or 'enter' in s: print(i, r[:10])
        break
    except Exception as e: print('CE', y, e)
