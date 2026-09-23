<#
Drive the open Illustrator document from the shell (COM -> ExtendScript).

  .\ai.ps1 tree                         layers and their top-level items
  .\ai.ps1 selection                    what is selected in Illustrator right now
  .\ai.ps1 run banner.jsx               run a script from this folder, or any path
  .\ai.ps1 js "app.activeDocument.name" run inline ExtendScript
  .\ai.ps1 render [-Artboard 1] [-Scale 100] [-Crop left,top,right,bottom] [-Name back]

Renders land in ..\renders (git-ignored). -Crop takes document points, as reported by tree/selection.
#>
param(
  [Parameter(Position = 0, Mandatory = $true)]
  [ValidateSet('tree', 'selection', 'run', 'js', 'render')][string]$Command,
  [Parameter(Position = 1)][string]$Arg,
  [int]$Artboard = 1,
  [int]$Scale = 100,
  [double[]]$Crop,
  [string]$Name = 'render'
)
$ErrorActionPreference = 'Stop'
$ai = New-Object -ComObject Illustrator.Application

# One-line description of an item, recursing into groups to $maxDepth.
$describe = @'
function bb(it) { return it.geometricBounds.join(',').replace(/(\.\d)\d+/g, '$1'); }
function desc(it, dep, maxDepth, out) {
  var s = new Array(dep + 2).join('  ') + it.typename + " '" + it.name + "'" + (it.hidden ? ' HIDDEN' : '') + (it.locked ? ' LOCKED' : '');
  if (it.typename == 'TextFrame') s += " txt='" + it.contents.substr(0, 30).replace(/\r/g, '/') + "' font=" + it.textRange.characterAttributes.textFont.name + ' size=' + Math.round(it.textRange.characterAttributes.size);
  if (it.typename == 'PathItem') s += ' pts=' + it.pathPoints.length + (it.guides ? ' GUIDE' : '');
  if (it.typename == 'GroupItem') s += ' (' + it.pageItems.length + ')';
  if (it.typename == 'CompoundPathItem') s += ' subpaths=' + it.pathItems.length;
  out.push(s + ' b=' + bb(it) + (it.layer ? ' @' + it.layer.name : ''));
  if (it.typename == 'GroupItem' && dep < maxDepth) for (var i = 0; i < it.pageItems.length; i++) desc(it.pageItems[i], dep + 1, maxDepth, out);
}
'@

function Invoke-Js([string]$code) { $ai.DoJavaScript($code) }

switch ($Command) {
  'tree' {
    Invoke-Js ($describe + @'
var d = app.activeDocument, out = ['doc=' + d.name + ' saved=' + d.saved];
for (var L = 0; L < d.layers.length; L++) {
  var ly = d.layers[L];
  out.push("LAYER '" + ly.name + "' visible=" + ly.visible + ' locked=' + ly.locked + ' print=' + ly.printable);
  for (var i = 0; i < ly.pageItems.length; i++) if (ly.pageItems[i].parent == ly) desc(ly.pageItems[i], 0, 0, out);
}
out.join('\n');
'@)
  }
  'selection' {
    Invoke-Js ($describe + @'
var s = app.activeDocument.selection, out = ['selected=' + s.length];
if (s.typename == 'TextRange') out = ["text range: '" + s.contents + "'"];
else for (var i = 0; i < s.length; i++) desc(s[i], 0, 1, out);
out.join('\n');
'@)
  }
  'run' {
    $path = if (Test-Path $Arg) { $Arg } else { Join-Path $PSScriptRoot $Arg }
    Invoke-Js (Get-Content -Raw -Encoding UTF8 $path)  # PS 5.1 otherwise reads as ANSI and mangles em dashes etc.
  }
  'js' { Invoke-Js $Arg }
  'render' {
    $dir = (New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot '..\renders')).FullName
    $png = Join-Path $dir "$Name.png"
    $rect = Invoke-Js @"
var d = app.activeDocument;
d.artboards.setActiveArtboardIndex($Artboard);
var o = new ExportOptionsPNG24(); o.artBoardClipping = true; o.transparency = false; o.antiAliasing = true;
o.horizontalScale = $Scale; o.verticalScale = $Scale;
d.exportFile(new File('$($png -replace '\\', '/')'), ExportType.PNG24, o);
d.artboards[$Artboard].artboardRect.join(',');
"@
    if ($Crop) {
      Add-Type -AssemblyName System.Drawing
      $ab = $rect.Split(',') | ForEach-Object { [double]$_ }
      $k = $Scale / 100
      $img = [System.Drawing.Bitmap]::FromFile($png)
      $x = [Math]::Max(0, [int](($Crop[0] - $ab[0]) * $k)); $y = [Math]::Max(0, [int](($ab[1] - $Crop[1]) * $k))
      $w = [Math]::Min($img.Width - $x, [int](($Crop[2] - $Crop[0]) * $k)); $h = [Math]::Min($img.Height - $y, [int](($Crop[1] - $Crop[3]) * $k))
      $cut = $img.Clone((New-Object System.Drawing.Rectangle $x, $y, $w, $h), $img.PixelFormat)
      $img.Dispose()
      $cut.Save($png, [System.Drawing.Imaging.ImageFormat]::Png); $cut.Dispose()
    }
    $png
  }
}
