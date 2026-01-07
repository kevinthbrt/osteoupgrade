# 🔍 DEBUG : Emails Reçus Non Affichés

## Diagnostic du problème

Vous avez envoyé un email à `admin@osteo-upgrade.fr`, il apparaît dans Resend Receiving, mais PAS dans `/admin/emails`.

**Cause probable :** Le webhook Resend n'est pas configuré ou n'appelle pas votre API.

---

## ✅ Étape 1 : Vérifier la table `received_emails`

Dans Supabase SQL Editor, exécutez :

```sql
-- Voir tous les emails reçus
SELECT id, from_email, subject, received_at, category, is_read
FROM public.received_emails
ORDER BY received_at DESC
LIMIT 10;

-- Compter les emails
SELECT COUNT(*) as total FROM public.received_emails;
```

**Résultat attendu :**
- Si la table est **VIDE** → Le webhook n'envoie pas les emails à votre API
- Si la table **contient des emails** → Problème d'affichage frontend

---

## ✅ Étape 2 : Vérifier le webhook Resend

### A) Accéder à la configuration

1. Va sur https://resend.com/inbound
2. Tu devrais voir ton email de test dans la liste
3. Cherche une section **"Inbound Routes"** ou **"Webhook"**

### B) Vérifier si le webhook est configuré

**Tu dois avoir :**
```
Email Address Pattern: admin@osteo-upgrade.fr
Forward to: Webhook
Webhook URL: https://osteoupgrade.com/api/emails/inbound
Status: Active ✅
```

**Si ce n'est PAS le cas, configure-le :**

1. Clique sur **"Add Inbound Route"** (ou "Add Rule")
2. Remplis :
   - **Match**: `admin@osteo-upgrade.fr` (ou `*@osteo-upgrade.fr` pour tous les emails)
   - **Forward to**: `Webhook`
   - **URL**: `https://osteoupgrade.com/api/emails/inbound`
3. Clique sur **"Save"**

---

## ✅ Étape 3 : Tester le webhook manuellement

### A) Voir les logs Resend

Dans Resend Dashboard :
1. Va sur https://resend.com/inbound
2. Clique sur ton email de test
3. Cherche un onglet **"Webhooks"** ou **"Deliveries"**
4. Regarde s'il y a des erreurs (400, 500, etc.)

### B) Tester l'URL directement

Dans ton terminal local ou dans Postman :

```bash
curl https://osteoupgrade.com/api/emails/inbound
```

**Résultat attendu :**
```json
{
  "webhook": "Resend Inbound Email Webhook",
  "status": "active",
  "instructions": "Configure this webhook URL in your Resend dashboard...",
  "url": "https://osteoupgrade.com/api/emails/inbound"
}
```

Si tu obtiens une **erreur 404** → Le déploiement n'a pas pris en compte le fichier `/app/api/emails/inbound/route.ts`

---

## ✅ Étape 4 : Vérifier les logs Vercel

1. Va sur https://vercel.com/ton-projet/logs
2. Recherche : `Received inbound email webhook`
3. Si tu vois des logs :
   - **Sans erreur** → L'email devrait être dans la DB
   - **Avec erreur** → Note l'erreur et envoie-la moi

**Si tu ne vois AUCUN log** → Le webhook Resend n'appelle pas ton API (retourne à l'Étape 2)

---

## ✅ Étape 5 : Envoyer un nouvel email de test

Une fois le webhook configuré :

1. Envoie un **NOUVEAU** email à `admin@osteo-upgrade.fr`
2. Attends 10-30 secondes
3. Va sur `/admin/emails` et rafraîchis la page
4. L'email devrait apparaître !

---

## 🔧 Solutions selon le diagnostic

### Problème 1 : Webhook non configuré
→ **Solution :** Configure-le dans Resend (Étape 2)

### Problème 2 : Erreur 404 sur /api/emails/inbound
→ **Solution :** Redéploie sur Vercel ou vérifie que le fichier existe

### Problème 3 : Erreur 500 dans les logs
→ **Solution :** Vérifie les variables `SUPABASE_SERVICE_ROLE_KEY` dans Vercel

### Problème 4 : Table vide mais webhook OK
→ **Solution :** Problème d'insertion, envoie-moi les logs d'erreur Vercel

### Problème 5 : Table pleine mais rien à l'écran
→ **Solution :** Problème frontend, vérifie les permissions RLS :

```sql
-- Vérifier les RLS policies
SELECT * FROM pg_policies WHERE tablename = 'received_emails';

-- Si manquantes, exécute :
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view received emails"
ON public.received_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 📸 Captures d'écran utiles

Envoie-moi si possible :
1. Screenshot de Resend Inbound Routes
2. Screenshot des logs Vercel (si erreur)
3. Résultat de la requête SQL `SELECT COUNT(*) FROM received_emails`

---

## 🆘 Commandes de debug rapides

```sql
-- Voir le contenu de received_emails
SELECT * FROM public.received_emails ORDER BY received_at DESC LIMIT 5;

-- Vérifier les policies RLS
SELECT * FROM pg_policies WHERE tablename = 'received_emails';

-- Tester manuellement une insertion (pour vérifier les permissions)
INSERT INTO public.received_emails (from_email, to_email, subject, text_content)
VALUES ('test@example.com', 'admin@osteo-upgrade.fr', 'Test manuel', 'Ceci est un test');
```

---

**Commence par l'Étape 1 et dis-moi ce que tu trouves !** 🚀
