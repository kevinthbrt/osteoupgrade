# 📘 Guide de Configuration Stripe - Abonnement Mensuel avec Engagement Annuel

Ce guide explique comment configurer Stripe pour accepter des paiements mensuels avec un engagement obligatoire de 12 mois.

## 🎯 Objectif

Créer deux plans d'abonnement :
- **Premium Silver** : 30€/mois (360€/an) avec engagement 12 mois
- **Premium Gold** : 42€/mois (500€/an) avec engagement 12 mois

## ✅ Étape 1 : Créer les Prix Mensuels dans Stripe

### 1.1 Accéder à Stripe Dashboard

1. Connectez-vous à [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Produits** → **Ajouter un produit**

### 1.2 Créer le produit Premium Silver

1. **Nom du produit** : `Premium Silver`
2. **Description** : `Abonnement mensuel avec engagement 12 mois - Accès complet aux outils digitaux`
3. **Prix** :
   - Modèle de tarification : **Récurrent**
   - Montant : **30,00 €** (ou 29,92 € pour arrondir à 360€/an)
   - Fréquence de facturation : **Mensuelle**
4. Cliquez sur **Créer le produit**
5. **IMPORTANT** : Copiez l'**ID du prix** (commence par `price_...`)

### 1.3 Créer le produit Premium Gold

1. **Nom du produit** : `Premium Gold`
2. **Description** : `Abonnement mensuel avec engagement 12 mois - Accès complet + séminaire présentiel`
3. **Prix** :
   - Modèle de tarification : **Récurrent**
   - Montant : **42,00 €** (ou 41,67 € pour arrondir à 500€/an)
   - Fréquence de facturation : **Mensuelle**
4. Cliquez sur **Créer le produit**
5. **IMPORTANT** : Copiez l'**ID du prix** (commence par `price_...`)

## 🔐 Étape 2 : Configurer les Variables d'Environnement

Ajoutez ces variables dans Vercel (ou votre fichier `.env.local`) :

```bash
# Clés Stripe
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... en production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_... en production)

# IDs des prix
STRIPE_PRICE_SILVER=price_... # L'ID que vous avez copié pour Silver
STRIPE_PRICE_GOLD=price_... # L'ID que vous avez copié pour Gold

# Webhook secret (voir étape 3)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔔 Étape 3 : Configurer les Webhooks

### 3.1 Créer un endpoint webhook

1. Dans Stripe Dashboard, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. URL de l'endpoint : `https://votre-domaine.com/api/stripe/webhook`
4. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquez sur **Ajouter un endpoint**
6. **IMPORTANT** : Copiez le **Secret de signature du webhook** (`whsec_...`)
7. Ajoutez-le dans vos variables d'environnement (`STRIPE_WEBHOOK_SECRET`)

## 🛡️ Étape 4 : Configurer le Portail Client (Pour l'Engagement)

Le portail client permet aux utilisateurs de gérer leur abonnement. Pour appliquer l'engagement de 12 mois :

### 4.1 Accéder aux paramètres du portail

1. Allez dans **Paramètres** → **Portail de facturation**
2. Cliquez sur **Configuration**

### 4.2 Configurer les annulations

Dans la section **Annulations** :

**Option 1 : Bloquer complètement l'annulation pendant 12 mois**
- Décochez "Autoriser les clients à annuler leurs abonnements"
- Les clients ne pourront PAS annuler avant la fin de l'engagement

**Option 2 : Autoriser l'annulation avec avertissement (Recommandé)**
- Cochez "Autoriser les clients à annuler leurs abonnements"
- Dans "Comportement d'annulation" : Sélectionnez **"Fin de la période de facturation"**
- Ajoutez un message personnalisé :
  ```
  ⚠️ Votre abonnement inclut un engagement de 12 mois.
  Une annulation anticipée peut entraîner des frais ou des restrictions d'accès.
  Veuillez nous contacter pour plus d'informations.
  ```

**Option 3 : Frais de résiliation anticipée (Avancé)**
- Dans Stripe, vous pouvez configurer des frais automatiques pour résiliation anticipée
- Nécessite une configuration custom via l'API Stripe

### 4.3 Désactiver les changements de plan

Pour éviter que les clients contournent l'engagement en changeant de plan :
- Dans **Mises à niveau et rétrogradations** : Décochez toutes les options
- Ou laissez seulement les upgrades (Silver → Gold) mais bloquez les downgrades

## 📋 Étape 5 : Ajouter les Conditions Générales

### 5.1 Dans vos CGV

Ajoutez explicitement :

```
ARTICLE X - ENGAGEMENT D'ABONNEMENT

1. Les abonnements Premium Silver et Premium Gold sont facturés mensuellement.
2. Un engagement minimum de 12 mois est requis pour tous les abonnements.
3. La première facturation a lieu lors de la souscription, puis chaque mois à la même date.
4. L'annulation est possible après les 12 premiers mois d'engagement.
5. En cas d'annulation anticipée (avant 12 mois), l'accès aux services sera maintenu
   jusqu'à la fin de la période d'engagement, mais sans remboursement des mois restants.
```

### 5.2 Dans Stripe Checkout

Les métadonnées incluent déjà :
- `commitment_months: 12`
- `billing_type: monthly_with_commitment`
- `commitment_start: date`

Ces informations sont stockées dans Supabase pour référence.

## 🗄️ Étape 6 : Mise à Jour de la Base de Données Supabase

Ajoutez un nouveau champ dans la table `profiles` :

```sql
ALTER TABLE profiles
ADD COLUMN commitment_end_date TIMESTAMP WITH TIME ZONE;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN profiles.commitment_end_date IS
'Date de fin de l''engagement minimum de 12 mois pour les abonnements mensuels';
```

## 🧪 Étape 7 : Tester le Workflow Complet

### 7.1 Mode Test

1. Utilisez les clés de test Stripe (`sk_test_...` et `pk_test_...`)
2. Testez un abonnement avec une carte de test : `4242 4242 4242 4242`
3. Vérifiez que :
   - Le checkout fonctionne
   - Le webhook `checkout.session.completed` est reçu
   - Le profil utilisateur est mis à jour avec `commitment_end_date`
   - L'accès Premium est accordé

### 7.2 Tester l'annulation

1. Allez dans le portail client Stripe
2. Essayez d'annuler l'abonnement
3. Vérifiez que le message d'engagement s'affiche
4. Vérifiez que le webhook `customer.subscription.deleted` est reçu
5. Vérifiez que la détection d'annulation anticipée fonctionne (logs dans Vercel)

### 7.3 Cartes de test Stripe

- **Succès** : `4242 4242 4242 4242`
- **Échec de paiement** : `4000 0000 0000 0341`
- **3D Secure requis** : `4000 0025 0000 3155`

Toutes avec :
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quel code à 3 chiffres
- Code postal : N'importe lequel

## 🚀 Étape 8 : Passage en Production

### 8.1 Checklist

- [ ] Créer les produits en mode Live dans Stripe
- [ ] Copier les nouveaux `price_id` de production
- [ ] Mettre à jour les variables d'environnement avec les clés Live
- [ ] Configurer le webhook en production (URL de production)
- [ ] Tester avec une vraie carte (puis rembourser)
- [ ] Vérifier que les CGV sont à jour
- [ ] Vérifier que le portail client est configuré
- [ ] Activer les emails de Stripe (reçus, confirmations)

### 8.2 Variables de Production

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_SILVER=price_live_...
STRIPE_PRICE_GOLD=price_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

## 📊 Étape 9 : Monitoring et Alertes

### 9.1 Dans Stripe Dashboard

- Activez les **notifications par email** pour :
  - Paiements échoués
  - Annulations d'abonnements
  - Tentatives de fraude
  - Litiges

### 9.2 Dans Vercel

- Surveillez les logs de vos webhooks :
  - Allez dans **Logs** → Filtrez par `/api/stripe/webhook`
  - Vérifiez qu'il n'y a pas d'erreurs

### 9.3 Dans Supabase

Créez une vue pour suivre les engagements :

```sql
CREATE VIEW active_commitments AS
SELECT
  id,
  email,
  role,
  subscription_start_date,
  commitment_end_date,
  EXTRACT(DAYS FROM (commitment_end_date - NOW())) AS days_remaining,
  CASE
    WHEN commitment_end_date > NOW() THEN 'En engagement'
    ELSE 'Hors engagement'
  END AS commitment_status
FROM profiles
WHERE role IN ('premium_silver', 'premium_gold')
  AND subscription_status = 'active'
ORDER BY commitment_end_date ASC;
```

## ❓ FAQ

### Que se passe-t-il si un client annule avant 12 mois ?

L'annulation est enregistrée, mais selon votre configuration :
- **Option 1** : L'accès reste actif jusqu'à la fin de l'engagement
- **Option 2** : Des frais de résiliation peuvent être appliqués
- **Option 3** : L'accès est révoqué immédiatement (non recommandé légalement)

### Comment calculer le remboursement en cas d'annulation anticipée ?

Vous devez gérer ça manuellement ou via l'API Stripe. Exemple :
```typescript
const monthsPaid = 8; // Exemple : client a payé 8 mois
const monthsRemaining = 12 - monthsPaid; // 4 mois restants
// Pas de remboursement car engagement = accès garanti
```

### Les clients peuvent-ils changer de Silver à Gold ?

Oui ! C'est un upgrade. La configuration actuelle le permet.
Le nouvel engagement démarre à la date du changement.

### Comment gérer les échecs de paiement ?

Stripe retente automatiquement les paiements échoués selon votre configuration :
1. Allez dans **Paramètres** → **Facturation**
2. Configurez **Smart Retries** (recommandé)
3. Définissez le nombre de tentatives (3-4 recommandé)
4. Configurez les emails d'alerte automatiques

## 🎉 Résumé

Vous avez maintenant un système complet d'abonnement mensuel avec engagement annuel :

✅ **Facturation mensuelle** : Les clients paient 30€ ou 42€/mois
✅ **Engagement 12 mois** : Obligation contractuelle de 12 mois minimum
✅ **Tracking automatique** : La date de fin d'engagement est stockée
✅ **Webhooks configurés** : Gestion automatique des paiements et annulations
✅ **Portail client** : Les utilisateurs peuvent gérer leur abonnement
✅ **Conformité légale** : CGV et conditions claires

---

**Besoin d'aide ?** Consultez la [documentation Stripe](https://stripe.com/docs) ou contactez le support Stripe.
