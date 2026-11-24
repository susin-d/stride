<#
.SYNOPSIS
  Smart test runner: skip a suite, or individual test files, when unchanged.
.DESCRIPTION
  Content-addressed cache over scripts/lib/test-hash.py with two levels:

  1. Suite cache — skips the whole suite when the stored record is schema v1,
     result=pass, and the scope sha matches the current tree.
  2. Per-file cache (-PerFile, server/website) — runs only the test files whose
     reachable source files changed, using `test-hash.py affected`.

  Fail-closed at every step: a missing/corrupt record, a prior failure, an
  unparseable test file, or an unavailable analysis runs more tests, never
  fewer. Guard files (conftest, pytest.ini, requirements, package/lock/vite
  configs) are folded into every test's sha, so touching one invalidates all.
.EXAMPLE
  ./scripts/test-smart.ps1 -Scope server
  ./scripts/test-smart.ps1 -Scope server -PerFile
  ./scripts/test-smart.ps1 -Scope all -Force
#>
[CmdletBinding()]
param(
  [ValidateSet("server", "website", "worker", "all")][string]$Scope = "all",
  [switch]$Force,
  [switch]$PerFile
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/lib/common.ps1"
$root = (Resolve-Path "$PSScriptRoot/..").Path
$cacheDir = Join-Path $root ".cache/test-smart"
$hashScript = Join-Path $root "scripts/lib/test-hash.py"
$CACHE_SCHEMA = 1
$PER_FILE_SCOPES = @("server", "website")

function Get-CurrentSha {
  param([string]$Name)
  $py = Resolve-PythonForServer -Root $root
  if (-not $py) { throw "No Python found. Create server/.venv or install Python 3.12+." }
  $out = & $py "$hashScript" "$Name" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "test-hash.py failed for scope '$Name': $out" }
  $sha = ("$out" | Select-Object -Last 1).Trim().ToLowerInvariant()
  if ($sha -notmatch '^[0-9a-f]{64}$') { throw "Invalid hash for scope '$Name': $sha" }
  return $sha
}

function Get-GitInfo {
  $commit = "unknown"; $branch = "unknown"
  try {
    $c = & git rev-parse HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $c) { $commit = $c.Trim() }
    $b = & git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $b) { $branch = $b.Trim() }
  } catch { }
  return @{ commit = $commit; branch = $branch }
}

function Read-CacheRecord {
  param([string]$Name)
  $path = Join-Path $cacheDir "$Name.json"
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  try {
    $rec = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($rec.v -ne $CACHE_SCHEMA) { return $null }
    if ($rec.sha -notmatch '^[0-9a-f]{64}$') { return $null }
    if ($rec.result -ne "pass" -and $rec.result -ne "fail") { return $null }
    if (-not $rec.scope) { return $null }
    return $rec
  } catch {
    return $null
  }
}

function Write-CacheRecord {
  param([string]$Name, [string]$Sha, [string]$Result, [string]$Cmd, [long]$DurationS)
  if (-not (Test-Path -LiteralPath $root)) { throw "Repo root missing: $root" }
  if (-not (Test-Path -LiteralPath $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir | Out-Null
  }
  $info = Get-GitInfo
  $rec = [ordered]@{
    v = $CACHE_SCHEMA
    scope = $Name
    sha = $Sha
    result = $Result
    commit = $info.commit
    branch = $info.branch
    cmd = $Cmd
    updated_at = ([DateTime]::UtcNow.ToString("o"))
    duration_s = $DurationS
  }
  $target = Join-Path $cacheDir "$Name.json"
  $tmp = "$target.tmp.$PID"
  ($rec | ConvertTo-Json -Compress) | Set-Content -LiteralPath $tmp -Encoding utf8NoBOM
  Move-Item -LiteralPath $tmp -Destination $target -Force
}

function Get-AffectedMap {
  param([string]$Name)
  # @{ tests = @{ path -> sha }; global = <sha> } or $null when unavailable.
  if ($Name -notin $PER_FILE_SCOPES) { return $null }
  $py = Resolve-PythonForServer -Root $root
  if (-not $py) { return $null }
  $out = & $py "$hashScript" "affected" "$Name" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Per-file analysis failed for '$Name' — falling back to whole suite."
    return $null
  }
  try {
    $doc = ("$out" | Out-String) | ConvertFrom-Json
    if ($doc.schema -ne 1) { return $null }
    $map = @{}
    foreach ($prop in $doc.tests.PSObject.Properties) {
      $map[$prop.Name] = $prop.Value.sha
    }
    return @{ tests = $map; global = $doc.global }
  } catch {
    Write-Warn "Per-file analysis unreadable for '$Name' — falling back."
    return $null
  }
}

function Read-PerFileRecords {
  param([string]$Name)
  $empty = @{ scope_sha = $null; files = @{} }
  $path = Join-Path $cacheDir "$Name.files.json"
  if (-not (Test-Path -LiteralPath $path)) { return $empty }
  try {
    $rec = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($rec.v -ne $CACHE_SCHEMA) { return $empty }
    $map = @{}
    foreach ($prop in $rec.files.PSObject.Properties) {
      $map[$prop.Name] = $prop.Value
    }
    return @{ scope_sha = $rec.scope_sha; files = $map }
  } catch {
    return $empty
  }
}

function Write-PerFileRecords {
  param([string]$Name, [hashtable]$Map, [string]$ScopeSha)
  if (-not (Test-Path -LiteralPath $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir | Out-Null
  }
  $info = Get-GitInfo
  $rec = [ordered]@{
    v = $CACHE_SCHEMA
    scope = $Name
    scope_sha = $ScopeSha
    commit = $info.commit
    updated_at = ([DateTime]::UtcNow.ToString("o"))
    files = $Map
  }
  $target = Join-Path $cacheDir "$Name.files.json"
  $tmp = "$target.tmp.$PID"
  ($rec | ConvertTo-Json -Depth 5 -Compress) | Set-Content -LiteralPath $tmp -Encoding utf8NoBOM
  Move-Item -LiteralPath $tmp -Destination $target -Force
}

function Get-ChangedTestFiles {
  param([string]$Name, [hashtable]$Affected)
  # Which test files must run for the current tree.
  #
  # Each per-file sha covers that test's dependency closure AND every guard
  # file, so an entry stays valid across edits elsewhere in the scope. That is
  # what makes selection selective. Fail closed: an absent entry means "never
  # verified at this exact content", so the test runs.
  $stored = (Read-PerFileRecords $Name).files
  $changed = @()
  foreach ($testPath in $Affected.tests.Keys) {
    $current = $Affected.tests[$testPath]
    if ($Force -or -not $stored.ContainsKey($testPath) -or $stored[$testPath] -ne $current) {
      $changed += $testPath
    }
  }
  return @($changed | Sort-Object)
}

function Invoke-SuiteNative {
  param([string]$Command, [string[]]$TestArgs = @(), [string]$WorkDir = "")
  # Runs a suite with live console output that does NOT leak into the
  # function's output stream: native stdout goes through Write-Host so callers
  # receive only the integer exit code (a bare `& $Command` would append every
  # output line to the caller's return value and corrupt `$rc -ne 0`).
  Push-Location -LiteralPath $WorkDir
  try {
    & $Command @TestArgs 2>&1 | ForEach-Object { Write-Host "$_" }
    return $LASTEXITCODE
  } finally { Pop-Location }
}

function Invoke-ScopeSuite {
  param([string]$Name)
  $sha = Get-CurrentSha $Name
  $short = $sha.Substring(0, 12)
  $rec = Read-CacheRecord $Name

  if ($rec -eq $null -and (Test-Path -LiteralPath (Join-Path $cacheDir "$Name.json"))) {
    Write-Warn "Cache corrupt for '$Name' — running suite and healing."
  }

  if (-not $Force -and $rec -ne $null -and $rec.result -eq "pass" -and $rec.sha -eq $sha) {
    $saved = ""
    if ($rec.duration_s) { $saved = " (last run $($rec.duration_s)s)" }
    Write-Ok "SKIP $Name — unchanged $short$saved"
    return 0
  }
  if ($Force) { Write-Step "FORCED run $Name ($short)" }
  elseif ($rec -ne $null -and $rec.result -eq "fail") { Write-Step "Retrying $Name — prior run failed ($short)" }
  else { Write-Step "Running $Name tests ($short)" }

  # Per-file selection. NOTE: always wrap in @() — PowerShell unrolls a
  # single-element return into a scalar and `.Count` would throw.
  $selected = @()
  if ($PerFile -and $Name -in $PER_FILE_SCOPES) {
    $affected = Get-AffectedMap $Name
    if ($affected -ne $null) {
      $selected = @(Get-ChangedTestFiles $Name $affected)
      if ($selected.Count -eq 0 -and -not $Force) {
        Write-Ok "SKIP $Name — no test file depends on a changed file ($short)"
        return 0
      }
      Write-Step "Per-file: running $($selected.Count)/$($affected.tests.Count) test files"
    } else {
      Write-Warn "Per-file analysis unavailable for '$Name' — running the whole suite."
    }
  }
  $fullRun = ($selected.Count -eq 0)

  $started = Get-Date
  $cmd = ""
  $code = 0
  try {
    if ($Name -eq "server") {
      $py = Resolve-PythonForServer -Root $root
      if (-not $py) { throw "No Python found. Create server/.venv or install Python 3.12+." }
      $runnerName = Split-Path -Leaf $py
      # When files are selected, do NOT also pass the `tests` root — pytest
      # would collect everything under it and ignore the selection.
      $pytestArgs = @("-m", "pytest")
      if ($fullRun) {
        $pytestArgs += @("tests", "-q")
        $cmd = "$runnerName -m pytest tests -q"
      } else {
        $pytestArgs += $selected | ForEach-Object { $_.Substring("server/".Length) }
        $cmd = "$runnerName -m pytest <$($selected.Count) files>"
      }
      $code = Invoke-SuiteNative -Command $py -TestArgs $pytestArgs -WorkDir (Join-Path $root "server")
    } elseif ($Name -eq "website") {
      Assert-Command "npm" "Install Node 20+ and retry."
      $testArgs = @("test", "--", "--run")
      if ($fullRun) {
        $cmd = "npm test -- --run"
      } else {
        $testArgs += $selected | ForEach-Object { $_.Substring("website/".Length) }
        $cmd = "npm test -- --run <$($selected.Count) files>"
      }
      $code = Invoke-SuiteNative -Command "npm" -TestArgs $testArgs -WorkDir (Join-Path $root "website")
    } else {
      $cmd = "go test ./..."
      Assert-Command "go" "Install Go and retry, or run -Scope server."
      $code = Invoke-SuiteNative -Command "go" -TestArgs @("test", "./...") -WorkDir (Join-Path $root "services/whatsapp-worker")
    }
  } catch {
    $code = 1
    Write-Err "$Name suite error: $_"
  }
  $duration = [long]((Get-Date) - $started).TotalSeconds

  if ($code -eq 0) {
    Write-CacheRecord $Name $sha "pass" $cmd $duration
    if ($Name -in $PER_FILE_SCOPES) {
      $affected = Get-AffectedMap $Name
      if ($affected -ne $null) {
        if ($fullRun) {
          Write-PerFileRecords $Name $affected.tests $sha
        } else {
          # Partial run: mark the tests that ran. Unrun tests keep their prior
          # entry, which still describes an identical dependency closure —
          # precisely why they were not selected — so it stays valid.
          $base = (Read-PerFileRecords $Name).files
          foreach ($t in $selected) { $base[$t] = $affected.tests[$t] }
          Write-PerFileRecords $Name $base $sha
        }
      }
    }
    Write-Ok "$Name passed in ${duration}s — cached $short"
    return 0
  }
  Write-CacheRecord $Name $sha "fail" $cmd $duration
  # A failing tree must never leave a partially "verified" baseline behind.
  if ($Name -in $PER_FILE_SCOPES) {
    $stale = Join-Path $cacheDir "$Name.files.json"
    if (Test-Path -LiteralPath $stale) { Remove-Item -LiteralPath $stale -Force }
  }
  Write-Err "$Name FAILED in ${duration}s — cache marked fail (will rerun next time)"
  return $code
}

$targets = @()
if ($Scope -eq "all") { $targets = @("server", "website", "worker") } else { $targets = @($Scope) }

$failed = @()
foreach ($t in $targets) {
  $rc = Invoke-ScopeSuite $t
  if ($rc -ne 0) { $failed += $t }
}

if ($failed.Count -gt 0) {
  Write-Err "Smart tests failed: $($failed -join ', ')"
  exit 1
}
Write-Ok "Smart tests done ($Scope)"
