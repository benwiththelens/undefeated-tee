// First-draft builder for the tour tagline between USA and the frame:
// tour name on double rules that cap the frame, gold stars at the rule ends, tour years beneath.
// Refuses to run over an existing "Tour Tagline" unless FORCE = true, so hand edits survive.
var FORCE = false;
var NAME = 'UNDEFEATED WORLD TOUR', YEARS = '1918 — 2026';
var FONT = 'SuperclarendonRg-Bold';
var NAME_SIZE = 22, NAME_TRACK = 200, YEARS_SIZE = 14, YEARS_TRACK = 350;
var NAME_BASE = -257, YEARS_BASE = -278;       // baselines; gap is USA bottom -214 to frame top -303.8
var LEFT = 967.9, RIGHT = 1823.9;              // frame outer edges
var CX = (LEFT + RIGHT) / 2;
var TEXT_PAD = 18, STAR_R = 10, STAR_PAD = 6;  // rule-to-text gap, star radius, rule-to-star gap
var CREAM = 'FFF4D4', GOLD = 'F9B233';

var d = app.activeDocument;
var art = d.layers.getByName('[ART] Vectors (back)');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }

var existing = null;
try { existing = art.groupItems.getByName('Tour Tagline'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Tour Tagline" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();

var G = art.groupItems.add(); G.name = 'Tour Tagline';
try { G.move(art.groupItems.getByName('Outer Border'), ElementPlacement.PLACEBEFORE); } catch (e) {}

// Centred point text on a baseline. Tracking is zeroed on the last glyph so it doesn't push the centre left.
function label(txt, size, track, base) {
  var t = G.textFrames.add(); t.contents = txt;
  var ca = t.textRange.characterAttributes;
  ca.textFont = app.textFonts.getByName(FONT); ca.size = size; ca.tracking = track; ca.fillColor = rgb(CREAM);
  t.textRange.characters[t.characters.length - 1].characterAttributes.tracking = 0;
  t.textRange.paragraphAttributes.justification = Justification.CENTER;
  t.translate(CX - t.anchor[0], base - t.anchor[1]);  // anchor is read-only; move the frame instead
  return t;
}
function rule(x1, x2, y, w) {
  var p = G.pathItems.add(); p.setEntirePath([[x1, y], [x2, y]]);
  p.filled = false; p.stroked = true; p.strokeColor = rgb(CREAM); p.strokeWidth = w; p.strokeCap = StrokeCap.BUTTENDCAP;
  return p;
}
function star(x, y) {
  var s = G.pathItems.star(x, y, STAR_R, STAR_R * 0.42, 5, false);
  s.filled = true; s.fillColor = rgb(GOLD); s.stroked = false;
  return s;
}

var nameTf = label(NAME, NAME_SIZE, NAME_TRACK, NAME_BASE);  // not "name": that's an ExtendScript global
label(YEARS, YEARS_SIZE, YEARS_TRACK, YEARS_BASE);

// Rules sit on the name's optical middle: a heavy line over a hairline, echoing the frame's band + inner line.
var nb = nameTf.geometricBounds, mid = (nb[1] + nb[3]) / 2;
var ls = LEFT + STAR_R, rs = RIGHT - STAR_R;
var segs = [[ls + STAR_R + STAR_PAD, nb[0] - TEXT_PAD], [nb[2] + TEXT_PAD, rs - STAR_R - STAR_PAD]];
for (var i = 0; i < 2; i++) {
  rule(segs[i][0], segs[i][1], mid + 2.5, 2.5);
  rule(segs[i][0], segs[i][1], mid - 2.5, 0.75);
}
star(ls, mid); star(rs, mid);

d.selection = null;
'Tour Tagline built: name=' + nb.join(',').replace(/(\.\d)\d+/g, '$1') + ' block=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');
