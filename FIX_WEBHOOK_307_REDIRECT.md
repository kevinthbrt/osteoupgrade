# 🔧 FIX : Webhook 307 Redirect - Signing Secret

## ❌ Problème

Le webhook Resend retourne **HTTP 307 - Temporary Redirect** au lieu de traiter les emails.

**Cause identifiée :** Le webhook ne vérifie pas la **signature Svix** envoyée par Resend, ce qui peut causer des problèmes de sécurité et des redirects.

---

## ✅ Solution Appliquée

### 1️⃣ Installation du package Svix

```bash
npm install svix
```

✅ **Fait** - Package installé

### 2️⃣ Modification du webhook pour vérifier la signature

Le fichier `/app/api/emails/inbound/route.ts` a été modifié pour :
- Extraire les headers Svix (`svix-id`, `svix-timestamp`, `svix-signature`)
- Vérifier la signature avec le Signing Secret
- Refuser les requêtes non signées si le secret est configuré

✅ **Fait** - Vérification ajoutée au code

---

## 🔑 Configuration du Signing Secret

### Étape 1 : Récupérer le Signing Secret dans Resend

1. Va sur **https://resend.com/inbound**
2. Clique sur ton **Inbound Route** existant
3. Cherche une section **"Signing Secret"** ou **"Webhook Secret"**
4. Copie la valeur qui ressemble à : `whsec_xxxxxxxxxxxxxxxxxxxxx`

> **Note :** Si tu ne vois pas de Signing Secret, cherche dans :
> - Settings → API Keys → Webhooks
> - Ou directement dans la configuration de l'Inbound Route

### Étape 2 : Ajouter la variable d'environnement dans Vercel

1. Va sur **https://vercel.com/ton-projet/settings/environment-variables**
2. Ajoute une nouvelle variable :
   - **Key:** `RESEND_WEBHOOK_SECRET`
   - **Value:** `whsec_xxxxxxxxxxxxxxxxxxxxx` (la valeur copiée)
   - **Environments:** Cocher **Production, Preview, Development**
3. Clique sur **Save**

### Étape 3 : Redéployer l'application

Après avoir ajouté la variable d'environnement :

```bash
git add .
git commit -m "fix: Add Svix signature verification for Resend webhook"
git push origin claude/add-referral-system-wfW1t
```

Vercel va automatiquement redéployer avec la nouvelle variable.

---

## 🧪 Tester le Webhook

### Option 1 : Envoyer un email de test

1. Envoie un email à `admin@osteo-upgrade.fr`
2. Attends 10-30 secondes
3. Vérifie les logs Vercel : https://vercel.com/ton-projet/logs
4. Cherche : `✅ Webhook signature verified`

### Option 2 : Vérifier dans Resend Dashboard

1. Va sur https://resend.com/inbound
2. Clique sur ton Inbound Route
3. Cherche l'onglet **"Deliveries"** ou **"Webhook Logs"**
4. Le dernier événement devrait montrer **HTTP 200** au lieu de 307

### Option 3 : Vérifier dans la base de données

```sql
SELECT
  id,
  from_email,
  subject,
  received_at,
  category
FROM public.received_emails
ORDER BY received_at DESC
LIMIT 5;
```

Si l'email apparaît dans la table, le webhook fonctionne ! ✅

---

## 🔍 Logs à surveiller

### ✅ Logs de succès attendus

```
✅ Webhook signature verified
📧 Received inbound email webhook from Resend
✅ Email stored successfully: { id: '...', from: '...', subject: '...' }
```

### ❌ Logs d'erreur possibles

**Si signature invalide :**
```
❌ Webhook signature verification failed: signature verification failed
```
→ **Solution :** Vérifie que le `RESEND_WEBHOOK_SECRET` est correct

**Si headers Svix manquants :**
```
❌ Missing Svix headers for webhook verification
```
→ **Solution :** Vérifie que Resend envoie bien les headers Svix (devrait être automatique)

**Si secret non configuré :**
```
⚠️ RESEND_WEBHOOK_SECRET not configured - skipping signature verification
```
→ **Solution :** Ajoute la variable d'environnement dans Vercel (Étape 2)

---

## 📋 Checklist de vérification

- [x] Package `svix` installé
- [x] Webhook modifié pour vérifier la signature
- [ ] `RESEND_WEBHOOK_SECRET` ajouté dans Vercel
- [ ] Application redéployée
- [ ] Email de test envoyé
- [ ] Webhook retourne HTTP 200 dans Resend
- [ ] Email apparaît dans `/admin/emails`

---

## 🆘 Si ça ne fonctionne toujours pas

### Problème 1 : Toujours 307 après avoir ajouté le secret

**Cause possible :** Vercel n'a pas redéployé avec la nouvelle variable

**Solution :**
1. Va sur Vercel → Deployments
2. Clique sur le dernier déploiement
3. Clique sur **"Redeploy"**
4. OU force un redéploiement en faisant un push vide :
```bash
git commit --allow-empty -m "chore: Force redeploy for webhook fix"
git push
```

### Problème 2 : Erreur 401 "Invalid webhook signature"

**Cause possible :** Le Signing Secret est incorrect ou a changé

**Solution :**
1. Retourne sur Resend Dashboard
2. Régénère le Signing Secret si possible
3. Mets à jour `RESEND_WEBHOOK_SECRET` dans Vercel
4. Redéploie

### Problème 3 : HTTP 200 dans Resend mais pas d'email dans la DB

**Cause possible :** Problème de permissions RLS Supabase

**Solution :**
1. Va sur Supabase SQL Editor
2. Exécute le script `QUICK_FIX_TEST_CATEGORIES_AND_DEBUG.sql` section 3 (RLS Policies)
3. Vérifie que les policies existent :
```sql
SELECT * FROM pg_policies WHERE tablename = 'received_emails';
```

---

## 🎯 Résumé rapide

**Le problème du 307 redirect vient probablement de l'absence de vérification de la signature Svix.**

**Solution en 3 étapes :**
1. ✅ Code modifié (déjà fait)
2. Ajouter `RESEND_WEBHOOK_SECRET` dans Vercel
3. Redéployer l'application

**Une fois fait, le webhook devrait retourner HTTP 200 et les emails apparaîtront dans `/admin/emails` !**

---

## 📚 Documentation Resend

- Inbound Emails : https://resend.com/docs/dashboard/inbound-emails
- Webhook Security : https://resend.com/docs/dashboard/webhooks/introduction
- Svix Documentation : https://docs.svix.com/receiving/verifying-payloads/how
