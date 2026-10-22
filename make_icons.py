#!/usr/bin/env python3
"""Draw the app icon (house roofline over three rising bars) at the sizes PWAs need."""
from PIL import Image, ImageDraw
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
BG, HOUSE, BUY, INV, CASH = (22, 32, 29), (243, 245, 244), (76, 194, 145), (138, 162, 255), (212, 176, 90)

def icon(size, maskable=False):
    S = size * 4  # supersample
    im = Image.new('RGBA', (S, S), BG + (255,))
    d = ImageDraw.Draw(im)
    pad = S * (0.20 if maskable else 0.12)
    w = S - 2 * pad
    # roof
    lw = max(4, int(S * 0.05))
    apex = (S / 2, pad + w * 0.06)
    left, right = (pad + w * 0.04, pad + w * 0.42), (pad + w * 0.96, pad + w * 0.42)
    d.line([left, apex, right], fill=HOUSE, width=lw, joint='curve')
    for p in (left, apex, right):
        d.ellipse([p[0] - lw / 2, p[1] - lw / 2, p[0] + lw / 2, p[1] + lw / 2], fill=HOUSE)
    # bars
    base = pad + w * 0.94
    bw = w * 0.18
    gap = w * 0.07
    x0 = S / 2 - (3 * bw + 2 * gap) / 2
    for i, (h, c) in enumerate([(0.26, CASH), (0.38, INV), (0.50, BUY)]):
        x = x0 + i * (bw + gap)
        d.rounded_rectangle([x, base - w * h, x + bw, base], radius=bw * 0.18, fill=c)
    return im.resize((size, size), Image.LANCZOS)

for s in (192, 512):
    icon(s).save(f'{OUT}/icon-{s}.png')
    icon(s, True).save(f'{OUT}/icon-maskable-{s}.png')
icon(180).convert('RGB').save(f'{OUT}/apple-touch-icon.png')
icon(32).save(f'{OUT}/favicon-32.png')
print('ok')
