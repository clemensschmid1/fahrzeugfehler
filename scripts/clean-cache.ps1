# PowerShell script to clean Next.js and TurboPack cache on Windows
# Usage: .\scripts\clean-cache.ps1 [-All]

param(
    [switch]$All
)

$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $PSScriptRoot
$nextCacheDir = Join-Path $projectRoot ".next\cache"
$turboCacheDir = Join-Path $projectRoot ".next\cache\turbo"
$nodeModulesCache = Join-Path $projectRoot "node_modules\.cache"
$turboGlobalCache = Join-Path $env:USERPROFILE ".turbo"

function Get-DirectorySize {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return 0
    }
    
    $size = 0
    try {
        $items = Get-ChildItem -Path $Path -Recurse -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            if ($item.PSIsContainer -eq $false) {
                $size += $item.Length
            }
        }
    } catch {
        # Ignore errors
    }
    return $size
}

function Format-Bytes {
    param([long]$Bytes)
    
    if ($Bytes -eq 0) { return "0 Bytes" }
    $units = @("Bytes", "KB", "MB", "GB", "TB")
    $i = [math]::Floor([math]::Log($Bytes, 1024))
    $size = [math]::Round($Bytes / [math]::Pow(1024, $i), 2)
    return "$size $($units[$i])"
}

Write-Host "Cleaning Next.js and TurboPack cache...`n" -ForegroundColor Cyan

$dirs = @(
    @{ Path = $nextCacheDir; Name = "Next.js Cache" }
    @{ Path = $turboCacheDir; Name = "TurboPack Cache" }
    @{ Path = $nodeModulesCache; Name = "Node Modules Cache" }
)

if ($All) {
    $dirs += @{ Path = $turboGlobalCache; Name = "TurboPack Global Cache" }
}

Write-Host "Cache sizes before cleanup:" -ForegroundColor Yellow
$totalFreed = 0
foreach ($dir in $dirs) {
    $size = Get-DirectorySize -Path $dir.Path
    if ($size -gt 0) {
        $formatted = Format-Bytes -Bytes $size
        Write-Host "  $($dir.Name): $formatted" -ForegroundColor Gray
        $totalFreed += $size
    }
}

if ($totalFreed -eq 0) {
    Write-Host "`nNo cache to clean!" -ForegroundColor Green
    exit 0
}

Write-Host "`nTotal cache size: $(Format-Bytes -Bytes $totalFreed)`n" -ForegroundColor Yellow

Write-Host "Deleting caches...`n" -ForegroundColor Yellow

foreach ($dir in $dirs) {
    if (Test-Path $dir.Path) {
        try {
            Remove-Item -Path $dir.Path -Recurse -Force -ErrorAction Stop
            Write-Host "  [OK] Deleted: $($dir.Path)" -ForegroundColor Green
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "  [ERROR] Error deleting $($dir.Path) : $errorMsg" -ForegroundColor Red
        }
    } else {
        Write-Host "  [SKIP] $($dir.Path) - does not exist" -ForegroundColor Gray
    }
}

if ($All) {
    $buildDir = Join-Path $projectRoot ".next\build"
    if (Test-Path $buildDir) {
        try {
            Remove-Item -Path $buildDir -Recurse -Force -ErrorAction Stop
            Write-Host "  [OK] Deleted: $buildDir" -ForegroundColor Green
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "  [ERROR] Error deleting $buildDir : $errorMsg" -ForegroundColor Red
        }
    }
}

Write-Host "`nCleaned $(Format-Bytes -Bytes $totalFreed) of cache!" -ForegroundColor Green
Write-Host "`nTip: Run 'npm run dev' to rebuild cache." -ForegroundColor Cyan

