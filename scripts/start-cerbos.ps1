#Requires -Version 5.1
# Start Cerbos locally on Windows: Docker, or WSL (Cerbos has no native Windows binary).
$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Test-CerbosHealthy {
  try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3592/_cerbos/health' -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-CerbosHealthy {
  param([int]$Seconds = 30)
  for ($i = 0; $i -lt $Seconds; $i++) {
    if (Test-CerbosHealthy) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Start-CerbosDocker {
  Write-Host 'Starting Cerbos via Docker...'
  Push-Location $Root
  try {
    docker compose up cerbos -d
    if ($LASTEXITCODE -ne 0) { throw 'docker compose failed' }
  } finally {
    Pop-Location
  }
  if (Wait-CerbosHealthy) {
    Write-Host 'Cerbos is running (Docker)'
    Write-Host '  Health: http://localhost:3592/_cerbos/health'
    Write-Host '  gRPC:   localhost:3593'
    return
  }
  throw 'Cerbos container started but health check failed. Run: docker compose logs cerbos'
}

function ConvertTo-WslPath {
  param([string]$WindowsPath)
  # Manual conversion — avoids PowerShell/wslpath issues with paths like D:\TDR\TDR-Repo
  $normalized = ($WindowsPath -replace '\\', '/').TrimEnd('/')
  if ($normalized -match '^([A-Za-z]):/(.*)$') {
    return "/mnt/$($Matches[1].ToLower())/$($Matches[2])"
  }
  throw "Cannot convert path to WSL: $WindowsPath"
}

function Start-CerbosWsl {
  $WslRoot = ConvertTo-WslPath -WindowsPath $Root
  Write-Host "Starting Cerbos via WSL at $WslRoot ..."
  Write-Host 'Keep this terminal open while developing.'
  Write-Host ''
  wsl -e bash -lc "cd '$WslRoot' && bash scripts/start-cerbos.sh"
}

if (Test-CerbosHealthy) {
  Write-Host 'Cerbos is already running on http://localhost:3592 (gRPC :3593)'
  exit 0
}

$HasDocker = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
  try {
    docker info *> $null
    $HasDocker = $true
  } catch {
    $HasDocker = $false
  }
}

$HasWsl = $false
if (Get-Command wsl -ErrorAction SilentlyContinue) {
  try {
    wsl -e true 2>$null
    $HasWsl = $LASTEXITCODE -eq 0
  } catch {
    $HasWsl = $false
  }
}

if ($HasDocker) {
  Start-CerbosDocker
  Write-Host ''
  Write-Host 'In another terminal: npm run dev'
  exit 0
}

if ($HasWsl) {
  Start-CerbosWsl
  exit $LASTEXITCODE
}

Write-Host @'

Cannot start Cerbos on Windows without Docker or WSL.

Option A — Docker Desktop (recommended):
  1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  2. npm run cerbos:start

Option B — WSL (Ubuntu):
  1. wsl --install   (if not already installed)
  2. npm run cerbos:start

Then set in .env:
  CERBOS_MOCK_MODE=false
  CERBOS_PDP_URL=localhost:3593

'@
exit 1
