# 🚀 Quick Start - Was du jetzt machen musst

## ✅ Code ist fertig!

Alle Metadaten sind bereits auf `fahrzeugfehler.de` angepasst. Du musst **NICHTS** im Code ändern!

---

## 📋 Was du machen musst (in dieser Reihenfolge):

### 1️⃣ Supabase: ANON_KEY finden

**Du hast bereits:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Noch fehlt:**
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**So findest du den ANON_KEY:**
1. Gehe zu **Project Settings** → **API**
2. Suche nach **"Project API keys"** oder **"anon public"**
3. Kopiere den **"anon public"** Key
   - Das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Beginnt normalerweise mit `eyJ...`

### 2️⃣ Vercel: Environment Variables setzen

**Im Vercel Dashboard:**
1. Gehe zu deinem Projekt → **Settings** → **Environment Variables**
2. Füge diese 3 Variablen hinzu:

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [deine Supabase URL - die du bereits hast]
Environment: ✅ Production ✅ Preview ✅ Development
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [anon public key aus Supabase - den du gerade gefunden hast]
Environment: ✅ Production ✅ Preview ✅ Development
```

**Variable 3:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [service_role key - den du bereits hast]
Environment: ✅ Production ✅ Preview ✅ Development
⚠️ WICHTIG: Dieser Key ist geheim!
```

**Optional - Variable 4:**
```
Name: NEXT_PUBLIC_GOOGLE_VERIFICATION
Value: [dein Google Verification Code]
Environment: ✅ Production ✅ Preview ✅ Development
```

3. **WICHTIG:** Nach dem Setzen → **Redeploy** das Projekt!
   - Gehe zu **Deployments** → 3 Punkte → **Redeploy**

### 3️⃣ Vercel: Domain hinzufügen

1. **Settings** → **Domains**
2. Füge hinzu: `fahrzeugfehler.de`
3. Folge den DNS-Anweisungen

### 4️⃣ GitHub: Repository verbinden

1. **Settings** → **Git**
2. Repository verbinden
3. Fertig! Bei jedem `git push` wird automatisch deployed

---

## 🎯 Das war's!

Nach diesen 4 Schritten:
- ✅ Code ist fertig
- ✅ Supabase verbunden
- ✅ Vercel konfiguriert
- ✅ Domain eingerichtet
- ✅ Auto-Deployment aktiv

**Einfach `git push` und fertig!** 🚀

---

## 📚 Detaillierte Dokumentation

Für mehr Details siehe:
- `docs/SUPABASE_VERCEL_SETUP.md` - Ausführliche Anleitung
- `docs/DEPLOYMENT_CHECKLIST.md` - Vollständige Checkliste
- `docs/WAS_AUSTAUSCHEN.md` - Was genau ausgetauscht werden muss

