# Instructions de déploiement - Nettoyage System.io & Mailing intégré

## 🚀 Étapes rapides

### 1️⃣ Appliquer les migrations Supabase

1. Ouvrez le **SQL Editor** de votre projet Supabase.
2. Exécutez `supabase-migration.sql` pour valider les rôles (`premium_silver`, `premium_gold`).
3. Exécutez `supabase-remove-systemio.sql` pour supprimer toutes les traces de System.io (tables, colonnes, index).

### 2️⃣ Configurer l'emailing intégré (Resend / Brevo)

Ajoutez ces variables d'environnement dans Vercel :

```
RESEND_API_KEY=...
BREVO_API_KEY=...
BREVO_SENDER="OsteoUpgrade <no-reply@osteoupgrade.app>"
```

- Resend est utilisé en priorité, puis Brevo prend le relais si besoin.
- Aucun paramétrage System.io n'est requis.

### 3️⃣ Redéployer l'application

1. Dans Vercel, allez dans **Deployments**.
2. Cliquez sur **Redeploy** pour le dernier déploiement.
3. Attendez la fin du build et vérifiez que les pages `/dashboard` et `/elearning` se chargent sans erreurs.

### 4️⃣ Vérifier le nettoyage

Dans Supabase SQL Editor :

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE 'systemio%';
```

Le résultat doit être vide. Les tables `systemio_courses`, `systemio_sync_logs` et `user_course_enrollments` ne doivent plus exister.

## 📨 Tests recommandés

- Créez un utilisateur premium et confirmez que la page `/elearning` affiche le message de migration vers Vimeo + email intégré.
- Envoyez un email de test avec la fonction `sendTransactionalEmail` (lib/mailing.ts) en renseignant un destinataire test.

## ✅ Checklist finale

- [ ] SQL exécutés (`supabase-migration.sql` + `supabase-remove-systemio.sql`)
- [ ] Variables d'environnement Resend/Brevo ajoutées
- [ ] Application redéployée
- [ ] Vérifications Supabase sans colonnes/tables System.io
- [ ] Email de test envoyé avec la nouvelle stack
