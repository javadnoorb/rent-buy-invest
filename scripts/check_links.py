#!/usr/bin/env python3
"""Checks that the sources cited by the hand-compiled data still answer: every source URL in data/state_rules.json and
data/transfer_taxes.json. Prints one line per broken link and writes them to the file named by LINKS_OUT (for the
monthly workflow's issue). Sites that refuse automated requests (401/403/429) are listed separately as "not checked",
not as broken. Exit 0 always: a dead link is a to-do, not a failure.
Run: python3 scripts/check_links.py
"""
import json, os, sys, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 rent-buy-invest link check'}

def urls(x, where, out):
    """(url, where) pairs for every *url / source_url / u field in a JSON tree."""
    if isinstance(x, dict):
        for k, v in x.items():
            if isinstance(v, str) and v.startswith('http') and (k in ('u', 'url') or k.endswith('_url')): out.append((v, where))
            else: urls(v, f'{where}.{k}' if where else k, out)
    elif isinstance(x, list):
        for i, v in enumerate(x): urls(v, f'{where}[{i}]', out)
    return out

def check(u):
    for method in ('HEAD', 'GET'):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H, method=method), timeout=30) as r: return r.status
        except urllib.error.HTTPError as e:
            if method == 'GET' or e.code not in (403, 405, 400, 501): return e.code
        except Exception as e:
            if method == 'GET': return f'{type(e).__name__}: {str(e)[:80]}'
    return None

if __name__ == '__main__':
    pairs = []
    for f in ('state_rules.json', 'transfer_taxes.json'):
        p = os.path.join(ROOT, 'data', f)
        if os.path.exists(p): urls(json.load(open(p)), f, pairs)
    seen = {}
    for u, w in pairs: seen.setdefault(u, w)
    with ThreadPoolExecutor(8) as ex: res = dict(zip(seen, ex.map(check, seen)))
    broken = [(u, s) for u, s in res.items() if not (isinstance(s, int) and (s < 400 or s in (401, 403, 429)))]
    blocked = [(u, s) for u, s in res.items() if s in (401, 403, 429)]
    print(f'{len(res)} links: {len(res) - len(broken) - len(blocked)} ok, {len(blocked)} not checked (site refuses robots), {len(broken)} broken')
    lines = [f'- {s}: {u} (in {seen[u]})' for u, s in broken]
    for l in lines: print(l)
    if os.environ.get('LINKS_OUT'): open(os.environ['LINKS_OUT'], 'w').write('\n'.join(lines) + ('\n' if lines else ''))
