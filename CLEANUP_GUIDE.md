# 🧹 Cleanup Guide - Reducing Project Size

## Problem
Das Projekt ist aktuell **15GB groß**, was zu langsamen Ladezeiten führt.

## Gefundene Probleme

### 1. ✅ **public/generated/** - Temporäre Generierungsdateien (HAUPTPROBLEM)
- **148+ JSONL-Dateien** (Bulk-Generierung)
- **23 TXT-Dateien** 
- **5 PNG-Dateien**
- Diese Dateien sind **temporäre Artefakte** aus dem Bulk-Generierungsprozess
- Sie werden über API-Routen zum Download bereitgestellt, sollten aber **nicht im Repository** sein

**Lösung:**
```powershell
# Alle generierten Dateien entfernen (können bei Bedarf neu generiert werden)
Remove-Item -Recurse -Force public\generated\*
```

**Oder selektiv (nur alte Dateien > 30 Tage):**
```powershell
$cutoffDate = (Get-Date).AddDays(-30)
Get-ChildItem -Path "public\generated" -Recurse -File | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
```

### 2. ✅ **Duplicate Sitemap Files** (BEREITS ENTFERNT)
- `sitemap(2).xml` - entfernt
- `sitemap-0(2).xml` - entfernt

### 3. **.next/** Build-Ordner
- Wird bei jedem Build neu erstellt
- Sollte lokal gelöscht werden, wenn nicht benötigt:
```powershell
Remove-Item -Recurse -Force .next
```

### 4. **node_modules/** 
- Normal groß (~500MB-1GB)
- Bereits in `.gitignore`
- Wird nicht ins Repository committed

## Empfohlene Aktionen

### Sofort:
1. ✅ `.gitignore` aktualisiert - `public/generated/**` wird jetzt ignoriert
2. ✅ Duplikate-Sitemaps entfernt
3. ⚠️ **Entscheiden Sie, ob Sie `public/generated/` Dateien behalten möchten**

### Optional (für weitere Reduzierung):
```powershell
# Cleanup-Skript ausführen (zeigt nur Analyse, löscht nichts automatisch)
powershell -ExecutionPolicy Bypass -File scripts\cleanup-large-files.ps1

# Oder manuell:
# 1. Alte generierte Dateien löschen
Remove-Item -Recurse -Force public\generated\*

# 2. .next Build-Ordner löschen (wird beim nächsten Build neu erstellt)
Remove-Item -Recurse -Force .next

# 3. TypeScript Build-Info löschen
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue
```

## Erwartete Größenreduzierung

Nach Cleanup:
- **public/generated/**: ~10-14GB → 0GB (wenn gelöscht)
- **.next/**: ~500MB-1GB → 0GB (wird neu erstellt)
- **Gesamt**: ~15GB → ~1-2GB (nur Code + node_modules lokal)

## Wichtige Hinweise

⚠️ **Die generierten Dateien können bei Bedarf neu generiert werden!**
- Sie sind temporäre Artefakte aus dem Bulk-Generierungsprozess
- Die eigentlichen Daten sind in der Supabase-Datenbank gespeichert
- Die Dateien werden nur für den Download/Import-Prozess benötigt

✅ **Nach dem Cleanup:**
- Projekt wird deutlich kleiner
- Schnellere Git-Operationen
- Schnellere Build-Zeiten
- `.gitignore` verhindert zukünftige Commits dieser Dateien

