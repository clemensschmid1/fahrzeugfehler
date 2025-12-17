# Seed-Daten für Fahrzeugfehler.de

## 📋 Was wurde erstellt:

Die Datei `supabase_migrations/seed_top_brands_models.sql` enthält:

### ✅ Automarken (8 Marken):
1. **BMW** - Premium-Automobilhersteller aus München
2. **Mercedes-Benz** - Premium-Automobilhersteller aus Stuttgart
3. **Audi** - Premium-Automobilhersteller aus Ingolstadt
4. **Volkswagen** - Größter Automobilhersteller Europas
5. **Opel** - Deutscher Automobilhersteller
6. **Porsche** - Sportwagenhersteller aus Stuttgart
7. **Ford** - Amerikanischer Hersteller mit großer Präsenz in Deutschland
8. **Škoda** - Tschechischer Hersteller (VW-Gruppe)

### ✅ Automodelle (15 Modelle):
- **BMW**: 3er, 5er, X3
- **Mercedes-Benz**: C-Klasse, E-Klasse, GLC
- **Audi**: A4, A6, Q5
- **Volkswagen**: Golf, Passat, Tiguan
- **Opel**: Astra, Corsa

### ✅ Modellgenerationen (20+ Generationen):
- **BMW 3er**: E46, E90, F30, G20
- **BMW 5er**: E39, F10
- **Mercedes C-Klasse**: W203, W204, W205, W206
- **Mercedes E-Klasse**: W211, W213
- **Audi A4**: B6, B8, B9
- **VW Golf**: Golf IV, V, VI, VII, VIII
- **Opel Astra**: Astra G, Astra K

---

## 🚀 So führst du die Seed-Daten aus:

### Option 1: Über Supabase Dashboard (Empfohlen)

1. **Gehe zu Supabase Dashboard**
2. **Klicke auf "SQL Editor"** (links in der Sidebar)
3. **Klicke auf "New query"**
4. **Öffne die Datei:** `supabase_migrations/seed_top_brands_models.sql`
5. **Kopiere den gesamten Inhalt** in den SQL Editor
6. **Klicke auf "Run"** (oder F5)
7. **Fertig!** ✅

### Option 2: Über Supabase CLI

```bash
# Falls du Supabase CLI installiert hast
supabase db execute -f supabase_migrations/seed_top_brands_models.sql
```

---

## ✅ Nach der Seed-Ausführung prüfen:

1. **Marken prüfen:**
   ```sql
   SELECT name, slug, country, is_featured 
   FROM public.car_brands 
   ORDER BY display_order;
   ```

2. **Modelle prüfen:**
   ```sql
   SELECT cb.name as brand, cm.name as model, cm.slug
   FROM public.car_models cm
   JOIN public.car_brands cb ON cm.brand_id = cb.id
   ORDER BY cb.display_order, cm.display_order;
   ```

3. **Generationen prüfen:**
   ```sql
   SELECT cb.name as brand, cm.name as model, mg.name as generation, mg.generation_code
   FROM public.model_generations mg
   JOIN public.car_models cm ON mg.car_model_id = cm.id
   JOIN public.car_brands cb ON cm.brand_id = cb.id
   ORDER BY cb.display_order, cm.display_order, mg.display_order;
   ```

---

## 📝 Hinweise:

1. **ON CONFLICT**: Die Seed-Datei verwendet `ON CONFLICT DO UPDATE`, sodass du sie mehrfach ausführen kannst, ohne Duplikate zu erstellen.

2. **Featured Marken**: Alle Marken sind als `is_featured = true` markiert und haben `display_order` Werte für die Sortierung.

3. **Generation-Codes**: Alle Generationen haben offizielle Generation-Codes (E46, W204, B8, etc.) für bessere Identifikation.

4. **Jahrgänge**: Alle Generationen haben `year_start` und `year_end` (NULL wenn noch in Produktion).

---

## 🔍 Troubleshooting:

### Fehler: "foreign key constraint fails"
- Die Tabellen-Struktur wurde noch nicht erstellt
- Lösung: Führe zuerst `create_fahrzeugfehler_schema.sql` aus

### Fehler: "duplicate key value"
- Die Daten existieren bereits
- Lösung: Kein Problem! Die Seed-Datei aktualisiert bestehende Einträge mit `ON CONFLICT DO UPDATE`

### Fehler: "column does not exist"
- Die Tabellen-Struktur ist veraltet
- Lösung: Führe die Schema-Migration erneut aus

---

## 📚 Nächste Schritte:

1. ✅ Seed-Daten ausführen
2. ✅ Website testen: http://localhost:3000/cars
3. ✅ Marken und Modelle sollten jetzt sichtbar sein
4. ✅ Du kannst jetzt Fehler und Anleitungen für diese Modelle hinzufügen

---

## 🎯 Erweiterung:

Du kannst die Seed-Datei erweitern, um:
- Weitere Marken hinzuzufügen (Toyota, Hyundai, etc.)
- Weitere Modelle für bestehende Marken
- Weitere Generationen für bestehende Modelle
- Test-Fahrzeugfehler hinzuzufügen

