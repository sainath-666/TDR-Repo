param(
  [Parameter(Mandatory = $true)][string]$PptxPath,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [Parameter(Mandatory = $true)][string]$Prefix
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PptxPath)) {
  throw "PPTX not found: $PptxPath"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
$pres = $ppt.Presentations.Open($PptxPath, $true, $true, $false)

$paths = @()
for ($i = 1; $i -le $pres.Slides.Count; $i++) {
  $out = Join-Path $OutDir ("$Prefix-slide-$i.png")
  $pres.Slides.Item($i).Export($out, 'PNG', 1920, 1080)
  $paths += $out
}

$pres.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null

$paths -join '|'
