# Guide: Fragengeneration in neues Projekt übertragen

## Kern-Dateien für Fragengeneration

### 1. API Route (Hauptfunktion)
**Datei:** `src/app/api/questions/generate-ai/route.ts`
- **Was macht es:** Generiert Fragen mit OpenAI API
- **Dependencies:** 
  - `OPENAI_API_KEY` Environment Variable
  - Optional: `OPENAI_MODEL_QUESTIONS` (Standard: `gpt-4o-mini`)

### 2. Frontend UI (Einfache Version)
**Datei:** `src/app/[lang]/internal/questiongeneration/page.tsx`
- **Was macht es:** Einfache UI zum Generieren von Fragen
- **Dependencies:** 
  - Die API Route oben
  - React, Next.js

### 3. Mass Generation (Erweiterte Version)
**Dateien:**
- `src/app/api/mass-generation/generate-questions/route.ts` - Batch-Generierung
- `src/app/[lang]/mass-generation/page.tsx` - Komplexe UI für Mass Generation

## Schnellstart: Minimale Übertragung

### Schritt 1: API Route kopieren
```bash
# Kopiere diese Datei:
src/app/api/questions/generate-ai/route.ts
```

### Schritt 2: Environment Variables setzen
In deinem neuen Projekt `.env.local`:
```env
OPENAI_API_KEY=dein-api-key
OPENAI_MODEL_QUESTIONS=gpt-4o-mini  # Optional
```

### Schritt 3: Frontend kopieren (optional)
```bash
# Für einfache UI:
src/app/[lang]/internal/questiongeneration/page.tsx

# Oder für komplexe Mass Generation:
src/app/[lang]/mass-generation/page.tsx
# + alle Dateien in src/app/api/mass-generation/
```

## Was du anpassen musst:

1. **Routing:** Wenn dein Projekt kein `[lang]` Routing hat, passe die Pfade an
2. **Authentication:** Die `InternalAuth` Komponente - entweder kopieren oder entfernen
3. **Styling:** Tailwind CSS Klassen anpassen falls nötig
4. **Dependencies:** Stelle sicher, dass du hast:
   - `next`
   - `react`
   - `react-dom`

## Minimale Standalone-Version

Wenn du nur die Kern-Funktion willst, kopiere nur:

1. `src/app/api/questions/generate-ai/route.ts`
2. Passe die System-Prompts an deine Bedürfnisse an
3. Erstelle eine einfache Frontend-Seite die die API aufruft

## Beispiel: Minimaler API-Call

```typescript
// In deinem Frontend:
const response = await fetch('/api/questions/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Dein Thema hier',
    count: 20,
    language: 'en',
    model: 'gpt-4o-mini'
  })
});

const data = await response.json();
console.log(data.questions); // Array von Fragen
```

## Wichtige Funktionen in den Dateien:

### `generate-ai/route.ts`
- `POST` Handler für Fragengeneration
- Unterstützt verschiedene Models
- Multi-Language (en/de)
- Configurable count

### `questiongeneration/page.tsx`
- React UI Component
- State Management für Generations
- Download-Funktionalität
- Merge-Funktionalität

## Tipps:

1. **Starte klein:** Kopiere erst nur die API Route und teste sie
2. **Anpassen:** Die System-Prompts in `generate-ai/route.ts` anpassen für deine Use-Case
3. **Erweitern:** Dann nach und nach die UI-Komponenten hinzufügen

## Vollständige Liste (für komplette Übertragung):

```
src/app/api/questions/
  ├── generate-ai/route.ts          # KERN - Fragengeneration
  ├── generate-metadata/route.ts     # Optional - Metadata
  ├── check-duplicate/route.ts       # Optional - Duplikate prüfen
  └── save-generated/route.ts        # Optional - Speichern

src/app/[lang]/internal/
  └── questiongeneration/
      └── page.tsx                   # UI für einfache Generierung

src/app/api/mass-generation/        # Optional - Für Batch-Processing
  ├── generate-questions/route.ts
  ├── generate-questions-stream/route.ts
  └── ... (weitere Dateien)

src/app/[lang]/mass-generation/
  └── page.tsx                       # UI für Mass Generation
```

## Empfehlung:

**Für schnellen Start:** Kopiere nur `generate-ai/route.ts` und erstelle eine einfache Test-Seite.

**Für vollständige Funktionalität:** Kopiere die kompletten `questions/` und `mass-generation/` Ordner.


