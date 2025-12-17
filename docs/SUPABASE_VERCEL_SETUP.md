# Supabase & Vercel Setup - Was muss ausgetauscht werden?

## 🔧 Supabase Setup

### 1. Neue Tabelle erstellen
Du wirst eine neue Supabase-Tabelle für die neue Infrastruktur erstellen. Stelle sicher, dass:

- [ ] Tabelle erstellt ist
- [ ] RLS (Row Level Security) Policies gesetzt sind
- [ ] Indizes für Performance erstellt sind
- [ ] Foreign Keys korrekt gesetzt sind

### 2. Supabase Connection Strings

**WICHTIG: Diese Werte musst du aus deinem Supabase Dashboard kopieren!**

Im Supabase Dashboard (wie im Screenshot zu sehen):
1. Gehe zu **Project Settings** → **API**
2. Kopiere die folgenden Werte:

#### Für Vercel Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[dein-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dein-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dein-service-role-key]
```

**Wo findest du diese Werte?**
- **Project URL**: `https://[project-ref].supabase.co` → Das ist dein `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key**: Unter "Project API keys" → Das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key**: Unter "Project API keys" → Das ist dein `SUPABASE_SERVICE_ROLE_KEY` (⚠️ NIEMALS im Client-Code verwenden!)

### 3. Database Password

Falls du das Database Password zurücksetzen musst:
1. Gehe zu **Project Settings** → **Database**
2. Klicke auf **Reset database password**
3. Speichere das neue Passwort sicher (wird für direkte PostgreSQL-Verbindungen benötigt)

### 4. IPv4 Compatibility (Optional)

Falls du IPv4 benötigst (siehe Warnung im Screenshot):
- Du kannst den **IPv4 add-on** kaufen
- Oder den **Shared Pooler** verwenden (empfohlen für Vercel)

**Für Vercel empfehle ich den Shared Pooler:**
- Gehe zu **Project Settings** → **Database** → **Connection Pooling**
- Verwende den **Connection String** mit `pooler.supabase.co` statt `db.supabase.co`

## 🚀 Vercel Setup

### 1. Environment Variables in Vercel setzen

Gehe zu deinem Vercel Projekt → **Settings** → **Environment Variables**

#### Erforderliche Variablen:

```bash
# Supabase (ERFORDERLICH)
NEXT_PUBLIC_SUPABASE_URL=https://[dein-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dein-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dein-service-role-key]

# Google Verification (ERFORDERLICH für Google Search Console)
NEXT_PUBLIC_GOOGLE_VERIFICATION=[dein-google-verification-code]

# Optional: OpenAI (falls Content-Generierung verwendet wird)
OPENAI_API_KEY=[dein-openai-key]

# Optional: IndexNow (falls verwendet)
INDEXNOW_API_KEY=[dein-indexnow-key]
```

### 2. Domain konfigurieren

1. Gehe zu **Settings** → **Domains**
2. Füge `fahrzeugfehler.de` hinzu
3. Füge `www.fahrzeugfehler.de` hinzu (wird automatisch zu `fahrzeugfehler.de` weitergeleitet)
4. Folge den DNS-Anweisungen von Vercel

### 3. Build Settings prüfen

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (Standard)
- **Output Directory**: `.next` (Standard)
- **Install Command**: `npm install` (Standard)
- **Node.js Version**: 20.x (empfohlen)

### 4. Deployment

1. **GitHub Repository verbinden** (falls noch nicht geschehen)
2. **Automatic Deployments** aktivieren
3. Bei jedem Push zu `main` wird automatisch deployed

## 📋 Checkliste vor dem ersten Deployment

### Supabase:
- [ ] Neue Tabelle erstellt
- [ ] RLS Policies gesetzt
- [ ] Test-Daten eingefügt (optional)
- [ ] Connection Strings kopiert

### Vercel:
- [ ] Projekt erstellt
- [ ] GitHub Repository verbunden
- [ ] Environment Variables gesetzt
- [ ] Domain hinzugefügt
- [ ] DNS Records gesetzt

### Code:
- [ ] Alle Metadaten auf `fahrzeugfehler.de` angepasst
- [ ] robots.txt aktualisiert
- [ ] Structured Data implementiert
- [ ] SEO-Optimierungen abgeschlossen

## 🔍 Nach dem ersten Deployment prüfen

1. **Website erreichbar**: https://fahrzeugfehler.de
2. **robots.txt**: https://fahrzeugfehler.de/robots.txt
3. **Sitemap**: https://fahrzeugfehler.de/sitemap.xml
4. **Structured Data**: https://search.google.com/test/rich-results
5. **Google Search Console**: Sitemap einreichen

## ⚠️ Wichtige Hinweise

1. **SUPABASE_SERVICE_ROLE_KEY**: 
   - NIEMALS im Client-Code verwenden!
   - Nur für Server-Side API Routes
   - Hat volle Admin-Rechte

2. **Database Password**:
   - Wird für direkte PostgreSQL-Verbindungen benötigt
   - Nicht für Next.js App erforderlich (verwendet Supabase Client)

3. **Connection Pooling**:
   - Empfohlen für Vercel
   - Verwendet `pooler.supabase.co` statt `db.supabase.co`
   - Besser für Serverless-Umgebungen

4. **Environment Variables**:
   - Alle `NEXT_PUBLIC_*` Variablen sind im Client-Code sichtbar
   - Nur nicht-sensitive Daten dort speichern
   - Service Role Key NIE als `NEXT_PUBLIC_*` setzen!

