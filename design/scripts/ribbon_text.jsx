// Sets the front ribbon's words on paths that follow each band's twist: "UNDEFEATED" on the top band,
// "WORLD TOUR" on the lower band.
// Band geometry comes from the ribbon face shapes in the hidden "Front Eagle v2" (same art as the knockout),
// mapped onto the knockout's current position/scale, then scanned for centre line and height.
// Refuses to overwrite "Ribbon Text" unless FORCE = true.
var FORCE = false;
var FONT = 'Western_Hornet-Regular', INK = 'F0E0B8', TRACK = 40;
var BANDS = [   // [text, face bounds in v2 as placed (left, top, right, bottom)]
  ['UNDEFEATED', [209, -622, 628, -825]],
  ['WORLD TOUR', [238, -756, 577, -896]]
];
var SPAN = [0.14, 0.86];   // use this fraction of each band's length (skips the curled ends)
var FILL = 0.56;           // cap height as a fraction of the band's narrowest height along the span
var CAP = 0.72;            // Western Hornet cap height / point size (checked against the render)

var d = app.activeDocument, front = d.layers.getByName('[ART] Vectors (front)');
var v2 = front.groupItems.getByName('Front Eagle v2'), ko = front.groupItems.getByName('Front Eagle KO');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }

var existing = null;
try { existing = front.groupItems.getByName('Ribbon Text'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Ribbon Text" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();

// v2 -> knockout mapping (same art: scale by width ratio, align top-left corners).
var vb = v2.geometricBounds, kb = ko.geometricBounds, S = ko.width / v2.width;
function map(p) { return [kb[0] + (p[0] - vb[0]) * S, kb[1] + (p[1] - vb[1]) * S]; }
function findFace(target) {
  var hit = null;
  (function w(x) { if (x.typename == 'GroupItem') { for (var i = 0; i < x.pageItems.length; i++) w(x.pageItems[i]); return; }
    var b = x.geometricBounds, ok = true; for (var k = 0; k < 4; k++) if (Math.abs(b[k] - target[k]) > 2) ok = false; if (ok) hit = x; })(v2);
  if (!hit) throw new Error('band face not found near ' + target.join(','));
  return hit;
}
// Flatten a (compound) path into mapped polygon edges.
function edges(item) {
  var paths = item.typename == 'CompoundPathItem' ? item.pathItems : [item], E = [];
  for (var i = 0; i < paths.length; i++) {
    var pp = paths[i].pathPoints, n = pp.length;
    for (var j = 0; j < n; j++) {
      var a = pp[j], b = pp[(j + 1) % n], prev = map(a.anchor);
      for (var t = 1; t <= 12; t++) {
        var u = t / 12, v = 1 - u, q = [];
        for (var k = 0; k < 2; k++) q.push(v*v*v*a.anchor[k] + 3*v*v*u*a.rightDirection[k] + 3*v*u*u*b.leftDirection[k] + u*u*u*b.anchor[k]);
        q = map(q); E.push([prev, q]); prev = q;
      }
    }
  }
  return E;
}
// Vertical scan: at each x, the face's top and bottom crossings -> centre and height.
function scan(E, x0, x1, step) {
  var out = [];
  for (var x = x0; x <= x1; x += step) {
    var ys = [];
    for (var i = 0; i < E.length; i++) { var p = E[i][0], q = E[i][1];
      if ((p[0] - x) * (q[0] - x) <= 0 && p[0] != q[0]) ys.push(p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])); }
    if (ys.length < 2) continue;
    ys.sort(function (a, b) { return b - a; });
    // Outermost crossings: the faces are compounds with hatch gaps inside, so inner pairs are hatch edges.
    out.push([x, (ys[0] + ys[ys.length - 1]) / 2, ys[0] - ys[ys.length - 1]]);
  }
  return out;
}
// Smooth path through points (Catmull-Rom -> Bezier).
function smoothPath(parent, pts) {
  var p = parent.pathItems.add(), an = [];
  for (var i = 0; i < pts.length; i++) an.push(pts[i]);
  p.setEntirePath(an);
  for (i = 0; i < pts.length; i++) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], pt = p.pathPoints[i];
    var tx = (b[0] - a[0]) / 6, ty = (b[1] - a[1]) / 6;
    pt.leftDirection = [pts[i][0] - tx, pts[i][1] - ty]; pt.rightDirection = [pts[i][0] + tx, pts[i][1] + ty];
  }
  p.filled = false; p.stroked = false;
  return p;
}

var G = front.groupItems.add(); G.name = 'Ribbon Text';
G.move(ko, ElementPlacement.PLACEBEFORE);
var report = [];
for (var bi = 0; bi < BANDS.length; bi++) {
  var E = edges(findFace(BANDS[bi][1]));
  var xs = []; for (var i = 0; i < E.length; i++) xs.push(E[i][0][0]);
  var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  var samples = scan(E, xmin + (xmax - xmin) * SPAN[0], xmin + (xmax - xmin) * SPAN[1], 4);
  // 15th-percentile height: robust to a single pinch or stray crossing.
  var hs = []; for (i = 0; i < samples.length; i++) hs.push(samples[i][2]);
  hs.sort(function (a, b) { return a - b; });
  var hmin = hs[Math.floor(hs.length * 0.15)];
  var size = hmin * FILL / CAP, capH = size * CAP;
  // Baseline = centre line lowered by half the cap height; keep every 5th sample for a smooth curve.
  var pts = []; for (i = 0; i < samples.length; i += 5) pts.push([samples[i][0], samples[i][1] - capH / 2]);
  var last = samples[samples.length - 1]; pts.push([last[0], last[1] - capH / 2]);
  var tf = G.textFrames.pathText(smoothPath(G, pts));
  tf.contents = BANDS[bi][0];
  var ca = tf.textRange.characterAttributes;
  ca.textFont = app.textFonts.getByName(FONT); ca.size = size; ca.tracking = TRACK; ca.fillColor = rgb(INK);
  tf.textRange.characters[tf.characters.length - 1].characterAttributes.tracking = 0;
  tf.textRange.paragraphAttributes.justification = Justification.CENTER;
  // Shrink until the whole word fits on the path (text on a path overflows silently).
  function shown() { try { return tf.lines.length ? tf.lines[0].characters.length : 0; } catch (e) { return 0; } }
  var guard = 0;
  while (shown() < tf.characters.length && guard++ < 60) { size *= 0.96; tf.textRange.characterAttributes.size = size; }
  tf.name = BANDS[bi][0];
  report.push(BANDS[bi][0] + ': band height p15=' + hmin.toFixed(1) + 'pt, size=' + size.toFixed(1) + 'pt, samples=' + samples.length + ', fits=' + (shown() == tf.characters.length));
}
d.selection = null;
report.join('\n');
