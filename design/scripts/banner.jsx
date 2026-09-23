// First-draft builder for the arched ribbon banner over the frame's bottom edge.
// Refuses to run over an existing "Banner" unless FORCE = true, so hand edits survive.
var FORCE = false;
var TEXT = 'UNDEFEATED WORLD TOUR', FONT = 'Western_Hornet-Regular', SIZE = 31, TRACK = 25;
var CX = 1395.9;          // frame center
var APEX_Y = -852;        // band midline at its peak; frame bottom edge is -856.2
var W = 520, H = 56, SAG = 24;           // band chord width, height, arch rise
var TAIL = 86, DROP = 22, TUCK = 28, NOTCH = 20;
var KEY_INSET = 5;

var d = app.activeDocument;
var layer = d.layers.getByName('[ART] Vectors (back)');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }
function grad(name, stops) {
  try { d.gradients.getByName(name).remove(); } catch (e) {}
  var g = d.gradients.add(); g.name = name; g.type = GradientType.LINEAR;
  while (g.gradientStops.length < stops.length) g.gradientStops.add();
  for (var i = 0; i < stops.length; i++) { var s = g.gradientStops[i]; s.rampPoint = stops[i][0]; s.midPoint = 50; s.color = rgb(stops[i][1]); }
  var gc = new GradientColor(); gc.gradient = g; return gc;
}

// Geometry: all arcs share one circle centre below the band.
var R = (W * W / 4 + SAG * SAG) / (2 * SAG);
var C = [CX, APEX_Y - R];
var A = Math.asin((W / 2) / R);
var T0 = Math.PI / 2 + A, T1 = Math.PI / 2 - A;   // left end, right end
function at(r, t) { return [C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)]; }
// Bezier arc from t0 to t1 as [{a,l,r}] with corner-free interior points.
function arc(r, t0, t1, n) {
  var out = [], step = (t1 - t0) / n, k = 4 / 3 * Math.tan(step / 4) * r;
  for (var i = 0; i <= n; i++) {
    var t = t0 + step * i, p = at(r, t), dir = [-Math.sin(t), Math.cos(t)];
    out.push({ a: p, l: [p[0] - k * dir[0], p[1] - k * dir[1]], r: [p[0] + k * dir[0], p[1] + k * dir[1]] });
  }
  out[0].l = out[0].a; out[n].r = out[n].a;
  return out;
}
function line(pts) { var o = []; for (var i = 0; i < pts.length; i++) o.push({ a: pts[i], l: pts[i], r: pts[i] }); return o; }
function make(parent, pts, closed) {
  var p = parent.pathItems.add(), an = [];
  for (var i = 0; i < pts.length; i++) an.push(pts[i].a);
  p.setEntirePath(an); p.closed = closed;
  for (i = 0; i < pts.length; i++) { var q = p.pathPoints[i]; q.leftDirection = pts[i].l; q.rightDirection = pts[i].r; q.pointType = PointType.CORNER; }
  return p;
}
function style(p, fill, strokeHex, sw, vertical) {
  if (fill) { p.filled = true; p.fillColor = fill; } else p.filled = false;
  if (strokeHex) { p.stroked = true; p.strokeColor = rgb(strokeHex); p.strokeWidth = sw; p.strokeJoin = StrokeJoin.MITERENDJOIN; } else p.stroked = false;
  if (vertical) p.rotate(-90, false, false, true, false, Transformation.CENTER);
  return p;
}
// Map ribbon-local (u outward along the band, v along the radius) at an end angle to page coords.
function endMap(t, side) {
  var m = at(R, t), N = [Math.cos(t), Math.sin(t)];
  var Tn = side > 0 ? [Math.sin(t), -Math.cos(t)] : [-Math.sin(t), Math.cos(t)];
  return function (u, v) { return [m[0] + u * Tn[0] + v * N[0], m[1] + u * Tn[1] + v * N[1]]; };
}

// Replace a previous build; hide the old flat tagline (text + stars), never the guide.
var existing = null;
try { existing = layer.groupItems.getByName('Banner'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Banner" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();
for (var gi = 0; gi < layer.groupItems.length; gi++) {
  var g0 = layer.groupItems[gi], hit = false;
  for (var j = 0; j < g0.textFrames.length; j++) if (g0.textFrames[j].contents == TEXT) hit = true;
  if (hit) for (j = 0; j < g0.pageItems.length; j++) { var it = g0.pageItems[j]; if (!(it.typename == 'PathItem' && it.guides)) it.hidden = true; }
}

var G = layer.groupItems.add(); G.name = 'Banner';
// The frame's bottom edge must pass behind the ribbon.
try { G.move(layer.groupItems.getByName('Outer Border'), ElementPlacement.PLACEBEFORE); }
catch (e) { G.move(layer, ElementPlacement.PLACEATBEGINNING); }

var tailFill = grad('Banner Tail', [[0, 'D6C49A'], [100, 'A89160']]);
var bandFill = grad('Banner Band', [[0, 'FFF6DE'], [55, 'F2E4BF'], [100, 'D9C593']]);

// Tails and folds (behind the band).
var sides = [[T0, -1], [T1, 1]];
for (var s = 0; s < 2; s++) {
  var f = endMap(sides[s][0], sides[s][1]);
  var top = H / 2 - DROP, bot = -H / 2 - DROP;
  style(make(G, line([f(-TUCK, top), f(TAIL, top), f(TAIL - NOTCH, (top + bot) / 2), f(TAIL, bot), f(-TUCK, bot)]), true), tailFill, '2A1C0E', 2, true);
  style(make(G, line([f(0, -H / 2), f(0, bot), f(-TUCK, -H / 2)]), true), rgb('6B5835'), '2A1C0E', 2, false);
}

// Band.
var band = arc(R + H / 2, T0, T1, 4).concat(arc(R - H / 2, T1, T0, 4));
style(make(G, band, true), bandFill, '2A1C0E', 2.5, true);
style(make(G, arc(R + H / 2 - KEY_INSET, T0, T1, 4), false), null, '3B2A17', 1, false);
style(make(G, arc(R - H / 2 + KEY_INSET, T0, T1, 4), false), null, '3B2A17', 1, false);

// Text on an arc through the band's optical centre.
var capH = SIZE * 0.72;
var tp = make(G, arc(R - capH / 2, T0 + 0.1, T1 - 0.1, 4), false);
var tf = G.textFrames.pathText(tp);
tf.contents = TEXT;
var ca = tf.textRange.characterAttributes;
ca.textFont = app.textFonts.getByName(FONT); ca.size = SIZE; ca.tracking = TRACK; ca.fillColor = rgb('2A1C0E');
tf.textRange.paragraphAttributes.justification = Justification.CENTER;

d.selection = null;
'Banner built: R=' + Math.round(R) + ' bounds=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');


