# Black Friday 2026

-30 % sur la **première année** des trois offres en facturation annuelle, du
**lundi 23 novembre 0 h au lundi 30 novembre minuit** (heure de Paris).

| Offre | Annuel habituel | Première année Black Friday |
|---|---|---|
| Premium | 499,99 € | 349,99 € |
| MyOsteoFlow | 299,99 € | 209,99 € |
| OsteoUpgrade | 299,99 € | 209,99 € |

## Qui en profite

- **Nouveaux clients** : la remise est posée d'office sur tout abonnement
  annuel standard souscrit pendant la période. Aucun code à saisir.
- **Adhérents mensuels** : un encart « Passer à l'annuel » sur « Mon
  abonnement » et sur le tableau de bord ouvre l'écran de confirmation Stripe,
  prix annuel et remise déjà posés. Le reste du mois en cours est déduit au
  prorata.

## Ce qui ne se cumule pas

- **Essai gratuit** : une souscription annuelle Black Friday est payée tout de
  suite. Les offres mensuelles gardent leur essai de 7 jours.
- **Tarif étudiant** (-50 %) : plus favorable, il passe avant. Un étudiant qui
  coche le tarif étudiant ne reçoit pas la remise Black Friday en plus.
- **Tarifs Fondateur** : jamais remisés, ni à la souscription ni par la
  bascule (règle du projet).
- Un **code promo** saisi à la main : Stripe n'accepte qu'une remise à la fois,
  le champ de saisie disparaît quand la remise Black Friday est posée.

Le parrainage reste possible : c'est un crédit d'un mois, pas une remise.

## « Un an maximum »

Le coupon Stripe `BLACK_FRIDAY_2026_30_ANNUEL` est créé à la première
utilisation (`lib/black-friday-server.ts`) :

- `percent_off: 30`, `duration: repeating`, `duration_in_months: 12` : sur une
  facture annuelle, cela couvre la seule première année, et le renouvellement
  se fait au tarif annuel habituel sans rien à programmer ;
- `applies_to` : les trois produits annuels seulement ;
- `redeem_by` : fin de l'offre. Stripe refuse le coupon après minuit, même sur
  une page de paiement ouverte avant.

Côté serveur, la période est revérifiée à chaque checkout et à chaque bascule
(`isBlackFridayActive`, `lib/black-friday.ts`). Côté pages, le bandeau et les
prix sont recalculés dans le navigateur chaque minute : la landing est rendue
au build, une date lue au rendu serait figée au jour du déploiement.

## Emails aux adhérents

Deux séquences créées par `supabase/migrations/20261120_black_friday_2026.sql`,
modifiables dans **Administration → Automatisations** :

| Séquence | Envoi |
|---|---|
| Black Friday 2026 - Lancement | chaque matin du 23 au 29, une fois par adhérent |
| Black Friday 2026 - Dernier jour | le 30 au matin, à ceux qui sont toujours au mois |

Le cron Vercel appelle `/api/promo/black-friday/emails` à 9 h (Paris), du 23
au 30 novembre. Destinataires : abonnés `active` au mois, hors fondateurs,
comptes offerts et désinscrits. Le journal `promo_email_sends` empêche tout
doublon. Les emails partent ensuite avec le traitement habituel des séquences
(`/api/automations/process`).

Aperçu sans rien envoyer (admin connecté) :
`/api/promo/black-friday/emails?apercu=1`.

## Suivi

Les souscriptions et bascules Black Friday apparaissent avec la remise
« Black Friday 2026 » dans `/admin/users`, et chaque bascule envoie une
notification admin.

## Après le 30 novembre

Rien à faire : bandeau, prix, bascule, emails et coupon s'arrêtent seuls. Le
code peut être retiré à tête reposée.
