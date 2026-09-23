// First-draft import of the Envato "American Eagle Holding Vintage Ribbon" engraving onto the front artboard.
// The art is two colours: a light "paper" silhouette under navy linework. Paper -> frame cream,
// lines -> the banner's fold brown ("C-darker": the mockup's warm engraving with most of the contrast kept).
// Hides (never deletes) the earlier "Front Eagle". Refuses to overwrite "Front Eagle v2" unless FORCE = true.
var FORCE = false;
var SRC = 'C:/Users/benea/Downloads/american-eagle-holding-vintage-ribbon-2026-02-24-01-45-51-utc/American Eagle Holding Vintage Ribbon.ai';
var LINES = '6B5835', PAPER = 'FFF4D4';
var HEIGHT = 620, CENTER_X = 396, TOP_Y = -280;   // leaves the top of the 792x1008 front artboard for USA

var d = app.activeDocument;
var layer = d.layers.getByName('[ART] Vectors (front)');
function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0,2),16); c.green = parseInt(hex.substr(2,2),16); c.blue = parseInt(hex.substr(4,2),16); return c; }

var existing = null;
try { existing = layer.groupItems.getByName('Front Eagle v2'); } catch (e) {}
if (existing && !FORCE) throw new Error('"Front Eagle v2" exists and may carry hand edits; set FORCE = true to rebuild it');
if (existing) existing.remove();
try { layer.groupItems.getByName('Front Eagle').hidden = true; } catch (e) {}

var lvl = app.userInteractionLevel, G;
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
try {
  var s = app.open(new File(SRC));
  try { G = s.layers.getByName('Object').pageItems[0].duplicate(layer, ElementPlacement.PLACEATBEGINNING); }  // cross-doc: target a layer, not a group
  finally { s.close(SaveOptions.DONOTSAVECHANGES); }
} finally { app.userInteractionLevel = lvl; d.activate(); }
G.name = 'Front Eagle v2';

var lines = 0, paper = 0;
(function walk(x) {
  if (x.typename == 'GroupItem') { for (var j = 0; j < x.pageItems.length; j++) walk(x.pageItems[j]); return; }
  var p = x.typename == 'CompoundPathItem' ? (x.pathItems.length ? x.pathItems[0] : null) : x;
  if (!p || !p.filled || p.fillColor.typename != 'RGBColor') return;
  if (p.fillColor.red < 100) { p.fillColor = rgb(LINES); lines++; } else { p.fillColor = rgb(PAPER); paper++; }
})(G);

var sc = HEIGHT / G.height * 100;
G.resize(sc, sc, true, true, true, true, sc, Transformation.CENTER);
var b = G.geometricBounds;
G.translate(CENTER_X - (b[0] + b[2]) / 2, TOP_Y - b[1]);
d.selection = null;
'Front Eagle v2: ' + lines + ' line shapes, ' + paper + ' paper shapes, scale=' + sc.toFixed(1) + '% w=' + G.width.toFixed(0) + ' h=' + G.height.toFixed(0) + ' b=' + G.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1');
