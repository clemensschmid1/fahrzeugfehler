# Komplette Übertragungsanleitung: Mass Generation & Prompt-System

## 📋 Übersicht

Diese Anleitung zeigt dir, wie du das komplette Mass Generation System und das Prompt-Management in ein neues Cursor-Projekt übertragen kannst.

## 🎯 Was wird übertragen?

1. **Mass Generation UI** - Komplette Benutzeroberfläche für Batch-Fragengeneration
2. **Prompt-System** - Dynamisches Prompt-Management pro Generation
3. **API Routes** - Alle Backend-Endpunkte für Generation, Transformation, Batch-Processing
4. **Helper Functions** - Wiederverwendbare Funktionen für Fragengeneration

---

## 📁 Dateien-Struktur

### 1. Frontend (UI-Komponenten)

```
src/app/[lang]/mass-generation/
  └── page.tsx                    # Haupt-UI für Mass Generation (2542 Zeilen)

src/app/[lang]/prompts/
  └── page.tsx                    # Prompt-Management UI

src/components/
  └── FileUpload.tsx              # File Upload Komponente (wird von Mass Generation verwendet)
```

### 2. API Routes (Backend)

```
src/app/api/mass-generation/
  ├── generate-questions/
  │   └── route.ts               # Generiert Fragen (Batch)
  ├── generate-questions-stream/
  │   └── route.ts               # Stream-Version mit Progress
  ├── transform-to-jsonl/
  │   └── route.ts               # Transformiert TXT zu JSONL
  ├── build-jsonl/
  │   └── route.ts               # Baut JSONL für OpenAI Batch API
  ├── build-metadata-jsonl/
  │   └── route.ts               # Baut Metadata JSONL
  ├── submit-batch/
  │   └── route.ts               # Submittet Batch zu OpenAI
  ├── check-status/
  │   └── route.ts               # Prüft Batch-Status
  ├── download-batch-output/
  │   └── route.ts               # Lädt Batch-Output herunter
  ├── download-file/
  │   └── route.ts               # Lädt generierte Dateien herunter
  ├── import/
  │   └── route.ts               # Importiert Ergebnisse in DB
  ├── convert-questions-to-answers-jsonl/
  │   └── route.ts               # Konvertiert Questions zu Answers JSONL
  ├── split-jsonl/
  │   └── route.ts               # Teilt große JSONL-Dateien
  └── get-openai-upload-url/
      └── route.ts               # Holt Upload-URL für OpenAI
```

### 3. Datenbank-Migrationen (Supabase)

```
supabase_migrations/
  └── create_prompts_table.sql   # Erstellt generation_prompts Tabelle
```

### 4. Helper Components

```
src/components/
  ├── InternalAuth.tsx           # Authentication (optional, kann angepasst werden)
  └── FileUpload.tsx             # File Upload Komponente
```

---

## 🚀 Schritt-für-Schritt Übertragung

### Schritt 1: Dependencies installieren

In deinem neuen Projekt:

```bash
npm install @supabase/supabase-js
# Oder falls du Supabase nicht verwendest, kannst du die DB-Aufrufe anpassen
```

### Schritt 2: Environment Variables

Füge zu deinem `.env.local` hinzu:

```env
# OpenAI
OPENAI_API_KEY=dein-api-key
OPENAI_MODEL_QUESTIONS=gpt-4o-mini
BATCH_MODEL_ANSWERS=gpt-4o-mini

# Supabase (falls verwendet)
NEXT_PUBLIC_SUPABASE_URL=deine-url
SUPABASE_SERVICE_ROLE_KEY=dein-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### Schritt 3: Datenbank-Struktur (falls Supabase)

Falls du Supabase verwendest, führe diese Migration aus:

```sql
-- Siehe: supabase_migrations/create_prompts_table.sql
-- Erstellt die generation_prompts Tabelle
```

**Wichtig:** Die Tabelle speichert Prompts pro Generation. Falls du keine `model_generations` Tabelle hast, musst du die Struktur anpassen.

### Schritt 4: Dateien kopieren

#### 4.1 API Routes kopieren

Kopiere den gesamten `src/app/api/mass-generation/` Ordner:

```bash
# Im neuen Projekt:
mkdir -p src/app/api/mass-generation
# Dann alle Dateien kopieren
```

#### 4.2 Frontend kopieren

```bash
# Mass Generation UI
mkdir -p src/app/[lang]/mass-generation
# Kopiere: src/app/[lang]/mass-generation/page.tsx

# Prompt Management UI (optional)
mkdir -p src/app/[lang]/prompts
# Kopiere: src/app/[lang]/prompts/page.tsx
```

#### 4.3 Components kopieren

```bash
# File Upload Component
mkdir -p src/components
# Kopiere: src/components/FileUpload.tsx

# Internal Auth (optional, anpassen oder entfernen)
# Kopiere: src/components/InternalAuth.tsx
```

### Schritt 5: Anpassungen

#### 5.1 Routing anpassen

Falls dein Projekt kein `[lang]` Routing hat:

**Option A:** Entferne `[lang]` aus den Pfaden:
- `src/app/mass-generation/page.tsx` statt `src/app/[lang]/mass-generation/page.tsx`
- Passe alle `useParams()` Aufrufe an

**Option B:** Behalte `[lang]` und setze einen Default:
```typescript
const params = useParams();
const lang = (params.lang as string) || 'en';
```

#### 5.2 Supabase-Integration anpassen

Falls du **keine Supabase** verwendest:

1. **In API Routes:** Ersetze Supabase-Aufrufe durch deine DB-Logik
2. **Prompt-System:** 
   - Entweder: Prompts in Config-Dateien speichern
   - Oder: Prompts in deiner eigenen DB speichern
   - Oder: Prompts hardcoden (weniger flexibel)

**Beispiel-Anpassung für Prompts ohne Supabase:**

```typescript
// Statt Supabase-Query:
async function loadGenerationPrompts(
  generationId: string,
  contentType: 'fault' | 'manual',
  language: 'en' | 'de'
) {
  // Option 1: Config-Datei
  const prompts = require('@/config/prompts.json');
  return prompts[generationId]?.[contentType]?.[language] || [];
  
  // Option 2: Hardcoded Defaults
  return [{
    prompt_order: 1,
    system_prompt: '...',
    user_prompt_template: '...',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 5000,
  }];
}
```

#### 5.3 Datenmodell anpassen

Falls deine Datenstruktur anders ist (z.B. keine `car_brands`, `car_models`, `model_generations`):

**In `generate-questions/route.ts` und anderen API Routes:**

```typescript
// Statt:
const { data: brandsData } = await supabase
  .from('car_brands')
  .select('id, name, slug')
  .in('id', brandIds);

// Passe an dein Datenmodell an:
const brandsData = await yourDatabase.getBrands(brandIds);
```

#### 5.4 Authentication anpassen

**Option A:** `InternalAuth` entfernen (für öffentlichen Zugang):
```typescript
// In page.tsx:
export default function MassGenerationPage() {
  return <MassGenerationContent />; // Direkt ohne Auth
}
```

**Option B:** Eigene Auth verwenden:
```typescript
import { YourAuthComponent } from '@/components/YourAuth';

export default function MassGenerationPage() {
  return (
    <YourAuthComponent>
      <MassGenerationContent />
    </YourAuthComponent>
  );
}
```

#### 5.5 File Storage anpassen

Die API Routes speichern Dateien in `public/generated/`. Falls du Cloud Storage verwendest:

**In `generate-questions/route.ts` und anderen:**

```typescript
// Statt:
const filePath = join(process.cwd(), 'public', 'generated', filename);
await writeFile(filePath, jsonlContent, 'utf-8');
const fileUrl = `/generated/${filename}`;

// Passe an:
const fileUrl = await uploadToCloudStorage(filename, jsonlContent);
// Oder:
const fileUrl = await saveToS3(filename, jsonlContent);
```

---

## 🔧 Kern-Funktionalitäten

### 1. Fragengeneration

**Datei:** `src/app/api/mass-generation/generate-questions/route.ts`

**Was macht es:**
- Generiert Fragen für mehrere Generations gleichzeitig
- Verwendet verbesserte Prompts mit Fokus auf Suchhäufigkeit
- Unterstützt Batch-Processing
- Erstellt JSONL-Dateien für OpenAI Batch API

**Anpassungen:**
- `generateFaultQuestionsImproved()` - Prompt-Logik anpassen
- `generateManualQuestionsImproved()` - Für Manuals anpassen

### 2. Prompt-System

**Datei:** `src/app/[lang]/prompts/page.tsx` + `supabase_migrations/create_prompts_table.sql`

**Was macht es:**
- Verwaltet Prompts pro Generation
- Rotiert Prompts alle 4 Batches (200 Fragen pro Slot)
- Unterstützt verschiedene Models, Temperature, Max Tokens

**Ohne Supabase:**
- Erstelle eine Config-Datei: `src/config/prompts.ts`
- Oder: Verwende Default-Prompts in den API Routes

### 3. Stream-Generation

**Datei:** `src/app/api/mass-generation/generate-questions-stream/route.ts`

**Was macht es:**
- Generiert Fragen mit Echtzeit-Progress-Updates
- Verwendet Server-Sent Events (SSE)
- Zeigt detaillierten Fortschritt pro Generation

**Anpassungen:**
- SSE-Logik bleibt gleich
- Nur DB-Aufrufe anpassen

### 4. JSONL Transformation

**Datei:** `src/app/api/mass-generation/transform-to-jsonl/route.ts`

**Was macht es:**
- Transformiert TXT-Dateien zu JSONL-Format
- Erstellt OpenAI Batch API-kompatible JSONL
- Unterstützt Prompt-Rotation

---

## 📝 Minimale Übertragung (nur Kern-Funktion)

Falls du nur die **Fragengeneration** ohne UI willst:

### Dateien:
1. `src/app/api/mass-generation/generate-questions/route.ts`
2. `src/app/api/mass-generation/generate-questions-stream/route.ts` (optional)

### Anpassungen:
- Entferne Supabase-Abhängigkeiten
- Passe Datenmodell an
- Verwende Default-Prompts statt DB

### Beispiel-Usage:

```typescript
// In deinem Frontend:
const response = await fetch('/api/mass-generation/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandIds: ['brand-1', 'brand-2'],
    generationIds: ['gen-1', 'gen-2'],
    contentType: 'fault',
    questionsPerGeneration: 5000,
    language: 'en'
  })
});

const data = await response.json();
// data.fileUrl - Link zur generierten JSONL-Datei
```

---

## 🎨 UI-Anpassungen

### Styling

Die UI verwendet **Tailwind CSS**. Falls du kein Tailwind hast:

1. **Option A:** Tailwind installieren
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Option B:** CSS-Klassen durch eigene ersetzen

### Dark Mode

Die UI unterstützt Dark Mode via `dark:` Klassen. Falls nicht benötigt, entferne diese.

---

## 🔍 Wichtige Funktionen im Detail

### Prompt-Rotation

Das System rotiert Prompts alle 4 Batches:
- Batches 1-4: Prompt 1
- Batches 5-8: Prompt 2
- etc.

**Code:** `getPromptForBatch()` in `transform-to-jsonl/route.ts`

### Duplikat-Erkennung

Das System erkennt Duplikate via:
- Normalisierung (lowercase, trim)
- Set-basierte Prüfung
- Vergleich mit existierenden Fragen

**Code:** `existingQuestions` Set in `generate-questions/route.ts`

### Batch-Processing

- OpenAI Batch API für Antworten
- Lokale Batch-Generierung für Fragen
- Progress-Tracking pro Generation

---

## ✅ Checkliste

- [ ] Dependencies installiert (`@supabase/supabase-js` oder alternative)
- [ ] Environment Variables gesetzt
- [ ] API Routes kopiert (`src/app/api/mass-generation/`)
- [ ] Frontend kopiert (`src/app/[lang]/mass-generation/page.tsx`)
- [ ] Components kopiert (`FileUpload.tsx`, `InternalAuth.tsx`)
- [ ] Routing angepasst (falls kein `[lang]`)
- [ ] Supabase-Integration angepasst (oder entfernt)
- [ ] Datenmodell angepasst (falls anders)
- [ ] Authentication angepasst
- [ ] File Storage angepasst (falls Cloud)
- [ ] Prompts-System angepasst (Config oder DB)
- [ ] Styling angepasst (Tailwind oder eigene Styles)
- [ ] Getestet: Fragengeneration funktioniert
- [ ] Getestet: UI lädt und funktioniert
- [ ] Getestet: Batch-Processing funktioniert

---

## 🆘 Troubleshooting

### Problem: "Missing Supabase credentials"
**Lösung:** Entweder Supabase einrichten oder DB-Aufrufe durch eigene Logik ersetzen

### Problem: "Cannot find module '@/lib/supabase'"
**Lösung:** Erstelle `src/lib/supabase.ts` oder passe Imports an

### Problem: "Routing error - [lang] not found"
**Lösung:** Entferne `[lang]` aus Pfaden oder setze Default-Wert

### Problem: "File upload not working"
**Lösung:** Prüfe `FileUpload.tsx` Component und File Storage-Pfade

---

## 📚 Weitere Ressourcen

- **OpenAI Batch API Docs:** https://platform.openai.com/docs/guides/batch
- **Supabase Docs:** https://supabase.com/docs
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 💡 Tipps

1. **Starte klein:** Kopiere erst nur `generate-questions/route.ts` und teste
2. **Schrittweise:** Füge nach und nach weitere Features hinzu
3. **Anpassen:** Die Prompts sind sehr spezifisch für Autos - passe für deinen Use-Case an
4. **Testen:** Teste mit kleinen Batches (z.B. 100 Fragen) bevor du große Batches machst
5. **Monitoring:** Füge Logging hinzu um zu sehen was passiert

---

## 🎯 Zusammenfassung

**Kern-Dateien für minimale Übertragung:**
- `src/app/api/mass-generation/generate-questions/route.ts`
- `src/app/api/mass-generation/generate-questions-stream/route.ts` (optional)

**Für vollständige UI:**
- Alle Dateien in `src/app/api/mass-generation/`
- `src/app/[lang]/mass-generation/page.tsx`
- `src/components/FileUpload.tsx`

**Für Prompt-Management:**
- `src/app/[lang]/prompts/page.tsx`
- `supabase_migrations/create_prompts_table.sql` (oder eigene DB-Struktur)

Viel Erfolg! 🚀


