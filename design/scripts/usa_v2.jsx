// First-draft builder for the back-print USA as outlined, layered vector art.
// Refuses to run over an existing "USA v2": that group carries hand-applied live effects
// (inner glow, warp) that a rebuild would destroy. Edit in place instead (usa_rim.jsx),
// or set FORCE = true to deliberately start over.
var FORCE = false;
var FONT = 'Western_Hornet-Regular';
var RIM = 9, BEVEL = 5, EXTRUDE = 16, GAP = 5;
var TARGET_W = 764;      // outer rim width = frame width
var CENTER_X = 1404.3;   // frame center
var FACE_BOTTOM = -135;  // keeps tagline (-188) clear of rim + extrusion
var FACE_H = 236;        // rim top stays under the artboard top (144)

var d = app.activeDocument;
var art = d.layers.getByName('[ART] Vectors (back)');
var log = [];

function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }
function grad(name, stops) {
  try { d.gradients.getByName(name).remove(); } catch (e) {}
  var g = d.gradients.add(); g.name = name; g.type = GradientType.LINEAR;
  while (g.gradientStops.length < stops.length) g.gradientStops.add();
  for (var i = 0; i < stops.length; i++) { var s = g.gradientStops[i]; s.rampPoint = stops[i][0]; s.midPoint = 50; s.color = rgb(stops[i][1]); }
  var gc = new GradientColor(); gc.gradient = g; return gc;
}
// Visit each letter-level shape (PathItem or CompoundPathItem) inside a group.
function shapes(it, out) {
  out = out || [];
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) shapes(it.pageItems[i], out); }
  else if (it.typename == 'PathItem' || it.typename == 'CompoundPathItem') out.push(it);
  return out;
}
function paint(it, fill, strokeHex, sw, vertical) {
  var s = shapes(it);
  for (var i = 0; i < s.length; i++) {
    var p = s[i].typename == 'CompoundPathItem' ? s[i].pathItems[0] : s[i];
    p.filled = true; p.fillColor = fill;
    if (strokeHex) { p.stroked = true; p.strokeColor = rgb(strokeHex); p.strokeWidth = sw; p.strokeJoin = StrokeJoin.MITERENDJOIN; }
    else p.stroked = false;
    if (vertical) s[i].rotate(-90, false, false, true, false, Transformation.CENTER);
  }
}
function offsetCopy(src, dist) {
  var dup = src.duplicate();
  dup.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + dist + ' I jntp 2 "/></LiveEffect>');
  d.selection = null; dup.selected = true;
  app.executeMenuCommand('expandStyle');
  return d.selection[0];
}

// Clear a previous build; hide (never delete) the original live USA.
var existing = null;
try { existing = art.groupItems.getByName('USA v2'); } catch (e) {}
if (existing && !FORCE) throw new Error('"USA v2" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();
for (var i = 0; i < art.textFrames.length; i++) if (art.textFrames[i].contents == 'USA') art.textFrames[i].hidden = true;

// Face letters as outlines.
var tf = art.textFrames.add(); tf.contents = 'USA';
var ca = tf.textRange.characterAttributes; ca.textFont = app.textFonts.getByName(FONT); ca.size = 300; ca.fillColor = rgb('000000');
var face = tf.createOutline();
var L = shapes(face);
L.sort(function (a, b) { return a.geometricBounds[0] - b.geometricBounds[0]; });

// Scale so the outer rim spans TARGET_W with GAP between neighbouring rims.
var wf = 0; for (i = 0; i < L.length; i++) wf += L[i].width;
var s = (TARGET_W - 2 * RIM - (L.length - 1) * (2 * RIM + GAP)) / wf;
var sy = FACE_H / face.height;
face.resize(s * 100, sy * 100, true, true, true, true, 100, Transformation.CENTER);
var x = CENTER_X - TARGET_W / 2 + RIM;
for (i = 0; i < L.length; i++) {
  var b = L[i].geometricBounds;
  L[i].translate(x - b[0], 0);
  x += L[i].width + 2 * RIM + GAP;
}
var fb = face.geometricBounds; face.translate(0, FACE_BOTTOM - fb[3]);

// Layers.
var rim = offsetCopy(face, RIM);
var bevel = offsetCopy(face, BEVEL);
var ex = [];
for (var k = 1; k <= EXTRUDE; k++) { var c = rim.duplicate(); c.translate(0, -k); ex.push(c); }
var extrude = art.groupItems.add();
for (k = 0; k < ex.length; k++) ex[k].move(extrude, ElementPlacement.PLACEATEND);
d.selection = null; extrude.selected = true;
app.executeMenuCommand('Live Pathfinder Add'); app.executeMenuCommand('expandStyle');
extrude = d.selection[0];

paint(extrude, grad('USA Extrude', [[0,'9097A0'],[55,'4A4F56'],[100,'23262A']]), '000000', 1, true);
paint(rim,     grad('USA Chrome',  [[0,'F4F6F8'],[28,'9DA3AA'],[47,'FFFFFF'],[53,'4E545B'],[76,'D3D7DC'],[100,'7C838B']]), '111111', 1.5, true);
paint(bevel,   grad('USA Bevel',   [[0,'5C6168'],[50,'E9ECEF'],[100,'3E4349']]), null, 0, true);
paint(face,    grad('USA Fire',    [[0,'B5121B'],[38,'E53A1C'],[72,'F7931E'],[100,'FFD340']]), '2A0F05', 1.5, true);

var G = art.groupItems.add(); G.name = 'USA v2';
extrude.move(G, ElementPlacement.PLACEATEND);
rim.move(G, ElementPlacement.PLACEATBEGINNING);
bevel.move(G, ElementPlacement.PLACEATBEGINNING);
face.move(G, ElementPlacement.PLACEATBEGINNING);
d.selection = null;
'USA v2 built: sx=' + s.toFixed(3) + ' sy=' + sy.toFixed(3) + ' bounds=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');




