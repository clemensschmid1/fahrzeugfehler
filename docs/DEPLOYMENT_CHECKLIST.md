# Deployment-Checkliste für Fahrzeugfehler.de

## ✅ Vor dem Deployment

### 1. SEO-Checkliste
- [x] robots.txt aktualisiert (fahrzeugfehler.de)
- [x] Structured Data implementiert (Organization, Website, Breadcrumbs)
- [x] Meta-Tags optimiert (Title, Description, Keywords, OG, Twitter)
- [x] Canonical URLs gesetzt
- [x] Google Verification Code vorhanden
- [x] Bing Verification Code vorhanden
- [ ] Sitemap generiert und geprüft (< 1.000 Seiten)
- [ ] Alle Seiten haben unique Title-Tags
- [ ] Alle Seiten haben Meta-Descriptions

### 2. Environment Variables (Vercel)
**WICHTIG: Diese müssen in Vercel gesetzt werden!**

#### Supabase (ERFORDERLICH)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (für Admin-APIs)
```

#### Google Services (ERFORDERLICH)
```
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
```

#### Tracking & Analytics (OPTIONAL)
```
- Google Analytics: G-HQBPXZ8LHX (bereits im Code)
- Google Ads: AW-17794505631 (bereits im Code)
- Bing Clarity: sigphxs9mi (bereits im Code)
- Matomo: fahrzeugfehler.matomo.cloud (bereits im Code)
- Plausible: infoneva.com (bereits im Code)
- ContentSquare: 469e33c68e5d9 (bereits im Code)
```

#### OpenAI (Falls benötigt für Content-Generierung)
```
OPENAI_API_KEY=your-openai-key
```

#### IndexNow (OPTIONAL)
```
INDEXNOW_API_KEY=your-indexnow-key
```

### 3. Supabase Setup
- [ ] Neue Tabelle erstellt (für neue Infrastruktur)
- [ ] Alte Tabellen migriert (falls nötig)
- [ ] RLS (Row Level Security) Policies gesetzt
- [ ] Indizes für Performance erstellt
- [ ] Foreign Keys und Constraints geprüft
- [ ] Test-Daten eingefügt (falls nötig)

### 4. Domain & DNS
- [ ] Domain fahrzeugfehler.de auf Vercel verifiziert
- [ ] DNS Records korrekt gesetzt
- [ ] SSL-Zertifikat aktiv (automatisch bei Vercel)
- [ ] www.fahrzeugfehler.de → fahrzeugfehler.de Redirect (optional)

### 5. Vercel Configuration
- [ ] Projekt in Vercel erstellt
- [ ] GitHub Repository verbunden
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next` (Standard)
- [ ] Node.js Version: 20.x (empfohlen)
- [ ] Framework Preset: Next.js

### 6. Performance Optimierungen
- [x] Image Optimization aktiviert
- [x] Caching Headers gesetzt
- [x] ISR (Incremental Static Regeneration) konfiguriert
- [ ] Bundle Size geprüft
- [ ] Lighthouse Score geprüft (Ziel: >90)

### 7. Sicherheit
- [x] API Routes geschützt (falls nötig)
- [x] Environment Variables nicht im Client-Code
- [ ] Rate Limiting aktiviert (falls nötig)
- [ ] CORS korrekt konfiguriert

### 8. Monitoring & Analytics
- [x] Google Analytics integriert
- [x] Vercel Analytics integriert
- [x] Speed Insights integriert
- [ ] Error Tracking (Sentry o.ä.) - optional
- [ ] Uptime Monitoring - optional

## 🚀 Deployment-Schritte

### Schritt 1: Supabase Setup
1. Neue Tabelle in Supabase erstellen
2. Migration Scripts ausführen
3. Test-Daten einfügen
4. RLS Policies testen

### Schritt 2: Vercel Setup
1. Projekt in Vercel erstellen
2. GitHub Repository verbinden
3. Environment Variables setzen
4. Build Settings prüfen
5. Domain hinzufügen

### Schritt 3: Erste Deployment
1. `git push` zu main branch
2. Vercel baut automatisch
3. Build-Logs prüfen
4. Deployment URL testen

### Schritt 4: Post-Deployment
1. Website auf fahrzeugfehler.de testen
2. Alle wichtigen Seiten durchgehen
3. SEO-Tags prüfen (View Source)
4. Structured Data prüfen (Google Rich Results Test)
5. robots.txt prüfen
6. Sitemap prüfen

### Schritt 5: Google Search Console
1. Property hinzufügen (fahrzeugfehler.de)
2. Sitemap einreichen: `https://fahrzeugfehler.de/sitemap.xml`
3. URL Inspection testen
4. Coverage Report prüfen

### Schritt 6: Bing Webmaster Tools
1. Property hinzufügen
2. Sitemap einreichen
3. IndexNow API Key setzen (falls verwendet)

## 🔍 Post-Deployment Checks

### Funktionale Tests
- [ ] Homepage lädt korrekt
- [ ] Marken-Übersicht funktioniert
- [ ] Marken-Detail-Seiten funktionieren
- [ ] Modell-Seiten funktionieren
- [ ] Generation-Seiten funktionieren
- [ ] Fehlercode-Seiten funktionieren
- [ ] Suche funktioniert
- [ ] Navigation funktioniert
- [ ] Dark Mode funktioniert
- [ ] Mobile Responsive

### SEO-Tests
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Schema Markup Validator: https://validator.schema.org/
- [ ] Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- [ ] PageSpeed Insights: https://pagespeed.web.dev/
- [ ] robots.txt Tester: https://www.google.com/webmasters/tools/robots-testing-tool

### Performance-Tests
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

## 📝 Wichtige URLs nach Deployment

- **Production**: https://fahrzeugfehler.de
- **Sitemap**: https://fahrzeugfehler.de/sitemap.xml
- **robots.txt**: https://fahrzeugfehler.de/robots.txt
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

## ⚠️ Häufige Probleme

### Problem: Build schlägt fehl
**Lösung**: 
- Environment Variables prüfen
- Node.js Version prüfen
- Build-Logs genau lesen

### Problem: Supabase Connection Error
**Lösung**:
- NEXT_PUBLIC_SUPABASE_URL prüfen
- NEXT_PUBLIC_SUPABASE_ANON_KEY prüfen
- Supabase Project Status prüfen

### Problem: SEO-Tags fehlen
**Lösung**:
- Metadata in page.tsx prüfen
- generateMetadata Funktion prüfen
- View Source im Browser prüfen

### Problem: Structured Data nicht erkannt
**Lösung**:
- JSON-LD Script prüfen
- Google Rich Results Test verwenden
- Schema.org Validator verwenden

## 🎯 Nächste Schritte nach erfolgreichem Deployment

1. **Content-Strategie**: Hochwertige Inhalte erstellen (< 1.000 Seiten)
2. **Link Building**: Backlinks aufbauen
3. **Social Media**: Website teilen
4. **Monitoring**: Google Search Console regelmäßig prüfen
5. **Optimierung**: Basierend auf Analytics Daten optimieren

