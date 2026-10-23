#!/usr/bin/env python3
"""Unstage and restore the data files whose only change is the "fetched_utc" download time (or JSON formatting).
The weekly refresh rewrites every file it downloads; without this a week with one new number would still commit and
redeploy ~150 files whose only change is the download time. Prints the files it restored; exit 0."""
import json, subprocess

def strip(x):
    if isinstance(x, dict): return {k: strip(v) for k, v in x.items() if k != 'fetched_utc'}
    if isinstance(x, list): return [strip(v) for v in x]
    return x

def same(f):
    try:
        old = json.loads(subprocess.run(['git', 'show', f'HEAD:{f}'], capture_output=True, text=True, check=True).stdout)
        return strip(old) == strip(json.load(open(f)))
    except Exception: return False  # new, deleted or not JSON: a real change

files = subprocess.run(['git', 'diff', '--cached', '--name-only', '--', 'data'], capture_output=True, text=True, check=True).stdout.split()
keep = [f for f in files if same(f)]
if keep:
    subprocess.run(['git', 'checkout', 'HEAD', '--'] + keep, check=True)
    print(f'{len(keep)} file(s) with only a new download time left as they were')
