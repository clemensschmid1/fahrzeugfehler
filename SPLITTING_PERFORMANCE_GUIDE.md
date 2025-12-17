# 🔥 File Splitting Performance Guide

## Problem: PC Freezing beim Splitting

Wenn dein PC beim Splitting von Dateien einfriert (Maus tot, UI tot), liegt das an **4 Hauptursachen**:

### 1. File-Watcher Explosion (🔥 Hauptschuldiger)

Beim Splitting werden viele Dateien erstellt/geändert:
- Next.js Dev-Server beobachtet alle Änderungen
- TypeScript Language Server re-parsed alles
- Cursor indexiert neu
- Firebase Emulator reagiert auf Änderungen

**→ Windows + NTFS + viele kleine Dateien = Katastrophe**

### 2. Blocking IO

Synchrones File-IO blockiert den Event Loop:
- `fs.writeFileSync()` → PC friert ein
- `fs.readFileSync()` → UI tot

### 3. Cursor + TypeScript Language Server

Cursor analysiert bei jeder Dateiänderung:
- LSP
- AST-Analyse
- Indexing
- Import-Graph Rebuild

### 4. Firebase Emulator + Hot Reload

Emulator beobachtet Dateien und startet Funktionen neu.

---

## ✅ Implementierte Fixes

### Fix #1: File-Watcher Reduzierung

**`next.config.ts`** wurde aktualisiert:
- `public/generated/**` wird ignoriert (alle Split-Dateien)
- `**/*.jsonl` wird ignoriert
- `knowledge/**` wird ignoriert
- `supabase_migrations/**` wird ignoriert

**→ Next.js beobachtet Splitting-Dateien nicht mehr**

### Fix #2: Asynchrones IO

**Alle synchronen File-IO wurde ersetzt:**
- ✅ `statSync()` → `stat()` (async)
- ✅ `existsSync()` → `access()` (async)
- ✅ `writeFileSync()` → `writeFile()` (async)
- ✅ Streams mit Backpressure-Handling

### Fix #3: Aggressives Yielding

**Nach jeder 5. Zeile wird gepauset:**
- `setTimeout(0)` gibt dem OS Zeit
- Event Loop wird nicht blockiert
- PC bleibt responsiv

### Fix #4: Optimierte Streams

- 64KB Buffer für bessere Performance
- Backpressure-Handling mit `drain` Events
- Batch-Processing mit häufigen Pausen

---

## 🚀 Best Practices (Empfohlen)

### Option A: Splitting OHNE Dev-Server (BESTE LÖSUNG)

**Workflow:**
```bash
# 1. Dev-Server STOPPEN
# Ctrl+C im Terminal

# 2. Splitting durchführen
# Über die UI oder direkt API aufrufen

# 3. Dev-Server NEU STARTEN
npm run dev
```

**Vorteil:** Kein File-Watcher-Storm, PC bleibt responsiv.

### Option B: Cursor Settings Optimieren

**In Cursor Settings deaktivieren:**
- ❌ "Index on Large Repos"
- ❌ "Auto-Refactor on Save"
- ❌ "Deep Type Analysis"
- ❌ "Format on Save" (während Splitting)

**Oder:** Cursor während Splitting schließen.

### Option C: Firebase Emulator Isolieren

**Nie gleichzeitig:**
- Firebase Emulator
- Dev-Server
- Splitting

**Workflow:**
```bash
# Splitting offline
# Dann Emulator neu starten
firebase emulators:start
```

---

## 📊 Performance-Monitoring

**Wenn PC trotzdem einfriert:**

1. **Task Manager öffnen** (vor Splitting)
2. **CPU/Disk IO beobachten**
3. **Falls 100% → Dev-Server stoppen**

**Typische Symptome:**
- Disk IO = 100% → File-Watcher Problem
- CPU = 100% → TypeScript/Cursor Problem
- Beides = Kombination aus beidem

---

## 🔧 Technische Details

### Yielding-Strategie

```typescript
// Nach jeder 5. Zeile:
if (++linesProcessedInBatch >= 5) {
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

**Warum `setTimeout(0)` statt `setImmediate`?**
- Gibt dem OS mehr Zeit
- Windows Scheduler kann andere Prozesse verarbeiten
- Verhindert UI-Freeze

### Watcher-Ignorierung

```typescript
config.watchOptions = {
  ignored: [
    '**/public/generated/**', // Split-Dateien
    '**/*.jsonl',             // Alle JSONL
  ],
  aggregateTimeout: 1000,     // Delay rebuild
  poll: false,                // Native events
};
```

---

## ⚠️ WICHTIG: Server Neustart

**Nach Änderungen an `next.config.ts`:**
```bash
# Dev-Server NEU STARTEN
npm run dev
```

**Ohne Neustart:** Watcher-Konfiguration wird nicht übernommen!

---

## 🎯 Zusammenfassung

**Was wurde gefixt:**
- ✅ File-Watcher ignoriert Split-Dateien
- ✅ Alle IO ist asynchron
- ✅ Aggressives Yielding (alle 5 Zeilen)
- ✅ Optimierte Streams

**Was du tun solltest:**
- ✅ Dev-Server während Splitting stoppen (BESTE LÖSUNG)
- ✅ Cursor Settings optimieren
- ✅ Firebase Emulator isolieren

**Wenn es immer noch einfriert:**
- → Dev-Server definitiv stoppen
- → Cursor schließen
- → Splitting offline durchführen





