# Instructions de déploiement - Intégration System.io

## 🚀 Déploiement rapide (5 étapes)

### 1️⃣ Exécuter le SQL dans Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet OsteoUpgrade
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase-migration.sql`
5. Cliquez sur **Run**

✅ Ceci va créer les nouvelles tables et modifier les rôles.

---

### 2️⃣ Configurer les variables d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. **Settings** > **Environment Variables**
4. Ajoutez ces deux variables :

```
SYSTEMIO_API_KEY=votre_clé_api_systemio
SYSTEMIO_API_URL=https://systeme.io/api/v1
```

**Comment obtenir votre clé API System.io ?**
- Connectez-vous à [systeme.io](https://systeme.io)
- Paramètres > API > Créer une clé API

---

### 3️⃣ Redéployer l'application

1. Dans Vercel, allez dans **Deployments**
2. Cliquez sur **Redeploy** pour le dernier déploiement
3. Attendez que le déploiement soit terminé (~2-3 minutes)

---

### 4️⃣ Migrer les utilisateurs existants (optionnel)

Si vous avez des utilisateurs avec l'ancien rôle `premium`, convertissez-les :

```sql
-- Dans Supabase SQL Editor
UPDATE public.profiles
SET role = 'premium_silver'
WHERE role = 'premium';
```

Si vous voulez promouvoir certains utilisateurs en Premium Gold :

```sql
UPDATE public.profiles
SET role = 'premium_gold'
WHERE email IN ('user1@example.com', 'user2@example.com');
```

---

### 5️⃣ Tester l'intégration

1. **Tester l'inscription** : Créez un nouveau compte pour vérifier la synchronisation avec System.io
2. **Tester E-learning** : Connectez-vous avec un compte Premium et allez sur `/elearning`
3. **Tester les séminaires** : Vérifiez que seuls les Premium Gold peuvent s'inscrire

---

## 📊 Vérifier que tout fonctionne

### Vérifier la synchronisation des utilisateurs

Dans Supabase SQL Editor :

```sql
-- Voir les logs de synchronisation
SELECT * FROM systemio_sync_logs
ORDER BY created_at DESC
LIMIT 10;

-- Voir les utilisateurs synchronisés
SELECT email, role, systemio_contact_id, systemio_synced_at
FROM profiles
WHERE systemio_contact_id IS NOT NULL;
```

### Vérifier les formations

```sql
-- Voir les formations disponibles
SELECT * FROM systemio_courses
WHERE is_active = true;
```

---

## ⚠️ Problèmes courants

### "SYSTEMIO_API_KEY is not configured"

➡️ **Solution** : Vous avez oublié de redéployer après avoir ajouté les variables d'environnement. Redéployez l'application.

### Les formations n'apparaissent pas

➡️ **Solution** : Vous devez synchroniser les formations depuis System.io. Exécutez dans la console :

```javascript
fetch('/api/systemio/sync-courses', {
  method: 'POST'
}).then(res => res.json()).then(console.log)
```

### Les utilisateurs Premium Silver peuvent s'inscrire aux séminaires

➡️ **Solution** : Vérifiez que vous avez bien exécuté la migration SQL et redéployé l'application.

---

## 📝 Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] ✅ SQL exécuté dans Supabase
- [ ] ✅ Variables d'environnement ajoutées dans Vercel
- [ ] ✅ Application redéployée
- [ ] ✅ Utilisateurs existants migrés
- [ ] ✅ Nouveau compte testé (synchronisation System.io)
- [ ] ✅ Page E-learning testée
- [ ] ✅ Restrictions séminaires testées
- [ ] ✅ Logs vérifiés dans Supabase

---

## 📚 Documentation complète

Pour plus de détails, consultez **SYSTEMIO_INTEGRATION_GUIDE.md**

---

**Besoin d'aide ?** Consultez les logs dans :
- Vercel : Dashboard > Logs
- Supabase : Table `systemio_sync_logs`
