"""Detail shots for the store gallery: the distressed print set into a synthetic black cotton-jersey
surface, cropped close enough that the joke is readable.

  public/detail-back.jpg    the tour table (frame + ornament)
  public/detail-front.jpg   the whole front graphic

Reads the full-artboard 300 dpi exports (design/exports/raw-<side>-distressed.png) so crops can be
given in Illustrator document coordinates.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
EXPORTS = ROOT / "design" / "exports"
OUT = ROOT / "public"
SIZE = 1800
PX = 300 / 72
ARTBOARD_TL = {"front": (0.0, 0.0), "back": (891.933884297521, 144.0)}   # left, top in document points
rng = np.random.default_rng(7)


def fabric(n):
    """Black cotton jersey: vertical knit wales, fine grain, soft top-left light, slight vignette."""
    base = rng.standard_normal((n, n)).astype(np.float32)
    wales = Image.fromarray(((base - base.min()) / np.ptp(base) * 255).astype(np.uint8))
    wales = np.asarray(wales.filter(ImageFilter.BoxBlur(1)).resize((n, n // 3)).resize((n, n), Image.BILINEAR), np.float32) / 255
    knit = 0.55 * wales + 0.45 * (rng.standard_normal((n, n)).astype(np.float32) * 0.5 + 0.5)
    knit = (knit - knit.mean()) / (knit.std() + 1e-6)
    y, x = np.mgrid[0:n, 0:n] / n
    light = 1.0 + 0.10 * (1 - (x * 0.6 + y * 0.4)) - 0.18 * ((x - 0.5) ** 2 + (y - 0.5) ** 2)
    shade = 22 * light + 2.2 * knit
    rgb = np.stack([shade, shade, shade * 1.03], axis=-1)
    return np.clip(rgb, 0, 255), knit


def crop_doc(side, left, top, right, bottom):
    img = Image.open(EXPORTS / f"raw-{side}-distressed.png").convert("RGBA")
    ax, ay = ARTBOARD_TL[side]
    box = (int((left - ax) * PX), int((ay - top) * PX), int((right - ax) * PX), int((ay - bottom) * PX))
    return img.crop(box)


def shoot(art, name, fill=0.86):
    bg, knit = fabric(SIZE)
    s = min(SIZE * fill / art.width, SIZE * fill / art.height)
    art = art.resize((int(art.width * s), int(art.height * s)), Image.LANCZOS)
    art = art.filter(ImageFilter.GaussianBlur(0.45))               # ink soaking into the knit
    a = np.asarray(art, np.float32)
    ox, oy = (SIZE - art.width) // 2, (SIZE - art.height) // 2
    k = knit[oy:oy + art.height, ox:ox + art.width, None]
    ink = a[..., :3] * 0.93 * (1 + 0.05 * k)                        # knit shading, slightly muted DTG ink
    alpha = (a[..., 3:] / 255) * np.clip(0.94 + 0.04 * k, 0, 1)
    region = bg[oy:oy + art.height, ox:ox + art.width]
    bg[oy:oy + art.height, ox:ox + art.width] = region * (1 - alpha) + ink * alpha
    Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).save(OUT / name, quality=90, optimize=True)
    print(f"{name}: art {art.width}x{art.height} px in {SIZE}x{SIZE}")


# Back: the frame and bottom ornament (document coordinates, with a little breathing room).
shoot(crop_doc("back", 952, -290, 1840, -990), "detail-back.jpg", fill=0.9)

# Front: the whole graphic, found from the export's own alpha bounds.
front = Image.open(EXPORTS / "raw-front-distressed.png").convert("RGBA")
bbox = front.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
shoot(front.crop(bbox), "detail-front.jpg", fill=0.88)
