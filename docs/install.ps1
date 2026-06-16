#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$PackageName = '@decodo/cli'
$CommandName = 'decodo'
$MinNodeMajor = 18

$script:OrigPath = $env:PATH
$script:UserPrefix = $null
$script:PathActivationRequired = $false

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

function Write-Ok([string]$Message) {
  Write-Host $Message -ForegroundColor Green
}

function Test-PathContains([string]$Dir, [string]$PathValue) {
  $entries = $PathValue -split ';' | Where-Object { $_ -ne '' }
  return $entries -contains $Dir
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

function Invoke-NpmInstall {
  param([string[]]$NpmArgs)
  try {
    & npm install -g @NpmArgs | Out-Host
    return $LASTEXITCODE
  } catch {
    return 1
  }
}

function Install-Package {
  Write-Info "Installing $PackageName globally..."
  if ((Invoke-NpmInstall @($PackageName)) -eq 0) {
    return
  }

  Write-Warn 'Global install failed. Falling back to a user-level install.'
  $script:UserPrefix = Join-Path $env:APPDATA 'npm-global'
  New-Item -ItemType Directory -Force -Path $script:UserPrefix | Out-Null
  Write-Info "Installing $PackageName to $script:UserPrefix instead..."
  if ((Invoke-NpmInstall @('--prefix', $script:UserPrefix, $PackageName)) -ne 0) {
    Write-Err @"
Installation failed.
Try fixing your npm permissions, or run the CLI without installing: npx $PackageName --help
"@
  }

  $env:PATH = "$script:UserPrefix;$env:PATH"
}

function Resolve-InstallBin {
  if ($script:UserPrefix) {
    return $script:UserPrefix
  }

  $npmPrefix = (npm prefix -g 2>$null).Trim()
  if (-not $npmPrefix) {
    Write-Err 'Could not determine npm global bin directory.'
  }

  return $npmPrefix
}

function Ensure-InstallPath([string]$BinDir) {
  if (Test-PathContains $BinDir $script:OrigPath) {
    return
  }

  $script:PathActivationRequired = $true
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')

  if ($userPath -and $userPath -like "*$BinDir*") {
    Write-Warn "$BinDir is in your user PATH but not active in this shell."
    Write-Warn 'Restart this terminal, then run decodo setup.'
    return
  }

  $newPath = if ($userPath) { "$BinDir;$userPath" } else { $BinDir }
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  Write-Warn "$BinDir was not in your PATH. Added it to your user PATH."
  Write-Warn 'Restart this terminal, then run decodo setup.'
}

function Get-DecodoBin([string]$BinDir) {
  $cmd = Join-Path $BinDir 'decodo.cmd'
  if (Test-Path $cmd) {
    return $cmd
  }

  return Join-Path $BinDir 'decodo'
}

function Get-CommandPrefix([string]$BinDir) {
  if ($script:PathActivationRequired) {
    return Get-DecodoBin $BinDir
  }

  return $CommandName
}

function Offer-Setup([string]$BinDir) {
  $decodoBin = Get-DecodoBin $BinDir
  if (-not (Test-Path $decodoBin)) {
    Write-Err "Could not find $decodoBin after install."
  }

  if (-not [Console]::IsInputRedirected -and -not [Console]::IsOutputRedirected) {
    Write-Host ''
    Write-Host 'Next: configure your auth token.'
    Write-Host ''
    $answer = Read-Host 'Continue with setup? [Y/n]'
    if ($answer -match '^[nN]') {
      $cmd = Get-CommandPrefix $BinDir
      Write-Host ''
      Write-Host "Run $cmd setup when you are ready."
      Write-Host ''
      return
    }

    & $decodoBin setup
    return
  }

  $cmd = Get-CommandPrefix $BinDir
  Write-Host ''
  Write-Host "Next step: configure your auth token with $cmd setup"
  Write-Host ''
}

function Print-NextSteps([string]$BinDir) {
  $cmd = Get-CommandPrefix $BinDir
  Write-Host 'Get started:'
  Write-Host "  $cmd scrape https://ip.decodo.com"
  Write-Host '  $cmd search "decodo scraping api"'
  Write-Host "  $cmd whoami"
  Write-Host ''
}

Write-Host ''
Write-Host 'Decodo CLI Installer' -ForegroundColor White
Write-Host ''

$nodeVersion = Get-NodeVersion
Write-Info "Found Node.js v$nodeVersion"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Err 'npm is not available. Install npm and try again.'
}

Install-Package

$binDir = Resolve-InstallBin
Ensure-InstallPath $binDir

$decodoBin = Get-DecodoBin $binDir
$installedVersion = & $decodoBin --version 2>$null
if (-not $installedVersion) {
  $installedVersion = 'unknown'
}

Write-Host ''
Write-Ok "Success! $PackageName $installedVersion is installed."

if ($script:PathActivationRequired) {
  Write-Host ''
} else {
  Write-Ok 'Ready to use — decodo is on your PATH.'
}

Offer-Setup $binDir
Print-NextSteps $binDir
