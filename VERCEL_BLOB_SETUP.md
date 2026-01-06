# Configuration Vercel Blob - Guide de déploiement

## 🚨 Problème actuel
L'erreur 403 "Forbidden" vient de Vercel Blob qui n'est pas configuré.

## 📋 Étapes de configuration

### 1. Activer Vercel Blob Storage

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet "osteoupgrade"
3. Allez dans l'onglet **Storage**
4. Cliquez sur **Create Database** > **Blob**
5. Donnez un nom (ex: "osteoupgrade-files")
6. Cliquez sur **Create**

### 2. Vérifier la variable d'environnement

1. Dans votre projet Vercel, allez dans **Settings** > **Environment Variables**
2. Vérifiez que `BLOB_READ_WRITE_TOKEN` existe
3. Si elle n'existe pas, Vercel l'a normalement créée automatiquement lors de l'activation de Blob Storage
4. Si elle est manquante, vous devrez la créer manuellement depuis le dashboard Blob

### 3. Déployer les nouvelles modifications

**Option A - Depuis GitHub (recommandé):**
```bash
# 1. Créer une Pull Request depuis la branche
# 2. Merger la PR dans main
# 3. Vercel déploiera automatiquement
```

**Option B - Déploiement manuel:**
```bash
# Depuis votre terminal local
vercel --prod
```

### 4. Redéployer l'application

Une fois la variable configurée, redéployez :
- Soit via un nouveau commit/merge
- Soit via le bouton "Redeploy" dans Vercel Dashboard > Deployments

### 5. Vérifier l'authentification

Assurez-vous d'être connecté en tant qu'**admin** :
1. Connectez-vous sur osteo-upgrade.fr
2. Vérifiez votre profil dans la base Supabase
3. La colonne `role` doit être `'admin'`

## 🔍 Vérifications post-déploiement

Après le déploiement, vous devriez voir des erreurs différentes :
- ✅ Si non connecté : "Non authentifié" (401)
- ✅ Si pas admin : "Accès refusé. Seuls les administrateurs..." (403)
- ✅ Si token manquant : "Configuration serveur manquante..." (500)
- ✅ Si tout est OK : L'upload fonctionne ! 🎉

## 📝 Notes importantes

- Les modifications du code sont sur la branche `claude/fix-communication-upload-403-S3noP`
- Le token Vercel Blob est créé automatiquement lors de l'activation de Blob Storage
- Ce token est spécifique à chaque environnement (development, preview, production)
- Pensez à configurer le token pour tous les environnements si nécessaire

## 🆘 Si le problème persiste

1. Vérifiez les logs Vercel : Dashboard > Deployments > [votre déploiement] > Logs
2. Vérifiez que le déploiement utilise bien la dernière version du code
3. Testez l'endpoint directement : 
   ```bash
   curl -X POST https://osteo-upgrade.fr/api/communication-document-upload \
     -F "file=@test.pdf" \
     -H "Cookie: votre_cookie_session"
   ```
