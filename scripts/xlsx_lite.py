"""Minimal .xlsx reader (standard library only): the rows of one worksheet as lists of strings and numbers.
Enough for the plain data tables HUD and FHFA publish; no formulas, styles or dates."""
import io, re, zipfile
import xml.etree.ElementTree as ET
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
REL = '{http://schemas.openxmlformats.org/package/2006/relationships}'

def _col(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group(0): n = n * 26 + ord(ch) - 64
    return n - 1

def sheets(data):
    """Names of the worksheets, in workbook order."""
    z = zipfile.ZipFile(io.BytesIO(data))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    return [s.get('name') for s in wb.find('m:sheets', NS)]

def rows(data, sheet=0):
    """Rows of a worksheet (index or name) as lists; empty cells are None, numbers are floats."""
    z = zipfile.ZipFile(io.BytesIO(data))
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    sh = list(wb.find('m:sheets', NS))
    s = sh[sheet] if isinstance(sheet, int) else next(x for x in sh if x.get('name') == sheet)
    rid = s.get('{%s}id' % NS['r'])
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = next(r.get('Target') for r in rels if r.get('Id') == rid)
    path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
    out = []
    for _, el in ET.iterparse(io.BytesIO(z.read(path))):
        if el.tag != '{%s}row' % NS['m']: continue
        row = []
        for c in el.findall('m:c', NS):
            i = _col(c.get('r')) if c.get('r') else len(row)
            while len(row) < i: row.append(None)
            t, v = c.get('t'), c.find('m:v', NS)
            if t == 's' and v is not None: val = shared[int(v.text)]
            elif t == 'inlineStr': val = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
            elif t in ('str', 'e'): val = v.text if v is not None else None
            elif v is not None and v.text is not None:
                try: val = float(v.text)
                except ValueError: val = v.text
            else: val = None
            row.append(val)
        out.append(row); el.clear()
    return out
