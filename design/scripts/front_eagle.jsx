// First-draft import of the Envato "Hand Drawn American Bald Eagle" onto the front artboard:
// eagle body + ribbon + talons only (no AMERICA text, flags or shield), recoloured into the back's palette.
// The art is a solid black silhouette with lighter feathers on top, so black maps to a dark tan (the
// engraved lines) rather than to transparent, which would delete the whole chest.
// Refuses to run over an existing "Front Eagle" unless FORCE = true, so hand edits survive.
var FORCE = false;
var SRC = 'C:/Users/benea/Downloads/hand-drawn-american-bald-eagle-design-2026-02-24-04-13-13-utc/Hand Drawn American Bald Eagle Design.ai';
var PALETTE = {            // source RGB -> replacement hex
  '0/0/0':       '8A7348',
  '142/112/85':  'D6C49A',
  '255/255/255': 'FFF4D4',
  '224/223/220': 'E9DDB8',
  '255/195/23':  'F2BE48',
  '67/98/172':   '8A7348'
};
var WINGSPAN = 620;        // pt, on the 792pt-wide front artboard
var CENTER_X = 396, TOP_Y = -250;

var d = app.activeDocument;
var layer = d.layers.getByName('[ART] Vectors (front)');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }
function key(c) { return c.typename == 'RGBColor' ? [Math.round(c.red), Math.round(c.green), Math.round(c.blue)].join('/') : c.typename; }

var existing = null;
try { existing = layer.groupItems.getByName('Front Eagle'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Front Eagle" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();

var lvl = app.userInteractionLevel, unmapped = {}, recoloured = 0;
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
try {
  var s = app.open(new File(SRC));
  try {
    var src = s.layers.getByName('eagle'), copied = [];
    // Source stacking, bottom to top: body (3), ribbon (2), talons (0). Index 1 is the AMERICA text.
    // Cross-document duplicates must target a layer; duplicating straight into a group throws PARM.
    var parts = [[3, 'Eagle Body'], [2, 'Ribbon'], [0, 'Talons']];
    for (var i = 0; i < parts.length; i++) {
      var p = src.pageItems[parts[i][0]].duplicate(layer, ElementPlacement.PLACEATBEGINNING);
      p.name = parts[i][1]; copied.push(p);
    }
  } finally { s.close(SaveOptions.DONOTSAVECHANGES); }
} finally { app.userInteractionLevel = lvl; d.activate(); }
var G = layer.groupItems.add(); G.name = 'Front Eagle';
for (var i = 0; i < copied.length; i++) copied[i].move(G, ElementPlacement.PLACEATBEGINNING);

(function walk(it) {
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) walk(it.pageItems[i]); return; }
  var p = it.typename == 'CompoundPathItem' ? (it.pathItems.length ? it.pathItems[0] : null) : it;
  if (!p) return;
  if (p.filled) { var k = key(p.fillColor); if (PALETTE[k]) { p.fillColor = rgb(PALETTE[k]); recoloured++; } else unmapped[k] = (unmapped[k] || 0) + 1; }
  if (p.stroked) { var sk = key(p.strokeColor); if (PALETTE[sk]) p.strokeColor = rgb(PALETTE[sk]); else unmapped['stroke ' + sk] = 1; }
})(G);

var s2 = WINGSPAN / G.width * 100;
G.resize(s2, s2, true, true, true, true, s2, Transformation.CENTER);
var b = G.geometricBounds;
G.translate(CENTER_X - (b[0] + b[2]) / 2, TOP_Y - b[1]);
d.selection = null;
var um = []; for (var k in unmapped) um.push(k + ' x' + unmapped[k]);
'Front Eagle: ' + recoloured + ' fills recoloured, scale=' + s2.toFixed(0) + '%, b=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1') + (um.length ? '\nUNMAPPED: ' + um.join(', ') : '\nall colours mapped');
