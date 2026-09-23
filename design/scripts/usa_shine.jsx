// In-place finish pass on "USA v2": gold keyline on the face, horizon-chrome rim.
// Touches strokes and the rim fill only; face fills and live effects are left alone.
// (Specular glints were tried and rejected — don't bring them back.)
var KEYLINE = 'F2BE48', KEYLINE_W = 1.5;
var CHROME = [[0,'FFFFFF'],[16,'DCE5EE'],[40,'8D9AA8'],[48.5,'353C44'],[51,'F6F2EA'],[68,'B8AD9C'],[87,'6C665F'],[100,'D5D5D5']];

var d = app.activeDocument;
var G = d.layers.getByName('[ART] Vectors (back)').groupItems.getByName('USA v2');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }
function shapes(it, out) {
  out = out || [];
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) shapes(it.pageItems[i], out); }
  else if (it.typename == 'PathItem' || it.typename == 'CompoundPathItem') out.push(it);
  return out;
}
// Style a compound path through its first subpath only: writing to the others makes Illustrator
// re-apply the fill and reset its gradient angle (the A's fire turned horizontal).
function first(s) { return s.typename == 'CompoundPathItem' ? s.pathItems[0] : s; }

// Stacking order inside USA v2: face, bevel, rim, extrusion.
var faceG = G.pageItems[0], rimG = G.pageItems[2];

// 1. Gold keyline around the face letters.
var faces = shapes(faceG);
for (var i = 0; i < faces.length; i++) {
  var p = first(faces[i]);
  p.stroked = true; p.strokeColor = rgb(KEYLINE); p.strokeWidth = KEYLINE_W; p.strokeJoin = StrokeJoin.MITERENDJOIN;
}

// 2. Horizon chrome: cool sky, a hard dark horizon, then a bright warm ground; the hard break is what reads as polish.
var g;
try { g = d.gradients.getByName('USA Chrome'); } catch (e) { g = d.gradients.add(); g.name = 'USA Chrome'; }
g.type = GradientType.LINEAR;
while (g.gradientStops.length < CHROME.length) g.gradientStops.add();
while (g.gradientStops.length > CHROME.length) g.gradientStops[g.gradientStops.length - 1].remove();
for (i = 0; i < CHROME.length; i++) { var st = g.gradientStops[i]; st.rampPoint = CHROME[i][0]; st.midPoint = 50; st.color = rgb(CHROME[i][1]); st.opacity = 100; }
var rims = shapes(rimG);
for (i = 0; i < rims.length; i++) {
  var gc = new GradientColor(); gc.gradient = g;
  first(rims[i]).fillColor = gc;
  rims[i].rotate(-90, false, false, true, false, Transformation.CENTER);
}
d.selection = [G];
'shine pass: ' + faces.length + ' keylined, ' + rims.length + ' rim shapes re-chromed';
