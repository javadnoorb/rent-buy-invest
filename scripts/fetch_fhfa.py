#!/usr/bin/env python3
"""Download FHFA House Price Index files and extract purchase-only series:
quarterly metro indexes (all metros) and the monthly national index (NSA and SA).
FHFA data are freely available from https://www.fhfa.gov/data/hpi ."""
import csv, io, json, sys, urllib.request
MASTER = 'https://www.fhfa.gov/hpi/download/monthly/hpi_master.csv'
PO_METRO = 'https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_po_metro.txt'
def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'rent-buy-invest data fetch (github actions)'})
    with urllib.request.urlopen(req, timeout=120) as r: return r.read().decode('utf-8', 'replace')
out = {'source_page': 'https://www.fhfa.gov/data/hpi/datasets', 'files': [MASTER, PO_METRO], 'metro_po_quarterly': {}, 'us_po_monthly': {}, 'us_po_quarterly': {}}
try:
    rows = csv.DictReader(io.StringIO(get(MASTER)))
    for r in rows:
        flav, freq, lvl = r.get('hpi_flavor', ''), r.get('frequency', ''), r.get('level', '')
        if flav != 'purchase-only': continue
        key = f"{r['yr']}-{int(r['period']):02d}"
        val = {'nsa': float(r['index_nsa']) if r.get('index_nsa') else None, 'sa': float(r['index_sa']) if r.get('index_sa') else None}
        if freq == 'monthly' and r.get('place_id') == 'USA': out['us_po_monthly'][key] = val
        elif freq == 'quarterly' and r.get('place_id') == 'USA': out['us_po_quarterly'][key] = val
        elif freq == 'quarterly' and 'MSA' in lvl:
            m = out['metro_po_quarterly'].setdefault(r['place_id'], {'name': r['place_name'], 'level': lvl, 'q': {}})
            m['q'][key] = val
except Exception as e:
    out['master_error'] = str(e)
out['metro_txt_check'] = {}
if True:
    txt = get(PO_METRO)
    for r in csv.reader(io.StringIO(txt), delimiter='\t'):
        if len(r) < 6 or not r[2].strip().isdigit(): continue
        cbsa, name, yr, qtr, nsa, sa = (x.strip() for x in r[:6])
        tgt = out['metro_txt_check'] if out['metro_po_quarterly'] and cbsa in out['metro_po_quarterly'] else out['metro_po_quarterly']
        m = tgt.setdefault(cbsa, {'name': name, 'level': 'MSA/MSAD', 'q': {}})
        m['q'][f"{yr}-{int(qtr):02d}"] = {'nsa': float(nsa) if nsa not in ('', '.') else None, 'sa': float(sa) if sa not in ('', '.') else None}
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'fhfa_extract.json', 'w'))
print('metros', len(out['metro_po_quarterly']), 'us monthly', len(out['us_po_monthly']), 'us quarterly', len(out['us_po_quarterly']))
