#!/usr/bin/env python3
"""Offline tests for the parsers in scripts/: each is fed a small sample shaped like the real download (HTML page,
spreadsheet, CSV, API reply), so a change to a parser that breaks reading the published format fails here instead of
silently keeping old data in the weekly refresh. No network: the fetch scripts download at the top level, so only their
imports, functions and constant assignments are loaded (see load()).
Run: python3 tests/test_scripts.py
"""
import ast, csv, io, json, os, sys, unittest, zipfile
from xml.sax.saxutils import escape
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, 'scripts')
sys.path.insert(0, SCRIPTS)
import xlsx_lite

SAFE_CALLS = ('os.path.', 're.', 'time.', 'len', 'dict', 'set', 'list', 'tuple', 'str', 'int', 'float', 'range')

def _safe(node):
    """True if evaluating node calls nothing but harmless helpers (lambda bodies are not evaluated)."""
    stack = [node]
    while stack:
        n = stack.pop()
        if isinstance(n, ast.Lambda): continue
        if isinstance(n, ast.Call):
            name = ast.unparse(n.func)
            if not name.startswith(SAFE_CALLS): return False
        stack.extend(ast.iter_child_nodes(n))
    return True

def load(name, **inject):
    """The functions of scripts/<name>.py without running its downloads: imports, defs and safe assignments only."""
    path = os.path.join(SCRIPTS, name + '.py')
    with open(path) as f: tree = ast.parse(f.read())
    keep = [n for n in tree.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef))
            or (isinstance(n, ast.Assign) and _safe(n.value))]
    ns = {'__file__': path, '__name__': 'loaded_' + name}
    for n in keep:
        try: exec(compile(ast.Module(body=[n], type_ignores=[]), path, 'exec'), ns)
        except NameError:  # an assignment that depends on a skipped download
            if not isinstance(n, ast.Assign): raise
    ns.update(inject)
    return ns

def make_xlsx(rows, shared=False):
    """A one-sheet .xlsx: strings inline (or in sharedStrings.xml), numbers as numbers, None as an empty cell."""
    ss, cells = [], []
    for r, row in enumerate(rows, 1):
        cs = []
        for c, v in enumerate(row):
            if v is None: continue
            ref = (chr(65 + c) if c < 26 else 'A' + chr(65 + c - 26)) + str(r)
            if isinstance(v, (int, float)): cs.append(f'<c r="{ref}"><v>{v}</v></c>')
            elif shared: ss.append(v); cs.append(f'<c r="{ref}" t="s"><v>{len(ss) - 1}</v></c>')
            else: cs.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape(v)}</t></is></c>')
        cells.append(f'<row r="{r}">{"".join(cs)}</row>')
    M = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w') as z:
        z.writestr('xl/workbook.xml', f'<workbook xmlns="{M}" xmlns:r="{R}"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml', f'<worksheet xmlns="{M}"><sheetData>{"".join(cells)}</sheetData></worksheet>')
        if shared:
            z.writestr('xl/sharedStrings.xml', f'<sst xmlns="{M}">' + ''.join(f'<si><t>{escape(s)}</t></si>' for s in ss) + '</sst>')
    return b.getvalue()


class Xlsx(unittest.TestCase):
    def test_rows(self):
        for shared in (False, True):
            got = xlsx_lite.rows(make_xlsx([['a', None, 'c'], [1, 2.5, None, 'd']], shared=shared))
            self.assertEqual(got, [['a', None, 'c'], [1.0, 2.5, None, 'd']])
        self.assertEqual(xlsx_lite.sheets(make_xlsx([['x']])), ['Data'])


class Forecasts(unittest.TestCase):
    F = load('fetch_forecasts')

    def test_spf(self):
        page = ('<p>Over the next 10 years, 2026 to 2035, the forecasters predict headline CPI inflation will be an annual-average '
                'rate of 2.30 percent.</p><h3>Median Long-Term (10-Year) Forecasts (%)</h3><table><thead><tr><th>&nbsp;</th>'
                '<th>First Quarter 2025</th><th>Current Survey</th></tr></thead><tbody>'
                '<tr><td>Real GDP Growth</td><td>2.10</td><td>2.10</td></tr>'
                '<tr><td>Stock Returns (S&amp;P 500)</td><td style="x">\n 7.00</td><td>\n 7.00</td></tr>'
                '<tr><td>Rate on 10-Year Treasury Bonds</td><td>4.00</td><td>4.00</td></tr>'
                '<tr><td>Bill Returns (3-Month)</td><td>3.17</td><td>3.00</td></tr></tbody></table>')
        self.assertEqual(self.F['parse_spf'](page), {'stocks': 7.0, 'bond_rate': 4.0, 'bills': 3.0, 'cpi': 2.3, 'span': '2026–2035'})
        with self.assertRaises(ValueError): self.F['parse_spf']('<p>no table</p>')

    def test_cps(self):
        rows = [['Table A-4. Annual Geographic Mobility by Tenure: 1988-2023'], ['Survey Year and Tenure', 'Total', 'Same residence', 'Total movers'],
                ['Numbers'], ['2023', None, None, None],
                ['\t.Total, 1 year and over', 327167, 301543, 25624], ['\t\t..In owner-occupied units', 226143, 216856, 9287],
                ['\t\t..In renter-occupied units', 101024, 84687, 16337], ['2022', None, None, None],
                ['\t\t..In owner-occupied units', 220000, 200000, 20000]]
        y, o, r = self.F['parse_cps'](make_xlsx(rows, shared=True))
        self.assertEqual(y, 2023); self.assertAlmostEqual(o, 9287 / 226143); self.assertAlmostEqual(r, 16337 / 101024)
        with self.assertRaises(ValueError): self.F['parse_cps'](make_xlsx([['nothing here']]))

    def test_ce(self):
        res = {'Results': {'series': [{'data': [{'year': '2024', 'value': '104'}, {'year': '2023', 'value': '92'}, {'year': '2025', 'value': '-'}]}]}}
        self.assertEqual(self.F['parse_ce'](res), (2024, 104.0))


class Hud(unittest.TestCase):
    def test_safmr(self):
        Z = load('fetch_zips')
        rows = [['Small Area FMRs FY2027'], ['ZIP\nCode', 'HUD Area Code', 'SAFMR\n0BR', 'SAFMR\n0BR -\n90% Payment Standard', 'SAFMR\n1BR', 'SAFMR\n2BR', 'SAFMR\n3BR', 'SAFMR\n4BR'],
                [2134.0, 'METRO14460M14460', 2000, 1800, 2200, 2600, 3200, 3600], ['98101', 'METRO42660', 1600, 1440, 1900, 2400, 3200, 3700], [None, 'x', 1, 1, 1, 1, 1, 1]]
        self.assertEqual(Z['parse_safmr'](make_xlsx(rows)), {'02134': [2000, 2200, 2600, 3200, 3600], '98101': [1600, 1900, 2400, 3200, 3700]})

    def test_fmr(self):
        F = load('fetch_fmr')
        rows = [['FY2027 FMRs'], ['stusps', 'fips', 'pop2020', 'fmr_0', 'fmr_1', 'fmr_2', 'fmr_3', 'fmr_4'],
                ['MA', '2500199999', 3000.0, 1000, 1100, 1200, 1500, 1700],  # two New England towns in one county,
                ['MA', 2500100000.0, 1000.0, 2000, 2100, 2200, 2500, 2700],  # weighted by population
                ['AL', 1001.0, 59000.0, 800, 900, 1000, 1300, 1500]]
        self.assertEqual(F['parse'](make_xlsx(rows)), {'01001': [800, 900, 1000, 1300, 1500], '25001': [1250, 1350, 1450, 1750, 1950]})

    def test_county_hpi(self):
        H = load('fetch_county_hpi')
        rows = [['County Developmental Index'], ['State', 'County', 'FIPS code', 'Year', 'Annual Change (%)', 'HPI'],
                ['AL', 'Autauga', 1001.0, 2023.0, 5.0, 210.456], ['AL', 'Autauga', 1001.0, 2024.0, '.', '.'], ['WA', 'King', '53033', 2024.0, 3.0, 400.0]]
        self.assertEqual(H['parse'](rows), {'01001': {'2023': 210.46}, '53033': {'2024': 400.0}})
        self.assertEqual(H['table']('x.csv', b'FIPS code,Year,HPI\n01001,2023,1.5\n'), [['FIPS code', 'Year', 'HPI'], [1001.0, 2023.0, 1.5]])


class Market(unittest.TestCase):
    def test_zillow(self):
        body = 'RegionID,SizeRank,RegionName,RegionType,StateName,2025-08-31,2025-09-30\n102001,0,United States,country,,360000.5,361000\n1,1,"Boston, MA",msa,MA,700000,\n2,2,"Nowhere, ZZ",msa,ZZ,1,2\n'
        M = load('fetch_market', get=lambda url, *a, **k: body, names={'Boston, MA': 'boston'})
        self.assertEqual(M['zillow']('u'), {'us': [('2025-08', 360000.5), ('2025-09', 361000.0)], 'boston': [('2025-08', 700000.0)]})


class Insurance(unittest.TestCase):
    def test_state_values(self):
        I = load('fetch_insurance')
        b = io.BytesIO()
        with zipfile.ZipFile(b, 'w') as z:
            s = io.StringIO(); w = csv.writer(s); w.writerow(['RT', 'TEN', 'BLD', 'INSP', 'WGTP', 'ADJHSG'])
            w.writerows([['H', '1', '02', '1200', '10', '1000000'], ['H', '2', '03', '2000', '5', '1100000'],
                         ['H', '3', '02', '900', '50', '1000000'],   # rented: skipped
                         ['H', '1', '06', '700', '50', '1000000'],   # apartment building: skipped
                         ['H', '1', '02', '0', '50', '1000000']])    # pays no insurance: skipped
            z.writestr('psam_h50.csv', s.getvalue())
        self.assertEqual(I['state_values'](b.getvalue()), [(1200.0, 10.0), (2200.0, 5.0)])
        self.assertEqual(I['wmedian']([(100, 1), (200, 1), (300, 5)]), 300)


class AcsSummaryFile(unittest.TestCase):
    def test_sf_lines(self):
        import acs_sf
        lines = b'FILEID|GEO_ID|B25077_E001\nACSDT5Y|0100000US|300000\nACSDT5Y|1400000US01001020100|1\nACSDT5Y|0500000US01001|190000\n'
        real = acs_sf.urllib.request.urlopen
        acs_sf.urllib.request.urlopen = lambda req, timeout=None: io.BytesIO(lines)
        try: hdr, rows = acs_sf.sf_lines('https://example.invalid/t.dat', ('0500000US', '0100000US'))
        finally: acs_sf.urllib.request.urlopen = real
        self.assertEqual(hdr, ['FILEID', 'GEO_ID', 'B25077_E001'])
        self.assertEqual([r[1] for r in rows], ['0100000US', '0500000US01001'])


class CountyMetro(unittest.TestCase):
    def test_parse(self):
        C = load('fetch_county_metro')
        rows = [['List 1. CORE BASED STATISTICAL AREAS (CBSAs), METROPOLITAN DIVISIONS, AND COMBINED STATISTICAL AREAS (CSAs)'], ['July 2023'],
                ['CBSA Code', 'Metropolitan Division Code', 'CSA Code', 'CBSA Title', 'Metropolitan/Micropolitan Statistical Area', 'Metropolitan Division Title',
                 'CSA Title', 'County/County Equivalent', 'State Name', 'FIPS State Code', 'FIPS County Code', 'Central/Outlying County'],
                ['14460', '14454', '148', 'Boston-Cambridge-Newton, MA-NH', 'Metropolitan Statistical Area', 'Boston, MA', '', 'Suffolk County', 'Massachusetts', '25', '025', 'Central'],
                [42660.0, None, None, 'Seattle', 'Metropolitan Statistical Area', None, None, 'King County', 'Washington', 53.0, 33.0, 'Central'],
                ['10100', None, None, 'Aberdeen, SD', 'Micropolitan Statistical Area', None, None, 'Brown County', 'South Dakota', '46', '013', 'Central']]
        self.assertEqual(C['parse'](make_xlsx(rows), {'14460': 'boston', '42660': 'seattle'}), {'25025': 'boston', '53033': 'seattle'})


if __name__ == '__main__':
    unittest.main(verbosity=1)
