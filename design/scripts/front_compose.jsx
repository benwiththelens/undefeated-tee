// Front composition: a copy of the back's "USA v2" on top, the knockout eagle below at the same width with
// its wingtips tucked behind the lettering (as in the mockup), the eagle optically centred under USA.
// Refuses to overwrite an existing "USA (front)" unless FORCE = true, so hand edits survive.
var FORCE = false;
var WIDTH = 560;          // pt; USA and eagle share this width (~7.8")
var CENTER_X = 396;       // front artboard centre
var USA_TOP = -40;
var TUCK = 50;            // pt the eagle's top rises behind the USA's bottom
var OPTICAL = 0.5;        // 0 = bounding-box centre, 1 = ink centroid

var d = app.activeDocument;
var back = d.layers.getByName('[ART] Vectors (back)'), front = d.layers.getByName('[ART] Vectors (front)');

var existing = null;
try { existing = front.groupItems.getByName('USA (front)'); } catch (e) {}
if (existing && !FORCE) throw new Error('"USA (front)" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();

// USA: duplicate keeps its live warp and glow; strokes scale with it.
var usa = back.groupItems.getByName('USA v2').duplicate(front, ElementPlacement.PLACEATBEGINNING);
usa.name = 'USA (front)';
var su = WIDTH / usa.width * 100;
usa.resize(su, su, true, true, true, true, su, Transformation.CENTER);
var ub = usa.visibleBounds;
usa.translate(CENTER_X - (ub[0] + ub[2]) / 2, USA_TOP - ub[1]);
ub = usa.visibleBounds;

// Eagle: scale to the same width, tuck under the USA.
var eagle = front.groupItems.getByName('Front Eagle KO');
var se = WIDTH / eagle.width * 100;
eagle.resize(se, se, true, true, true, true, se, Transformation.CENTER);
var eb = eagle.geometricBounds;
eagle.translate(0, (ub[3] + TUCK) - eb[1]);

// Optical centring: area-weighted centroid of the ink, blended with the bounding-box centre.
function area(x) { if (x.typename == 'CompoundPathItem') { var s = 0; for (var i = 0; i < x.pathItems.length; i++) s += x.pathItems[i].area; return Math.abs(s); } return isNaN(x.area) ? 0 : Math.abs(x.area); }
var A = 0, MX = 0;
(function w(x) { if (x.typename == 'GroupItem') { for (var i = 0; i < x.pageItems.length; i++) w(x.pageItems[i]); return; }
  var a = area(x), b = x.geometricBounds; A += a; MX += a * (b[0] + b[2]) / 2; })(eagle);
eb = eagle.geometricBounds;
var boxC = (eb[0] + eb[2]) / 2, inkC = MX / A, target = boxC + (inkC - boxC) * OPTICAL;
eagle.translate(CENTER_X - target, 0);
eb = eagle.geometricBounds;

// USA in front of the eagle.
usa.move(front, ElementPlacement.PLACEATBEGINNING);
d.selection = null;
function f(v) { return v.toFixed(1); }
'USA (front): scale=' + f(su) + '% b=' + f(ub[0]) + ',' + f(ub[1]) + ',' + f(ub[2]) + ',' + f(ub[3]) +
'\nEagle: scale=' + f(se) + '% b=' + f(eb[0]) + ',' + f(eb[1]) + ',' + f(eb[2]) + ',' + f(eb[3]) + ' (ink centroid sat ' + f(inkC - boxC) + 'pt from box centre; shifted ' + f(CENTER_X - target - (CENTER_X - boxC)) + ')' +
'\nDesign: ' + f((Math.max(ub[2], eb[2]) - Math.min(ub[0], eb[0])) / 72) + '" x ' + f((ub[1] - eb[3]) / 72) + '"';
