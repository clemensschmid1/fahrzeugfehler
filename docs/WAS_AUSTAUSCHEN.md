# 🔄 Was muss ausgetauscht werden? - Quick Reference

## ✅ Code ist bereits angepasst!

Alle wichtigen Metadaten und Domain-Referenzen sind bereits auf `fahrzeugfehler.de` angepasst:
- ✅ `src/app/layout.tsx` - fahrzeugfehler.de
- ✅ `src/app/page.tsx` - fahrzeugfehler.de  
- ✅ `src/components/Footer.tsx` - fahrzeugfehler.de
- ✅ `src/components/Header.tsx` - fahrzeugfehler.de
- ✅ `public/robots.txt` - fahrzeugfehler.de
- ✅ `next.config.ts` - fahrzeugfehler.de
- ✅ API Routes (IndexNow, etc.) - fahrzeugfehler.de
- ✅ Structured Data - fahrzeugfehler.de

**Hinweis:** Alte Referenzen in `/src/app/[lang]/` können ignoriert werden, da diese Routen nicht mehr verwendet werden.

---

## 🔧 Was du in Supabase machen musst:

### 1. Neue Tabelle erstellen
- [ ] Neue Tabelle für neue Infrastruktur erstellen
- [ ] RLS Policies setzen
- [ ] Indizes für Performance erstellen

### 2. Connection Strings kopieren

**Im Supabase Dashboard:**
1. Gehe zu **Project Settings** → **API**
2. Kopiere diese 3 Werte:

```
NEXT_PUBLIC_SUPABASE_URL=https://[dein-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dein-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dein-service-role-key]
```

**Wo findest du diese?**
- **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key = `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Geheim!

---

## 🚀 Was du in Vercel machen musst:

### 1. Environment Variables setzen

Gehe zu: **Vercel Projekt** → **Settings** → **Environment Variables**

Füge diese Variablen hinzu:

```bash
# Supabase (ERFORDERLICH)
NEXT_PUBLIC_SUPABASE_URL=https://[dein-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dein-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dein-service-role-key]

# Google Verification (ERFORDERLICH)
NEXT_PUBLIC_GOOGLE_VERIFICATION=[dein-google-code]

# Optional
OPENAI_API_KEY=[falls benötigt]
INDEXNOW_API_KEY=[falls verwendet]
```

### 2. Domain hinzufügen

1. **Settings** → **Domains**
2. Füge hinzu: `fahrzeugfehler.de`
3. Füge hinzu: `www.fahrzeugfehler.de` (wird automatisch weitergeleitet)
4. Folge den DNS-Anweisungen

### 3. GitHub Repository verbinden

1. **Settings** → **Git**
2. Repository verbinden
3. **Automatic Deployments** aktivieren

---

## 📋 Schritt-für-Schritt:

### Schritt 1: Supabase
1. ✅ Neue Tabelle erstellen
2. ✅ Connection Strings kopieren
3. ✅ Test-Daten einfügen (optional)

### Schritt 2: Vercel
1. ✅ Projekt erstellen
2. ✅ GitHub Repository verbinden
3. ✅ Environment Variables setzen (aus Schritt 1)
4. ✅ Domain hinzufügen
5. ✅ DNS Records setzen

### Schritt 3: Deployment
1. ✅ `git push` zu main branch
2. ✅ Vercel baut automatisch
3. ✅ Website testen: https://fahrzeugfehler.de

### Schritt 4: Post-Deployment
1. ✅ Google Search Console: Sitemap einreichen
2. ✅ Structured Data testen
3. ✅ robots.txt prüfen

---

## ⚠️ WICHTIGE HINWEISE:

1. **SUPABASE_SERVICE_ROLE_KEY**:
   - ⚠️ NIEMALS im Client-Code verwenden!
   - Nur für Server-Side API Routes
   - Hat volle Admin-Rechte

2. **Environment Variables**:
   - Alle `NEXT_PUBLIC_*` sind im Client sichtbar
   - Service Role Key NIE als `NEXT_PUBLIC_*` setzen!

3. **Connection Pooling** (empfohlen für Vercel):
   - Verwende `pooler.supabase.co` statt `db.supabase.co`
   - Besser für Serverless

---

## 🎯 Nichts im Code ändern!

**Der Code ist bereits fertig!** Du musst nur:
1. Supabase-Tabelle erstellen
2. Connection Strings in Vercel setzen
3. Domain konfigurieren
4. Deployen

**Das war's!** 🚀

