# SQL-Migration für Fahrzeugfehler.de

## 📋 Was wurde erstellt:

Die Datei `supabase_migrations/create_fahrzeugfehler_schema.sql` enthält:

### ✅ Tabellen:
1. **car_brands** - Automarken (BMW, Mercedes, etc.)
2. **car_models** - Automodelle (3er, C-Klasse, etc.)
3. **model_generations** - Modellgenerationen (E46, E90, etc.)
4. **car_faults** - Fahrzeugfehler und Lösungen
5. **car_manuals** - Reparatur- und Wartungsanleitungen

### ✅ Features:
- Indizes für schnelle Abfragen
- RLS (Row Level Security) Policies
- Trigger für automatisches `updated_at`
- Constraints für Datenintegrität
- Kommentare für Dokumentation

---

## 🚀 So führst du die Migration aus:

### Option 1: Über Supabase Dashboard (Empfohlen)

1. **Gehe zu Supabase Dashboard**
2. **Klicke auf "SQL Editor"** (links in der Sidebar)
3. **Klicke auf "New query"**
4. **Öffne die Datei:** `supabase_migrations/create_fahrzeugfehler_schema.sql`
5. **Kopiere den gesamten Inhalt** in den SQL Editor
6. **Klicke auf "Run"** (oder F5)
7. **Fertig!** ✅

### Option 2: Über Supabase CLI

```bash
# Falls du Supabase CLI installiert hast
supabase db push
```

---

## ✅ Nach der Migration prüfen:

1. **Tabellen prüfen:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'car_%';
   ```

2. **Indizes prüfen:**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'car_%';
   ```

3. **RLS Policies prüfen:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'car_%';
   ```

---

## 📝 Test-Daten einfügen (Optional):

Nach der Migration kannst du Test-Daten einfügen:

```sql
-- Beispiel: BMW Marke
INSERT INTO public.car_brands (name, slug, country, is_featured, display_order)
VALUES ('BMW', 'bmw', 'Deutschland', true, 1);

-- Beispiel: BMW 3er Modell
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order)
SELECT id, '3er', '3er', true, 1
FROM public.car_brands WHERE slug = 'bmw';

-- Beispiel: BMW 3er E46 Generation
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end)
SELECT id, 'E46 (1998-2006)', 'e46-1998-2006', 'E46', 1998, 2006
FROM public.car_models WHERE slug = '3er' AND brand_id = (SELECT id FROM public.car_brands WHERE slug = 'bmw');
```

---

## ⚠️ Wichtig:

1. **Backup erstellen** (falls du bereits Daten hast)
2. **RLS Policies** sind aktiviert - nur `live` Status wird öffentlich angezeigt
3. **Foreign Keys** sind gesetzt - beim Löschen einer Marke werden alle zugehörigen Daten gelöscht
4. **Indizes** verbessern Performance bei großen Datenmengen

---

## 🔍 Troubleshooting:

### Fehler: "relation already exists"
- Die Tabelle existiert bereits
- Lösung: Verwende `DROP TABLE IF EXISTS` oder überspringe diese Tabelle

### Fehler: "permission denied"
- Du hast keine Rechte
- Lösung: Verwende einen Admin-Account oder Service Role Key

### Fehler: "extension uuid-ossp does not exist"
- Die Extension fehlt
- Lösung: Führe `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` aus

---

## 📚 Nächste Schritte:

1. ✅ Migration ausführen
2. ✅ Test-Daten einfügen (optional)
3. ✅ Website testen: http://localhost:3000/cars
4. ✅ Daten über Supabase Dashboard oder API einfügen

