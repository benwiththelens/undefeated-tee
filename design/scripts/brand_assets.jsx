// Draft brand assets in throwaway documents (the tee file is never modified):
//   design/renders/favicon-star-<px>.png, favicon-leaf-<px>.png   star and corner leaf at favicon sizes
//   design/renders/og-card.png                                  1200x630 link-preview card
// Shapes are duplicated from the artwork: a star from "Tour Tagline", the leaf from "Outer Border".
var OUT = 'D:/Dev/undefeated-drop/design/renders/';
var FRONT_PNG = 'D:/Dev/undefeated-drop/design/exports/front_print_300dpi-distressed.png';
var INK = [240, 224, 184], GROUND = [27, 25, 23];
var ROWS = [
  ['1973', 'VIETNAM', '\u201CPEACE WITH HONOR\u201D'],
  ['2003', 'IRAQ', '\u201CMISSION ACCOMPLISHED\u201D'],
  ['2021', 'AFGHANISTAN', '\u201CAN EXTRAORDINARY SUCCESS\u201D'],
  ['2026', 'IRAN', '\u201COH, I THINK WE WON\u201D']
];

var main = app.activeDocument, back = main.layers.getByName('[ART] Vectors (back)');
function rgb(a) { var c = new RGBColor(); c.red = a[0]; c.green = a[1]; c.blue = a[2]; return c; }
function png(doc, file, scale, clear) {
  var o = new ExportOptionsPNG24(); o.artBoardClipping = true; o.transparency = !!clear; o.antiAliasing = true;
  o.horizontalScale = scale; o.verticalScale = scale;
  doc.exportFile(new File(OUT + file), ExportType.PNG24, o);
}
function fill(it, col) {
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) fill(it.pageItems[i], col); return; }
  var p = it.typename == 'CompoundPathItem' ? it.pathItems[0] : it; p.filled = true; p.fillColor = col; p.stroked = false;
}

// Source shapes.
var tag = back.groupItems.getByName('Tour Tagline'), star = null;
for (var i = 0; i < tag.pathItems.length; i++) if (tag.pathItems[i].pathPoints.length == 10) star = tag.pathItems[i];
var leaf = back.groupItems.getByName('Outer Border').pageItems[1];   // top-left corner leaf, tip at -45deg

// --- Favicons: 64pt master, exported down/up to each pixel size.
var SIZES = [16, 32, 180];
var shapes = [['star', star, 0], ['leaf', leaf, 135]];   // leaf rotated so its point faces up
for (var s = 0; s < shapes.length; s++) {
  var d = app.documents.add(DocumentColorSpace.RGB, 64, 64), ab = d.artboards[0].artboardRect;
  var bg = d.pathItems.roundedRectangle(ab[1], ab[0], 64, 64, 14, 14); bg.fillColor = rgb(GROUND); bg.stroked = false;
  var g = shapes[s][1].duplicate(d.layers[0], ElementPlacement.PLACEATBEGINNING);
  if (shapes[s][2]) g.rotate(shapes[s][2]);
  fill(g, rgb(INK));
  var k = 44 / Math.max(g.width, g.height) * 100; g.resize(k, k);
  var b = g.geometricBounds; g.translate(ab[0] + 32 - (b[0] + b[2]) / 2, ab[1] - 32 - (b[1] + b[3]) / 2);
  for (var z = 0; z < SIZES.length; z++) png(d, 'favicon-' + shapes[s][0] + '-' + SIZES[z] + '.png', SIZES[z] / 64 * 100, true);   // transparent corners
  d.close(SaveOptions.DONOTSAVECHANGES);
}

// --- OG card: front graphic left, four tour rows set large right.
var W = 1200, H = 630;
var d = app.documents.add(DocumentColorSpace.RGB, W, H), ab = d.artboards[0].artboardRect, L = ab[0], T = ab[1];
var bg = d.pathItems.rectangle(T, L, W, H); bg.fillColor = rgb(GROUND); bg.stroked = false;
var art = d.placedItems.add(); art.file = new File(FRONT_PNG);
var ks = (H - 70) / art.height * 100; art.resize(ks, ks);
art.left = L + 60; art.top = T - (H - art.height) / 2;
art.embed();

function text(str, font, size, x, y, track, just) {
  var t = d.textFrames.add(); t.contents = str;
  var ca = t.textRange.characterAttributes; ca.textFont = app.textFonts.getByName(font); ca.size = size; ca.fillColor = rgb(INK); ca.tracking = track || 0;
  if (just) t.textRange.paragraphAttributes.justification = just;
  t.translate(x - t.anchor[0], y - t.anchor[1]);
  return t;
}
var X0 = L + 520, colOpp = X0 + 78, colW = X0 + 262, colQ = X0 + 318;
text('UNDEFEATED WORLD TOUR', 'SuperclarendonRg-Bold', 22, X0, T - 118, 180);
text('1918 \u2014 2026', 'SuperclarendonRg-Bold', 15, X0, T - 146, 300);
var rule = d.pathItems.add(); rule.setEntirePath([[X0, T - 172], [L + W - 60, T - 172]]); rule.filled = false; rule.stroked = true; rule.strokeColor = rgb(INK); rule.strokeWidth = 1.5;
for (var r = 0; r < ROWS.length; r++) {
  var y = T - 238 - r * 78;
  text(ROWS[r][0], 'AlternateGotNo1D', 30, X0, y);
  text(ROWS[r][1], 'AlternateGotNo1D', 30, colOpp, y);
  text('W', 'SuperclarendonRg-Bold', 30, colW, y);
  text(ROWS[r][2], 'AlternateGotNo1D', 30, colQ, y);
}
text('+ 8 MORE DATES ON THE BACK', 'SuperclarendonRg-Bold', 13, X0, T - 238 - 3 * 78 - 58, 260);
png(d, 'og-card.png', 100);
d.close(SaveOptions.DONOTSAVECHANGES);
main.activate();
'drafts written; active=' + app.activeDocument.name;
