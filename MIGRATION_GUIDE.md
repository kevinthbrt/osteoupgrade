# 🚀 Guide d'Application de la Migration Communication

## ⚠️ Erreur 403 - Solution

L'erreur 403 que vous rencontrez signifie que la table `communication_documents` n'existe pas encore dans votre base de données Supabase, ou que les politiques RLS ne sont pas configurées.

## 📋 Étapes pour Appliquer la Migration

### Étape 1 : Accéder au SQL Editor de Supabase

1. Connectez-vous à votre projet Supabase : https://app.supabase.com
2. Sélectionnez votre projet `osteoupgrade`
3. Dans le menu latéral, cliquez sur **"SQL Editor"**
4. Cliquez sur **"New query"**

### Étape 2 : Exécuter le Script SQL

1. Ouvrez le fichier `apply-communication-migration.sql` dans votre éditeur de code
2. **Copiez tout le contenu** du fichier (Ctrl+A puis Ctrl+C)
3. **Collez-le** dans le SQL Editor de Supabase
4. Cliquez sur le bouton **"Run"** (ou appuyez sur Ctrl+Entrée)

### Étape 3 : Vérifier que la Migration a Fonctionné

Après avoir exécuté le script, vous devriez voir un message de succès et une liste de politiques créées :

```
policyname
--------------------------------------------------
Anyone can read active communication documents
Admins can read all communication documents
Only admins can insert communication documents
Only admins can update communication documents
Only admins can delete communication documents
```

### Étape 4 : Tester le Module

1. Retournez sur votre application
2. Accédez à `/outils/communication`
3. En tant qu'admin, essayez d'ajouter un nouveau document
4. L'upload devrait maintenant fonctionner ! ✅

## 🔍 Détails des Politiques RLS

Le script crée **5 politiques de sécurité** :

### 1️⃣ Lecture pour tous (documents actifs)
```sql
Anyone can read active communication documents
```
→ Tous les utilisateurs premium peuvent voir les documents actifs

### 2️⃣ Lecture pour admins (tous les documents)
```sql
Admins can read all communication documents
```
→ Les admins voient TOUS les documents (actifs et inactifs)

### 3️⃣ Création (admins seulement)
```sql
Only admins can insert communication documents
```
→ Seuls les admins peuvent créer de nouveaux documents

### 4️⃣ Modification (admins seulement)
```sql
Only admins can update communication documents
```
→ Seuls les admins peuvent modifier les documents

### 5️⃣ Suppression (admins seulement)
```sql
Only admins can delete communication documents
```
→ Seuls les admins peuvent supprimer les documents

## ❓ Problèmes Courants

### Erreur : "relation already exists"
✅ **C'est normal !** Le script utilise `IF NOT EXISTS` pour éviter cette erreur. La migration continuera sans problème.

### Erreur : "policy already exists"
✅ **C'est normal !** Le script supprime d'abord les anciennes politiques avec `DROP POLICY IF EXISTS`.

### Erreur persiste après la migration
1. Vérifiez que vous êtes bien connecté en tant qu'admin
2. Déconnectez-vous et reconnectez-vous
3. Videz le cache du navigateur (Ctrl+Shift+R)

## 📊 Vérification Manuelle

Pour vérifier manuellement que la table existe, exécutez dans le SQL Editor :

```sql
SELECT * FROM public.communication_documents;
```

Pour vérifier les politiques :

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'communication_documents';
```

## ✅ Prochaines Étapes

Une fois la migration appliquée avec succès :

1. ✅ Ajoutez vos premiers documents (courriers, attestations, factures)
2. ✅ Testez le téléchargement en tant qu'utilisateur premium
3. ✅ Testez l'activation/désactivation des documents
4. ✅ Vérifiez que les utilisateurs gratuits n'ont pas accès

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
- Vérifiez les logs dans l'onglet "Logs" de Supabase
- Vérifiez votre rôle dans la table `profiles`
- Assurez-vous que Vercel Blob est configuré (pour l'upload de fichiers)
