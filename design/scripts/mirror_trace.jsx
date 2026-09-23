// Builds perfectly symmetrical versions of an expanded Image Trace by mirroring one half.
// Works on duplicates of SOURCE; the source group is left as-is.
// Axis = x of the lowest anchor of the centre drop (the shape whose bounds straddle the middle).
var SOURCE = 'Trace (expanded copy)';
var MIN_AREA = 20;      // drops specks
var SEAM = 0.5;         // halves overlap this much at the axis so the union leaves no hairline gap

var d = app.activeDocument, ref = d.layers.getByName('[REF] Shirt Mockup');
var src = ref.groupItems.getByName(SOURCE);
// Pathfinder via script only works on a single selected group (loose multi-selections silently no-op),
// so wrap the operands in a temp group first.
function pathfinder(items, cmd) {
  var g = ref.groupItems.add();
  for (var i = 0; i < items.length; i++) items[i].move(g, ElementPlacement.PLACEATEND);
  d.selection = null; g.selected = true;
  app.executeMenuCommand(cmd); app.executeMenuCommand('expandStyle');
  return d.selection[0];
}

// Ornament shapes = everything except specks and anything spanning the whole crop
// (the traced background, and the white margin around the crop).
var keep = [], sw = src.width, bgArea = 0;
for (var i = 0; i < src.pageItems.length; i++) {
  var s = src.pageItems[i];
  if (s.width > sw * 0.9) { bgArea += Math.abs(s.area); continue; }
  if (Math.abs(s.area) >= MIN_AREA) keep.push(s);
}

// Axis from the centre drop: the kept shape whose bounds contain the ornament's midpoint, lowest anchor.
var ob = [1e9, -1e9, -1e9, 1e9];
for (i = 0; i < keep.length; i++) { var b = keep[i].geometricBounds; ob = [Math.min(ob[0], b[0]), Math.max(ob[1], b[1]), Math.max(ob[2], b[2]), Math.min(ob[3], b[3])]; }
var mid = (ob[0] + ob[2]) / 2, drop = null;
for (i = 0; i < keep.length; i++) { var bb = keep[i].geometricBounds; if (bb[0] < mid && bb[2] > mid && (!drop || bb[3] < drop.geometricBounds[3])) drop = keep[i]; }
var low = drop.pathPoints[0];
for (i = 1; i < drop.pathPoints.length; i++) if (drop.pathPoints[i].anchor[1] < low.anchor[1]) low = drop.pathPoints[i];
var axis = low.anchor[0];

// Reflect an item across the vertical line x = axis.
function mirror(it) {
  var b = it.geometricBounds, m = it.duplicate();
  m.resize(-100, 100, true, true, true, true, 100, Transformation.CENTER);
  m.translate((2 * axis - b[2]) - m.geometricBounds[0], 0);
  return m;
}
// Arms are separate shapes: keep one side's, reflect it. Only the drop crosses the axis, so it alone
// is halved (two-object Intersect), reflected and re-united.
function build(side) {
  var arms = [];
  for (var i = 0; i < keep.length; i++) {
    if (keep[i] == drop) continue;
    var b = keep[i].geometricBounds, cx = (b[0] + b[2]) / 2;
    if ((side == 'L') == (cx < axis)) arms.push(keep[i]);
  }
  var pad = 5, db = drop.geometricBounds;
  var left = side == 'L' ? db[0] - pad : axis - SEAM, right = side == 'L' ? axis + SEAM : db[2] + pad;
  var box = ref.pathItems.rectangle(db[1] + pad, left, right - left, db[1] - db[3] + 2 * pad);
  var d0 = drop.duplicate(ref, ElementPlacement.PLACEATBEGINNING);
  var halfDrop = pathfinder([d0, box], 'Live Pathfinder Intersect');
  var fullDrop = pathfinder([halfDrop, mirror(halfDrop)], 'Live Pathfinder Add');

  var G = ref.groupItems.add(); G.name = 'Ornament ' + side + '-mirror';
  fullDrop.move(G, ElementPlacement.PLACEATEND);
  for (i = 0; i < arms.length; i++) {
    arms[i].duplicate(G, ElementPlacement.PLACEATEND);
    mirror(arms[i]).move(G, ElementPlacement.PLACEATEND);
  }
  return G;
}
var out = [];
var names = ['Ornament L-mirror', 'Ornament R-mirror'];
for (i = 0; i < names.length; i++) try { ref.groupItems.getByName(names[i]).remove(); } catch (e) {}
var L = build('L'), R = build('R');
// Park them side by side under the source so they can be compared.
var sb = src.geometricBounds, gap = (sb[1] - sb[3]) * 0.6;
L.translate(sb[0] - L.geometricBounds[0], (sb[3] - gap) - L.geometricBounds[1]);
R.translate(sb[0] - R.geometricBounds[0], (L.geometricBounds[3] - gap) - R.geometricBounds[1]);
d.selection = null;
function count(g) { var n = 0; (function w(it) { if (it.typename == 'GroupItem' || it.typename == 'CompoundPathItem') { var c = it.typename == 'GroupItem' ? it.pageItems : it.pathItems; for (var i = 0; i < c.length; i++) w(c[i]); } else n++; })(g); return n; }
'axis=' + axis.toFixed(2) + ' bgArea=' + Math.round(bgArea) + ' kept=' + keep.length + '\nL: ' + L.typename + ' shapes=' + count(L) + ' w=' + L.width.toFixed(1) + '\nR: ' + R.typename + ' shapes=' + count(R) + ' w=' + R.width.toFixed(1);
