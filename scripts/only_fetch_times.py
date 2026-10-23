#!/usr/bin/env python3
"""Exit 0 if the staged changes under data/ only touch "fetched_utc" timestamps (or JSON formatting), 1 otherwise.
The weekly refresh rewrites every file it downloads; without this check a week with no new data would still commit
and redeploy ~150 files whose only change is the download time."""
import json, subprocess, sys

def strip(x):
    if isinstance(x, dict): return {k: strip(v) for k, v in x.items() if k != 'fetched_utc'}
    if isinstance(x, list): return [strip(v) for v in x]
    return x

files = subprocess.run(['git', 'diff', '--cached', '--name-only', '--', 'data'], capture_output=True, text=True, check=True).stdout.split()
for f in files:
    try:
        old = json.loads(subprocess.run(['git', 'show', f'HEAD:{f}'], capture_output=True, text=True, check=True).stdout)
        new = json.load(open(f))
    except Exception: sys.exit(1)  # new, deleted or not JSON: a real change
    if strip(old) != strip(new): sys.exit(1)
sys.exit(0)
