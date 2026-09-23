"""Knocks a scanned distress texture out of ALL the ink, with strength scaled by what the ink is.

A real worn print wears everywhere, but a speck that lands on a 1pt engraving line cuts it in two,
so strength follows ink thickness, per part:
  each named part: (fraction for its strokes >= THICK_PT, fraction for thinner strokes)
  everything else: (THICK_FRAC, THIN_FRAC)   (ribbon words, frame band, ornament, rules)
Specks are a fixed physical size, so smaller art (the front USA is 74% of the back's) needs a lower
fraction to read the same. Ben's tuning, 2026-09-24: USA and eagle solids pulled back, text as is.

Inputs (design/exports, 300 dpi transparent PNGs on one pixel grid, from export_parts.jsx):
  raw-<side>.png, mask-<side>-<part>.png
Output: raw-<side>-distressed.png

usage: python distress.py <texture.jpg>
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

EXPORTS = Path(__file__).resolve().parent.parent / "exports"
DPI = 300
PX_PER_PT = DPI / 72
PARTS = {                      # side -> [(part mask, thick fraction, thin fraction)]
    "front": [("usa", 0.07, 0.07), ("eagle", 0.05, 0.03)],
    "back": [("usa", 0.09, 0.09), ("table", 0.06, 0.06)],
}
THICK_PT, THICK_FRAC, THIN_FRAC = 3.0, 0.10, 0.03

tex = np.asarray(Image.open(sys.argv[1]).convert("L")).astype(np.float32)


def texture_for(h, w):
    """Mirror-tile the texture to cover h x w (flips avoid visible seams)."""
    row = np.concatenate([tex, tex[:, ::-1]], axis=1)
    block = np.concatenate([row, row[::-1, :]], axis=0)
    return np.tile(block, (-(-h // block.shape[0]), -(-w // block.shape[1])))[:h, :w]


def morph(m, r, grow):
    """Square-kernel dilation (grow=True) or erosion (grow=False), radius r px."""
    op = np.logical_or if grow else np.logical_and
    acc = m.copy()
    for axis in (0, 1):
        cur = acc.copy()
        for s in range(1, r + 1):
            cur = op(cur, np.roll(acc, s, axis=axis))
            cur = op(cur, np.roll(acc, -s, axis=axis))
        acc = cur
    return acc


def knock(t, zone, frac):
    """Holes where the texture is brightest, covering `frac` of the zone."""
    if not zone.any():
        return np.zeros_like(zone), 0.0
    thr = np.percentile(t[zone], 100 * (1 - frac))
    hole = zone & (t > thr)
    return hole, hole.sum() / zone.sum()


for side, parts in PARTS.items():
    art = np.asarray(Image.open(EXPORTS / f"raw-{side}.png").convert("RGBA")).copy()
    alpha = art[..., 3]
    ink = alpha > 8
    t = texture_for(*alpha.shape)
    claimed = np.zeros_like(ink)
    holes = np.zeros_like(ink)
    report = []
    r = max(1, int(round(THICK_PT * PX_PER_PT / 2)))
    wide = morph(morph(ink, r, False), r, True)                # opening: ink that is >= THICK_PT wide

    def split(zone, name, thick_frac, thin_frac):
        global holes
        for label, z, frac in (("thick", zone & wide, thick_frac), ("thin", zone & ~wide, thin_frac)):
            h, got = knock(t, z, frac)
            holes |= h
            report.append(f"{name} {label} {100 * got:.1f}%")

    for part, thick_frac, thin_frac in parts:
        m = (np.asarray(Image.open(EXPORTS / f"mask-{side}-{part}.png").convert("RGBA"))[..., 3] > 8) & ink & ~claimed
        split(m, part, thick_frac, thin_frac)
        claimed |= m
    split(ink & ~claimed, "rest", THICK_FRAC, THIN_FRAC)
    art[..., 3] = np.where(holes, 0, alpha)
    Image.fromarray(art).save(EXPORTS / f"raw-{side}-distressed.png", dpi=(DPI, DPI))
    print(f"{side}: " + "; ".join(report))
