# Cleanup script for large temporary files
# This script removes temporary generation files that shouldn't be in the repository

Write-Host "🧹 Cleaning up large temporary files..." -ForegroundColor Cyan

# 1. Remove old generated files (keep only recent ones if needed)
$generatedPath = "public\generated"
if (Test-Path $generatedPath) {
    Write-Host "`n📁 Checking generated folder..." -ForegroundColor Yellow
    
    # Count files before cleanup
    $filesBefore = (Get-ChildItem -Path $generatedPath -Recurse -File).Count
    $sizeBefore = (Get-ChildItem -Path $generatedPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
    
    Write-Host "   Found $filesBefore files ($([math]::Round($sizeBefore/1GB, 2)) GB)" -ForegroundColor Gray
    
    # Remove files older than 30 days (optional - uncomment if you want to keep recent files)
    # $cutoffDate = (Get-Date).AddDays(-30)
    # Get-ChildItem -Path $generatedPath -Recurse -File | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
    
    # Or remove all generated files (they're temporary artifacts)
    Write-Host "   ⚠️  Generated files are temporary artifacts from bulk generation." -ForegroundColor Yellow
    Write-Host "   ⚠️  They can be regenerated when needed." -ForegroundColor Yellow
    Write-Host "   💡 To keep recent files, edit this script and uncomment the date filter." -ForegroundColor Cyan
    
    # Uncomment the next 3 lines to actually delete:
    # Get-ChildItem -Path $generatedPath -Recurse -File | Remove-Item -Force
    # Write-Host "   ✅ Cleaned generated folder" -ForegroundColor Green
}

# 2. Remove duplicate sitemap files
Write-Host "`n🗺️  Checking for duplicate sitemap files..." -ForegroundColor Yellow
$sitemapFiles = Get-ChildItem -Path "public" -Filter "sitemap*.xml"
$duplicates = $sitemapFiles | Where-Object { 
    $_.Name -match "\(2\)" -or 
    $_.Name -eq "sitemap(2).xml" -or
    $_.Name -eq "sitemap-0(2).xml"
}

if ($duplicates.Count -gt 0) {
    Write-Host "   Found $($duplicates.Count) duplicate sitemap files:" -ForegroundColor Gray
    $duplicates | ForEach-Object { Write-Host "     - $($_.Name)" -ForegroundColor Gray }
    # Uncomment to delete:
    # $duplicates | Remove-Item -Force
    # Write-Host "   ✅ Removed duplicate sitemaps" -ForegroundColor Green
} else {
    Write-Host "   ✅ No duplicate sitemaps found" -ForegroundColor Green
}

# 3. Check .next build folder size
Write-Host "`n📦 Checking .next build folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    $nextSize = (Get-ChildItem -Path ".next" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host "   .next folder size: $([math]::Round($nextSize/1GB, 2)) GB" -ForegroundColor Gray
    Write-Host "   💡 This folder is already in .gitignore and can be deleted locally." -ForegroundColor Cyan
    Write-Host "   💡 Run: Remove-Item -Recurse -Force .next" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ .next folder not found" -ForegroundColor Green
}

# 4. Check node_modules size
Write-Host "`n📚 Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $nodeSize = (Get-ChildItem -Path "node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host "   node_modules size: $([math]::Round($nodeSize/1GB, 2)) GB" -ForegroundColor Gray
    Write-Host "   💡 This is normal - node_modules is in .gitignore" -ForegroundColor Cyan
}

Write-Host "`n✨ Cleanup analysis complete!" -ForegroundColor Green
Write-Host "`n⚠️  This script shows what CAN be cleaned. Uncomment deletion lines to actually remove files." -ForegroundColor Yellow
Write-Host "💡 Recommended actions:" -ForegroundColor Cyan
Write-Host "   1. Add public/generated/** to .gitignore (except maybe a .gitkeep file)" -ForegroundColor White
Write-Host "   2. Remove duplicate sitemap files manually or uncomment deletion" -ForegroundColor White
Write-Host "   3. Delete .next folder locally (it will be regenerated on build)" -ForegroundColor White

