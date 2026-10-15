# Facturation annuelle et codes partenaires

Complète `docs/PRICING_3_OFFRES.md`.

## 1. La grille

| Offre | Mensuel | Annuel (2 mois offerts) | Fondateur (-50 %) |
|---|---|---|---|
| Premium (bundle) | 49,99 € | **499,99 €** (au lieu de 599,88 €) | 299,94 € |
| MyOsteoFlow | 29,99 € | **299,99 €** (au lieu de 359,88 €) | 179,94 € |
| OsteoUpgrade | 29,99 € | **299,99 €** (au lieu de 359,88 €) | 179,94 € |

Clés du catalogue (`STRIPE_PLANS`) et variables d'environnement :

| Clé | Variable |
|---|---|
| `premium_annual` | `STRIPE_PRICE_PREMIUM_ANNUAL` |
| `osteoflow_annual` | `STRIPE_PRICE_OSTEOFLOW_ANNUAL` |
| `osteoupgrade_annual` | `STRIPE_PRICE_OSTEOUPGRADE_ANNUAL` |

## 2. Un produit Stripe par rythme

Chaque offre a **deux produits** Stripe : celui du mensuel (historique, qui
porte aussi le tarif Fondateur) et un produit « … (annuel) ». Raison : Stripe
ne restreint un code promo que par produit, jamais par prix. Avec un produit
commun, un code ne pouvait pas viser l'annuel sans le mensuel.

Le portail client autorise le passage d'un produit à l'autre : le passage
mensuel ↔ annuel reste possible depuis « Gérer mon abonnement ».

Les prix sont créés par `POST /api/admin/stripe-annual-prices-setup`
(idempotent), qui archive aussi les prix de la première version.

## 3. Règles

- **Mêmes droits** : un tarif annuel donne exactement l'offre du mensuel
  (`metadata.plan` sur le prix Stripe). Seul le rythme change.
- **Essai gratuit** de 7 jours ouvert à l'annuel, aux mêmes conditions (un
  seul par compte).
- **Codes promo** : le champ de saisie est ouvert sur tous les tarifs ; c'est
  le coupon de chaque code qui dit à quels produits il s'applique.
- **Remise de funnel** : restreinte aux produits mensuels, jamais posée sur
  une session annuelle.
- **Parrainage** : ouvert à l'annuel (le mois offert est crédité sur le solde
  Stripe).
- **Tarifs Fondateur inchangés.**

## 4. Codes partenaires (écoles, organismes de formation)

`/admin/partners` génère des lots de codes à usage unique, réservés aux
nouveaux clients. Pour chaque lot : partenaire, pourcentage, durée en mois,
nombre de codes, et **tarifs visés** (offre × mensuel/annuel, tous cochés par
défaut). La cible est enregistrée dans `coupon.metadata.cibles`.

Sur un tarif annuel, la remise porte sur chaque facture émise pendant la
durée : 12 mois couvre la première année seulement. Stripe arrête la remise
seul, rien n'est à programmer côté site.

Exemple, école au Canada, -30 % la première année sur l'annuel :
partenaire « Nom de l'école », 30 %, 12 mois, les trois cases « Annuel ».
Premium revient alors à 349,99 € la première année, puis 499,99 €.

Les lots créés avant cette option visent les trois offres mensuelles.

Un premier « programme école » (code unique partagé, tarifs annuels dédiés à
-30 %) a été retiré le 15/10/2026 : il faisait doublon avec les lots de codes,
et n'aurait pas su limiter la remise à la première année sans un mécanisme
supplémentaire.

## 5. Mise en place (après déploiement)

1. Connecté en administrateur, dans la console du navigateur :
   ```js
   await fetch('/api/admin/stripe-annual-prices-setup', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```
   Remplacer les trois `STRIPE_PRICE_*_ANNUAL` dans Vercel par les valeurs
   renvoyées. Supprimer `STRIPE_PRICE_PARTNER_*` et
   `STRIPE_PORTAL_CONFIG_PLANS_PARTNER`. Redéployer.
2. Vérifier : `await fetch('/api/admin/check-prices').then(r => r.json()).then(console.log)`.
3. Mettre à jour le portail :
   ```js
   await fetch('/api/admin/stripe-portal-setup', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```
