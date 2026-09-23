"""DTG line-weight check on a 300 dpi render of an artboard.

Isolates one ink colour, then flags:
  thin ink  - ink that disappears under a morphological opening of width W (lines thinner than W)
  thin gaps - background that fills under a closing of width W (knocked-out gaps narrower than W)
for W = 0.5pt and 1pt. Writes a diagnostic overlay (red = thin ink, cyan = thin gaps).

usage: python linecheck.py render.png out.png [ink_hex] [dpi]
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
ink_hex = sys.argv[3] if len(sys.argv) > 3 else "F0E0B8"
dpi = float(sys.argv[4]) if len(sys.argv) > 4 else 300.0
px_per_pt = dpi / 72.0

img = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
ink_rgb = np.array([int(ink_hex[i:i + 2], 16) for i in (0, 2, 4)])
ink = np.abs(img - ink_rgb).sum(axis=2) < 60


def shift_reduce(m, r, op):
    """Square-kernel erosion (op=np.logical_and) or dilation (op=np.logical_or), radius r px."""
    acc = m.copy()
    for axis in (0, 1):
        cur = acc.copy()
        for s in range(1, r + 1):
            for d in (s, -s):
                cur = op(cur, np.roll(acc, d, axis=axis))
        acc = cur
    return acc


def erode(m, r):
    return shift_reduce(m, r, np.logical_and)


def dilate(m, r):
    return shift_reduce(m, r, np.logical_or)


# Only judge gaps inside the art, not the open shirt around it.
region = dilate(ink, int(6 * px_per_pt))

report = []
overlay = np.zeros(img.shape, dtype=np.uint8)
overlay[ink] = (90, 85, 70)
for w_pt in (0.5, 1.0):
    r = max(1, int(round(w_pt * px_per_pt / 2)))
    opened = dilate(erode(ink, r), r)
    thin_ink = ink & ~opened
    closed = erode(dilate(ink, r), r)
    thin_gap = closed & ~ink & region
    report.append(
        f"< {w_pt}pt: thin ink {thin_ink.sum() / px_per_pt**2:8.1f} sq pt "
        f"({100 * thin_ink.sum() / max(1, ink.sum()):.2f}% of ink) | "
        f"thin gaps {thin_gap.sum() / px_per_pt**2:8.1f} sq pt"
    )
    if w_pt == 1.0:
        overlay[thin_ink] = (255, 40, 40)
        overlay[thin_gap] = (0, 220, 255)

report.insert(0, f"ink area {ink.sum() / px_per_pt**2:.0f} sq pt at {dpi:.0f} dpi ({img.shape[1]}x{img.shape[0]} px)")
Image.fromarray(overlay).save(out)
print("\n".join(report))
