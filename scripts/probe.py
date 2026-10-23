import csv, io, urllib.request, zipfile, collections
H = {'User-Agent': 'rent-buy-invest data refresh'}
b = urllib.request.urlopen(urllib.request.Request('https://www2.census.gov/programs-surveys/acs/data/pums/2024/1-Year/csv_hvt.zip', headers=H), timeout=120).read()
z = zipfile.ZipFile(io.BytesIO(b)); name = next(n for n in z.namelist() if n.endswith('.csv'))
r = csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8'))
cols = r.fieldnames; print([c for c in cols if any(k in c for k in ('TAX', 'VAL', 'MV', 'TEN', 'BLD', 'WGTP', 'ADJ', 'YRBLT', 'YBL', 'FINS', 'INSP', 'HOI'))][:40])
cnt = collections.Counter(); ex = []
for row in r:
    if row.get('TEN') in ('1', '2'):
        cnt[(row.get('MV'), bool(row.get('TAXAMT')))] += 1
        if len(ex) < 5 and row.get('TAXAMT'): ex.append({k: row.get(k) for k in ('TAXAMT', 'VALP', 'MV', 'BLD', 'ADJHSG', 'TAXP')})
print(sorted(cnt.items())); print(ex)
