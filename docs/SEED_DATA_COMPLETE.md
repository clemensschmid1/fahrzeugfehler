# Vollständige Seed-Daten Übersicht

## 📋 Alle Seed-Dateien im Überblick:

### 1. Schema-Migration
**Datei:** `supabase_migrations/create_fahrzeugfehler_schema.sql`
- Erstellt alle Tabellen, Indizes, RLS Policies
- **MUSS ZUERST** ausgeführt werden

### 2. Basis Seed-Daten
**Datei:** `supabase_migrations/seed_top_brands_models.sql`
- 8 Top-Marken (BMW, Mercedes, Audi, VW, Opel, Porsche, Ford, Škoda)
- 15 Modelle
- 20+ Generationen

### 3. Erweiterte Seed-Daten
**Datei:** `supabase_migrations/seed_extended_brands_models.sql`
- 10 weitere Marken (Toyota, Honda, Nissan, Hyundai, Mazda, Volvo, Peugeot, Renault, SEAT, Fiat)
- 20+ weitere Modelle
- 15+ weitere Generationen

### 4. Umfassende Seed-Daten
**Datei:** `supabase_migrations/seed_comprehensive_brands_models.sql`
- 8 weitere Marken (Kia, Subaru, Mitsubishi, Suzuki, Citroën, Alfa Romeo, Mini, Smart)
- 15+ weitere Modelle
- 10+ weitere Generationen

### 5. Finale Seed-Daten
**Datei:** `supabase_migrations/seed_final_brands_models.sql`
- 7 weitere Marken (Dacia, Lada, Jeep, Land Rover, Jaguar, Lexus, Infiniti)
- 15+ weitere Modelle
- 10+ weitere Generationen

### 6. Basis Fehlercodes
**Datei:** `supabase_migrations/seed_error_codes.sql`
- 17+ Fehlercodes für Basis-Modelle

### 7. Erweiterte Fehlercodes
**Datei:** `supabase_migrations/seed_extended_error_codes.sql`
- 15+ weitere Fehlercodes für erweiterte Modelle

### 8. Umfassende Fehlercodes
**Datei:** `supabase_migrations/seed_comprehensive_error_codes.sql`
- 15+ weitere Fehlercodes für umfassende Modelle

### 9. Finale Fehlercodes
**Datei:** `supabase_migrations/seed_final_error_codes.sql`
- 15+ weitere Fehlercodes für finale Modelle

---

## 📊 Gesamt-Statistik (nach Ausführung aller Seeds):

### Automarken: **33 Marken**
- **Deutsche (8):** BMW, Mercedes-Benz, Audi, Volkswagen, Opel, Porsche, Ford, Smart
- **Japanische (8):** Toyota, Honda, Nissan, Mazda, Mitsubishi, Suzuki, Lexus, Infiniti
- **Koreanische (2):** Hyundai, Kia
- **Europäische (10):** Volvo, Peugeot, Renault, SEAT, Fiat, Citroën, Alfa Romeo, Škoda, Dacia, Lada
- **Britische (3):** Mini, Land Rover, Jaguar
- **Tschechische (1):** Škoda
- **Amerikanische (1):** Jeep

### Automodelle: **65+ Modelle**
- Von Kleinwagen bis SUV
- Beliebte Modelle in Deutschland und Europa

### Modellgenerationen: **65+ Generationen**
- Von 1998 bis heute
- Mit Generation-Codes (E46, W204, B8, etc.)

### Fehlercodes: **60+ Fehlercodes**
- Häufige OBD-II Codes (P0xxx)
- Für verschiedene Modelle und Generationen
- Kategorien: Zündsystem, Kraftstoffsystem, Abgasreinigung, Motorsteuerung, Kühlsystem, Drosselklappe

---

## 🚀 Ausführungsreihenfolge:

```sql
-- 1. Schema erstellen (MUSS ZUERST!)
create_fahrzeugfehler_schema.sql

-- 2. Fix: Fehlende Spalten hinzufügen (falls nötig)
fix_car_models_year_columns.sql

-- 3. Basis-Daten
seed_top_brands_models.sql
seed_error_codes.sql

-- 4. Erweiterte Daten
seed_extended_brands_models.sql
seed_extended_error_codes.sql

-- 5. Umfassende Daten
seed_comprehensive_brands_models.sql
seed_comprehensive_error_codes.sql

-- 6. Finale Daten
seed_final_brands_models.sql
seed_final_error_codes.sql
```

---

## ✅ Nach der Ausführung prüfen:

```sql
-- Marken zählen
SELECT COUNT(*) FROM public.car_brands;

-- Modelle zählen
SELECT COUNT(*) FROM public.car_models;

-- Generationen zählen
SELECT COUNT(*) FROM public.model_generations;

-- Fehlercodes zählen
SELECT COUNT(DISTINCT error_code) FROM public.car_faults WHERE error_code IS NOT NULL;

-- Fehlerlösungen zählen
SELECT COUNT(*) FROM public.car_faults WHERE status = 'live';
```

---

## 📝 Hinweise:

1. **ON CONFLICT**: Alle Seed-Dateien verwenden `ON CONFLICT DO UPDATE` oder `ON CONFLICT DO NOTHING`, sodass sie mehrfach ausgeführt werden können.

2. **Reihenfolge wichtig**: Die Schema-Migration muss zuerst ausgeführt werden, danach können die Seed-Dateien in beliebiger Reihenfolge ausgeführt werden.

3. **Idempotent**: Alle Seed-Dateien sind idempotent - sie können mehrfach ausgeführt werden, ohne Duplikate zu erstellen.

4. **Status**: Alle Fehlercodes haben `status = 'live'`, sodass sie sofort auf der Website sichtbar sind.

---

## 🎯 Nächste Schritte:

Nach der Ausführung aller Seed-Dateien hast du eine umfassende Datenbank mit:
- ✅ 33 Automarken
- ✅ 65+ Automodellen
- ✅ 65+ Modellgenerationen
- ✅ 60+ verschiedenen Fehlercodes
- ✅ 70+ Fehlerlösungen

Die Website ist jetzt bereit für den produktiven Einsatz! 🚀

