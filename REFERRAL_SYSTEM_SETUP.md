# Système de Parrainage et Nouveaux Abonnements - Guide de Déploiement

## 📋 Résumé des changements

### 1. Nouveaux prix d'abonnement (SANS ENGAGEMENT)

#### Premium Silver
- **Mensuel** : 29€/mois (au lieu de 29.99€)
- **Annuel** : 240€/an (soit 20€/mois, économie de 108€)
- Sans engagement (annulation à tout moment)

#### Premium Gold
- **Annuel uniquement** : 499€/an (au lieu de 599.88€/an)
- Possibilité d'activer une promotion à 399€/an via variable d'environnement
- Sans engagement (annulation à tout moment)
- Inclut le système de parrainage

### 2. Système de parrainage

- Chaque membre Premium Gold reçoit un code de parrainage unique
- 10% de commission sur chaque abonnement ANNUEL (Silver ou Gold) parrainé
- Les membres peuvent demander le paiement de leurs gains (minimum 10€)
- Paiements traités par virement bancaire

## 🗄️ Migrations de base de données

### Appliquer les migrations Supabase

1. Connectez-vous à Supabase Dashboard
2. Allez dans SQL Editor
3. Exécutez le fichier : `supabase/migrations/20260107_add_referral_system.sql`

Ce script créera :
- Table `referral_codes` : codes de parrainage uniques par utilisateur
- Table `referral_transactions` : historique des parrainages et commissions
- Table `referral_payouts` : demandes et historique des paiements
- Vue `referral_earnings_summary` : résumé des gains par utilisateur
- Trigger automatique pour créer un code de parrainage lors du passage à Premium Gold

## 🔑 Variables d'environnement Stripe

### Anciennes variables à supprimer

```bash
# Anciennes variables (ne sont plus utilisées)
STRIPE_PRICE_SILVER=price_xxx  # ancien prix mensuel Silver
STRIPE_PRICE_GOLD=price_xxx    # ancien prix mensuel Gold
```

### Nouvelles variables requises

```bash
# Prix Silver
STRIPE_PRICE_SILVER_MONTHLY=price_xxx    # 29€/mois
STRIPE_PRICE_SILVER_ANNUAL=price_xxx     # 240€/an

# Prix Gold
STRIPE_PRICE_GOLD_ANNUAL=price_xxx       # 499€/an

# Promotion Gold (optionnel)
STRIPE_GOLD_PROMO_ACTIVE=false          # Mettre à "true" pour activer la promo à 399€
```

## 💳 Configuration Stripe Dashboard

### 1. Créer les nouveaux prix

Dans Stripe Dashboard > Products :

1. **Premium Silver Monthly**
   - Prix : 29,00 € EUR
   - Facturation : Récurrente
   - Période : Mensuelle
   - Copier le Price ID → `STRIPE_PRICE_SILVER_MONTHLY`

2. **Premium Silver Annual**
   - Prix : 240,00 € EUR
   - Facturation : Récurrente
   - Période : Annuelle
   - Copier le Price ID → `STRIPE_PRICE_SILVER_ANNUAL`

3. **Premium Gold Annual**
   - Prix : 499,00 € EUR
   - Facturation : Récurrente
   - Période : Annuelle
   - Copier le Price ID → `STRIPE_PRICE_GOLD_ANNUAL`

### 2. Configurer le portail client

Dans Stripe Dashboard > Settings > Billing > Customer Portal :

- ✅ Activer "Allow customers to cancel subscriptions"
- ✅ Activer "Allow customers to update payment methods"
- ✅ Activer "Allow customers to view invoices"
- ❌ **DÉSACTIVER** "Require confirmation before canceling" (plus d'engagement)

### 3. Mettre à jour les métadonnées des produits (optionnel)

Ajouter les métadonnées suivantes à vos produits pour mieux les identifier :
- `plan_type`: `premium_silver` ou `premium_gold`
- `billing_interval`: `month` ou `year`

## 📧 Configuration des emails d'automatisation

### Nouveaux événements

1. **Nouveau parrainage**
   - Déclenché quand quelqu'un s'inscrit avec un code de parrainage
   - Variables : `{commission}`, `{referred_user}`, `{plan}`

2. **Demande de paiement parrainage**
   - Déclenché quand un membre demande le paiement de ses gains
   - Envoyé aux administrateurs
   - Variables : `{user_name}`, `{user_email}`, `{amount}`, `{method}`, `{payout_id}`

Créez ces automatisations dans votre système de mailing.

## 🔗 Nouvelles routes API

### Publiques
- `POST /api/referrals/validate` - Valider un code de parrainage

### Authentifiées (Premium Gold uniquement)
- `GET /api/referrals/my-code` - Récupérer son code de parrainage
- `GET /api/referrals/earnings` - Voir ses gains et parrainages
- `POST /api/referrals/request-payout` - Demander un paiement

## 📱 Nouvelles pages

### Page de parrainage (Premium Gold)
- URL : `/settings/referrals`
- Affiche le code de parrainage personnalisé
- Résumé des gains (disponible, en attente, payé)
- Historique des parrainages
- Bouton pour demander un paiement

### Page d'abonnement mise à jour
- URL : `/settings/subscription`
- Support du paramètre `?ref=CODE` pour pré-remplir le code de parrainage
- Nouveaux prix affichés
- Suppression des mentions d'engagement de 12 mois

## 🚀 Déploiement

### 1. Préparer l'environnement

```bash
# Sur Vercel (ou votre plateforme)
vercel env add STRIPE_PRICE_SILVER_MONTHLY
vercel env add STRIPE_PRICE_SILVER_ANNUAL
vercel env add STRIPE_PRICE_GOLD_ANNUAL
vercel env add STRIPE_GOLD_PROMO_ACTIVE
```

### 2. Exécuter les migrations

```bash
# Via Supabase Dashboard ou CLI
supabase db push
```

### 3. Déployer le code

```bash
git add .
git commit -m "feat: Add referral system and update subscription plans"
git push origin main
```

### 4. Vérifications post-déploiement

- [ ] Tester la création d'un code de parrainage pour un utilisateur Gold
- [ ] Tester la validation d'un code de parrainage
- [ ] Tester l'inscription avec un code de parrainage
- [ ] Vérifier que la commission est bien enregistrée
- [ ] Tester la demande de paiement
- [ ] Vérifier les emails d'automatisation

## 🔄 Migration des utilisateurs existants

### Utilisateurs avec engagement en cours

Les utilisateurs actuels avec un engagement de 12 mois en cours ne seront PAS affectés. Leurs champs `commitment_end_date` resteront valides jusqu'à la fin de leur engagement.

Après la fin de l'engagement, lors du prochain renouvellement :
- Les champs `commitment_end_date` et `commitment_cycle_number` seront réinitialisés à `NULL`
- L'abonnement continuera sans engagement

### Codes de parrainage pour les Gold existants

Un trigger automatique créera un code de parrainage pour tous les utilisateurs Premium Gold existants dès qu'ils se connectent après le déploiement.

## 📊 Gestion des paiements de parrainage (Admin)

Pour traiter manuellement les demandes de paiement :

1. Connectez-vous à Supabase Dashboard
2. Allez dans la table `referral_payouts`
3. Filtrez par `payout_status = 'requested'`
4. Pour chaque demande :
   - Effectuez le virement bancaire au montant indiqué
   - Mettez à jour le statut :
     ```sql
     UPDATE referral_payouts
     SET payout_status = 'completed',
         completed_at = NOW()
     WHERE id = 'xxx';
     ```
   - Mettez à jour les transactions liées :
     ```sql
     UPDATE referral_transactions
     SET commission_status = 'paid'
     WHERE id = ANY(
       SELECT unnest(transaction_ids)
       FROM referral_payouts
       WHERE id = 'xxx'
     );
     ```

## 🎯 Promotion Gold à 399€

Pour activer la promotion :

```bash
# Mettre la variable d'environnement à true
vercel env add STRIPE_GOLD_PROMO_ACTIVE true

# Redéployer
vercel --prod
```

Pour désactiver :

```bash
vercel env add STRIPE_GOLD_PROMO_ACTIVE false
vercel --prod
```

## 📞 Support

Pour toute question :
- Consulter les logs Vercel
- Consulter les webhooks Stripe Dashboard
- Consulter les logs Supabase

## ✅ Checklist de déploiement

- [ ] Migrations SQL exécutées
- [ ] Prix Stripe créés
- [ ] Variables d'environnement configurées
- [ ] Portail client Stripe mis à jour
- [ ] Code déployé
- [ ] Tests de validation effectués
- [ ] Documentation partagée avec l'équipe
- [ ] Automatisations email configurées
