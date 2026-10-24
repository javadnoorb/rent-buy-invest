#!/usr/bin/env python3
"""Tiles the chart screenshots from sweep.js into a few labelled sheets, so a handful of image reads cover every chart.
Usage: python3 .claude/skills/upgrade-app/montage.py <outdir>   (needs Pillow; writes <outdir>/sheet-*.png)"""
import glob, os, sys
from PIL import Image, ImageDraw

out = sys.argv[1] if len(sys.argv) > 1 else 'sweep'
groups = {}
for f in sorted(glob.glob(os.path.join(out, '*.png'))):
    name = os.path.basename(f)
    if name.startswith('sheet-'):
        continue
    groups.setdefault(name.split('-')[0], []).append(f)
for width, files in groups.items():
    phone = width.startswith('390')
    per, cols, scale = (15, 5, 1) if phone else (6, 3, 0.66)
    for g in range(0, len(files), per):
        ims = [Image.open(f) for f in files[g:g + per]]
        w, h = max(i.width for i in ims), max(i.height for i in ims) + 18
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (w * cols, h * rows), 'white'); d = ImageDraw.Draw(sheet)
        for k, (im, f) in enumerate(zip(ims, files[g:g + per])):
            x, y = (k % cols) * w, (k // cols) * h
            d.text((x + 4, y + 2), os.path.basename(f), fill='red'); sheet.paste(im, (x, y + 18))
        if scale != 1:
            sheet = sheet.resize((int(sheet.width * scale), int(sheet.height * scale)))
        p = os.path.join(out, f'sheet-{width}-{g // per}.png'); sheet.save(p); print(p)
