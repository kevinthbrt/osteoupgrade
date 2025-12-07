# 💳 Guide Stripe + Déclencheurs d'automatisations

## 🎯 Vue d'ensemble

Votre application dispose maintenant d'un système complet de paiement Stripe intégré avec les automatisations d'emails !

## 📋 Ce qui a été créé

### 1. Configuration Stripe
- ✅ `lib/stripe.ts` - Configuration Stripe serveur
- ✅ `app/api/stripe/checkout/route.ts` - Création de sessions de paiement
- ✅ `app/api/stripe/webhook/route.ts` - Webhooks pour événements Stripe
- ✅ `app/api/automations/daily-checks/route.ts` - Détection inactifs & free

### 2. Déclencheurs d'automatisations

| Déclencheur | Type | Où ça se déclenche |
|-------------|------|-------------------|
| ✅ **Nouvelle inscription** | Automatique | `app/auth/page.tsx` (lors signup) |
| ✅ **Passage à Premium** | Webhook Stripe | `app/api/stripe/webhook/route.ts` |
| ✅ **Abonnement expiré** | Webhook Stripe | `app/api/stripe/webhook/route.ts` |
| ✅ **Inactif depuis 30 jours** | Cron quotidien | `app/api/automations/daily-checks/route.ts` |
| ✅ **Sur free depuis 14 jours** | Cron quotidien | `app/api/automations/daily-checks/route.ts` |

## 🔧 Configuration requise

### 1. Variables d'environnement Stripe

Ajoutez dans Vercel > Settings > Environment Variables :

```env
# Stripe (Trouvez ces clés sur https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # À générer dans l'étape 3

# Prix Stripe (À créer dans l'étape 2)
STRIPE_PRICE_SILVER=price_...  # Prix Premium Silver
STRIPE_PRICE_GOLD=price_...    # Prix Premium Gold

# URL de votre application
NEXT_PUBLIC_URL=https://votre-domaine.vercel.app

# CRON_SECRET (déjà configuré)
CRON_SECRET=88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
```

## 📝 Guide d'installation Stripe

### Étape 1 : Créer un compte Stripe

1. Allez sur **https://dashboard.stripe.com/register**
2. Créez votre compte
3. Activez le **mode Test** (toggle en haut à droite)

### Étape 2 : Créer les produits et prix

1. **Dashboard Stripe** > **Products** > **Add product**

2. **Premium Silver** :
   - Name: `Premium Silver`
   - Description: `Abonnement Premium Silver OsteoUpgrade`
   - Price: `29 EUR` / month
   - Cliquez **Save product**
   - Copiez le **Price ID** (commence par `price_...`)
   - → C'est votre `STRIPE_PRICE_SILVER`

3. **Premium Gold** :
   - Name: `Premium Gold`
   - Description: `Abonnement Premium Gold OsteoUpgrade`
   - Price: `49 EUR` / month
   - Cliquez **Save product**
   - Copiez le **Price ID**
   - → C'est votre `STRIPE_PRICE_GOLD`

### Étape 3 : Configurer le webhook

1. **Dashboard Stripe** > **Developers** > **Webhooks**
2. Cliquez **Add endpoint**
3. **Endpoint URL** : `https://votre-domaine.vercel.app/api/stripe/webhook`
4. **Events to send** : Sélectionnez ces événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Cliquez **Add endpoint**
6. Cliquez sur le webhook créé
7. **Révélez** le **Signing secret** (commence par `whsec_...`)
8. → C'est votre `STRIPE_WEBHOOK_SECRET`

### Étape 4 : Ajouter les variables dans Vercel

1. Vercel > Votre projet > **Settings** > **Environment Variables**
2. Ajoutez TOUTES les variables d'environnement ci-dessus
3. Cochez Production, Preview, Development
4. **Save**
5. **REDÉPLOYEZ** votre application

## 🚀 Utilisation

### Comment un utilisateur passe Premium ?

```typescript
// Exemple dans votre dashboard
async function handleUpgrade(planType: 'premium_silver' | 'premium_gold') {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planType,
      userId: user.id,
      email: user.email
    })
  })

  const { url } = await response.json()
  
  // Rediriger vers Stripe Checkout
  window.location.href = url
}
```

### Workflow complet

```
1. User clique "Passer Premium"
   ↓
2. API crée une session Stripe Checkout
   ↓
3. User est redirigé vers Stripe
   ↓
4. User paie avec sa carte
   ↓
5. Stripe envoie webhook "checkout.session.completed"
   ↓
6. Votre API webhook:
   - Met à jour le profil (role: premium_silver)
   - 🚀 DÉCLENCHE l'automatisation "Passage à Premium"
   ↓
7. Email de bienvenue Premium envoyé automatiquement !
```

## 🔄 Cron jobs quotidiens

### Configurer sur cron-job.org

En plus du cron toutes les 5 minutes, ajoutez un cron QUOTIDIEN :

1. Créez un nouveau cron job
2. **Title** : `OsteoUpgrade - Daily Checks`
3. **URL** : `https://votre-domaine.vercel.app/api/automations/daily-checks`
4. **Schedule** : **Once a day** à 9h00 (ou l'heure de votre choix)
5. **Method** : POST
6. **Headers** : 
   ```
   Authorization: Bearer 88f5165e1fb4cd34546280e9771169a33b9b77ee54a27ac0f70ec679995b7379
   ```
7. Save !

Ce cron quotidien va :
- Détecter les utilisateurs inactifs depuis 30 jours
- Détecter les comptes free depuis 14 jours
- Déclencher les automatisations correspondantes

## 🎯 Exemples d'automatisations

### 1. Bienvenue Premium (Passage à Premium)

```yaml
Nom: Onboarding Premium
Déclencheur: Passage à Premium
Email #1 (J+0): Bienvenue Premium - Accès débloqué
Email #2 (J+1): Guide complet des fonctionnalités Premium
Email #3 (J+7): Invitation séminaire exclusif Premium
```

### 2. Réactivation abonnement expiré

```yaml
Nom: Récupération clients
Déclencheur: Abonnement expiré
Email #1 (J+0): Votre abonnement a expiré
Email #2 (J+3): Offre spéciale -20% pour revenir
Email #3 (J+7): Dernière chance - Offre expire demain
```

### 3. Conversion Free → Premium

```yaml
Nom: Conversion Free 14 jours
Déclencheur: Sur free depuis 14 jours
Email #1 (J+0): Découvrez ce que vous manquez en Premium
Email #2 (J+2): Témoignages de membres Premium
Email #3 (J+5): Offre limitée - 50% sur le premier mois
```

### 4. Réactivation inactifs

```yaml
Nom: Réactivation 30 jours
Déclencheur: Inactif depuis 30 jours
Email #1 (J+0): On vous a manqué !
Email #2 (J+3): Nouvelles fonctionnalités ajoutées
Email #3 (J+7): Votre compte sera supprimé dans 30 jours
```

## 🧪 Tester en mode Test Stripe

### Cartes de test Stripe

Utilisez ces numéros de carte pour tester :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| ✅ Succès | `4242 4242 4242 4242` | Paiement réussi |
| ❌ Échec | `4000 0000 0000 0002` | Paiement refusé |
| 🔐 3D Secure | `4000 0027 6000 3184` | Requiert authentification |

- **Date d'expiration** : N'importe quelle date future (ex: 12/25)
- **CVC** : N'importe quel 3 chiffres (ex: 123)
- **ZIP** : N'importe quel code postal

### Workflow de test

1. Créez un compte test
2. Allez sur votre dashboard
3. Cliquez "Passer Premium Silver"
4. Sur Stripe Checkout, utilisez `4242 4242 4242 4242`
5. Validez le paiement
6. Vérifiez :
   - Le profil est mis à jour (role: premium_silver)
   - L'automatisation "Passage à Premium" est déclenchée
   - L'email est envoyé (dans les 5 minutes max)

## 📊 Monitoring

### Logs Vercel

Vérifiez que tout fonctionne :

```
# Webhook Stripe
✅ Checkout completed for user xxx, plan premium_silver
✅ Automation triggered: Passage à Premium

# Daily checks
🔍 Starting daily checks...
Found 5 inactive users (30+ days)
Found 3 free accounts (14 days old)
✅ Daily checks complete: 5 inactive, 3 free
```

### Dashboard Stripe

1. **Payments** : Voir tous les paiements
2. **Subscriptions** : Gérer les abonnements
3. **Webhooks** : Vérifier que les webhooks fonctionnent
4. **Logs** : Voir tous les événements

## ⚠️ Points importants

### 1. Mode Test vs Production

- **Test** : Utilisez les clés `sk_test_...` et `pk_test_...`
- **Production** : Utilisez les clés `sk_live_...` et `pk_live_...`

### 2. Webhook en local (développement)

Pour tester le webhook en local :

```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks vers localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Utilisez le webhook secret affiché (whsec_...)
```

### 3. Sécurité

- ✅ Ne commitez JAMAIS vos clés Stripe dans Git
- ✅ Utilisez toujours les variables d'environnement
- ✅ Vérifiez les signatures webhook
- ✅ Validez côté serveur, pas client

## 🐛 Dépannage

### Erreur "Invalid plan or price ID not configured"

→ Vérifiez que `STRIPE_PRICE_SILVER` et `STRIPE_PRICE_GOLD` sont configurés

### Webhook ne fonctionne pas

→ Vérifiez :
1. `STRIPE_WEBHOOK_SECRET` est correct
2. URL du webhook dans Stripe Dashboard est bonne
3. Les bons événements sont sélectionnés

### L'automatisation ne se déclenche pas

→ Vérifiez :
1. L'automatisation est **ACTIVÉE** (toggle vert)
2. Le trigger_event correspond exactement ("Passage à Premium", pas "passage à premium")
3. Les logs Vercel pour voir si l'API trigger est appelée

## 🎉 Félicitations !

Vous avez maintenant un système complet :
- ✅ Paiements Stripe fonctionnels
- ✅ Webhooks configurés
- ✅ 5 déclencheurs d'automatisations
- ✅ Cron jobs quotidiens
- ✅ Emails automatiques pour tous les événements

Testez tout en mode Test Stripe avant de passer en production ! 🚀
