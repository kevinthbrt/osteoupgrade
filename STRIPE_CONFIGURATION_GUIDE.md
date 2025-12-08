# 🔧 Guide de Configuration Stripe - Système d'Engagement

Ce guide vous explique **exactement** quoi cocher et configurer dans Stripe Dashboard pour que le système d'engagement fonctionne parfaitement.

---

## 📋 Table des matières

1. [Créer les produits et prix](#1-créer-les-produits-et-prix)
2. [Configurer les 2 portails clients](#2-configurer-les-2-portails-clients)
3. [Configurer le webhook](#3-configurer-le-webhook)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Tester la configuration](#5-tester-la-configuration)

---

## 1️⃣ Créer les Produits et Prix

### Étape 1.1 : Créer le produit Premium Silver

1. Allez dans **Dashboard Stripe** → **Produits** → **Ajouter un produit**
2. Remplissez :
   ```
   Nom : Premium Silver
   Description : Accès complet aux modules OsteoUpgrade
   ```
3. **Prix** :
   ```
   Modèle de prix : Récurrent
   Prix : 29,99 €
   Période de facturation : Mensuelle
   ```
4. **Options avancées** (cliquez sur "Afficher plus d'options") :
   - ☑️ **Cochez** : "Ce prix requiert un engagement minimum"
     - Durée : **12 mois**
   - ☐ **Ne cochez PAS** : "Autoriser plusieurs abonnements par client"
5. Cliquez sur **Enregistrer le produit**
6. **IMPORTANT** : Notez le `price_id` qui commence par `price_...`

### Étape 1.2 : Créer le produit Premium Gold

Répétez les mêmes étapes avec :
```
Nom : Premium Gold
Prix : 49,99 €
Période : Mensuelle
Engagement : 12 mois
```

Notez également le `price_id` de Gold.

---

## 2️⃣ Configurer les 2 Portails Clients

C'est **LA PARTIE LA PLUS IMPORTANTE** pour que l'engagement fonctionne !

### Étape 2.1 : Créer la configuration "ENGAGEMENT" (période de 12 mois)

1. Allez dans **Paramètres** → **Portail client** → **Ajouter une configuration**

2. **Nom de la configuration** :
   ```
   Nom : Configuration Engagement (12 mois)
   Description : Portail sans annulation pendant l'engagement
   ```

3. **Onglet "Fonctionnalités"** :

   #### 📧 Informations du client
   - ☑️ **Activer** : Mettre à jour les informations de contact
   - ☑️ **Activer** : Mettre à jour l'adresse de facturation

   #### 💳 Méthodes de paiement
   - ☑️ **Activer** : Mettre à jour la méthode de paiement
   - ☑️ **Activer** : Ajouter une nouvelle méthode de paiement

   #### 📄 Factures
   - ☑️ **Activer** : Afficher l'historique de facturation
   - ☑️ **Activer** : Télécharger les factures

   #### ❌ Abonnements → **ANNULATION**
   - ☐ **DÉSACTIVER** : Annuler les abonnements
   - **Message personnalisé à afficher** :
     ```
     Vous êtes actuellement engagé sur une période de 12 mois minimum.
     Vous pourrez annuler votre abonnement à partir de la date de fin
     de votre engagement. Un email de rappel vous sera envoyé 7 jours
     avant cette date.

     Pour toute question, contactez-nous à contact@votre-domaine.com
     ```

   #### 📝 Abonnements → **CHANGEMENT D'ABONNEMENT**
   - ☑️ **Activer** : Changer d'abonnement
   - Options :
     - ☑️ Autoriser le passage à Silver → Gold
     - ☑️ Autoriser le passage à Gold → Silver
     - Proratisation : **Proratiser au moment du changement**

4. **Onglet "Informations commerciales"** :
   ```
   Nom de l'entreprise : OsteoUpgrade
   Lien vers les conditions d'utilisation : https://votre-domaine.com/cgu
   Lien vers la politique de confidentialité : https://votre-domaine.com/politique-confidentialite
   ```

5. **Enregistrer** la configuration

6. **IMPORTANT** : Notez le **Configuration ID** qui commence par `bpc_...`
   → C'est votre `STRIPE_PORTAL_CONFIG_ENGAGEMENT`

---

### Étape 2.2 : Créer la configuration "LIBRE" (après 12 mois)

1. **Dupliquer** la configuration précédente ou créer une nouvelle

2. **Nom de la configuration** :
   ```
   Nom : Configuration Libre (après engagement)
   Description : Portail avec annulation autorisée
   ```

3. **Onglet "Fonctionnalités"** :

   Tout identique SAUF :

   #### ✅ Abonnements → **ANNULATION**
   - ☑️ **ACTIVER** : Annuler les abonnements
   - **Options d'annulation** :
     - ☑️ **Annuler immédiatement** : Autoriser
     - ☑️ **Annuler à la fin de la période de facturation** : Autoriser (recommandé)
     - Comportement par défaut : **À la fin de la période de facturation**

   - **Motifs d'annulation** (cochez tous) :
     - ☑️ Trop cher
     - ☑️ Fonctionnalités manquantes
     - ☑️ Service changé
     - ☑️ Non utilisé
     - ☑️ Expérience client
     - ☑️ Trop complexe
     - ☑️ Autre

   - **Message avant annulation** :
     ```
     Vous êtes sur le point d'annuler votre abonnement Premium.

     Votre accès restera actif jusqu'à la fin de votre période de
     facturation en cours. Vous ne serez plus facturé après cette date.

     Êtes-vous sûr de vouloir continuer ?
     ```

   - **Offres de rétention** (optionnel) :
     - Vous pouvez proposer une réduction pour retenir le client
     - Exemple : "-20% pendant 3 mois si vous restez"

4. **Enregistrer** la configuration

5. **IMPORTANT** : Notez le **Configuration ID** qui commence par `bpc_...`
   → C'est votre `STRIPE_PORTAL_CONFIG_LIBRE`

---

## 3️⃣ Configurer le Webhook

### Étape 3.1 : Créer l'endpoint webhook

1. Allez dans **Développeurs** → **Webhooks** → **Ajouter un endpoint**

2. **URL de l'endpoint** :
   ```
   https://votre-domaine.com/api/stripe/webhook
   ```

3. **Événements à écouter** :

   Cliquez sur **Sélectionner les événements** et cochez :

   - ☑️ `checkout.session.completed` - Nouvelle souscription
   - ☑️ `customer.subscription.updated` - Abonnement modifié
   - ☑️ `customer.subscription.deleted` - Abonnement annulé
   - ☑️ `invoice.payment_succeeded` - Paiement réussi (renouvellement)
   - ☑️ `invoice.payment_failed` - Paiement échoué

4. **Version de l'API** :
   - Utilisez la **version la plus récente** (recommandé)

5. **Enregistrer** l'endpoint

6. **IMPORTANT** : Cliquez sur votre webhook puis **Révéler** le secret de signature
   → C'est votre `STRIPE_WEBHOOK_SECRET` qui commence par `whsec_...`

---

### Étape 3.2 : Tester le webhook localement

Si vous développez en local :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Transférer les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 4️⃣ Variables d'Environnement

Créez un fichier `.env.local` (si pas déjà fait) et ajoutez :

```bash
# ============================================
# Stripe Configuration
# ============================================

# Clés API Stripe (Test ou Live)
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # ou pk_live_...

# Prix IDs des abonnements
STRIPE_PRICE_SILVER=price_... # ID du prix Silver (29,99€/mois)
STRIPE_PRICE_GOLD=price_... # ID du prix Gold (49,99€/mois)

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_... # Secret du webhook

# Configurations du Portail Client
STRIPE_PORTAL_CONFIG_ENGAGEMENT=bpc_... # Configuration avec annulation bloquée
STRIPE_PORTAL_CONFIG_LIBRE=bpc_... # Configuration avec annulation autorisée

# Cron Job Secret (pour sécuriser l'endpoint de vérification des renouvellements)
CRON_SECRET=votre_token_secret_ultra_securise_aleatoire

# URL de votre application
NEXT_PUBLIC_URL=https://votre-domaine.com # ou http://localhost:3000 en dev
```

### Générer le CRON_SECRET

```bash
# Sur Mac/Linux
openssl rand -base64 32

# Résultat : utilisez cette chaîne pour CRON_SECRET
```

---

## 5️⃣ Tester la Configuration

### Test 1 : Souscription à un abonnement

1. Allez sur `/settings/subscription`
2. Cliquez sur **Choisir Silver** ou **Choisir Gold**
3. Utilisez une carte de test :
   ```
   Numéro : 4242 4242 4242 4242
   Expiration : 12/34
   CVC : 123
   ```
4. Validez le paiement
5. Vérifiez dans Stripe Dashboard → **Clients** que le client a été créé
6. Vérifiez dans Supabase que le profil a été mis à jour avec :
   - `role` = `premium_silver` ou `premium_gold`
   - `commitment_end_date` = date actuelle + 12 mois
   - `commitment_cycle_number` = 1
   - `commitment_renewal_notification_sent` = false

### Test 2 : Portail client PENDANT l'engagement

1. Allez sur `/settings/subscription`
2. Cliquez sur **Gérer mon abonnement**
3. Vérifiez que vous voyez le message d'engagement
4. Vérifiez que le bouton "Annuler l'abonnement" n'existe PAS

### Test 3 : Portail client APRÈS l'engagement

**Pour tester sans attendre 12 mois** :

1. Allez dans Supabase SQL Editor
2. Exécutez :
   ```sql
   UPDATE profiles
   SET commitment_end_date = NOW() - INTERVAL '1 day'
   WHERE id = 'votre-user-id';
   ```
3. Retournez sur `/settings/subscription`
4. Cliquez sur **Gérer mon abonnement**
5. Vérifiez que maintenant vous voyez le bouton **Annuler l'abonnement**

### Test 4 : Webhook de paiement

1. Dans Stripe Dashboard → **Développeurs** → **Webhooks**
2. Cliquez sur votre webhook
3. Onglet **Tester**
4. Sélectionnez `invoice.payment_succeeded`
5. Modifiez le JSON pour mettre un `subscription` existant
6. Cliquez sur **Envoyer l'événement test**
7. Vérifiez les logs dans Vercel ou votre console

### Test 5 : Cron job de notification

1. Testez manuellement l'endpoint :
   ```bash
   curl -X GET https://votre-domaine.com/api/subscriptions/check-renewals \
     -H "Authorization: Bearer VOTRE_CRON_SECRET"
   ```
2. Vérifiez la réponse JSON
3. Vérifiez dans les logs que les notifications sont détectées

---

## ✅ Checklist finale

Avant de passer en production :

- [ ] ✅ Les 2 produits (Silver et Gold) sont créés avec les bons prix
- [ ] ✅ Les 2 configurations de portail sont créées (engagement + libre)
- [ ] ✅ Le webhook est configuré avec tous les événements
- [ ] ✅ Toutes les variables d'environnement sont définies dans Vercel
- [ ] ✅ Les CGU sont complètes et accessibles sur `/cgu`
- [ ] ✅ La migration SQL a été exécutée dans Supabase
- [ ] ✅ Le cron job Vercel est configuré (via `vercel.json`)
- [ ] ✅ Les emails d'automatisation sont créés ("Renouvellement imminent" et "Renouvellement effectué")
- [ ] ✅ La page d'abonnement affiche correctement le statut d'engagement
- [ ] ✅ Le portail client change bien selon la période d'engagement
- [ ] ✅ Les paiements de test fonctionnent correctement

---

## 🚨 Points d'attention

### Sécurité

1. **Toujours vérifier** la signature du webhook :
   ```typescript
   const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
   ```

2. **Sécuriser** l'endpoint du cron job avec `CRON_SECRET`

3. **Ne jamais exposer** les clés secrètes dans le code frontend

### Conformité légale

1. ✅ Les CGU doivent mentionner clairement l'engagement de 12 mois
2. ✅ Le droit de rétractation de 14 jours doit être respecté
3. ✅ L'utilisateur doit accepter les CGU avant la souscription
4. ✅ Le renouvellement automatique doit être mentionné
5. ✅ La notification 7 jours avant le renouvellement est obligatoire

### Support client

Préparez des réponses types pour :
- "Je veux annuler avant 12 mois"
  → Expliquer l'engagement, proposer alternatives (pause, changement de plan)
- "Je n'ai pas reçu l'email de renouvellement"
  → Vérifier dans les logs du cron job
- "Mon paiement a échoué"
  → Vérifier la méthode de paiement dans Stripe

---

## 🆘 Dépannage

### Le portail ne bloque pas l'annulation

- Vérifiez que `STRIPE_PORTAL_CONFIG_ENGAGEMENT` est correct
- Vérifiez que `commitment_end_date` est bien dans le futur
- Vérifiez les logs de `/api/stripe/portal` dans Vercel

### Le webhook ne reçoit pas les événements

- Vérifiez que l'URL du webhook est accessible publiquement
- Vérifiez dans Stripe Dashboard → Webhooks → Logs des événements
- Testez avec `stripe listen` en local

### Les notifications ne sont pas envoyées

- Vérifiez que le cron job s'exécute bien (logs Vercel)
- Vérifiez que `CRON_SECRET` est correct
- Vérifiez les dates dans `commitment_end_date`

---

## 📚 Ressources

- [Documentation Stripe Billing](https://stripe.com/docs/billing)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

**Besoin d'aide ?** Consultez les logs dans :
- Vercel → Functions → Logs
- Stripe Dashboard → Webhooks → Logs
- Supabase → Logs

**Date de mise à jour** : 2025-12-08
