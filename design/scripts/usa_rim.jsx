// Re-cuts the rim + extrusion of "USA v2" in place, keeping the groups (and any effects on them).
var RIM = 9, EXTRUDE = 16;
var d = app.activeDocument;
var art = d.layers.getByName('[ART] Vectors (back)');
var G = art.groupItems.getByName('USA v2');
var faceG = G.pageItems[0], rimG = G.pageItems[2], exG = G.pageItems[3];

function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }
function gc(name) { var g = new GradientColor(); g.gradient = d.gradients.getByName(name); return g; }
function shapes(it, out) {
  out = out || [];
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) shapes(it.pageItems[i], out); }
  else if (it.typename == 'PathItem' || it.typename == 'CompoundPathItem') out.push(it);
  return out;
}
function paint(it, fill, strokeHex, sw) {
  var s = shapes(it);
  for (var i = 0; i < s.length; i++) {
    var p = s[i].typename == 'CompoundPathItem' ? s[i].pathItems[0] : s[i];
    p.filled = true; p.fillColor = fill;
    p.stroked = true; p.strokeColor = rgb(strokeHex); p.strokeWidth = sw; p.strokeJoin = StrokeJoin.MITERENDJOIN;
    s[i].rotate(-90, false, false, true, false, Transformation.CENTER);
  }
}
function expanded(g) {
  d.selection = null; g.selected = true; app.executeMenuCommand('expandStyle');
  var r = d.selection[0], bad = [];
  (function walk(it) { if (it.typename == 'GroupItem') for (var i = 0; i < it.pageItems.length; i++) walk(it.pageItems[i]); else if (it.typename != 'PathItem' && it.typename != 'CompoundPathItem') bad.push(it.typename); })(r);
  if (bad.length) throw new Error('expand produced ' + bad.join(','));
  return r;
}

// Letter shapes only, copied into a bare group so the face group's glow never gets expanded.
var tmp = art.groupItems.add(), letters = shapes(faceG);
for (var i = 0; i < letters.length; i++) letters[i].duplicate(tmp, ElementPlacement.PLACEATEND);
tmp.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + RIM + ' I jntp 2 "/></LiveEffect>');
var rim = expanded(tmp);

var ex = art.groupItems.add();
for (var k = 1; k <= EXTRUDE; k++) { var c = rim.duplicate(); c.translate(0, -k); c.move(ex, ElementPlacement.PLACEATEND); }
d.selection = null; ex.selected = true;
app.executeMenuCommand('Live Pathfinder Add');
var extrude = expanded(ex);

paint(rim, gc('USA Chrome'), '111111', 1.5);
paint(extrude, gc('USA Extrude'), '000000', 1);

// Swap contents, keep the containers.
while (rimG.pageItems.length) rimG.pageItems[0].remove();
while (exG.pageItems.length) exG.pageItems[0].remove();
var rs = shapes(rim), es = shapes(extrude);
for (i = 0; i < rs.length; i++) rs[i].move(rimG, ElementPlacement.PLACEATEND);
for (i = 0; i < es.length; i++) es[i].move(exG, ElementPlacement.PLACEATEND);
try { rim.remove(); } catch (e) {}
try { extrude.remove(); } catch (e) {}
d.selection = null;
'rim ' + RIM + 'pt: rim=' + rimG.pageItems.length + ' shapes, extrude=' + exG.pageItems.length + ' shapes, G=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');
