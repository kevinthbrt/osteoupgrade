# ✅ Checklist Système de Parrainage - OsteoUpgrade

## 📋 Configuration Stripe (CRITIQUE)

### 1. Créer les Prix Stripe dans le Dashboard
🔗 https://dashboard.stripe.com/products

Vous devez créer **4 prix différents** dans Stripe :

#### Prix Silver :
- [ ] **Silver Mensuel** : 29€/mois (2900 centimes)
  - Type : Récurrent
  - Fréquence : Mensuel
  - Note : Copier l'ID du prix → `STRIPE_PRICE_SILVER_MONTHLY`

- [ ] **Silver Annuel** : 240€/an (24000 centimes)
  - Type : Récurrent
  - Fréquence : Annuel
  - Note : Copier l'ID du prix → `STRIPE_PRICE_SILVER_ANNUAL`

#### Prix Gold :
- [ ] **Gold Annuel Normal** : 499€/an (49900 centimes)
  - Type : Récurrent
  - Fréquence : Annuel
  - Note : Copier l'ID du prix → `STRIPE_PRICE_GOLD_ANNUAL`

- [ ] **Gold Annuel Promo** : 399€/an (39900 centimes)
  - Type : Récurrent
  - Fréquence : Annuel
  - Note : Copier l'ID du prix → `STRIPE_PRICE_GOLD_ANNUAL_PROMO`

### 2. Configuration des Variables d'Environnement Stripe

Fichier : `.env.local` (développement) et Vercel (production)

```bash
# Clés Stripe (Dashboard → Développeurs → Clés API)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Webhook Stripe (Dashboard → Développeurs → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Prix Stripe - Silver
STRIPE_PRICE_SILVER_MONTHLY=price_xxxxxxxxxxxxx  # Prix 29€/mois
STRIPE_PRICE_SILVER_ANNUAL=price_xxxxxxxxxxxxx   # Prix 240€/an

# Prix Stripe - Gold
STRIPE_PRICE_GOLD_ANNUAL=price_xxxxxxxxxxxxx         # Prix 499€/an (normal)
STRIPE_PRICE_GOLD_ANNUAL_PROMO=price_xxxxxxxxxxxxx  # Prix 399€/an (promo)

# Promotion Gold (true = prix promo 399€, false = prix normal 499€)
STRIPE_GOLD_PROMO_ACTIVE=false
NEXT_PUBLIC_GOLD_PROMO_ACTIVE=false  # Même valeur que ci-dessus
```

### 3. Configurer le Webhook Stripe

🔗 https://dashboard.stripe.com/webhooks

- [ ] Créer un nouveau endpoint webhook
- [ ] URL : `https://votre-domaine.com/api/stripe/webhook`
- [ ] Sélectionner les événements à écouter :
  - [x] `checkout.session.completed`
  - [x] `customer.subscription.created`
  - [x] `customer.subscription.updated`
  - [x] `customer.subscription.deleted`
- [ ] Copier le **signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 🗄️ Base de Données Supabase

### 4. Exécuter la Migration SQL

Fichier : `supabase/migrations/20260107_add_referral_system.sql`

**Dans Supabase Dashboard → SQL Editor :**

- [ ] Se connecter à Supabase : https://supabase.com/dashboard
- [ ] Sélectionner votre projet `osteoupgrade`
- [ ] Aller dans **SQL Editor** (menu gauche)
- [ ] Copier-coller le contenu du fichier `20260107_add_referral_system.sql`
- [ ] Cliquer sur **Run** pour exécuter la migration
- [ ] Vérifier qu'il n'y a pas d'erreurs

**Tables créées :**
- ✅ `referral_codes` - Codes de parrainage uniques
- ✅ `referral_transactions` - Historique des commissions
- ✅ `referral_payouts` - Demandes de paiement
- ✅ `referral_earnings_summary` - Vue récapitulative

**Triggers créés :**
- ✅ Génération automatique du code de parrainage quand un utilisateur devient Gold

### 5. Vérifier les Permissions RLS (Row Level Security)

Dans Supabase Dashboard → Authentication → Policies :

- [ ] Vérifier que les politiques RLS existent pour :
  - `referral_codes` : Les utilisateurs peuvent voir leur propre code
  - `referral_transactions` : Les utilisateurs peuvent voir leurs propres transactions
  - `referral_payouts` : Les utilisateurs peuvent voir et créer leurs demandes de paiement

---

## 📧 Configuration Emails (Resend)

### 6. Configurer le Domaine dans Resend

Suivre le guide : `RESEND_ADMIN_EMAIL_SETUP.md`

- [ ] Ajouter le domaine `osteo-upgrade.fr` dans Resend
- [ ] Configurer les 3 enregistrements DNS (TXT, MX, DKIM)
- [ ] Attendre la vérification du domaine (10-30 minutes)
- [ ] Vérifier que le statut passe à "Verified" ✅

### 7. Variables d'Environnement Email

```bash
# Resend API (Dashboard → API Keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email admin pour les notifications
ADMIN_EMAIL=admin@osteo-upgrade.fr
# OU votre email personnel
ADMIN_EMAIL=votre-email@gmail.com

# URL du site
NEXT_PUBLIC_URL=https://osteoupgrade.com
```

### 8. Créer les Automations Email

Dans votre système d'automatisation (Resend/Brevo/autre) :

- [ ] **"Passage à Premium Gold"**
  - Déclencheur : API call avec event `Passage à Premium Gold`
  - Contenu : Bienvenue + afficher le code de parrainage (`{{code_parrainage}}`)

- [ ] **"Nouveau parrainage"** (Pour le PARRAIN)
  - Déclencheur : API call avec event `Nouveau parrainage`
  - Contenu : Notification de commission gagnée (`{{commission}}€`) pour avoir parrainé `{{referred_user}}`

- [ ] **"Bonus parrainage filleul"** (Pour le FILLEUL) 🆕
  - Déclencheur : API call avec event `Bonus parrainage filleul`
  - Contenu : Félicitations ! Vous recevez `{{commission}}€` (10% de votre abonnement) pour avoir utilisé un code de parrainage

- [ ] **"Demande de paiement parrainage"**
  - Déclencheur : API call avec event `Demande de paiement parrainage`
  - Destinataire : Admin (`ADMIN_EMAIL`)
  - Contenu : Demande de paiement de `{{prenom}} {{nom}}` pour `{{montant}}€`

- [ ] **"Paiement parrainage effectué"**
  - Déclencheur : API call avec event `Paiement parrainage effectué`
  - Contenu : Confirmation du virement de `{{montant}}€` effectué le `{{date_paiement}}`

---

## 🔐 Variables d'Environnement Supabase

### 9. Configuration Supabase

```bash
# Supabase (Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚙️ Déploiement Vercel

### 10. Configurer les Variables d'Environnement dans Vercel

🔗 https://vercel.com/dashboard → Votre projet → Settings → Environment Variables

**Ajouter TOUTES les variables ci-dessus :**

- [ ] Variables Stripe (8 variables)
- [ ] Variables Supabase (3 variables)
- [ ] Variables Email (3 variables)

**Commandes :**
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... etc pour toutes les variables
```

### 11. Redéployer l'Application

```bash
# Option 1 : Via Git (recommandé)
git push origin claude/add-referral-system-wfW1t

# Option 2 : Via CLI Vercel
vercel --prod
```

---

## 🎁 Nouvelles Fonctionnalités du Système de Parrainage

### ✨ Commission Double Win-Win (Parrain + Filleul)

**Quand un utilisateur s'abonne avec un code de parrainage :**

1. **Le PARRAIN reçoit** : 10% de commission sur l'abonnement annuel
   - Exemple : Abonnement Gold à 499€ → Le parrain gagne **49,90€**

2. **Le FILLEUL reçoit AUSSI** : 10% de commission sur son propre achat ! 🎉
   - Exemple : Abonnement Gold à 499€ → Le filleul gagne **49,90€**

**Résultat :**
- Sur un abonnement Gold à 499€ avec code de parrainage :
  - Parrain : +49,90€ dans sa cagnotte
  - Filleul : +49,90€ dans sa cagnotte
  - **Total des commissions : 99,80€** (partagé entre les deux)

**Pourquoi ce système ?**
- Incite fortement les nouveaux utilisateurs à **utiliser** un code de parrainage
- Crée un cercle vertueux : tout le monde y gagne
- Les filleuls deviennent Gold et peuvent à leur tour parrainer

### 🚫 Contrainte de Parrainage UNIQUE (IMPÉRATIF)

**Règle stricte :** Un utilisateur ne peut être parrainé **qu'UNE SEULE FOIS AU TOTAL**.

**Vérifications automatiques :**
1. Avant de valider un code de parrainage au checkout
2. Le système vérifie si l'utilisateur a **DÉJÀ été parrainé** (peu importe la date)
3. Si OUI → Message d'erreur : "Vous avez déjà été parrainé"
4. Si NON → Le code est accepté et les commissions sont créées

**Cas d'usage :**
- Utilisateur parrainé en 2026 → **Ne pourra JAMAIS être parrainé à nouveau**
- Un seul parrainage par compte, à vie

**Protection contre les abus :**
- Empêche les utilisateurs de se créer plusieurs comptes pour accumuler les bonus
- Limite absolue : **1 parrainage reçu par utilisateur, pour toujours**
- Pas de renouvellement possible

---

## 🧪 Tests à Effectuer

### 12. Test de Création de Code de Parrainage

- [ ] Créer un compte test
- [ ] Souscrire à Premium Gold (mode test Stripe)
- [ ] Aller sur `/dashboard` → vérifier que la section "Espace Ambassadeur" apparaît
- [ ] Vérifier que le code de parrainage est généré automatiquement
- [ ] Copier le code et vérifier qu'il s'affiche correctement

### 13. Test de Parrainage

- [ ] Créer un deuxième compte test
- [ ] Aller sur `/settings/subscription`
- [ ] Entrer le code de parrainage du premier compte
- [ ] Vérifier que le code est validé (message vert)
- [ ] Souscrire à un abonnement ANNUEL (Silver 240€ ou Gold 499€)
- [ ] Vérifier la redirection vers Stripe Checkout

### 14. Test de Commission

Après un paiement test réussi :

- [ ] Se connecter avec le compte parrain
- [ ] Aller sur `/settings/referrals`
- [ ] Vérifier que la transaction apparaît
- [ ] Vérifier le montant de la commission (10% de l'abonnement)
- [ ] Vérifier que la cagnotte est mise à jour

### 15. Test de Demande de Paiement

- [ ] Accumuler au moins 10€ de commission (ou ajuster manuellement en DB)
- [ ] Cliquer sur "Demander un paiement"
- [ ] Uploader un RIB (PDF, JPG ou PNG, max 5MB)
- [ ] Soumettre la demande
- [ ] Vérifier que l'admin reçoit l'email de notification

### 16. Test Admin de Gestion des Paiements

- [ ] Se connecter en tant qu'admin
- [ ] Aller sur `/admin/referral-payouts`
- [ ] Vérifier que la demande de paiement apparaît
- [ ] Cliquer sur "Voir le RIB" pour télécharger
- [ ] Marquer comme "Payé"
- [ ] Vérifier que l'utilisateur reçoit l'email de confirmation

### 17. Test Commission Double (Parrain + Filleul) 🆕

- [ ] Créer un compte test A (sera le parrain)
- [ ] Souscrire A à Premium Gold (499€ annuel)
- [ ] Noter le code de parrainage de A (ex: `JEAN1234`)
- [ ] Créer un compte test B (sera le filleul)
- [ ] Aller sur `/settings/subscription` avec le compte B
- [ ] Entrer le code `JEAN1234` dans l'input de parrainage
- [ ] Souscrire B à un abonnement annuel (Silver 240€ ou Gold 499€)

**Vérifications après paiement :**
- [ ] Se connecter avec le compte A (parrain)
  - [ ] Vérifier que sa cagnotte a augmenté de 10% (24€ ou 49,90€)
  - [ ] Vérifier qu'une transaction apparaît dans `/settings/referrals`
- [ ] Se connecter avec le compte B (filleul)
  - [ ] **Vérifier que sa cagnotte contient AUSSI 10% de son propre achat**
  - [ ] Vérifier qu'une transaction "self-referral" apparaît
  - [ ] Si Gold : Vérifier que son code de parrainage est généré

### 18. Test Contrainte UNIQUE (1 parrainage TOTAL, pas par an) 🆕

**Scénario 1 : Premier parrainage (jamais parrainé avant)**
- [ ] Créer un compte test C (nouveau, jamais parrainé)
- [ ] Utiliser un code de parrainage valide
- [ ] Souscrire à un abonnement annuel
- [ ] ✅ Le paiement doit passer sans problème
- [ ] ✅ Les 2 commissions doivent être créées (parrain + filleul)

**Scénario 2 : Tentative de second parrainage (JAMAIS possible)**
- [ ] Avec le MÊME compte test C
- [ ] Annuler l'abonnement dans Stripe
- [ ] Attendre quelques jours/mois (peu importe)
- [ ] Essayer d'utiliser un AUTRE code de parrainage valide
- [ ] ❌ Le système doit BLOQUER avec le message :
  ```
  "Vous avez déjà été parrainé"
  "Un utilisateur ne peut être parrainé qu'une seule fois au total."
  ```
- [ ] Vérifier qu'on ne peut absolument PAS passer au paiement

**Scénario 3 : Protection contre auto-parrainage**
- [ ] Créer un compte Premium Gold D
- [ ] Noter son code de parrainage
- [ ] Essayer d'utiliser SON PROPRE code
- [ ] ❌ Le système doit BLOQUER avec le message :
  ```
  "Vous ne pouvez pas utiliser votre propre code de parrainage"
  ```

---

## 📊 Vérifications Post-Déploiement

### 19. Vérifications Finales

**Système de base :**
- [ ] **Génération automatique** : Les codes sont créés automatiquement pour les nouveaux Gold
- [ ] **Commissions parrain** : Les commissions de 10% sont bien calculées (UNIQUEMENT sur les abonnements annuels)
- [ ] **Cagnotte** : Les montants sont affichés correctement en euros
- [ ] **Minimum paiement** : Le bouton de demande est désactivé si < 10€
- [ ] **Upload RIB** : Les fichiers sont bien stockés en base64
- [ ] **Emails admin** : Les notifications arrivent bien à `ADMIN_EMAIL`
- [ ] **Emails utilisateurs** : Les confirmations de paiement sont envoyées
- [ ] **Dashboard** : L'espace Ambassadeur s'affiche uniquement pour les Gold
- [ ] **Page abonnement** : L'input de code de parrainage fonctionne

**Nouvelles fonctionnalités 🆕 :**
- [ ] **Commission filleul** : Le filleul reçoit AUSSI 10% dans sa cagnotte
- [ ] **Double transaction** : 2 transactions créées (parrain + filleul) lors d'un parrainage
- [ ] **Email bonus filleul** : Le filleul reçoit l'email "Bonus parrainage filleul"
- [ ] **Contrainte UNIQUE** : Impossible d'être parrainé 2 fois (JAMAIS, pas juste par an)
- [ ] **Protection auto-parrainage** : Impossible d'utiliser son propre code
- [ ] **Message d'erreur** : Messages clairs si contraintes non respectées

---

## 🚨 Points Critiques à Ne Pas Oublier

### ⚠️ IMPORTANT - Stripe

1. **Créer les 4 prix différents dans Stripe Dashboard** (c'est souvent oublié !)
2. **Configurer le webhook Stripe** avec la bonne URL et les bons événements
3. **Mode Test vs Production** : Utiliser les bonnes clés selon l'environnement

### ⚠️ IMPORTANT - Base de Données

1. **Exécuter la migration SQL** dans Supabase SQL Editor
2. **Vérifier que le trigger fonctionne** : Tester la création d'un compte Gold

### ⚠️ IMPORTANT - Emails

1. **Vérifier le domaine** dans Resend avant d'envoyer des emails
2. **Configurer ADMIN_EMAIL** pour recevoir les notifications de demande de paiement

### ⚠️ IMPORTANT - Variables d'Environnement

1. **Les variables `NEXT_PUBLIC_*`** doivent être identiques en dev et prod
2. **Redéployer après chaque changement** de variable d'environnement
3. **Ne JAMAIS commiter** les variables dans Git (fichier `.env.local` ignoré)

---

## 📞 Support

**Si quelque chose ne fonctionne pas :**

1. Vérifier les logs Vercel : https://vercel.com/dashboard → Deployments → Functions
2. Vérifier les logs Stripe : https://dashboard.stripe.com/logs
3. Vérifier les logs Supabase : Dashboard → Logs
4. Vérifier que toutes les variables d'environnement sont bien configurées

**Ordre de diagnostic :**
1. ✅ Migration SQL exécutée ?
2. ✅ Variables Stripe configurées ?
3. ✅ Webhook Stripe configuré ?
4. ✅ Codes de parrainage générés automatiquement ?
5. ✅ Commissions créées lors des paiements ?

---

## ✅ Génération Automatique des Codes - CONFIRMÉ

**Question : Le code est-il bien généré automatiquement pour tous les Gold ?**

**✅ OUI, c'est automatique !**

Voici comment ça fonctionne :

1. **Quand un utilisateur devient Premium Gold**, le trigger SQL `trigger_create_referral_code_on_gold_upgrade` s'exécute automatiquement
2. Le trigger appelle la fonction `create_referral_code_for_gold_user()`
3. Cette fonction :
   - Génère un code unique basé sur le nom de l'utilisateur (4 premières lettres + 4 chiffres)
   - Vérifie que le code n'existe pas déjà
   - L'insère dans la table `referral_codes`

**Exemple :**
- Utilisateur : "Kevin Thibaut"
- Code généré : `KEVI1234` (KEVI + nombre aléatoire)

**Où est le code visible ?**
- Dashboard : Section "Espace Ambassadeur Gold" (automatiquement chargée)
- Page complète : `/settings/referrals`

**Pas besoin de faire quoi que ce soit manuellement !** 🎉

---

**Version:** 1.0
**Dernière mise à jour:** 7 janvier 2026
