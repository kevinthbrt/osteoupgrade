# 🔄 Système de Renouvellement Automatique - Engagement par Cycles de 12 Mois

Ce document explique le fonctionnement du système de renouvellement automatique des abonnements avec engagement de 12 mois.

## 🎯 Principe de Fonctionnement

### Vue d'ensemble

Les abonnements Premium Silver et Premium Gold sont **facturés mensuellement** mais avec un **engagement obligatoire de 12 mois**.

À la fin de chaque période d'engagement de 12 mois :
1. **7 jours avant** la fin du cycle : L'utilisateur reçoit un email d'avertissement
2. S'il ne fait rien : **Le cycle se renouvelle automatiquement** pour 12 mois supplémentaires
3. S'il annule avant la fin : L'abonnement s'arrête à la fin du cycle en cours

## 📊 Structure de la Base de Données

### Nouveaux champs dans la table `profiles`

```sql
-- Date de fin de l'engagement en cours
commitment_end_date TIMESTAMP WITH TIME ZONE

-- Numéro du cycle d'engagement (1, 2, 3, etc.)
commitment_cycle_number INTEGER DEFAULT 1

-- Indique si la notification de renouvellement a été envoyée
commitment_renewal_notification_sent BOOLEAN DEFAULT false
```

### Exemple de données

```
user_id: 123
commitment_cycle_number: 2
commitment_end_date: 2025-12-15
commitment_renewal_notification_sent: false
```

Cet utilisateur est dans son 2ème cycle d'engagement, qui se terminera le 15 décembre 2025.

## 🔄 Flux de Renouvellement Automatique

### Cycle de vie d'un abonnement

```
Jour 0 : Souscription
  ↓
  commitment_cycle_number = 1
  commitment_end_date = J+365
  commitment_renewal_notification_sent = false

Jour 358 (7 jours avant la fin)
  ↓
  Cron job détecte que commitment_end_date est dans 7 jours
  ↓
  Email "Renouvellement imminent" envoyé
  ↓
  commitment_renewal_notification_sent = true

Jour 365 : Premier paiement après la fin du cycle
  ↓
  Webhook "invoice.payment_succeeded" reçu
  ↓
  Détection : now >= commitment_end_date
  ↓
  RENOUVELLEMENT AUTOMATIQUE :
    - commitment_cycle_number = 2
    - commitment_end_date = J+365 (nouveau cycle)
    - commitment_renewal_notification_sent = false
  ↓
  Email "Renouvellement effectué" envoyé

Jour 723 (7 jours avant la fin du cycle 2)
  ↓
  Email "Renouvellement imminent" envoyé
  ↓
  ... et ainsi de suite
```

## 🔧 Composants du Système

### 1. Webhook Stripe (`/app/api/stripe/webhook/route.ts`)

#### Événement : `checkout.session.completed`

Déclenché lors d'une nouvelle souscription :

```typescript
const updateData = {
  role: planType,
  subscription_status: 'active',
  commitment_end_date: commitmentEndDate.toISOString(), // J+365
  commitment_cycle_number: 1, // Premier cycle
  commitment_renewal_notification_sent: false,
  // ...
}
```

#### Événement : `invoice.payment_succeeded`

Déclenché à chaque paiement mensuel réussi :

```typescript
// Si le paiement a lieu APRÈS la fin du cycle
if (commitmentEndDate && now >= commitmentEndDate) {
  // Démarrer un nouveau cycle
  const newCycleNumber = currentCycle + 1
  const newCommitmentEndDate = new Date(now)
  newCommitmentEndDate.setMonth(newCommitmentEndDate.getMonth() + 12)

  // Mise à jour
  await supabaseAdmin
    .from('profiles')
    .update({
      commitment_cycle_number: newCycleNumber,
      commitment_end_date: newCommitmentEndDate.toISOString(),
      commitment_renewal_notification_sent: false
    })
    .eq('id', profile.id)
}
```

### 2. Cron Job Quotidien (`/app/api/subscriptions/check-renewals/route.ts`)

**Déclenchement** : Tous les jours à 9h00 (via Vercel Cron)

**Configuration** : `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/subscriptions/check-renewals",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Fonctionnement** :

1. Recherche les utilisateurs dont le cycle se termine dans 7 jours :
   ```sql
   WHERE commitment_end_date <= NOW() + INTERVAL '7 days'
     AND commitment_end_date >= NOW()
     AND commitment_renewal_notification_sent = false
   ```

2. Pour chaque utilisateur trouvé :
   - Envoie un email "Renouvellement imminent"
   - Marque `commitment_renewal_notification_sent = true`

3. Retourne un rapport JSON :
   ```json
   {
     "success": true,
     "checked_at": "2025-12-08T09:00:00Z",
     "notifications_sent": 5,
     "details": [...]
   }
   ```

### 3. Automatisations Email

Deux automatisations sont déclenchées via `/api/automations/trigger` :

#### a) "Renouvellement imminent" (7 jours avant)

```json
{
  "event": "Renouvellement imminent",
  "contact_email": "user@example.com",
  "metadata": {
    "cycle_number": 1,
    "renewal_date": "2025-12-15T00:00:00Z",
    "days_until_renewal": 7,
    "plan_type": "premium_silver"
  }
}
```

**Contenu suggéré de l'email** :

```
Objet : 🔔 Votre engagement se renouvelle dans 7 jours

Bonjour,

Votre abonnement Premium Silver arrive en fin de cycle d'engagement dans 7 jours (le 15 décembre 2025).

✅ Si vous souhaitez continuer : Rien à faire ! Votre abonnement se renouvellera automatiquement pour 12 mois supplémentaires.

❌ Si vous souhaitez annuler : Rendez-vous dans votre espace client avant le 15 décembre pour éviter le renouvellement automatique.

Gérer mon abonnement : [Lien vers le portail Stripe]
```

#### b) "Renouvellement effectué" (lors du renouvellement)

```json
{
  "event": "Renouvellement effectué",
  "contact_email": "user@example.com",
  "metadata": {
    "cycle_number": 2,
    "new_commitment_end_date": "2026-12-15T00:00:00Z",
    "plan_type": "premium_silver"
  }
}
```

**Contenu suggéré de l'email** :

```
Objet : ✅ Votre abonnement a été renouvelé avec succès

Bonjour,

Votre abonnement Premium Silver a été renouvelé pour un nouveau cycle de 12 mois.

📅 Prochain renouvellement : 15 décembre 2026
💰 Paiement mensuel : 29,99€/mois

Merci de votre confiance !
```

## 📝 Scénarios d'Utilisation

### Scénario 1 : Renouvellement Normal

1. **01/01/2025** : Utilisateur souscrit à Premium Silver
   - `commitment_cycle_number = 1`
   - `commitment_end_date = 01/01/2026`

2. **25/12/2025** : 7 jours avant la fin
   - Email "Renouvellement imminent" envoyé
   - `commitment_renewal_notification_sent = true`

3. **01/01/2026** : Paiement mensuel réussi
   - Webhook détecte que `now >= commitment_end_date`
   - **Nouveau cycle démarré** :
     - `commitment_cycle_number = 2`
     - `commitment_end_date = 01/01/2027`
     - `commitment_renewal_notification_sent = false`
   - Email "Renouvellement effectué" envoyé

4. **25/12/2026** : 7 jours avant la fin du cycle 2
   - Email "Renouvellement imminent" envoyé
   - ... et ainsi de suite

### Scénario 2 : Annulation Avant Renouvellement

1. **01/01/2025** : Utilisateur souscrit
   - `commitment_end_date = 01/01/2026`

2. **25/12/2025** : Email "Renouvellement imminent" reçu

3. **28/12/2025** : Utilisateur annule via le portail Stripe
   - Abonnement reste actif jusqu'au 01/01/2026
   - Aucun nouveau cycle ne sera créé

4. **01/01/2026** : Abonnement expire
   - `subscription_status = 'cancelled'`
   - `role = 'free'`

### Scénario 3 : Annulation Anticipée (Avant la Fin du Cycle)

1. **01/01/2025** : Utilisateur souscrit
   - `commitment_end_date = 01/01/2026`

2. **15/06/2025** : Utilisateur tente d'annuler (6 mois avant la fin)
   - **Option A** : Annulation bloquée par le portail Stripe (recommandé)
   - **Option B** : Annulation acceptée mais accès maintenu jusqu'au 01/01/2026
   - Webhook `customer.subscription.deleted` détecte l'annulation anticipée

3. **01/01/2026** : Abonnement expire
   - Pas de renouvellement
   - `role = 'free'`

## 🔐 Sécurité

### Protection du Cron Job

Le endpoint `/api/subscriptions/check-renewals` est protégé par un token secret :

```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Configuration requise** :

```env
CRON_SECRET=votre_token_secret_ultra_securise
```

Vercel Cron ajoute automatiquement ce header lors de l'appel du cron.

## 🧪 Tests

### Tester le Cron Job Manuellement

```bash
curl -X GET https://votre-domaine.com/api/subscriptions/check-renewals \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Tester le Webhook de Renouvellement

1. Créez un abonnement de test
2. Modifiez manuellement `commitment_end_date` à hier dans Supabase
3. Utilisez Stripe CLI pour simuler un paiement :
   ```bash
   stripe trigger invoice.payment_succeeded
   ```
4. Vérifiez dans les logs Vercel que le cycle a été incrémenté

### Tester la Notification Email

Modifiez la date d'engagement dans Supabase :

```sql
UPDATE profiles
SET commitment_end_date = NOW() + INTERVAL '7 days',
    commitment_renewal_notification_sent = false
WHERE id = 'votre-user-id';
```

Puis appelez le cron manuellement.

## 📊 Monitoring

### Tableau de Bord SQL

Créez une vue pour suivre les engagements :

```sql
CREATE VIEW renewal_monitoring AS
SELECT
  id,
  email,
  role,
  commitment_cycle_number,
  commitment_end_date,
  commitment_renewal_notification_sent,
  EXTRACT(DAYS FROM (commitment_end_date - NOW())) AS days_until_renewal,
  CASE
    WHEN commitment_end_date < NOW() THEN '⚠️ Cycle expiré'
    WHEN commitment_end_date <= NOW() + INTERVAL '7 days' AND NOT commitment_renewal_notification_sent THEN '📧 Notification à envoyer'
    WHEN commitment_end_date <= NOW() + INTERVAL '7 days' THEN '✅ Notification envoyée'
    ELSE '⏳ En cours'
  END AS status
FROM profiles
WHERE role IN ('premium_silver', 'premium_gold')
  AND subscription_status = 'active'
ORDER BY commitment_end_date ASC;
```

### Logs à Surveiller

Dans Vercel, surveillez :
- `/api/subscriptions/check-renewals` → Notifications envoyées quotidiennement
- `/api/stripe/webhook` → Événements `invoice.payment_succeeded` avec message "Starting new commitment cycle"

## ❓ FAQ

### Que se passe-t-il si un utilisateur oublie d'annuler ?

Le cycle se renouvelle automatiquement. C'est le comportement attendu pour un engagement avec renouvellement tacite.

### Peut-on annuler pendant la période d'engagement ?

Cela dépend de votre configuration du portail Stripe :
- **Option recommandée** : Bloquer l'annulation pendant les 12 mois
- **Alternative** : Autoriser l'annulation mais maintenir l'accès jusqu'à la fin du cycle

### Comment gérer les échecs de paiement lors du renouvellement ?

Stripe retente automatiquement les paiements échoués selon votre configuration Smart Retries. Si tous les paiements échouent, l'événement `customer.subscription.deleted` sera déclenché et l'utilisateur repassera en Free.

### Un utilisateur peut-il sauter un cycle de renouvellement ?

Oui ! Il suffit d'annuler avant la fin du cycle en cours. L'abonnement s'arrêtera et aucun nouveau cycle ne sera créé.

## 🎉 Résumé

✅ **Facturation mensuelle** : 29,99€ ou 49,99€ par mois
✅ **Engagement par cycles** : Renouvelable tous les 12 mois
✅ **Notification automatique** : 7 jours avant le renouvellement
✅ **Renouvellement automatique** : Si l'utilisateur ne fait rien
✅ **Annulation possible** : Avant la fin de chaque cycle
✅ **Tracking précis** : Numéro de cycle et dates dans la BDD

---

**Documentation mise à jour** : 2025-12-08
