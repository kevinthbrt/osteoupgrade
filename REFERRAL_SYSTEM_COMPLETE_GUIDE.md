# Guide Complet du Système de Parrainage - OsteoUpgrade

## 📋 Vue d'ensemble

Le système de parrainage permet aux membres Premium Gold de gagner des commissions en invitant de nouveaux utilisateurs.

### Caractéristiques principales
- ✅ Code de parrainage unique pour chaque membre Gold
- ✅ 10% de commission sur les abonnements annuels uniquement
- ✅ Upload de RIB obligatoire pour les demandes de paiement
- ✅ Dashboard admin complet pour gérer les paiements
- ✅ Emails automatiques à chaque étape

---

## 🔧 Configuration initiale

### 1. Variables d'environnement requises

```bash
# Stripe - Prix des abonnements
STRIPE_PRICE_SILVER_MONTHLY=price_xxx    # 29€/mois
STRIPE_PRICE_SILVER_ANNUAL=price_xxx     # 240€/an
STRIPE_PRICE_GOLD_ANNUAL=price_xxx       # 499€/an (prix normal)
STRIPE_PRICE_GOLD_ANNUAL_PROMO=price_xxx # 399€/an (prix promo - optionnel)

# Promotion Gold
STRIPE_GOLD_PROMO_ACTIVE=false          # Mettre "true" pour activer la promo
NEXT_PUBLIC_GOLD_PROMO_ACTIVE=false     # Même valeur (pour le frontend)

# Autres
CRON_SECRET=xxx                          # Pour les tâches cron
ADMIN_EMAIL=admin@osteoupgrade.com       # Email admin pour notifications
```

### 2. Créer les prix dans Stripe

Vous devez créer **4 prix** dans Stripe Dashboard :

1. **Silver Mensuel** : 29€/mois, récurrent mensuel
2. **Silver Annuel** : 240€/an, récurrent annuel
3. **Gold Normal** : 499€/an, récurrent annuel
4. **Gold Promo** : 399€/an, récurrent annuel

### 3. Exécuter la migration SQL

Dans Supabase Dashboard > SQL Editor :

```sql
-- Exécuter le fichier
supabase/migrations/20260107_add_referral_system.sql
```

Cette migration créera :
- `referral_codes` - Codes de parrainage
- `referral_transactions` - Historique des commissions
- `referral_payouts` - Demandes et paiements
- `referral_earnings_summary` - Vue des gains
- Trigger automatique pour créer les codes

---

## 💰 Système de promotion Gold (499€ → 399€)

### Comment ça marche

Le système utilise **deux prix Stripe différents** :
- Prix normal : `STRIPE_PRICE_GOLD_ANNUAL` (499€)
- Prix promo : `STRIPE_PRICE_GOLD_ANNUAL_PROMO` (399€)

### Activer la promotion

```bash
# Sur Vercel
vercel env add STRIPE_GOLD_PROMO_ACTIVE true
vercel env add NEXT_PUBLIC_GOLD_PROMO_ACTIVE true

# Redéployer
vercel --prod
```

**Résultat :**
- Le prix affiché change à 399€ avec un badge "🔥 OFFRE LIMITÉE -100€"
- Stripe facture automatiquement 399€ au lieu de 499€
- Les commissions de parrainage sont calculées sur 399€ (39,90€)

### Désactiver la promotion

```bash
vercel env add STRIPE_GOLD_PROMO_ACTIVE false
vercel env add NEXT_PUBLIC_GOLD_PROMO_ACTIVE false
vercel --prod
```

---

## 🎯 Flux utilisateur - Parrainage

### Pour le parrain (membre Gold)

1. **Obtenir son code**
   - Aller sur `/settings/referrals`
   - Le code est généré automatiquement (ex: `KEVI1234`)
   - Copier le code ou le lien de parrainage

2. **Partager**
   - Partager le lien : `https://osteoupgrade.com/settings/subscription?ref=KEVI1234`
   - Ou donner le code manuellement

3. **Gagner des commissions**
   - Quand quelqu'un s'inscrit avec le code (abonnement annuel uniquement)
   - La commission (10%) est immédiatement disponible
   - Visible dans le dashboard de parrainage

4. **Réclamer ses gains**
   - Minimum 10€ requis
   - Cliquer sur "Demander un paiement"
   - **Joindre son RIB** (PDF, JPG ou PNG - max 5MB)
   - La demande est envoyée aux admins

### Pour le filleul (nouveau membre)

1. **Accéder à la page d'abonnement**
   - Via le lien du parrain : `?ref=CODE`
   - Ou entrer le code manuellement

2. **Validation du code**
   - Le code est validé en temps réel
   - Message : "Code valide ! Parrainé par [Nom]"

3. **Souscrire**
   - Choisir un abonnement **ANNUEL** (Silver ou Gold)
   - Les abonnements mensuels ne génèrent PAS de commission
   - Procéder au paiement Stripe

---

## 👨‍💼 Dashboard Admin - Gestion des paiements

### Accès

URL : `/admin/referral-payouts` (réservé aux admins)

### Fonctionnalités

**1. Vue d'ensemble**
- Nombre de demandes en attente
- Nombre de paiements complétés
- Montant total en attente

**2. Demandes en attente**
- Liste de toutes les demandes `requested`
- Bouton "Voir le RIB" - Ouvre le RIB dans un nouvel onglet
- Bouton "Marquer comme payé"

**3. Marquer un paiement comme complété**
- Clique sur "Marquer comme payé"
- Visualiser les détails du paiement
- Ajouter des notes (optionnel)
- Confirmer

**Résultat automatique :**
- Le statut passe à `completed`
- Les transactions sont marquées comme `paid`
- **Email automatique** envoyé au bénéficiaire
- Le RIB reste accessible dans l'historique

**4. Historique**
- Liste de tous les paiements complétés
- Dates de demande et de paiement
- Accès aux RIBs archivés

### Télécharger un RIB

1. Cliquer sur "Voir le RIB"
2. Le RIB s'ouvre dans un nouvel onglet
3. Utiliser le lien "Télécharger le fichier" en bas de page

---

## 📧 Automatisations email

### 1. Code de parrainage créé (nouveau Gold)

**Événement :** `Passage à Premium Gold`

**Variables disponibles :**
- `{nom}` : "Premium Gold"
- `{prix}` : "499€" ou "399€"
- `{interval}` : "annuel"
- `{date_fact}` : Date de la prochaine facture

**Contenu suggéré :**
```
Sujet : Bienvenue dans Premium Gold ! Voici votre code de parrainage 🎁

Bonjour,

Félicitations pour votre passage à Premium Gold !

🎯 VOTRE CODE DE PARRAINAGE

Vous pouvez maintenant inviter vos collègues et gagner des commissions !
Accédez à votre code ici : https://osteoupgrade.com/settings/referrals

💰 COMMENT ÇA MARCHE

• Partagez votre code unique avec vos collègues
• À chaque abonnement annuel souscrit avec votre code
• Vous gagnez 10% dans votre cagnotte
• Vous pouvez réclamer vos gains à tout moment (minimum 10€)

Bonne chance !
```

### 2. Nouveau parrainage

**Événement :** `Nouveau parrainage`

**Destinataire :** Le parrain

**Variables :**
- `{commission}` : Montant de la commission (ex: "24.00€")
- `{referred_user}` : Email du filleul
- `{plan}` : "Premium Silver" ou "Premium Gold"

**Contenu suggéré :**
```
Sujet : Nouveau parrainage ! +{commission} dans votre cagnotte 🎉

Bonjour,

Bonne nouvelle ! Quelqu'un vient de s'inscrire avec votre code de parrainage.

💰 VOTRE COMMISSION
{commission} vient d'être ajouté à votre cagnotte

📊 DÉTAILS
• Plan souscrit : {plan}
• Votre code a été utilisé par : {referred_user}

Consultez votre cagnotte : https://osteoupgrade.com/settings/referrals

Continuez à partager votre code !
```

### 3. Demande de paiement (vers l'admin)

**Événement :** `Demande de paiement parrainage`

**Destinataire :** Admin (`ADMIN_EMAIL`)

**Variables :**
- `{user_name}` : Nom complet
- `{user_email}` : Email
- `{amount}` : Montant demandé
- `{payout_id}` : ID de la demande

**Contenu suggéré :**
```
Sujet : [ACTION REQUISE] Nouvelle demande de paiement parrainage

Une nouvelle demande de paiement de parrainage a été reçue.

👤 UTILISATEUR
{user_name} ({user_email})

💰 MONTANT
{amount}

🔗 TRAITER LA DEMANDE
https://osteoupgrade.com/admin/referral-payouts

⚠️ N'oubliez pas de :
1. Télécharger le RIB
2. Effectuer le virement
3. Marquer comme payé dans le dashboard
```

### 4. Paiement effectué (vers le bénéficiaire)

**Événement :** `Paiement parrainage effectué`

**Destinataire :** Le bénéficiaire

**Variables :**
- `{montant}` : Montant payé
- `{date_paiement}` : Date du paiement

**Contenu suggéré :**
```
Sujet : Votre paiement de parrainage a été effectué ✅

Bonjour,

Bonne nouvelle ! Votre demande de paiement de parrainage a été traitée.

💸 PAIEMENT EFFECTUÉ
Montant : {montant}
Date : {date_paiement}

Le virement devrait apparaître sur votre compte bancaire sous 2-3 jours ouvrés.

Merci de votre confiance !
```

---

## 🔒 Sécurité et validations

### Côté utilisateur

**Demande de paiement :**
- ✅ Montant minimum : 10€
- ✅ RIB obligatoire (PDF, JPG, PNG)
- ✅ Taille max : 5MB
- ✅ Validation du format de fichier

**Code de parrainage :**
- ✅ Unique par utilisateur
- ✅ Généré automatiquement
- ✅ Validation en temps réel côté frontend
- ✅ Vérification côté serveur avant checkout

### Côté admin

**API Admin :**
- ✅ Authentification requise
- ✅ Vérification du rôle `admin`
- ✅ Accès refusé (403) si non-admin

**Données sensibles :**
- ✅ RIB stocké en base64 dans PostgreSQL
- ✅ Accessible uniquement aux admins
- ✅ Chiffrement SSL/TLS par Supabase

---

## 📊 Calcul des commissions

### Règles

1. **10% sur les abonnements annuels uniquement**
   - Silver Annuel (240€) → Commission: 24€
   - Gold Normal (499€) → Commission: 49,90€
   - Gold Promo (399€) → Commission: 39,90€

2. **Abonnements mensuels = 0€ de commission**
   - Pour éviter les abus
   - Encourage les abonnements annuels (meilleurs pour le business)

3. **Disponibilité immédiate**
   - La commission est `available` dès le paiement Stripe validé
   - Pas de période d'attente

4. **Statuts des commissions**
   - `pending` : En attente (demande de paiement créée)
   - `available` : Disponible pour retrait
   - `paid` : Payée au bénéficiaire
   - `cancelled` : Annulée (rare)

---

## 🐛 Troubleshooting

### "Code de parrainage invalide"

**Causes possibles :**
1. Le code n'existe pas dans la base
2. Le code est inactif (`is_active = false`)
3. L'utilisateur n'est plus Premium Gold

**Solution :**
```sql
-- Vérifier le code
SELECT * FROM referral_codes WHERE referral_code = 'CODE1234';

-- Réactiver si nécessaire
UPDATE referral_codes SET is_active = true WHERE referral_code = 'CODE1234';
```

### "Pas de commission créée"

**Causes :**
1. Abonnement mensuel (pas de commission)
2. Code invalide au moment du checkout
3. Erreur dans le webhook

**Vérifier :**
```sql
-- Voir les transactions du parrain
SELECT * FROM referral_transactions WHERE referrer_id = 'user_id';

-- Voir les logs Stripe webhook dans Vercel
```

### "RIB non accessible dans le dashboard admin"

**Cause :** Format de stockage base64 incorrect

**Solution :**
1. Demander à l'utilisateur de renvoyer le RIB
2. Vérifier que le fichier est bien encodé en base64

---

## 📈 Statistiques et rapports

### Requêtes SQL utiles

**Total des commissions payées :**
```sql
SELECT
  SUM(amount) / 100 as total_paid_euros,
  COUNT(*) as nb_payouts
FROM referral_payouts
WHERE payout_status = 'completed';
```

**Top 10 parrains :**
```sql
SELECT
  p.full_name,
  p.email,
  COUNT(rt.id) as total_referrals,
  SUM(rt.commission_amount) / 100 as total_earned_euros
FROM referral_transactions rt
JOIN profiles p ON rt.referrer_id = p.id
GROUP BY p.id, p.full_name, p.email
ORDER BY total_earned_euros DESC
LIMIT 10;
```

**Commissions en attente de paiement :**
```sql
SELECT
  SUM(amount) / 100 as total_pending_euros,
  COUNT(*) as nb_pending_payouts
FROM referral_payouts
WHERE payout_status = 'requested';
```

---

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées (Stripe, promo)
- [ ] 4 prix créés dans Stripe Dashboard
- [ ] Migration SQL exécutée dans Supabase
- [ ] Code poussé et déployé sur Vercel
- [ ] 4 automatisations email créées dans le système de mailing
- [ ] Test : Créer un compte Gold → Vérifier le code de parrainage
- [ ] Test : S'inscrire avec un code → Vérifier la commission
- [ ] Test : Demander un paiement avec RIB → Vérifier la demande
- [ ] Test : Admin mark as paid → Vérifier l'email
- [ ] Promotion Gold testée (activer/désactiver)
- [ ] Dashboard admin accessible et fonctionnel

---

## 📞 Support

### Logs à consulter

**Vercel :**
- Fonction `api/referrals/*`
- Fonction `api/stripe/webhook`
- Fonction `api/admin/referral-payouts`

**Supabase :**
- Table `referral_codes`
- Table `referral_transactions`
- Table `referral_payouts`

**Stripe :**
- Dashboard > Webhooks > Events
- Vérifier que les metadata sont bien envoyées

### Problèmes connus

1. **"Missing Suspense boundary"** → Déjà corrigé avec Suspense wrapper
2. **"Dynamic server usage"** → Déjà corrigé avec `export const dynamic = 'force-dynamic'`
3. **RIB trop lourd** → Limite à 5MB, recommander la compression

---

## 🎓 Bonnes pratiques

### Pour l'utilisateur
1. Partager le lien complet avec `?ref=CODE` (plus facile)
2. Vérifier que le code est actif avant de partager
3. Encourager les abonnements annuels (plus de commission)

### Pour l'admin
1. Traiter les demandes dans les 48h
2. Vérifier le RIB avant le virement
3. Toujours marquer comme "payé" dans le système
4. Archiver les RIBs localement (backup)

---

**Version :** 2.0
**Dernière mise à jour :** Janvier 2026
**Auteur :** Claude + Kevin
