// Exports 300 dpi transparent artboard PNGs to design/exports for distress.py / make_print_files.py:
//   raw-<side>.png            everything visible on that side
//   mask-<side>-<part>.png    one part alone (its footprint), same pixel grid
// [REF] is hidden during export; every item's visibility is restored exactly afterwards.
var OUT = 'D:/Dev/undefeated-drop/design/exports/';
var d = app.activeDocument, ref = d.layers.getByName('[REF] Shirt Mockup');
var back = d.layers.getByName('[ART] Vectors (back)'), front = d.layers.getByName('[ART] Vectors (front)');
function items(ly) { var a = []; for (var i = 0; i < ly.pageItems.length; i++) if (ly.pageItems[i].parent == ly) a.push(ly.pageItems[i]); return a; }
function tableText() { var a = []; for (var i = 0; i < back.textFrames.length; i++) { var t = back.textFrames[i]; if (t.parent == back && !t.hidden && t.kind == TextType.AREATEXT) a.push(t); } return a; }
var all = items(back).concat(items(front)), saved = [];
for (var i = 0; i < all.length; i++) saved.push(all[i].hidden);

// [artboard, file, predicate(item) -> show?]  (null predicate = everything that was visible)
var tt = tableText();
function named(names) { return function (it) { for (var k = 0; k < names.length; k++) if (it.name == names[k]) return true; return false; }; }
function inList(list) { return function (it) { for (var k = 0; k < list.length; k++) if (it == list[k]) return true; return false; }; }
var specs = [
  [0, 'raw-front', null],
  [1, 'raw-back', null],
  [0, 'mask-front-usa', named(['USA (front, masked)'])],
  [0, 'mask-front-eagle', named(['Front Eagle KO'])],
  [1, 'mask-back-usa', named(['USA v2'])],
  [1, 'mask-back-table', inList(tt)]
];
var refVis = ref.visible, r = [];
ref.visible = false;
try {
  for (var s = 0; s < specs.length; s++) {
    var sp = specs[s];
    for (i = 0; i < all.length; i++) all[i].hidden = saved[i] || (sp[2] != null && !sp[2](all[i]));
    d.artboards.setActiveArtboardIndex(sp[0]);
    var o = new ExportOptionsPNG24(); o.artBoardClipping = true; o.transparency = true; o.antiAliasing = true;
    o.horizontalScale = 300 / 72 * 100; o.verticalScale = 300 / 72 * 100;
    d.exportFile(new File(OUT + sp[1] + '.png'), ExportType.PNG24, o);
    var shown = 0; for (i = 0; i < all.length; i++) if (!all[i].hidden) shown++;
    r.push(sp[1] + ' (' + shown + ' visible)');
  }
} finally {
  for (i = 0; i < all.length; i++) all[i].hidden = saved[i];
  ref.visible = refVis;
}
var ok = true; for (i = 0; i < all.length; i++) if (all[i].hidden != saved[i]) ok = false;
'exported: ' + r.join(', ') + '\nvisibility restored exactly: ' + ok;
