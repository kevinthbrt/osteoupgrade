# ⚡ Guide Rapide : Cron Job en 5 minutes

## Votre CRON_SECRET généré :

```
88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
```

⚠️ **COPIEZ ET SAUVEGARDEZ CE SECRET** - Vous en aurez besoin 2 fois !

---

## 📝 Checklist rapide

### ☐ Étape 1 : Ajouter le secret sur Vercel (2 minutes)

1. Allez sur **https://vercel.com**
2. Ouvrez votre projet **osteoupgrade**
3. Cliquez sur **Settings** (dans le menu)
4. Cliquez sur **Environment Variables** (dans le menu de gauche)
5. Cliquez sur **Add New**
6. Remplissez :
   ```
   Name:  CRON_SECRET
   Value: 88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
   ```
7. Cochez les 3 environnements (Production, Preview, Development)
8. Cliquez sur **Save**
9. **REDÉPLOYEZ** votre application :
   - Allez dans "Deployments"
   - Trouvez le dernier déploiement
   - Cliquez sur les 3 points "..."
   - Cliquez sur "Redeploy"

### ☐ Étape 2 : Créer un compte sur cron-job.org (2 minutes)

1. Allez sur **https://cron-job.org/en/signup/**
2. Remplissez :
   - Email : Votre email
   - Password : Choisissez un mot de passe
   - Acceptez les conditions
3. Cliquez sur **Create account**
4. **Vérifiez votre email** et cliquez sur le lien de confirmation
5. Connectez-vous sur **https://cron-job.org**

### ☐ Étape 3 : Créer le cron job (1 minute)

1. Une fois connecté, cliquez sur **Cronjobs** (menu gauche)
2. Cliquez sur **Create cronjob** (bouton bleu en haut)
3. Remplissez le formulaire :

```
┌─────────────────────────────────────────┐
│ Title:                                  │
│ OsteoUpgrade - Email Automations       │
├─────────────────────────────────────────┤
│ Address (URL):                          │
│ https://VOTRE-SITE.vercel.app/api/automations/process
│                                         │
│ ⚠️ REMPLACEZ "VOTRE-SITE" par votre    │
│    vrai domaine Vercel !               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Schedule:                               │
│ ● Every 5 minutes                       │
└─────────────────────────────────────────┘
```

4. **Cliquez sur "Advanced"** (en bas) pour développer

5. **Configuration avancée** :

```
┌─────────────────────────────────────────┐
│ Request method:                         │
│ ● POST                                  │
├─────────────────────────────────────────┤
│ Custom request headers:                 │
│ ☑ Enable custom headers                │
│                                         │
│ Authorization: Bearer 88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
│                                         │
│ ⚠️ COLLEZ VOTRE SECRET ICI !           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Notifications:                          │
│ ☑ Notify me on failed executions       │
│   Email: votre@email.com                │
└─────────────────────────────────────────┘
```

6. Cliquez sur **Create cronjob**

### ☐ Étape 4 : TESTER ! (1 minute)

1. Dans la liste de vos cronjobs, vous verrez votre nouveau job
2. Cliquez sur le bouton **▶️ Play** (ou "Run now")
3. Attendez 5 secondes
4. Vous devriez voir :
   ```
   ✅ Last execution: Success (200)
   ```

🎉 **C'EST FAIT !** Votre cron job est configuré et fonctionne !

---

## 🧪 Vérifier que tout fonctionne

### Option 1 : Sur cron-job.org

Cliquez sur votre job, vous verrez :
```
┌────────────────────────────────────────┐
│ Execution History                      │
├────────────────────────────────────────┤
│ ✅ 2024-12-07 14:35:00 | 200 | 0.5s   │
│ ✅ 2024-12-07 14:30:00 | 200 | 0.4s   │
│ ✅ 2024-12-07 14:25:00 | 200 | 0.3s   │
└────────────────────────────────────────┘
```

### Option 2 : Sur votre site

1. Allez sur votre site
2. Connectez-vous en tant qu'admin
3. Visitez : `/admin/automations`
4. Vous verrez les statistiques en temps réel

---

## 🚨 Problèmes courants

### ❌ Erreur 401 "Unauthorized"

**Vous voyez :**
```
❌ Last execution: Failed (401)
```

**Solution :**
1. Vérifiez que vous avez bien ajouté `CRON_SECRET` sur Vercel
2. Vérifiez que le header dans cron-job.org est exactement :
   ```
   Authorization: Bearer 88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
   ```
3. **REDÉPLOYEZ votre application sur Vercel** (très important !)
4. Attendez 2 minutes
5. Cliquez sur "Run now" à nouveau

### ❌ Erreur 404 "Not Found"

**Solution :**
Vérifiez l'URL, elle doit être exactement :
```
https://votre-domaine.vercel.app/api/automations/process
```
Pas de `/` à la fin !

### ✅ Status 200 mais rien ne se passe ?

**C'est normal si :**
- Vous n'avez pas encore créé d'automatisations
- Vos automatisations ne sont pas activées
- Il n'y a pas de contacts inscrits

**Pour tester :**
1. Allez sur `/admin/mailing`
2. Créez une automatisation de test
3. **ACTIVEZ-LA** (bouton toggle)
4. Inscrivez un contact de test
5. Attendez 5 minutes

---

## 📋 Récapitulatif de votre configuration

```yaml
Service: cron-job.org (GRATUIT)
Fréquence: Toutes les 5 minutes
URL: https://VOTRE-SITE.vercel.app/api/automations/process
Méthode: POST
Header: Authorization: Bearer 88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
Notifications: Activées sur échecs
```

---

## 🎯 Prochaines étapes

Maintenant que votre cron job fonctionne :

1. ✅ Créez vos automatisations sur `/admin/mailing`
2. ✅ **ACTIVEZ-LES** (très important !)
3. ✅ Testez avec quelques emails de test
4. ✅ Surveillez sur `/admin/automations`

---

## 💡 Astuces

### Changer la fréquence plus tard

Sur cron-job.org :
1. Cliquez sur votre job
2. Cliquez sur "Edit"
3. Changez la fréquence
4. Cliquez sur "Save changes"

### Désactiver temporairement

Sur cron-job.org :
1. Cliquez sur votre job
2. Toggle le bouton "Enabled" à OFF

### Voir les logs détaillés

Sur Vercel :
1. Allez dans votre projet
2. Cliquez sur "Logs"
3. Filtrez par `/api/automations/process`

---

## ✅ Vous avez terminé !

Votre système d'automatisation est maintenant **100% opérationnel** et **100% gratuit** ! 🎉

Des questions ? Consultez **CRON_JOB_SETUP.md** pour le guide détaillé.

Bon emailing ! 📧🚀
