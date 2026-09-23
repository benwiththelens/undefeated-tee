// Ribbon words as envelope distortions: straight Superclarendon text, then Object > Envelope Distort >
// Make with Top Object using a clean shape that traces each band's own top and bottom edges. Letters then
// stretch, squash and shear with the band (text on a path only bends the baseline).
// Each envelope is only as wide as its word naturally sets at the band's height, centred on the band.
// Envelopes stay live: Direct Selection (A) on the envelope's points to refine; Edit Contents to retype.
// Hides "Ribbon Text" (never deletes). Refuses to overwrite "Ribbon Envelopes" unless FORCE = true.
var FORCE = false;
var FONT = 'SuperclarendonRg-Bold', INK = 'F0E0B8', TRACK = 60;
var BANDS = [   // [text, face bounds in "Front Eagle v2" as placed (left, top, right, bottom)]
  ['UNDEFEATED', [209, -622, 628, -825]],
  ['WORLD TOUR', [238, -756, 577, -896]]
];
var SPAN = [0.12, 0.88];   // usable fraction of each band's length (skips the curled ends)
var FILL = 0.60;           // word height as a fraction of the band's height

var d = app.activeDocument, front = d.layers.getByName('[ART] Vectors (front)');
var v2 = front.groupItems.getByName('Front Eagle v2'), ko = front.groupItems.getByName('Front Eagle KO');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }

var existing = null;
try { existing = front.groupItems.getByName('Ribbon Envelopes'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Ribbon Envelopes" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();
try { front.groupItems.getByName('Ribbon Text').hidden = true; } catch (e) {}

// --- band geometry (same method as ribbon_text.jsx) ---
var vb = v2.geometricBounds, kb = ko.geometricBounds, S = ko.width / v2.width;
function map(p) { return [kb[0] + (p[0] - vb[0]) * S, kb[1] + (p[1] - vb[1]) * S]; }
function findFace(target) {
  var hit = null;
  (function w(x) { if (x.typename == 'GroupItem') { for (var i = 0; i < x.pageItems.length; i++) w(x.pageItems[i]); return; }
    var b = x.geometricBounds, ok = true; for (var k = 0; k < 4; k++) if (Math.abs(b[k] - target[k]) > 2) ok = false; if (ok) hit = x; })(v2);
  if (!hit) throw new Error('band face not found near ' + target.join(','));
  return hit;
}
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
function at(E, x) {   // outermost crossings -> [top, bottom]
  var ys = [];
  for (var i = 0; i < E.length; i++) { var p = E[i][0], q = E[i][1];
    if ((p[0] - x) * (q[0] - x) <= 0 && p[0] != q[0]) ys.push(p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])); }
  if (ys.length < 2) return null;
  ys.sort(function (a, b) { return b - a; });
  return [ys[0], ys[ys.length - 1]];
}
// Closed envelope with exactly FOUR anchors (one per corner); each band edge is one cubic fitted through
// the measured edge at 0, 1/3, 2/3, 1. Make with Top Object maps the text's corners onto the anchors, so
// extra anchors fold the mesh (an 18-point shape turned the words into a crumpled mess).
function envelopeShape(parent, E, x0, x1) {
  function edgePts(sign) {
    var q = [];
    for (var i = 0; i <= 3; i++) { var x = x0 + (x1 - x0) * i / 3, tb = at(E, x), mid = (tb[0] + tb[1]) / 2, h = (tb[0] - tb[1]) * FILL / 2; q.push([x, mid + sign * h]); }
    return q;
  }
  // Cubic through P0..P3 at t = 0, 1/3, 2/3, 1 -> control points.
  function ctrl(P) {
    var c1 = [], c2 = [];
    for (var k = 0; k < 2; k++) { c1.push((-5 * P[0][k] + 18 * P[1][k] - 9 * P[2][k] + 2 * P[3][k]) / 6); c2.push((2 * P[0][k] - 9 * P[1][k] + 18 * P[2][k] - 5 * P[3][k]) / 6); }
    return [c1, c2];
  }
  var T = edgePts(1), B = edgePts(-1), ct = ctrl(T), cb = ctrl(B);
  var p = parent.pathItems.add(); p.setEntirePath([T[0], T[3], B[3], B[0]]); p.closed = true;
  var a = p.pathPoints;
  a[0].leftDirection = a[0].anchor; a[0].rightDirection = ct[0];   // TL -> along top
  a[1].leftDirection = ct[1];       a[1].rightDirection = a[1].anchor;   // TR, straight down the right side
  a[2].leftDirection = a[2].anchor; a[2].rightDirection = cb[1];   // BR -> along bottom (reversed)
  a[3].leftDirection = cb[0];       a[3].rightDirection = a[3].anchor;   // BL, straight up the left side
  p.filled = true; p.fillColor = rgb(INK); p.stroked = false;
  return p;
}

// Words and envelope shapes are built loose on the layer: selecting two items inside a group can select the
// group itself, and Make Envelope then sees one object. Results are moved into the group afterwards.
// Alerts are suppressed so a failure comes back as an error instead of a modal that blocks all scripting.
var lvl = app.userInteractionLevel; app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
var made = [], report = [];
try {
for (var bi = 0; bi < BANDS.length; bi++) {
  var E = edges(findFace(BANDS[bi][1]));
  var xs = []; for (var i = 0; i < E.length; i++) xs.push(E[i][0][0]);
  var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  var u0 = xmin + (xmax - xmin) * SPAN[0], u1 = xmin + (xmax - xmin) * SPAN[1], cx = (u0 + u1) / 2;
  var mid = at(E, cx), bandH = mid[0] - mid[1];

  // Straight text sized so its glyph height = band height * FILL; its width decides the envelope's span.
  var tf = front.textFrames.add(); tf.contents = BANDS[bi][0];
  var ca = tf.textRange.characterAttributes;
  ca.textFont = app.textFonts.getByName(FONT); ca.size = 100; ca.tracking = TRACK; ca.fillColor = rgb(INK);
  tf.textRange.characters[tf.characters.length - 1].characterAttributes.tracking = 0;
  var glyphH = tf.createOutline(); var k = (bandH * FILL) / glyphH.height; var natW = glyphH.width * k; glyphH.remove();
  tf = front.textFrames.add(); tf.contents = BANDS[bi][0];   // outline consumed the first frame; recreate
  ca = tf.textRange.characterAttributes;
  ca.textFont = app.textFonts.getByName(FONT); ca.size = 100 * k; ca.tracking = TRACK; ca.fillColor = rgb(INK);
  tf.textRange.characters[tf.characters.length - 1].characterAttributes.tracking = 0;
  var half = Math.min(natW / 2, (u1 - u0) / 2);
  var tb = tf.geometricBounds; tf.translate(cx - (tb[0] + tb[2]) / 2, (mid[0] + mid[1]) / 2 - (tb[1] + tb[3]) / 2);

  var env = envelopeShape(front, E, cx - half, cx + half);
  env.move(tf, ElementPlacement.PLACEBEFORE);
  // Assign the selection as objects: setting .selected on a new text frame enters text-edit mode and selects its characters.
  d.selection = null; d.selection = [env, tf];
  app.executeMenuCommand('Make Envelope');
  var out = d.selection.length == 1 ? d.selection[0] : null;
  if (!out || out.typename != 'PluginItem') throw new Error(BANDS[bi][0] + ': Make Envelope did not produce an envelope (selection=' + d.selection.length + ')');
  out.name = BANDS[bi][0]; made.push(out);
  report.push(BANDS[bi][0] + ': band h=' + bandH.toFixed(1) + 'pt, word ' + (2 * half).toFixed(0) + 'pt wide' + (half < natW / 2 ? ' (clamped to band)' : '') + ' -> ' + (out ? out.typename : 'NOTHING'));
}
} finally { app.userInteractionLevel = lvl; }
var G = front.groupItems.add(); G.name = 'Ribbon Envelopes';
for (var m = 0; m < made.length; m++) made[m].move(G, ElementPlacement.PLACEATEND);
G.move(front, ElementPlacement.PLACEATBEGINNING);   // above the eagle
d.selection = null;
report.join('\n');
