"""Turns raw 300 dpi transparent artboard exports into print deliverables.

For each side:
  <side>_print_300dpi.png      art cropped to its own bounds (what a DTG printer positions)
  <side>_placement_12x16.png   the same art centred, top-aligned on a 12" x 16" print-area canvas (mockups)
Plus print_spec.txt with sizes and collar offsets.

Collar offsets are conventions for a crew-neck adult tee; the printer's own spec overrides them.

usage: python make_print_files.py [variant]   e.g. "distressed" reads raw-<side>-distressed.png and
       writes <side>_print_300dpi-distressed.png etc.; no variant = the clean files.
"""
import sys
from pathlib import Path
from PIL import Image

VARIANT = sys.argv[1] if len(sys.argv) > 1 else ""
SUFFIX = f"-{VARIANT}" if VARIANT else ""

DPI = 300
EXPORTS = Path(__file__).resolve().parent.parent / "exports"
CANVAS_IN = (12, 16)
COLLAR_IN = {"front": 3.0, "back": 2.0}   # top of art below the collar seam, centred horizontally
MAX_W_IN = 12.0                            # common DTG platen width

lines = [f"Undefeated World Tour Tee - print spec{(" (" + VARIANT + ")") if VARIANT else ""} ({DPI} dpi, transparent PNG, dark garment / black shirt)", ""]
for side in ("front", "back"):
    raw = Image.open(EXPORTS / f"raw-{side}{SUFFIX}.png").convert("RGBA")
    bbox = raw.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    art = raw.crop(bbox)
    art.save(EXPORTS / f"{side}_print_300dpi{SUFFIX}.png", dpi=(DPI, DPI))

    w_in, h_in = art.width / DPI, art.height / DPI
    cw, ch = CANVAS_IN[0] * DPI, CANVAS_IN[1] * DPI
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(art, ((cw - art.width) // 2, 0), art)
    canvas.save(EXPORTS / f"{side}_placement_12x16{SUFFIX}.png", dpi=(DPI, DPI))

    flags = []
    if w_in > MAX_W_IN:
        flags.append(f"WIDER THAN {MAX_W_IN:.0f}\" PLATEN")
    elif w_in > MAX_W_IN - 0.25:
        flags.append(f"within 0.25\" of a {MAX_W_IN:.0f}\" platen - confirm with printer")
    if h_in > CANVAS_IN[1]:
        flags.append(f"TALLER THAN {CANVAS_IN[1]}\" PRINT AREA")
    lines += [
        f"{side.upper()}",
        f"  file:       {side}_print_300dpi{SUFFIX}.png  ({art.width} x {art.height} px)",
        f"  print size: {w_in:.2f}\" W x {h_in:.2f}\" H",
        f"  placement:  centred horizontally; top of art {COLLAR_IN[side]:.1f}\" below the collar seam",
        f"  notes:      {'; '.join(flags) if flags else 'fits a 12x16 print area'}",
        "",
    ]
    raw.close()

lines += [
    "Artwork is knockout-style: the black shirt supplies the dark tones. Do not add a black underbase or",
    "fill transparent areas. Parchment ink F0E0B8; USA uses gradients (DTG).",
    "Recommend one physical test print before the batch (finest feather lines are near 1pt).",
]
(EXPORTS / f"print_spec{SUFFIX}.txt").write_text("\n".join(lines), encoding="utf-8")
print("\n".join(lines))
