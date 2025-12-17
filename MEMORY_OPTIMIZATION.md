# Memory & CPU-Optimierung für Next.js Dev Server

## Problem
Der Next.js Dev Server verbraucht sehr viel Arbeitsspeicher (4GB+) und CPU (90%+), selbst wenn keine Operationen laufen. Dies führt zu:
- PC-Lagging
- Hoher Node.js Memory-Verbrauch (4GB+ pro Sekunde)
- Hohe CPU-Auslastung (90%+)
- Probleme beim Beenden von Tasks

## Lösungen

### 1. Memory-Limits für Node.js setzen

**Standard Dev Server (1.5GB Limit, OHNE TurboPack):**
```bash
npm run dev
```
⚠️ **Empfohlen:** TurboPack ist standardmäßig DEAKTIVIERT, da es zu viel Memory/CPU verbraucht.

**Mit TurboPack (2GB Limit):**
```bash
npm run dev:turbo
```
⚠️ **Nur verwenden wenn nötig** - TurboPack verbraucht deutlich mehr Ressourcen.

**Ohne TurboPack (1.5GB Limit):**
```bash
npm run dev:no-turbo
```

**Erweiterter Dev Server (4GB Limit mit GC):**
```bash
npm run dev:memory
```

### 2. API-Route Optimierungen

#### ✅ Behoben: `submit-batch` Route
- **Vorher:** Lade gesamte Datei in Array → Memory-Leak bei großen Dateien
- **Jetzt:** Stream-basierte Validierung Zeile für Zeile → Minimaler Memory-Verbrauch

#### ✅ Behoben: `download-file` Route
- **Vorher:** Streams wurden nicht richtig aufgeräumt
- **Jetzt:** Proper cleanup mit Event-Listener-Removal

#### ✅ Bereits optimiert: `split-jsonl` Route
- Verwendet kleine Buffer (64KB)
- Explizites Cleanup aller Streams
- Garbage Collection Support

### 3. Next.js Config Optimierungen

- **onDemandEntries:** Reduzierte Buffer-Zeit von 60s auf 15s (aggressiv)
- **pagesBufferLength:** Reduziert auf 1 (Minimum)
- **webpack watchOptions:** Ignoriert `public/generated/**` um File-Watcher-Load zu reduzieren
- **TurboPack Memory-Limit:** 512MB (reduziert von 1GB)
- **Server Actions Body Limit:** 2MB

### 4. Best Practices

1. **Dev Server neu starten nach großen Operationen:**
   ```bash
   # Strg+C zum Stoppen
   npm run dev
   ```

2. **Temporäre Dateien aufräumen:**
   ```bash
   # Lösche alte temp-Dateien
   rm -rf public/generated/temp-*
   ```

3. **Node.js Memory überwachen:**
   - Task Manager → Details → Node.js → Memory
   - Sollte unter 1.5GB bleiben im Idle-Zustand

4. **Bei Problemen:**
   - Dev Server komplett beenden (Strg+C)
   - Alle Node.js Prozesse beenden (Task Manager)
   - Cache bereinigen: `npm run clean:cache:win:all`
   - Neu starten mit `npm run dev` (OHNE TurboPack)

## Technische Details

### Memory-Leak Quellen (behoben)

1. **submit-batch:** `lines.push(line)` für große Dateien → Jetzt: Stream-Validierung
2. **download-file:** Ungeschlossene Streams → Jetzt: Proper cleanup
3. **Next.js HMR:** File-Watcher auf `public/generated/**` → Jetzt: Ignoriert
4. **TurboPack:** Unbegrenzter Cache → Jetzt: 512MB Limit + Standard deaktiviert

### Node.js Memory Flags

- `--max-old-space-size=1536`: 1.5GB Heap-Limit (Standard, OHNE TurboPack)
- `--max-old-space-size=2048`: 2GB Heap-Limit (Mit TurboPack)
- `--max-old-space-size=4096`: 4GB Heap-Limit (Erweitert)
- `--max-semi-space-size=64`: Reduziert Semi-Space für weniger Memory
- `--expose-gc`: Ermöglicht manuelle Garbage Collection

## Monitoring

Um Memory-Verbrauch zu überwachen:

```bash
# Windows PowerShell
Get-Process node | Select-Object ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WS / 1MB, 2)}}, @{Name="CPU(%)";Expression={$_.CPU}}

# Oder Task Manager öffnen
# Details → Node.js → Memory & CPU-Spalte
```

**Erwartete Werte:**
- Idle (nichts läuft): < 500MB Memory, < 5% CPU
- Während Dev Server (ohne TurboPack): < 1.5GB Memory, < 20% CPU
- Während Dev Server (mit TurboPack): < 2GB Memory, < 40% CPU
- Während großer Operationen: < 2GB Memory (mit dev:memory < 4GB)

## TurboPack Cache-Problem (90% Datenträger)

### Problem
TurboPack erstellt einen riesigen Cache, der 90% des Datenträgers belegt.

### Lösungen

#### 1. Cache bereinigen
```bash
# Windows PowerShell
npm run clean:cache:win        # Standard-Bereinigung
npm run clean:cache:win:all    # Alles löschen (inkl. Global Cache)

# Cross-Platform
npm run clean:cache             # Standard-Bereinigung
npm run clean:cache:all        # Alles löschen
```

#### 2. TurboPack deaktivieren (EMPFOHLEN)
```bash
# Dev Server OHNE TurboPack (Standard, weniger Cache & CPU)
npm run dev

# Oder explizit:
npm run dev:no-turbo
```

#### 3. Cache-Limits in next.config.ts
- TurboPack Memory-Limit: 512MB (reduziert)
- Automatische Cache-Bereinigung nach Build

#### 4. Manuelle Cache-Bereinigung
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next\cache
Remove-Item -Recurse -Force node_modules\.cache

# Oder manuell im Explorer:
# .next/cache/ löschen
# node_modules/.cache/ löschen
```

### Cache-Größe überwachen
```bash
# Windows PowerShell - Cache-Größe prüfen
Get-ChildItem -Path .next\cache -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name="Size(GB)";Expression={[math]::Round($_.Sum / 1GB, 2)}}
```

**Empfohlene Cache-Größe:** < 2GB
**Warnung bei:** > 5GB → Cache bereinigen!

## CPU-Optimierung

### Problem: 90% CPU-Auslastung

**Ursachen:**
1. TurboPack ist sehr CPU-intensiv
2. File-Watcher überwacht zu viele Dateien
3. Hot Module Reloading (HMR) bei vielen Änderungen

**Lösungen:**
1. **TurboPack deaktivieren (Standard):**
   ```bash
   npm run dev  # OHNE TurboPack
   ```

2. **File-Watcher optimiert:**
   - Ignoriert `public/generated/**`
   - Ignoriert `node_modules/**`
   - Ignoriert `.next/**`

3. **onDemandEntries reduziert:**
   - Buffer-Zeit: 15s (statt 60s)
   - Pages Buffer: 1 (statt 2)

## Notfall-Maßnahmen

Wenn CPU/Memory immer noch zu hoch ist:

1. **Dev Server stoppen:**
   ```bash
   # Strg+C im Terminal
   ```

2. **Alle Node.js Prozesse beenden:**
   - Task Manager → Details
   - Alle "Node.js" Prozesse beenden

3. **Cache komplett löschen:**
   ```bash
   npm run clean:cache:win:all
   ```

4. **Neu starten OHNE TurboPack:**
   ```bash
   npm run dev  # Standard (ohne TurboPack)
   ```

5. **Falls weiterhin Probleme:**
   - Computer neu starten
   - Prüfe andere Programme (Antivirus, etc.)
   - Prüfe ob andere Node.js Prozesse laufen

