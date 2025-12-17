# SEO-Strategie für Fahrzeugfehler.de
## Google Trust Aufbau - Qualität über Quantität

### Ziel: < 1.000 indexierte Seiten

### Priorisierte Seitenstruktur:

1. **Hauptseiten (5-10 Seiten)**
   - `/` - Homepage
   - `/cars` - Marken-Übersicht
   - `/impressum` - Impressum
   - `/datenschutz` - Datenschutz
   - `/kontakt` - Kontakt

2. **Marken-Seiten (50-100 Seiten)**
   - `/cars/[brand]` - Nur für beliebte Marken mit >10 Fehlern
   - Qualitätskriterium: Mindestens 10 dokumentierte Fehlerlösungen

3. **Modell-Seiten (200-300 Seiten)**
   - `/cars/[brand]/[model]` - Nur für Modelle mit >5 Fehlern
   - Qualitätskriterium: Mindestens 5 dokumentierte Fehlerlösungen

4. **Generation-Seiten (300-400 Seiten)**
   - `/cars/[brand]/[model]/[generation]` - Nur für Generationen mit >3 Fehlern
   - Qualitätskriterium: Mindestens 3 dokumentierte Fehlerlösungen

5. **Fehlercode-Übersichten (100-150 Seiten)**
   - `/cars/[brand]/[model]/error-codes` - Nur für Modelle mit Fehlercodes
   - Qualitätskriterium: Mindestens 3 Fehlercodes dokumentiert

6. **Fehler-Detail-Seiten (200-300 Seiten)**
   - `/cars/[brand]/[model]/[generation]/faults/[slug]` - Nur für vollständige Fehlerlösungen
   - Qualitätskriterium: Vollständige Lösung mit Symptom, Ursachen, Risiken, Schritten

### Google Trust Signale (E-E-A-T):

1. **Experience (Erfahrung)**
   - Technische, präzise Beschreibungen
   - Praktische Lösungen aus der Praxis
   - Keine Marketing-Sprache

2. **Expertise (Expertise)**
   - Strukturierte, technische Inhalte
   - Fachbegriffe korrekt verwendet
   - Referenzen zu Komponenten und Systemen

3. **Authoritativeness (Autorität)**
   - Konsistente, hochwertige Inhalte
   - Klare Quellenangaben
   - Professionelle Präsentation

4. **Trustworthiness (Vertrauenswürdigkeit)**
   - Transparente Informationen
   - Aktuelle Inhalte (Datum der Erstellung)
   - Sicherheitshinweise bei komplexen Problemen

### Technische SEO-Optimierungen:

1. **Structured Data (Schema.org)**
   - Organization Schema auf allen Seiten
   - Website Schema mit SearchAction
   - HowTo Schema für Fehlerlösungen
   - BreadcrumbList für Navigation
   - Vehicle Schema für Fahrzeug-Informationen

2. **Meta-Tags**
   - Eindeutige Title-Tags (max. 60 Zeichen)
   - Beschreibende Meta-Descriptions (max. 160 Zeichen)
   - Open Graph Tags für Social Media
   - Twitter Cards

3. **Robots.txt**
   - Klare Anweisungen für Crawler
   - Nur qualitativ hochwertige Seiten indexieren
   - Alte/veraltete Routen blockieren

4. **Sitemap**
   - Nur Seiten mit Qualitätskriterien
   - Priorisierung wichtiger Seiten
   - Regelmäßige Updates

5. **Performance**
   - Schnelle Ladezeiten (< 2 Sekunden)
   - Optimierte Bilder
   - Caching-Strategien

### Content-Qualitätskriterien:

- **Minimale Seitenlänge**: 300 Wörter
- **Strukturierte Inhalte**: Klare Überschriften (H1-H6)
- **Technische Genauigkeit**: Korrekte Fachbegriffe
- **Aktualität**: Erstellungsdatum sichtbar
- **Vollständigkeit**: Alle relevanten Informationen vorhanden

### Seitenlimitierung-Strategie:

1. **Dynamische Generierung mit Qualitätsprüfung**
   - Nur Seiten generieren, die Qualitätskriterien erfüllen
   - `generateStaticParams` mit Filterung

2. **Robots Meta-Tag für Low-Quality Seiten**
   - Seiten ohne ausreichend Inhalt: `noindex, follow`
   - Nur vollständige Seiten: `index, follow`

3. **Sitemap-Filterung**
   - Nur Seiten in Sitemap, die indexiert werden sollen
   - Priorisierung nach Qualität

### Monitoring:

- Google Search Console
- Seitenindexierung überwachen
- Qualitätssignale tracken
- Performance-Metriken

