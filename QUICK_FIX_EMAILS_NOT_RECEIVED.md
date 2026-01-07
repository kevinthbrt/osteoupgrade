# ⚡ QUICK FIX : Emails non reçus

## 🎯 Diagnostic en 3 minutes

### ÉTAPE 1 : Ajouter `RESEND_WEBHOOK_SECRET` dans Vercel (CRITIQUE)

**C'est probablement LA cause du problème !**

1. **Récupérer le Signing Secret dans Resend :**
   - Va sur https://resend.com/inbound
   - Clique sur ton Inbound Route (admin@osteo-upgrade.fr)
   - Cherche "Signing Secret" ou "Webhook Secret"
   - Copie la valeur (format : `whsec_xxxxxxxxxxxxxx`)

2. **Ajouter dans Vercel :**
   - Va sur https://vercel.com/settings/environment-variables
   - Clique "Add New"
   - Key : `RESEND_WEBHOOK_SECRET`
   - Value : `whsec_xxxxxxxxxxxxxx` (colle la valeur)
   - Environments : ✅ Production ✅ Preview ✅ Development
   - Clique "Save"

3. **Redéployer :**
   ```bash
   git commit --allow-empty -m "chore: Redeploy for RESEND_WEBHOOK_SECRET"
   git push
   ```
   OU dans Vercel Dashboard : Deployments → Latest → Menu → Redeploy

---

### ÉTAPE 2 : Tester avec la page de diagnostic

1. **Va sur :** https://www.osteo-upgrade.fr/admin/test-webhook

2. **Clique sur "Tester le Webhook Complet"**

3. **Regarde les résultats :**
   - ✅ Tous verts → Le webhook fonctionne !
   - ❌ Erreur 401 → Le `RESEND_WEBHOOK_SECRET` est incorrect
   - ❌ Erreur 400 → Headers Svix manquants (normal pour ce test si le secret est configuré)
   - ❌ Database check échoue → Problème de permissions Supabase

---

### ÉTAPE 3 : Envoyer un vrai email de test

1. **Depuis ta boîte email personnelle, envoie un email à :**
   ```
   À : admin@osteo-upgrade.fr
   Sujet : Test réception email
   Corps : Ceci est un test
   ```

2. **Attends 30-60 secondes**

3. **Vérifie dans Resend Dashboard :**
   - Va sur https://resend.com/inbound
   - Clique sur ton Inbound Route
   - Cherche l'onglet "Deliveries" ou "Events"
   - L'email doit apparaître avec statut **HTTP 200** (vert)

4. **Vérifie dans la base de données :**
   ```sql
   SELECT * FROM public.received_emails
   ORDER BY received_at DESC
   LIMIT 5;
   ```
   L'email doit apparaître !

5. **Vérifie dans l'interface :**
   - Va sur https://www.osteo-upgrade.fr/admin/emails
   - L'email doit apparaître dans la liste

---

## 🔍 Troubleshooting rapide

### Problème : Webhook retourne 307 dans Resend
**Cause :** Le code n'est pas déployé ou l'URL est incorrecte
**Solution :**
- Vérifie que le dernier déploiement Vercel est actif (commit `4abbede`)
- Vérifie l'URL dans Resend : `https://osteo-upgrade.fr/api/emails/inbound` (sans `www`)

### Problème : Webhook retourne 401 "Invalid signature"
**Cause :** Le `RESEND_WEBHOOK_SECRET` est incorrect ou absent
**Solution :**
- Vérifie que la variable existe dans Vercel
- Vérifie que la valeur correspond exactement à celle de Resend
- Redéploie après avoir modifié

### Problème : Webhook retourne 200 mais email pas en DB
**Cause :** Problème de permissions Supabase RLS
**Solution :**
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'received_emails';

-- Si aucune policy, créer :
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything" ON public.received_emails
  FOR ALL USING (true);
```

### Problème : Email en DB mais pas visible dans /admin/emails
**Cause :** Problème de RLS policies pour la lecture
**Solution :**
```sql
CREATE POLICY "Admins can read all emails" ON public.received_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## ✅ Checklist complète

Coche chaque étape au fur et à mesure :

- [ ] `RESEND_WEBHOOK_SECRET` ajouté dans Vercel
- [ ] Application redéployée (dernier commit `4abbede` actif)
- [ ] Inbound Route existe dans Resend avec URL `https://osteo-upgrade.fr/api/emails/inbound`
- [ ] Test sur `/admin/test-webhook` réussi
- [ ] Email de test envoyé à `admin@osteo-upgrade.fr`
- [ ] Email apparaît dans Resend "Deliveries" avec HTTP 200
- [ ] Email visible dans la table `received_emails` (SQL)
- [ ] Email visible sur `/admin/emails` (interface)

**Si toutes les cases sont cochées → Tout fonctionne ! 🎉**

---

## 📞 Si rien ne fonctionne

Si après toutes ces étapes ça ne fonctionne toujours pas, vérifie :

1. **Les logs Vercel en temps réel :**
   - https://vercel.com/ton-projet/logs
   - Filtre par `/api/emails/inbound`
   - Cherche les erreurs

2. **La configuration DNS MX du domaine :**
   - Les emails doivent pouvoir arriver à Resend
   - Vérifie dans Resend > Domains > osteo-upgrade.fr > MX Records

3. **Que tu es bien admin :**
   ```sql
   SELECT id, email, role FROM public.profiles
   WHERE id = auth.uid();
   ```
   Le rôle doit être `'admin'`

---

## 🚀 Une fois que ça fonctionne

Une fois les emails réceptionnés, tu peux :
- Voir tous les emails reçus sur `/admin/emails`
- Filtrer par catégorie (parrainage, support, général)
- Marquer comme lu/non lu
- Archiver ou supprimer
- Rechercher dans les emails

Les emails sont automatiquement catégorisés :
- **Parrainage :** Si le sujet contient "parrain", "référal", "commission"
- **Support :** Si le sujet contient "support", "aide", "problème"
- **Spam :** Si détecté comme spam
- **Général :** Tous les autres

---

## 📚 Documentation complète

Pour plus de détails, consulte :
- `DEBUG_WEBHOOK_EMAIL_RECEPTION.md` - Diagnostic détaillé
- `FIX_WEBHOOK_307_REDIRECT.md` - Fix du problème 307
- `RESEND_INBOUND_EMAILS_SETUP.md` - Configuration initiale complète
