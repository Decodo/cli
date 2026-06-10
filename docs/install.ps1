#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$PackageName = '@decodo/cli'
$CommandName = 'decodo'
$MinNodeMajor = 18

function Write-Info([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Blue
}

function Write-Warn([string]$Message) {
  Write-Host "warning: $Message" -ForegroundColor Yellow
}

function Write-Err([string]$Message) {
  Write-Host "error: $Message" -ForegroundColor Red
  exit 1
}

function Get-NodeVersion {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err @"
Node.js is not installed.
Install Node.js ${MinNodeMajor}+ from https://nodejs.org/ and try again.
"@
  }

  $version = (node -v).TrimStart('v')
  $majorText = $version.Split('.')[0]
  $parsed = 0
  if (-not [int]::TryParse($majorText, [ref]$parsed) -or $parsed -lt $MinNodeMajor) {
    Write-Err @"
Node.js v$version found, but v${MinNodeMajor}+ is required.
Update Node.js from https://nodejs.org/ and try again.
"@
  }

  return $version
}

Write-Host ''
Write-Host 'Decodo CLI Installer' -ForegroundColor White
Write-Host ''

$nodeVersion = Get-NodeVersion
Write-Info "Found Node.js v$nodeVersion"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Err 'npm is not available. Install npm and try again.'
}

Write-Info "Installing $PackageName globally..."
npm install -g $PackageName

$installedVersion = $null
if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
  $installedVersion = & $CommandName --version 2>$null
}

if ($installedVersion) {
  Write-Host ''
  Write-Host "Success! $PackageName $installedVersion is installed." -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host 'Installed! You may need to restart your shell or add the npm global bin directory to your PATH.' -ForegroundColor Green

  $npmPrefix = (npm prefix -g 2>$null).Trim()
  if ($npmPrefix) {
    $pathEntries = $env:PATH -split ';' | Where-Object { $_ -ne '' }
    if ($pathEntries -notcontains $npmPrefix) {
      Write-Warn "$npmPrefix is not in your PATH. Add it with:"
      Write-Host "  setx PATH `"$npmPrefix;%PATH%`""
      Write-Host ''
    }
  }
}

Write-Host ''
Write-Host 'Next step: configure your auth token with decodo setup'
Write-Host 'Get started:'
Write-Host '  decodo scrape https://ip.decodo.com'
Write-Host '  decodo search "decodo scraping api"'
Write-Host '  decodo whoami'
Write-Host ''
