# 🔍 DIAGNOSTIC : Emails non reçus dans /admin/emails

## ❌ Problème
- Table `received_emails` est vide
- Aucun email n'apparaît dans `/admin/emails`
- Webhook Resend configuré mais emails non traités

---

## 📋 Checklist de diagnostic (À FAIRE DANS L'ORDRE)

### ✅ ÉTAPE 1 : Vérifier le déploiement Vercel

**1.1 - Vérifier que le code est déployé**

1. Va sur **https://vercel.com/ton-projet/deployments**
2. Vérifie que le dernier déploiement correspond au commit :
   - Commit : `fix: Add Svix signature verification for Resend webhook`
   - Hash : `4abbede`
3. Le déploiement doit être en statut **"Ready"** (vert)

**Si le déploiement n'est pas encore terminé** → Attends qu'il se termine avant de continuer

---

**1.2 - Vérifier la variable d'environnement `RESEND_WEBHOOK_SECRET`**

1. Va sur **https://vercel.com/ton-projet/settings/environment-variables**
2. Cherche la variable **`RESEND_WEBHOOK_SECRET`**
3. **Si elle n'existe PAS** → C'est le problème principal !

**Comment récupérer le Signing Secret dans Resend :**

1. Va sur **https://resend.com/inbound**
2. Clique sur ton Inbound Route (celui pour `admin@osteo-upgrade.fr`)
3. Cherche :
   - Section "Signing Secret"
   - OU section "Webhook" → "Secret"
   - OU onglet "Settings"
4. Copie la valeur (format : `whsec_xxxxxxxxxxxxxx`)

**Ajouter dans Vercel :**
- Key : `RESEND_WEBHOOK_SECRET`
- Value : `whsec_xxxxxxxxxxxxxx`
- Environments : ✅ Production, ✅ Preview, ✅ Development

**IMPORTANT :** Après avoir ajouté la variable, il faut **redéployer** :
```bash
# Option 1 : Via dashboard Vercel
# Deployments → Latest → Menu (•••) → Redeploy

# Option 2 : Force push
git commit --allow-empty -m "chore: Redeploy after adding RESEND_WEBHOOK_SECRET"
git push
```

---

### ✅ ÉTAPE 2 : Vérifier la configuration Resend

**2.1 - Vérifier l'Inbound Route**

1. Va sur **https://resend.com/inbound**
2. Vérifie qu'il existe un Inbound Route avec :
   - **Destination Email :** `admin@osteo-upgrade.fr`
   - **Webhook URL :** `https://osteo-upgrade.fr/api/emails/inbound`
   - **Status :** Enabled (actif)

**2.2 - Vérifier les logs du webhook dans Resend**

1. Sur la page de l'Inbound Route, cherche l'onglet **"Deliveries"** ou **"Events"**
2. Vérifie les derniers événements :
   - **Si HTTP 200** → Le webhook fonctionne, le problème est ailleurs (passer à l'étape 3)
   - **Si HTTP 307** → Le webhook redirige encore (vérifier que le code déployé est à jour)
   - **Si HTTP 400** → Headers Svix manquants (vérifier configuration Resend)
   - **Si HTTP 401** → Signature invalide (vérifier que `RESEND_WEBHOOK_SECRET` correspond)
   - **Si aucun événement** → Aucun email n'a été envoyé (passer à l'étape 2.3)

**2.3 - Envoyer un email de test**

Option A : Depuis ta boîte email personnelle
```
À : admin@osteo-upgrade.fr
Sujet : Test webhook inbound
Corps : Ceci est un test pour vérifier la réception d'emails
```

Option B : Depuis Resend (si disponible)
1. Va sur https://resend.com/emails
2. Clique sur "Send Test Email" (si disponible)
3. Destination : `admin@osteo-upgrade.fr`

**⏱ ATTENDS 30-60 secondes puis vérifie à nouveau les logs Resend**

---

### ✅ ÉTAPE 3 : Vérifier les logs Vercel

**3.1 - Accéder aux logs en temps réel**

1. Va sur **https://vercel.com/ton-projet/logs**
2. Filtre par :
   - **Path :** `/api/emails/inbound`
   - **Status :** Tous (ou 200, 400, 401)
   - **Time range :** Last 1 hour

**3.2 - Logs attendus si tout fonctionne**

Si un email est reçu, tu devrais voir dans les logs :
```
⚠️ RESEND_WEBHOOK_SECRET not configured - skipping signature verification
OU
✅ Webhook signature verified

📧 Received inbound email webhook from Resend:
  from: test@example.com
  to: admin@osteo-upgrade.fr
  subject: Test webhook inbound

✅ Email stored successfully: { id: '...', from: '...', subject: '...' }
```

**3.3 - Logs d'erreur possibles**

**Si tu vois :**
```
❌ Missing Svix headers for webhook verification
```
→ Resend n'envoie pas les headers Svix → Vérifier configuration Resend

**Si tu vois :**
```
❌ Webhook signature verification failed
```
→ Le `RESEND_WEBHOOK_SECRET` est incorrect → Vérifier la valeur dans Vercel

**Si tu vois :**
```
❌ Error inserting email into database
```
→ Problème de permissions Supabase → Passer à l'étape 4

**Si tu ne vois AUCUN log :**
→ Le webhook n'est PAS appelé → Vérifier configuration Resend (étape 2)

---

### ✅ ÉTAPE 4 : Vérifier les permissions Supabase

**4.1 - Vérifier que la table existe**

Va sur **Supabase SQL Editor** et exécute :
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'received_emails';
```

**Résultat attendu :** 1 ligne avec `received_emails`

**Si aucune ligne :** La table n'existe pas → Exécuter le SQL de création :
```sql
-- Voir fichier : supabase/migrations/received_emails.sql
```

**4.2 - Vérifier les RLS policies**

```sql
SELECT * FROM pg_policies
WHERE tablename = 'received_emails';
```

**Résultat attendu :** Au moins 1 policy (normalement 2-3)

**Si aucune policy :** Exécuter le SQL des policies :
```sql
-- Policies pour received_emails
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Policy pour le service role (bypass RLS)
CREATE POLICY "Service role can do anything" ON public.received_emails
  FOR ALL USING (true);

-- Policy admin pour lire
CREATE POLICY "Admins can read all emails" ON public.received_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy admin pour update
CREATE POLICY "Admins can update emails" ON public.received_emails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**4.3 - Tester l'insertion manuelle**

Pour vérifier que les permissions fonctionnent, essaie d'insérer un email de test :
```sql
INSERT INTO public.received_emails (
  from_email,
  from_name,
  to_email,
  subject,
  text_content,
  category,
  is_read,
  is_archived,
  received_at
) VALUES (
  'test@example.com',
  'Test User',
  'admin@osteo-upgrade.fr',
  'Test manuel insertion',
  'Ceci est un test pour vérifier que l''insertion fonctionne',
  'general',
  false,
  false,
  NOW()
);
```

**Puis vérifie :**
```sql
SELECT * FROM public.received_emails ORDER BY received_at DESC LIMIT 1;
```

**Si l'insertion fonctionne :** Le problème vient du webhook
**Si l'insertion échoue :** Problème de permissions → Vérifier les policies

---

### ✅ ÉTAPE 5 : Tester le webhook directement (DEBUG AVANCÉ)

**5.1 - Créer un payload de test**

Créer un fichier `test_webhook_payload.json` :
```json
{
  "from": "test@example.com",
  "to": "admin@osteo-upgrade.fr",
  "subject": "Test direct webhook",
  "text": "Ceci est un test pour vérifier le webhook",
  "html": "<p>Ceci est un test pour vérifier le webhook</p>",
  "message_id": "test-message-id-12345",
  "email_id": "test-email-id-67890"
}
```

**5.2 - Tester avec curl (SANS signature)**

Si `RESEND_WEBHOOK_SECRET` n'est pas encore configuré, le webhook devrait accepter les requêtes :
```bash
curl -X POST https://osteo-upgrade.fr/api/emails/inbound \
  -H "Content-Type: application/json" \
  -d @test_webhook_payload.json
```

**Résultat attendu :**
```json
{
  "success": true,
  "emailId": "uuid-de-l-email",
  "category": "general"
}
```

**Si erreur 400/401/500 :** Voir le message d'erreur et corriger

**5.3 - Vérifier dans la base de données**

```sql
SELECT * FROM public.received_emails
WHERE subject = 'Test direct webhook'
ORDER BY received_at DESC
LIMIT 1;
```

**Si l'email apparaît :** Le webhook fonctionne ! Le problème vient de Resend
**Si l'email n'apparaît pas :** Le webhook a un problème → Vérifier logs Vercel

---

## 🎯 Arbre de décision rapide

```
Email envoyé à admin@osteo-upgrade.fr
    │
    ├─ Apparaît dans Resend "Deliveries" ?
    │   │
    │   ├─ NON → Email pas reçu par Resend
    │   │         → Vérifier DNS MX records
    │   │         → Vérifier configuration domaine dans Resend
    │   │
    │   └─ OUI → Webhook appelé ?
    │       │
    │       ├─ NON (pas de log Vercel) → Webhook URL incorrecte
    │       │                           → Vérifier URL dans Resend
    │       │
    │       └─ OUI → HTTP 200 ?
    │           │
    │           ├─ NON (307) → Code pas déployé ou URL incorrecte
    │           ├─ NON (400) → Headers Svix manquants
    │           ├─ NON (401) → Signing secret incorrect
    │           │
    │           └─ OUI (200) → Email dans DB ?
    │               │
    │               ├─ NON → Erreur insertion (voir logs Vercel)
    │               │        → Vérifier policies Supabase
    │               │
    │               └─ OUI → Email visible dans /admin/emails ?
    │                   │
    │                   ├─ NON → Problème UI ou API list
    │                   │        → Vérifier /api/emails/list
    │                   │
    │                   └─ OUI → ✅ TOUT FONCTIONNE !
```

---

## 🆘 Solutions rapides selon le cas

### CAS 1 : `RESEND_WEBHOOK_SECRET` pas configuré
→ **Solution :** Ajouter la variable dans Vercel + redéployer

### CAS 2 : Webhook retourne toujours 307
→ **Solution :** Vérifier que le dernier déploiement est actif

### CAS 3 : Webhook retourne 401 "Invalid signature"
→ **Solution :** Vérifier que le secret dans Vercel correspond à celui de Resend

### CAS 4 : Webhook retourne 200 mais email pas en DB
→ **Solution :** Vérifier logs Vercel pour erreur insertion + vérifier policies Supabase

### CAS 5 : Email en DB mais pas visible dans /admin/emails
→ **Solution :** Vérifier l'API `/api/emails/list` et les policies RLS

### CAS 6 : Aucun log dans Vercel
→ **Solution :** Le webhook n'est pas appelé → Vérifier URL dans Resend

---

## 📝 Rapport de diagnostic

**Remplis ce rapport au fur et à mesure de tes vérifications :**

- [ ] Déploiement Vercel terminé et actif (commit `4abbede`)
- [ ] Variable `RESEND_WEBHOOK_SECRET` configurée dans Vercel
- [ ] Inbound Route existe dans Resend avec URL correcte
- [ ] Email de test envoyé à `admin@osteo-upgrade.fr`
- [ ] Email apparaît dans Resend "Deliveries"
- [ ] Webhook appelé (visible dans logs Vercel)
- [ ] Webhook retourne HTTP 200
- [ ] Email inséré dans table `received_emails`
- [ ] Email visible dans `/admin/emails`

**Si toutes les cases sont cochées → Le système fonctionne ! 🎉**

**Si une case n'est pas cochée → C'est là que se trouve le problème !**

---

## 🔧 QUICK FIX selon le problème identifié

Je vais te créer un script de test automatique dans la prochaine étape pour faciliter le diagnostic.
