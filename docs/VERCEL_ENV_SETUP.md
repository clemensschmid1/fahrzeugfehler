# Vercel Environment Variables Setup - Schritt für Schritt

## ✅ Was du bereits hast:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## ❌ Was noch fehlt:
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔍 ANON_KEY finden (Supabase Dashboard):

1. Gehe zu **Project Settings** → **API**
2. Suche nach **"Project API keys"** oder **"anon public"**
3. Du siehst zwei Keys:
   - **anon public** → Das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - **service_role** → Das hast du schon ✅

**Tipp:** Der "anon public" Key ist normalerweise länger und beginnt mit `eyJ...`

---

## 🚀 In Vercel setzen:

### Schritt 1: Vercel Dashboard öffnen
1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt (oder erstelle ein neues)

### Schritt 2: Environment Variables hinzufügen
1. Klicke auf **Settings** (oben rechts)
2. Klicke auf **Environment Variables** (links im Menü)
3. Füge diese 3 Variablen hinzu:

#### Variable 1:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [deine Supabase URL]
Environment: Production, Preview, Development (alle auswählen)
```

#### Variable 2:
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [dein anon public key aus Supabase]
Environment: Production, Preview, Development (alle auswählen)
```

#### Variable 3:
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [dein service_role key]
Environment: Production, Preview, Development (alle auswählen)
⚠️ WICHTIG: Dieser Key ist geheim! Niemals im Client-Code verwenden!
```

### Schritt 3: Optional - Google Verification
```
Name: NEXT_PUBLIC_GOOGLE_VERIFICATION
Value: [dein Google Verification Code]
Environment: Production, Preview, Development (alle auswählen)
```

### Schritt 4: Speichern
- Klicke auf **Save** für jede Variable
- Fertig! ✅

---

## ✅ Checkliste:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt
- [ ] `NEXT_PUBLIC_GOOGLE_VERIFICATION` gesetzt (optional)
- [ ] Alle Variablen für alle Environments aktiviert (Production, Preview, Development)

---

## 🎯 Nach dem Setzen:

1. **Redeploy** dein Projekt (falls es schon deployed ist)
   - Gehe zu **Deployments**
   - Klicke auf die 3 Punkte → **Redeploy**

2. **Oder** pushe einen neuen Commit:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

3. Vercel baut automatisch neu mit den neuen Environment Variables

---

## ⚠️ Wichtig:

- **NEXT_PUBLIC_*** Variablen sind im Client-Code sichtbar
- **SUPABASE_SERVICE_ROLE_KEY** ist NICHT als `NEXT_PUBLIC_*` gesetzt (korrekt!)
- Nach dem Setzen muss das Projekt neu deployed werden

