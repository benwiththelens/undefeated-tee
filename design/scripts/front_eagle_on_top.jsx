// Puts the knockout eagle IN FRONT of "USA (front)". The eagle is see-through (its dark tones are bare
// shirt), so the USA is clipped with "artboard minus the eagle's silhouette grown by HALO": the eagle then
// sits on clean black with a thin gap separating it from the letters. A clipping mask (not a pathfinder
// cut) keeps the USA's live warp and glow, and is reversible (Object > Clipping Mask > Release).
// Refuses to run if "USA (front, masked)" already exists.
var RAISE = 5;      // pt the eagle moves up; 60 buried half the U and S, keep overlap to ~25-30% of letter height
var HALO = 4;       // pt gap between the eagle and the letters

var d = app.activeDocument, front = d.layers.getByName('[ART] Vectors (front)');
try { front.groupItems.getByName('USA (front, masked)'); throw new Error('"USA (front, masked)" already exists'); } catch (e) { if (/already/.test(e.message)) throw e; }
var usa = front.groupItems.getByName('USA (front)'), eagle = front.groupItems.getByName('Front Eagle KO');
var v2 = front.groupItems.getByName('Front Eagle v2');

function pathfinder(items, cmd) {
  var g = front.groupItems.add();
  for (var i = 0; i < items.length; i++) items[i].move(g, ElementPlacement.PLACEATEND);
  d.selection = null; g.selected = true;
  app.executeMenuCommand(cmd); app.executeMenuCommand('expandStyle');
  return d.selection[0];
}
function grow(it, dist) {
  it.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + dist + ' I jntp 0 "/></LiveEffect>');
  d.selection = null; it.selected = true; app.executeMenuCommand('expandStyle'); return d.selection[0];
}

eagle.translate(0, RAISE);

// Silhouette at the eagle's current size/position: v2 is the same art, so scale a copy onto KO's bounds.
var tmp = v2.duplicate(front, ElementPlacement.PLACEATBEGINNING); tmp.hidden = false;
var s = eagle.width / tmp.width * 100;
tmp.resize(s, s, true, true, true, true, s, Transformation.CENTER);
var kb = eagle.geometricBounds, tb = tmp.geometricBounds;
tmp.translate(kb[0] - tb[0], kb[1] - tb[1]);
var sil = null;
(function w(x) { if (x.typename == 'GroupItem') { for (var i = 0; i < x.pageItems.length; i++) w(x.pageItems[i]); return; }
  var p = x.typename == 'CompoundPathItem' ? x.pathItems[0] : x; if (p.fillColor.red < 150 && x.width > eagle.width * 0.8) sil = x; })(tmp);
sil = sil.duplicate(front, ElementPlacement.PLACEATBEGINNING);
tmp.remove();

// Clip shape = generous rectangle around the artboard, minus the grown silhouette.
var ab = d.artboards[0].artboardRect, pad = 200;
var rect = front.pathItems.rectangle(ab[1] + pad, ab[0] - pad, (ab[2] - ab[0]) + 2 * pad, (ab[1] - ab[3]) + 2 * pad);
var cut = pathfinder([grow(sil, HALO), rect], 'Live Pathfinder Subtract');
// The subtraction leaves the big shape plus small islands (pockets the silhouette encloses). A clipping
// mask needs ONE path, so merge every piece into a single compound path.
var pieces = [];
if (cut.typename == 'GroupItem') { while (cut.pageItems.length) { var pc = cut.pageItems[0]; pc.move(front, ElementPlacement.PLACEATBEGINNING); pieces.push(pc); } cut.remove(); }
else pieces.push(cut);
d.selection = null; for (var i = 0; i < pieces.length; i++) pieces[i].selected = true;
app.executeMenuCommand('compoundPath');
var clip = d.selection[0];

// Clip path directly above the USA, then Make Clipping Mask; the new clip group is the USA's parent.
clip.move(usa, ElementPlacement.PLACEBEFORE);
d.selection = null; clip.selected = true; usa.selected = true;
app.executeMenuCommand('makeMask');
var G = usa.parent; G.name = 'USA (front, masked)';

// Eagle above the USA.
eagle.move(front, ElementPlacement.PLACEATBEGINNING);
d.selection = null;
for (var i = front.pageItems.length - 1; i >= 0; i--) { var it = front.pageItems[i]; if (it.parent == front && it.name == '' && (it.typename != 'GroupItem' || it.pageItems.length == 0)) it.remove(); }
var order = []; for (i = 0; i < front.pageItems.length; i++) if (front.pageItems[i].parent == front) order.push(front.pageItems[i].name + (front.pageItems[i].hidden ? ' (hidden)' : ''));
'eagle raised ' + RAISE + 'pt, halo ' + HALO + 'pt; clip=' + clip.typename + ' (' + clip.pathItems.length + ' subpaths); masked=' + G.clipped + '\nfront order (top->bottom): ' + order.join(' | ');
