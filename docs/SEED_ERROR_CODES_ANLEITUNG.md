# Seed-Daten für Fehlercodes

## 📋 Was wurde erstellt:

Die Datei `supabase_migrations/seed_error_codes.sql` enthält:

### ✅ Fehlercodes (15+ Fehlercodes):

**Häufige OBD-II Fehlercodes:**
- **P0300**: Zufällige Zylinderfehlzündung
- **P0301**: Zylinder 1 Fehlzündung
- **P0302**: Zylinder 2 Fehlzündung
- **P0303**: Zylinder 3 Fehlzündung
- **P0304**: Zylinder 4 Fehlzündung
- **P0171**: Kraftstoffgemisch zu mager
- **P0172**: Kraftstoffgemisch zu fett
- **P0420**: Katalysator-Wirkungsgrad zu niedrig
- **P0015**: Nockenwellenverstellung Bank 1
- **P0299**: Ladedruck zu niedrig
- **P0401**: EGR-Ventil Durchfluss zu niedrig
- **P0135**: Lambda-Sonde Heizung
- **P0128**: Kühlmitteltemperatur zu niedrig
- **P2015**: Drosselklappen-Stellungsfehler
- **P0441**: Kraftstoffdampf-Rückführung Durchfluss
- **P0442**: Kraftstoffdampf-Rückführung - kleine Undichtigkeit
- **P2187**: Kraftstoffgemisch zu mager im Leerlauf

### ✅ Verknüpfte Modelle:
- **BMW 3er**: E46, E90, F30
- **Mercedes-Benz C-Klasse**: W204, W205
- **Audi A4**: B8, B9
- **Volkswagen Golf**: Golf VI, Golf VII
- **Opel Astra**: Astra G

---

## 🚀 So führst du die Seed-Daten aus:

### Voraussetzung:
1. ✅ Schema-Migration ausgeführt (`create_fahrzeugfehler_schema.sql`)
2. ✅ Marken/Modelle-Seed ausgeführt (`seed_top_brands_models.sql`)

### Ausführung:

1. **Gehe zu Supabase Dashboard**
2. **Klicke auf "SQL Editor"**
3. **Klicke auf "New query"**
4. **Öffne die Datei:** `supabase_migrations/seed_error_codes.sql`
5. **Kopiere den gesamten Inhalt** in den SQL Editor
6. **Klicke auf "Run"** (oder F5)
7. **Fertig!** ✅

---

## ✅ Nach der Seed-Ausführung prüfen:

1. **Fehlercodes prüfen:**
   ```sql
   SELECT 
     cf.error_code,
     cf.title,
     cb.name as brand,
     cm.name as model,
     mg.name as generation
   FROM public.car_faults cf
   JOIN public.model_generations mg ON cf.model_generation_id = mg.id
   JOIN public.car_models cm ON mg.car_model_id = cm.id
   JOIN public.car_brands cb ON cm.brand_id = cb.id
   WHERE cf.error_code IS NOT NULL
   ORDER BY cf.error_code, cb.name, cm.name;
   ```

2. **Fehlercodes pro Modell:**
   ```sql
   SELECT 
     cb.name as brand,
     cm.name as model,
     COUNT(DISTINCT cf.error_code) as error_code_count,
     COUNT(cf.id) as total_faults
   FROM public.car_faults cf
   JOIN public.model_generations mg ON cf.model_generation_id = mg.id
   JOIN public.car_models cm ON mg.car_model_id = cm.id
   JOIN public.car_brands cb ON cm.brand_id = cb.id
   WHERE cf.error_code IS NOT NULL
   GROUP BY cb.name, cm.name
   ORDER BY error_code_count DESC;
   ```

---

## 📝 Struktur der Fehlercodes:

Jeder Fehlercode enthält:
- **error_code**: OBD-II Code (z.B. P0300)
- **title**: Deutscher Titel mit Fehlercode
- **description**: Beschreibung des Problems
- **solution**: Schritt-für-Schritt-Lösung
- **severity**: Schweregrad (low, medium, high, critical)
- **difficulty_level**: Schwierigkeitsgrad (easy, medium, hard, expert)
- **affected_component**: Betroffenes Bauteil
- **estimated_repair_time**: Geschätzte Reparaturzeit

---

## 🔍 Fehlercode-Kategorien:

### Zündsystem (P0300-P0304):
- Zylinderfehlzündungen
- Zündkerzen, Zündspulen

### Kraftstoffsystem (P0171, P0172, P2187):
- Kraftstoffgemisch-Probleme
- Lambda-Sonden, Luftmassenmesser

### Abgasreinigung (P0420, P0135, P0441, P0442):
- Katalysator-Probleme
- Lambda-Sonden
- EVAP-System

### Motorsteuerung (P0015, P2015):
- Nockenwellenverstellung
- Drosselklappe

### Turbolader (P0299):
- Ladedruck-Probleme

### Kühlsystem (P0128):
- Thermostat-Probleme

### Abgasrückführung (P0401):
- EGR-Ventil-Probleme

---

## 📚 Nächste Schritte:

1. ✅ Seed-Daten ausführen
2. ✅ Website testen: http://localhost:3000/cars/bmw/3er/error-codes
3. ✅ Fehlercodes sollten jetzt sichtbar sein
4. ✅ Du kannst weitere Fehlercodes hinzufügen

---

## 🎯 Erweiterung:

Du kannst die Seed-Datei erweitern, um:
- Weitere Fehlercodes hinzuzufügen
- Weitere Modelle abzudecken
- Spezifische Marken-Codes (z.B. BMW-Codes, Mercedes-Codes)
- Detailliertere Lösungen mit Bildern/Links

---

## ⚠️ Wichtig:

1. **ON CONFLICT DO NOTHING**: Die Seed-Datei verwendet `ON CONFLICT DO NOTHING`, sodass du sie mehrfach ausführen kannst, ohne Duplikate zu erstellen.

2. **Verknüpfung**: Die Fehlercodes sind mit spezifischen Modellgenerationen verknüpft. Stelle sicher, dass die Generationen bereits existieren.

3. **Status**: Alle Fehlercodes haben `status = 'live'`, sodass sie sofort auf der Website sichtbar sind.

