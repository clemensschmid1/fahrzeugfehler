# 🔧 Quick Fix: Fehlende Spalten in car_models

## Problem
Es fehlen mehrere Spalten in der `car_models` Tabelle, was zu folgenden Fehlern führt:
```
Error fetching car models: {
  code: '42703',
  message: 'column car_models.year_start does not exist'
}
Error fetching car models: {
  code: '42703',
  message: 'column car_models.image_url does not exist'
}
```

## Lösung

### Schritt 1: Öffne Supabase SQL Editor
1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "SQL Editor" im linken Menü
3. Klicke auf "New Query"

### Schritt 2: Führe diese SQL-Anweisung aus

```sql
-- Füge alle fehlenden Spalten zur car_models Tabelle hinzu
ALTER TABLE public.car_models 
    ADD COLUMN IF NOT EXISTS year_start INTEGER,
    ADD COLUMN IF NOT EXISTS year_end INTEGER,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS sprite_3d_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS production_numbers JSONB;
```

### Schritt 3: Prüfe, ob es funktioniert hat

```sql
-- Prüfe, ob alle Spalten jetzt existieren
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'car_models' 
  AND column_name IN ('year_start', 'year_end', 'image_url', 'sprite_3d_url', 'description', 'is_featured', 'display_order', 'production_numbers')
ORDER BY column_name;
```

Du solltest 8 Zeilen sehen mit allen Spalten.

### Schritt 4: Teste die Website
Nach der Ausführung sollte die Website wieder funktionieren und die Modelle sollten geladen werden.

---

## Alternative: Code temporär anpassen (nicht empfohlen)

Falls du die Spalten nicht hinzufügen kannst, kannst du temporär den Code anpassen, um diese Spalten nicht abzufragen. Aber **das ist nicht empfohlen**, da die Spalten für die Sortierung und Anzeige verwendet werden.

---

## Warum ist das passiert?

Die `car_models` Tabelle wurde möglicherweise erstellt, bevor alle Spalten in der Migration definiert wurden. Die `ALTER TABLE` Anweisung in der Migration sollte diese Spalten hinzufügen, aber wenn die Tabelle bereits existiert hat, wurde sie möglicherweise nicht ausgeführt.

---

## Nach dem Fix

Nachdem du die Spalten hinzugefügt hast, sollten:
- ✅ Die Modelle auf den Brand-Seiten geladen werden
- ✅ Die Sortierung nach Jahr funktionieren
- ✅ Die Jahresanzeige in der UI funktionieren
- ✅ Bilder und Beschreibungen angezeigt werden
- ✅ Die Sortierung nach display_order funktionieren

