# Configuration de la Réception d'Emails avec Resend - OsteoUpgrade

## 📧 Objectif

Recevoir les emails envoyés à `admin@osteo-upgrade.fr` directement dans votre interface admin sur OsteoUpgrade, avec gestion complète (lecture, archivage, catégorisation, etc.).

---

## 🔧 Architecture

### Comment ça fonctionne ?

1. **Email entrant** → Un utilisateur envoie un email à `admin@osteo-upgrade.fr`
2. **Resend reçoit** → Resend intercepte l'email grâce à la configuration DNS
3. **Webhook déclenché** → Resend envoie les données de l'email à votre API via webhook
4. **Stockage** → Votre API enregistre l'email dans la base de données PostgreSQL
5. **Interface admin** → Vous consultez l'email dans `/admin/emails`

### Composants créés

✅ **Base de données** : Table `received_emails` (déjà créée)
✅ **API Webhook** : `/api/emails/inbound` - Reçoit les emails de Resend
✅ **API Liste** : `/api/emails/list` - Liste les emails pour l'admin
✅ **API Détails** : `/api/emails/[id]` - Affiche et met à jour un email
✅ **Interface Admin** : `/admin/emails` - Interface complète de gestion

---

## 📝 Configuration étape par étape

### Étape 1 : Vérifier que votre domaine est validé dans Resend

Votre domaine `osteo-upgrade.fr` doit être vérifié dans Resend (voir `RESEND_ADMIN_EMAIL_SETUP.md`).

**Vérifier :**
1. Allez sur https://resend.com/domains
2. Vérifiez que `osteo-upgrade.fr` a un statut **✅ Verified**

Si ce n'est pas le cas, suivez d'abord le guide `RESEND_ADMIN_EMAIL_SETUP.md`.

---

### Étape 2 : Activer la réception d'emails dans Resend

#### a) Accéder aux paramètres de réception

1. Connectez-vous à votre dashboard Resend : https://resend.com/inbound
2. Cliquez sur **"Inbound"** dans le menu de gauche
3. Cliquez sur **"Enable Inbound Emails"** si ce n'est pas déjà fait

#### b) Ajouter les enregistrements DNS MX

Resend va vous demander de configurer des enregistrements **MX** pour recevoir les emails.

**IMPORTANT :** Les enregistrements MX sont DIFFÉRENTS de ceux pour l'envoi d'emails.

**Exemple d'enregistrements MX à ajouter :**

| Type | Nom | Valeur | Priorité |
|------|-----|--------|----------|
| MX | `@` | `inbound.resend.com` | 10 |
| MX | `@` | `inbound2.resend.com` | 20 |

**Comment ajouter ces enregistrements :**

**Option A - OVH :**
1. Allez dans votre espace client OVH
2. Domaine → `osteo-upgrade.fr` → Zone DNS
3. **IMPORTANT** : Supprimez les anciens enregistrements MX si vous en avez (sinon les emails iront ailleurs)
4. Cliquez sur **"Ajouter une entrée"** → **MX**
5. Ajoutez chaque enregistrement avec sa priorité

**Option B - Cloudflare :**
1. Connectez-vous à Cloudflare
2. Sélectionnez votre domaine `osteo-upgrade.fr`
3. DNS → Records
4. **IMPORTANT** : Supprimez les anciens enregistrements MX
5. Cliquez sur **"Add record"** → Type: **MX**
6. Ajoutez chaque enregistrement

**⚠️ ATTENTION :**
- Les enregistrements MX dirigent TOUS les emails du domaine vers Resend
- Si vous avez déjà une boîte mail configurée (ex: `kevin@osteo-upgrade.fr`), elle ne fonctionnera plus
- Pour conserver vos autres emails, utilisez Cloudflare Email Routing (voir plus bas)

#### c) Vérifier le statut

1. Retournez sur https://resend.com/inbound
2. Attendez que le statut passe de **"Pending"** à **"Active"** (icône verte ✅)
3. Les changements DNS prennent généralement 10-30 minutes

---

### Étape 3 : Configurer le webhook Resend

#### a) Obtenir l'URL de votre webhook

Votre webhook est accessible à l'adresse :
```
https://votre-domaine.com/api/emails/inbound
```

**Production** : `https://osteoupgrade.com/api/emails/inbound`
**Staging** : `https://your-staging-url.vercel.app/api/emails/inbound`

#### b) Ajouter le webhook dans Resend

1. Allez sur https://resend.com/inbound
2. Cliquez sur **"Add Inbound Route"**
3. Configurez comme suit :

**Email Address Pattern :**
- Si vous voulez TOUS les emails du domaine : `*@osteo-upgrade.fr`
- Si vous voulez seulement `admin@` : `admin@osteo-upgrade.fr`
- Recommandé : `admin@osteo-upgrade.fr` pour limiter le volume

**Webhook URL :**
```
https://osteoupgrade.com/api/emails/inbound
```

**Enabled :** ✅ Coché

4. Cliquez sur **"Save"**

#### c) Tester le webhook (optionnel)

Resend fournit un bouton **"Send Test Email"** pour tester la configuration.

1. Cliquez sur **"Send Test Email"**
2. Vérifiez dans les logs Vercel que l'email a été reçu
3. Vérifiez dans `/admin/emails` que l'email apparaît

---

### Étape 4 : Configurer les variables d'environnement

Aucune nouvelle variable d'environnement n'est nécessaire ! Le système utilise déjà :

```bash
# API Key Resend (déjà configurée pour l'envoi)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URL du site (pour les liens dans les emails)
NEXT_PUBLIC_URL=https://osteoupgrade.com
```

---

## 🧪 Tester la configuration

### Test 1 : Envoyer un email de test

1. Utilisez votre email personnel (Gmail, Outlook, etc.)
2. Envoyez un email à : `admin@osteo-upgrade.fr`
3. Sujet : `Test de réception d'emails`
4. Corps : `Ceci est un test de configuration.`

### Test 2 : Vérifier la réception dans l'interface admin

1. Connectez-vous en tant qu'admin sur OsteoUpgrade
2. Allez sur `/admin`
3. Cliquez sur **"Emails Reçus"**
4. Votre email de test devrait apparaître dans la liste
5. Cliquez dessus pour voir le contenu complet

### Test 3 : Vérifier les logs

**Dans Resend :**
1. Allez sur https://resend.com/inbound
2. Cliquez sur **"Logs"**
3. Vous verrez tous les emails reçus et les webhooks envoyés

**Dans Vercel :**
1. Allez sur votre projet Vercel
2. Onglet **"Logs"**
3. Recherchez : `Received inbound email webhook`
4. Vous devriez voir les logs de votre API

---

## 🎨 Utilisation de l'interface `/admin/emails`

### Fonctionnalités disponibles

#### Sidebar - Filtres
- **Tous les emails** : Affiche tous les emails non archivés
- **Non lus** : Uniquement les emails non lus (avec badge bleu)
- **Parrainage** : Emails auto-catégorisés comme parrainage
- **Support** : Emails de support
- **Général** : Emails généraux
- **Spam** : Emails détectés comme spam

#### Liste d'emails
- **Badge catégorie** : Couleur selon la catégorie (jaune = parrainage, bleu = support, etc.)
- **Badge non lu** : Point bleu à gauche pour les emails non lus
- **Icône pièce jointe** : Si l'email a des pièces jointes
- **Date relative** : "Il y a 5 min", "Il y a 2h", etc.

#### Vue détaillée d'un email
- **Auto-marquer comme lu** : S'ouvre automatiquement comme lu
- **HTML + texte** : Affiche le contenu HTML ou texte brut
- **Actions :**
  - ✉️ Marquer comme lu/non lu
  - 📥 Archiver (retire de la liste)
  - 🗑️ Supprimer définitivement

#### Recherche
- Recherche dans : sujet, expéditeur, nom de l'expéditeur
- Tapez dans le champ de recherche et les résultats se filtrent automatiquement

---

## 🔒 Sécurité

### Accès admin uniquement

Toutes les routes sont protégées par vérification admin :
- L'utilisateur doit être connecté
- L'utilisateur doit avoir le rôle `admin` dans la table `profiles`
- Sinon, erreur `403 Forbidden`

### Row Level Security (RLS)

La table `received_emails` a des politiques RLS :
- **SELECT** : Seulement les admins peuvent lire
- **INSERT** : Seulement via la fonction Supabase Admin (webhook)
- **UPDATE** : Seulement les admins
- **DELETE** : Seulement les admins

### Validation des données

Le webhook valide :
- Présence des champs obligatoires (`from`, `to`, `subject`)
- Format des adresses email
- Taille des pièces jointes (limitée par Resend)

---

## 📊 Catégorisation automatique

Le système catégorise automatiquement les emails en fonction du contenu :

```typescript
// Règles de catégorisation
if (subject.includes('parrain') || subject.includes('référal') || subject.includes('commission')) {
  category = 'parrainage'
} else if (subject.includes('support') || subject.includes('aide') || subject.includes('problème')) {
  category = 'support'
} else if (sender.includes('spam') || subject.includes('viagra') || subject.includes('casino')) {
  category = 'spam'
} else {
  category = 'general'
}
```

**Vous pouvez modifier la catégorie manuellement** via l'API (à implémenter dans l'UI si besoin).

---

## ❓ Troubleshooting

### Problème : Emails non reçus dans l'interface admin

**Solutions possibles :**

1. **Vérifiez les enregistrements MX DNS**
   - Outil : https://mxtoolbox.com/SuperTool.aspx
   - Entrez : `osteo-upgrade.fr`
   - Vérifiez que les MX pointent vers `inbound.resend.com`

2. **Vérifiez le statut Inbound dans Resend**
   - https://resend.com/inbound
   - Doit être **Active** (vert)

3. **Vérifiez les logs du webhook Resend**
   - https://resend.com/inbound → Logs
   - Vérifiez qu'il n'y a pas d'erreur 500 ou 400

4. **Vérifiez les logs Vercel**
   - Recherchez : `Received inbound email webhook`
   - S'il n'y a rien, le webhook n'est pas appelé (problème de configuration Resend)
   - S'il y a une erreur, corrigez le code

5. **Testez l'URL du webhook manuellement**
   ```bash
   curl https://osteoupgrade.com/api/emails/inbound
   ```
   Devrait retourner un JSON avec `"status": "active"`

### Problème : Webhook rejeté (erreur 401/403)

**Cause :** Le webhook utilise `supabaseAdmin` qui n'a pas besoin d'authentification utilisateur.

**Solution :**
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien définie
- Vérifiez que le webhook n'utilise PAS `createRouteHandlerClient` (qui nécessite une session)

### Problème : Pièces jointes non affichées

**Explication :** Resend n'envoie PAS le contenu des pièces jointes dans le webhook, seulement les métadonnées (nom, taille, type).

**Solution future :**
- Utiliser l'API Resend pour télécharger les pièces jointes
- Les stocker dans Supabase Storage
- Ajouter un lien de téléchargement dans l'interface

### Problème : Les emails arrivent en spam

**Cause :** Le domaine expéditeur n'est pas le vôtre.

**Solution :**
- Ajoutez SPF, DKIM, DMARC à votre domaine (déjà fait pour l'envoi avec Resend)
- Ajoutez votre adresse admin en contact de confiance

---

## 🔄 Alternative : Cloudflare Email Routing

Si vous voulez conserver vos autres adresses email tout en recevant les emails admin, utilisez **Cloudflare Email Routing** :

### Configuration Cloudflare Email Routing

1. **Activer Email Routing**
   - Dashboard Cloudflare → Email → Email Routing
   - Cliquez sur **"Enable Email Routing"**

2. **Configurer les règles**
   - Règle 1 : `admin@osteo-upgrade.fr` → Webhook Resend
   - Règle 2 (Catch-all) : `*@osteo-upgrade.fr` → Votre email perso

3. **Avantages**
   - Vous conservez vos autres adresses email
   - Flexibilité totale sur le routage
   - Gratuit

---

## 📞 Support

**Documentation Resend :**
- Inbound Emails : https://resend.com/docs/dashboard/inbound-emails/introduction
- Webhooks : https://resend.com/docs/dashboard/webhooks/introduction
- API Reference : https://resend.com/docs/api-reference/inbound/get-inbound-email

**Logs et Debug :**
- Resend Dashboard : https://resend.com/inbound
- Vercel Logs : https://vercel.com/your-project/logs
- Webhook de test : https://osteoupgrade.com/api/emails/inbound

---

## 🎯 Récapitulatif

### ✅ Checklist de configuration

- [ ] Domaine `osteo-upgrade.fr` vérifié dans Resend
- [ ] Enregistrements MX ajoutés et vérifiés (10-30 min)
- [ ] Inbound Emails activé dans Resend (statut "Active")
- [ ] Webhook configuré dans Resend avec l'URL de production
- [ ] Test d'envoi d'email effectué
- [ ] Email visible dans `/admin/emails`
- [ ] Logs vérifiés (Resend + Vercel)

### 📋 Récapitulatif des URLs

| Ressource | URL |
|-----------|-----|
| Interface Admin Emails | `https://osteoupgrade.com/admin/emails` |
| Webhook Inbound | `https://osteoupgrade.com/api/emails/inbound` |
| API Liste Emails | `https://osteoupgrade.com/api/emails/list` |
| API Détails Email | `https://osteoupgrade.com/api/emails/[id]` |
| Resend Inbound Dashboard | `https://resend.com/inbound` |
| Test DNS MX | `https://mxtoolbox.com/SuperTool.aspx` |

---

**Version :** 1.0
**Dernière mise à jour :** Janvier 2026
**Auteur :** Claude Code
