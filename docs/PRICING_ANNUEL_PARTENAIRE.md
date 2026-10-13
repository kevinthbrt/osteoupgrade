# Facturation annuelle et tarif écoles partenaires

Complète `docs/PRICING_3_OFFRES.md`.

## 1. La grille

| Offre | Mensuel | Annuel (2 mois offerts) | Annuel école partenaire (-30 %) | Fondateur (-50 %) |
|---|---|---|---|---|
| Premium (bundle) | 49,99 € | **499,99 €** (au lieu de 599,88 €) | **349,99 €** | 299,94 € |
| MyOsteoFlow | 29,99 € | **299,99 €** (au lieu de 359,88 €) | **209,99 €** | 179,94 € |
| OsteoUpgrade | 29,99 € | **299,99 €** (au lieu de 359,88 €) | **209,99 €** | 179,94 € |

Clés du catalogue (`STRIPE_PLANS`) et variables d'environnement :

| Clé | Variable |
|---|---|
| `premium_annual` | `STRIPE_PRICE_PREMIUM_ANNUAL` |
| `osteoflow_annual` | `STRIPE_PRICE_OSTEOFLOW_ANNUAL` |
| `osteoupgrade_annual` | `STRIPE_PRICE_OSTEOUPGRADE_ANNUAL` |
| `partner_premium_annual` | `STRIPE_PRICE_PARTNER_PREMIUM_ANNUAL` |
| `partner_osteoflow_annual` | `STRIPE_PRICE_PARTNER_OSTEOFLOW_ANNUAL` |
| `partner_osteoupgrade_annual` | `STRIPE_PRICE_PARTNER_OSTEOUPGRADE_ANNUAL` |

Plus `STRIPE_PORTAL_CONFIG_PLANS_PARTNER` pour la grille du portail client.

## 2. Règles

- **Mêmes droits** : un tarif annuel donne exactement l'offre du mensuel
  (`metadata.plan` sur le prix Stripe). Seul le rythme change.
- **Essai gratuit** de 7 jours ouvert aux tarifs annuels et partenaires, aux
  mêmes conditions (un seul par compte).
- **Pas de cumul** sur un tarif annuel standard ou partenaire : ni code promo
  (le champ est masqué), ni remise de funnel. Raison technique : un coupon se
  restreint par produit, et les prix annuels partagent les produits des
  mensuels ; le serveur est donc le seul garde-fou.
- **Parrainage** : ouvert à l'annuel standard (le mois offert est crédité sur
  le solde Stripe), fermé au tarif école.
- **Tarifs Fondateur inchangés.**

## 3. Écoles partenaires

- Table `partner_programs` (nom, code d'accès, actif, date de fin) et
  `partner_program_members` (un compte, une école). Aucune politique
  d'écriture : seul le serveur rattache un compte, après vérification du code.
- **Pourquoi pas une colonne de `profiles`** : la politique RLS de mise à
  jour de `profiles` laisse l'utilisateur modifier toutes ses colonnes sauf
  `role`. Une colonne de profil serait donc modifiable depuis le navigateur.
- Le stagiaire saisit le code sur « Mon abonnement », ou suit le lien
  `/settings/subscription?ecole=CODE` (bouton « Copier le lien » dans
  `/admin/partners`). Sans compte, il est renvoyé vers l'inscription ; le
  code est gardé dans son navigateur et appliqué à son prochain passage sur
  « Mon abonnement ».
- `/api/stripe/checkout` revérifie le rattachement pour tout tarif
  partenaire ; le webhook écrit le nom de l'école dans
  `profiles.partner_discount_name` (badge visible dans `/admin/users`).
- Désactiver une école ou dépasser sa date de fin bloque les **nouvelles**
  souscriptions. Les abonnements en cours gardent leur prix à chaque
  renouvellement : pour les faire repasser au tarif standard, il faut changer
  leur prix dans Stripe.

## 4. Mise en production, dans cet ordre

1. **Migration** `supabase/migrations/20261013_annual_and_partner_pricing.sql`.
   À appliquer **avant** le déploiement : le webhook écrit
   `profiles.billing_interval`, et une colonne absente ferait échouer la mise
   à jour du profil après paiement. Testée dans une transaction annulée le
   13/10/2026 (backfill : 3 annuels fondateurs, 6 mensuels).
2. **Déployer** le code. Tant que les nouvelles variables ne sont pas
   renseignées, choisir un tarif annuel renvoie une erreur (« Price ID not
   configured ») ; les tarifs mensuels ne changent pas. Enchaîner l'étape 3
   sans attendre.
3. Connecté en administrateur, dans la console du navigateur :
   ```js
   await fetch('/api/admin/stripe-annual-prices-setup', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```
   Reporter les six `STRIPE_PRICE_*` renvoyés dans Vercel, puis redéployer.
4. Vérifier : `await fetch('/api/admin/check-prices').then(r => r.json()).then(console.log)`.
5. Mettre à jour le portail client :
   ```js
   await fetch('/api/admin/stripe-portal-setup', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```
   Reporter `STRIPE_PORTAL_CONFIG_PLANS_PARTNER` dans Vercel, redéployer.
6. Créer l'école dans `/admin/partners` et lui transmettre le lien.
