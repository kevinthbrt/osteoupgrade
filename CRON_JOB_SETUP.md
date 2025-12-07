# 🔄 Configuration d'un Cron Job Gratuit

Guide complet pour configurer un service de cron job externe **GRATUIT** pour vos automatisations d'emails.

---

## 📋 Prérequis

- Votre application doit être déployée (Vercel, Netlify, etc.)
- Vous devez avoir l'URL de votre application (ex: `https://osteoupgrade.vercel.app`)

---

## 🔒 Étape 1 : Sécuriser votre endpoint

### 1.1 Générer un secret aléatoire

Utilisez une de ces méthodes :

**Option A : Via terminal**
```bash
openssl rand -hex 32
```

**Option B : Via Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C : Manuellement**
Créez une chaîne aléatoire longue (ex: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 1.2 Ajouter la variable d'environnement

**Sur Vercel :**
1. Allez dans votre projet > Settings > Environment Variables
2. Ajoutez une nouvelle variable :
   - **Name:** `CRON_SECRET`
   - **Value:** Votre secret généré (ex: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
   - **Environment:** Production, Preview, Development (cochez les 3)
3. Cliquez sur "Save"
4. **Important** : Redéployez votre application pour que la variable soit prise en compte

**Sur Netlify :**
1. Site Settings > Environment Variables
2. Ajoutez `CRON_SECRET` avec votre secret
3. Redéployez

**Localement (.env.local) :**
```env
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

⚠️ **IMPORTANT** : Notez bien votre secret, vous en aurez besoin pour le cron job !

---

## 🌐 Étape 2 : Choisir un service de cron job gratuit

Je recommande **cron-job.org** (le meilleur gratuit) :

### Comparaison des services :

| Service | Gratuit | Fréquence min | Limite |
|---------|---------|---------------|--------|
| **cron-job.org** | ✅ Oui | 1 minute | 50 jobs |
| EasyCron | ✅ Oui (limité) | 1 heure | 1 job |
| Uptime Robot | ✅ Oui | 5 minutes | 50 monitors |

👉 **On va utiliser cron-job.org**

---

## 🚀 Étape 3 : Configuration sur cron-job.org

### 3.1 Créer un compte

1. Allez sur **https://cron-job.org**
2. Cliquez sur "Sign up" (en haut à droite)
3. Remplissez le formulaire :
   - Email
   - Mot de passe
   - Acceptez les conditions
4. Vérifiez votre email et activez votre compte

### 3.2 Créer votre premier cron job

1. Une fois connecté, cliquez sur **"Create cronjob"**

2. **Remplissez le formulaire** :

   **📝 Title (Titre)**
   ```
   OsteoUpgrade - Email Automations
   ```

   **🌐 URL**
   ```
   https://VOTRE-DOMAINE.vercel.app/api/automations/process
   ```
   ⚠️ Remplacez `VOTRE-DOMAINE` par votre vrai domaine !

   **⏰ Schedule (Planification)**
   - Sélectionnez : **"Every 5 minutes"**
   - Ou si vous voulez plus de contrôle : Custom
     - Minutes : `*/5` (toutes les 5 minutes)
     - Hours : `*` (toutes les heures)
     - Days : `*` (tous les jours)
     - Months : `*` (tous les mois)
     - Weekdays : `*` (tous les jours de la semaine)

   **🔧 Advanced Settings (Cliquez pour développer)**

   - **Request method** : Sélectionnez `POST`

   - **Custom HTTP headers** : Activez et ajoutez
     ```
     Authorization: Bearer VOTRE_CRON_SECRET
     ```
     ⚠️ Remplacez `VOTRE_CRON_SECRET` par le secret que vous avez généré à l'étape 1 !

   - **Request timeout** : 30 seconds (par défaut, OK)

   - **Notifications** :
     - ✅ Cochez "Notify me on failed executions"
     - Email : Votre email

3. Cliquez sur **"Create cronjob"**

---

## ✅ Étape 4 : Vérifier que ça fonctionne

### 4.1 Test manuel immédiat

1. Dans la liste de vos cron jobs, trouvez celui que vous venez de créer
2. Cliquez sur le bouton ▶️ **"Run now"** (Exécuter maintenant)
3. Attendez quelques secondes

### 4.2 Vérifier les logs

**Sur cron-job.org :**
- Cliquez sur votre job
- Regardez la section "History" ou "Execution history"
- Vous devriez voir une ligne verte ✅ avec Status Code 200

**Sur Vercel :**
1. Allez dans votre projet Vercel
2. Onglet "Logs"
3. Cherchez les logs contenant :
   ```
   🚀 Starting automation processor...
   Found X active automation(s)
   ✅ Automation processing complete
   ```

### 4.3 Vérifier dans votre dashboard

1. Allez sur votre site : `https://votre-domaine.com/admin/automations`
2. Cliquez sur le bouton "Traiter maintenant"
3. Vous devriez voir une alerte avec les résultats

---

## 🎯 Configuration finale recommandée

### Pour de meilleures performances :

**Fréquence recommandée selon votre usage :**

| Volume d'emails/jour | Fréquence recommandée |
|---------------------|----------------------|
| < 100 | Toutes les 10 minutes |
| 100 - 1000 | Toutes les 5 minutes |
| > 1000 | Toutes les 2 minutes |

**Sur cron-job.org (plan gratuit) :**
- Maximum : Toutes les minutes
- Recommandé : **Toutes les 5 minutes** (bon équilibre)

---

## 🐛 Dépannage

### ❌ Erreur 401 Unauthorized

**Cause** : Le secret CRON_SECRET est incorrect ou manquant

**Solution** :
1. Vérifiez que vous avez bien ajouté `CRON_SECRET` dans les variables d'environnement de Vercel
2. Vérifiez que le header dans cron-job.org est bien :
   ```
   Authorization: Bearer VOTRE_SECRET
   ```
   (avec le même secret que dans Vercel)
3. Redéployez votre application Vercel
4. Attendez 1-2 minutes
5. Réessayez

### ❌ Erreur 500 Internal Server Error

**Cause** : Problème dans le code ou la base de données

**Solution** :
1. Vérifiez les logs Vercel
2. Testez manuellement : `https://votre-domaine.com/api/automations/process`
3. Vérifiez que Supabase est bien configuré

### ❌ Le cron job ne s'exécute pas

**Cause** : Job mal configuré ou désactivé

**Solution** :
1. Sur cron-job.org, vérifiez que le job est "Enabled" (activé)
2. Vérifiez l'URL (doit commencer par https://)
3. Vérifiez que la méthode est bien POST

### ⚠️ Status 200 mais rien ne se passe

**Cause** : Pas d'automatisations actives ou pas d'inscriptions en attente

**Solution** :
1. Vérifiez que vous avez créé des automatisations
2. Vérifiez qu'elles sont **activées** (toggle vert)
3. Vérifiez qu'il y a des contacts inscrits
4. Testez en créant une automatisation de test

---

## 📊 Monitoring

### Voir les statistiques

1. **Sur cron-job.org** :
   - Cliquez sur votre job
   - Regardez "Execution history"
   - Vous verrez combien de fois il s'est exécuté et le taux de succès

2. **Sur votre dashboard** :
   - Allez sur `/admin/automations`
   - Vous verrez les stats en temps réel

### Logs recommandés

Pour suivre l'activité, regardez les logs Vercel :
- ✅ Succès : Status 200, "X emails sent"
- ⚠️ Aucune action : "No active automations" ou "0 processed"
- ❌ Erreur : Status 500 ou erreur dans les logs

---

## 🔐 Sécurité - Bonnes pratiques

### ✅ À FAIRE :
- Utilisez un CRON_SECRET long et aléatoire (32+ caractères)
- Ne partagez JAMAIS votre CRON_SECRET
- Changez le secret si vous pensez qu'il a été compromis
- Activez les notifications d'erreur sur cron-job.org

### ❌ À ÉVITER :
- N'utilisez pas de secrets simples comme "123456" ou "password"
- Ne mettez pas le CRON_SECRET dans votre code
- Ne commitez pas le .env.local dans Git

---

## 🎉 Félicitations !

Votre cron job est configuré ! Vos automatisations d'emails vont maintenant s'exécuter automatiquement toutes les 5 minutes.

### Prochaines étapes :

1. ✅ Créez vos premières automatisations sur `/admin/mailing`
2. ✅ Activez-les (important !)
3. ✅ Testez avec quelques contacts
4. ✅ Surveillez les résultats sur `/admin/automations`

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez cette checklist :
   - [ ] CRON_SECRET configuré dans Vercel ?
   - [ ] Application redéployée après ajout du secret ?
   - [ ] Header Authorization configuré dans cron-job.org ?
   - [ ] URL correcte dans cron-job.org ?
   - [ ] Méthode POST sélectionnée ?
   - [ ] Job activé (enabled) ?

2. Testez manuellement l'API :
   ```bash
   curl -X POST https://votre-domaine.com/api/automations/process \
     -H "Authorization: Bearer VOTRE_SECRET"
   ```

3. Vérifiez les logs Vercel pour voir les erreurs

Bonne automatisation ! 🚀
