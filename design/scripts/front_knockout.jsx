// Knockout version of "Front Eagle v2" for dark-shirt DTG: the shirt supplies every dark tone, so no
// solid slab of ink.
// How the source is built, bottom to top: one full dark silhouette, light highlight shapes ("paper"),
// then more dark detail (eye, brow, head markings, hatching) back on top of the paper.
//   Eagle   = highlights minus the top dark details (so the eye is shirt), plus a thin contour traced from
//             the silhouette's edge (the outline the silhouette used to give by peeking past the paper).
//   Ribbon  = the reverse: only its dark lines (outline + hatching), in ink; its light faces are cut out.
//             The strand in the beak and talons counts as ribbon.
//   Feet over the ribbon: the eagle's highlights (grown slightly) are cut out of the ribbon lines so toe
//   gaps stay shirt-coloured.
// Works on copies; hides v2 (never deletes). Refuses to overwrite "Front Eagle KO" unless FORCE = true.
var FORCE = false;
var INK = 'F0E0B8';        // warm parchment
var RIBBON_GROW = 2;       // pt; pulls the ribbon's edge outlines into the ribbon zone
var FEET_GROW = 1.5;       // pt; clears the ribbon lines just around the feet
var CONTOUR = 1.2;         // pt; width of the traced silhouette outline
// The ribbon strand in the beak and talons, by bounds [left, top, right, bottom] in v2 as placed.
var STRAND = [[603, -436, 623, -509], [491, -516, 591, -692], [490, -589, 509, -637], [441, -662, 524, -689]];

var d = app.activeDocument, layer = d.layers.getByName('[ART] Vectors (front)');
var V2 = layer.groupItems.getByName('Front Eagle v2');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }

var existing = null;
try { existing = layer.groupItems.getByName('Front Eagle KO'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Front Eagle KO" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();

function leaves(it, out) { out = out || []; if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) leaves(it.pageItems[i], out); } else out.push(it); return out; }
function copies(list) { var g = layer.groupItems.add(); for (var i = 0; i < list.length; i++) list[i].duplicate(g, ElementPlacement.PLACEATEND); return g; }
// Effect > Pathfinder only applies to one selected group, so operands are wrapped. The LAST operand ends
// up backmost; Subtract (Minus Front) keeps only that backmost object, so it must be a single compound.
function pathfinder(items, cmd) {
  var g = layer.groupItems.add();
  for (var i = 0; i < items.length; i++) items[i].move(g, ElementPlacement.PLACEATEND);
  d.selection = null; g.selected = true;
  app.executeMenuCommand(cmd); app.executeMenuCommand('expandStyle');
  return d.selection[0];
}
function toCompound(it) {
  if (it.typename == 'CompoundPathItem') return it;
  var L = leaves(it);
  for (var i = 0; i < L.length; i++) L[i].move(layer, ElementPlacement.PLACEATBEGINNING);
  try { if (it.typename == 'GroupItem') it.remove(); } catch (e) {}
  d.selection = null; for (i = 0; i < L.length; i++) L[i].selected = true;
  app.executeMenuCommand('compoundPath');
  return d.selection[0];
}
function grow(it, dist) {
  it.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + dist + ' I jntp 0 "/></LiveEffect>');
  d.selection = null; it.selected = true; app.executeMenuCommand('expandStyle'); return d.selection[0];
}

function isStrand(b) {
  for (var i = 0; i < STRAND.length; i++) { var s = STRAND[i], ok = true; for (var k = 0; k < 4; k++) if (Math.abs(b[k] - s[k]) > 2) ok = false; if (ok) return true; }
  return false;
}
var lines = [], details = [], silhouette = null, eagleP = [], ribbonP = [];
(function walk(x) {
  if (x.typename == 'GroupItem') { for (var j = 0; j < x.pageItems.length; j++) walk(x.pageItems[j]); return; }
  var p = x.typename == 'CompoundPathItem' ? x.pathItems[0] : x, b = x.geometricBounds;
  if (p.fillColor.red < 150) { lines.push(x); if (x.width > 400) silhouette = x; else details.push(x); }
  else if (b[1] <= -700 || (b[1] <= -600 && x.width >= 150) || isStrand(b)) ribbonP.push(x);
  else eagleP.push(x);
})(V2);

var eagleInk = pathfinder([copies(details), toCompound(pathfinder([copies(eagleP)], 'Live Pathfinder Add'))], 'Live Pathfinder Subtract');
var sil = toCompound(silhouette.duplicate(layer, ElementPlacement.PLACEATBEGINNING));
var contour = pathfinder([grow(sil.duplicate(), -CONTOUR), sil], 'Live Pathfinder Subtract');
var zone = toCompound(grow(pathfinder([copies(ribbonP)], 'Live Pathfinder Add'), RIBBON_GROW));
var allLines = toCompound(pathfinder([copies(lines)], 'Live Pathfinder Add'));
var ribbonLines = toCompound(pathfinder([allLines, zone], 'Live Pathfinder Intersect'));
var feet = grow(pathfinder([copies(eagleP)], 'Live Pathfinder Add'), FEET_GROW);
// The silhouette is solid under the ribbon too, so its visible lines = silhouette minus the ribbon's faces.
var ribbonOut = pathfinder([feet, copies(ribbonP), ribbonLines], 'Live Pathfinder Subtract');

var G = layer.groupItems.add(); G.name = 'Front Eagle KO';
ribbonOut.move(G, ElementPlacement.PLACEATEND); ribbonOut.name = 'Ribbon (outline)';
eagleInk.move(G, ElementPlacement.PLACEATBEGINNING); eagleInk.name = 'Eagle (highlights)';
contour.move(G, ElementPlacement.PLACEATBEGINNING); contour.name = 'Contour';
var n = 0;
(function paint(x) {
  if (x.typename == 'GroupItem') { for (var j = 0; j < x.pageItems.length; j++) paint(x.pageItems[j]); return; }
  var p = x.typename == 'CompoundPathItem' ? (x.pathItems.length ? x.pathItems[0] : null) : x;
  if (p) { p.filled = true; p.fillColor = rgb(INK); p.stroked = false; n++; }
})(G);
d.selection = null;
for (var i = layer.pageItems.length - 1; i >= 0; i--) { var it = layer.pageItems[i]; if (it.parent == layer && it.name == '') it.remove(); }  // pathfinder leftovers
'Front Eagle KO: eagle highlights=' + eagleP.length + ', details cut=' + details.length + ', ribbon faces dropped=' + ribbonP.length + ' (strand ' + (function () { var c = 0; for (var i = 0; i < ribbonP.length; i++) if (isStrand(ribbonP[i].geometricBounds)) c++; return c; })() + '/4), ink shapes=' + n + ', b=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');
