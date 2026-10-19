# Offre étudiant

-50 % la première année sur les trois offres annuelles, pour les étudiants et
jeunes diplômés, sur justificatif vérifié à la main.

| Offre | 1re année (étudiant) | Ensuite |
|---|---|---|
| Premium | 249,99 € | 499,99 €/an |
| MyOsteoFlow | 149,99 € | 299,99 €/an |
| OsteoUpgrade | 149,99 € | 299,99 €/an |

## Parcours

1. Sur « Mon abonnement », l'étudiant dépose son justificatif (carte
   étudiante, certificat de scolarité, diplôme, avis de situation INSEE ;
   PDF ou photo, 10 Mo). Le fichier va dans le bucket **privé**
   `student-documents` ; la demande dans `student_verifications`
   (statut `pending`). L'admin reçoit une notification.
2. Le tarif est débloqué tout de suite : la grille annuelle affiche les prix
   étudiants, et `/api/stripe/checkout` (paramètre `student`) pose le coupon
   `ETUDIANT_50_ANNUEL` (-50 %, 12 mois, produits annuels uniquement). Stripe
   arrête la remise au premier renouvellement.
3. L'admin vérifie dans `/admin/etudiants`, idéalement pendant les 7 jours
   d'essai :
   - **Valider** : le justificatif est supprimé, la décision conservée.
   - **Refuser** (motif obligatoire) : la remise est retirée de l'abonnement.
     Pendant l'essai, le premier prélèvement se fait au plein tarif. Après,
     la remise déjà accordée est facturée tout de suite (facture
     « Régularisation tarif étudiant »). Le justificatif est supprimé, et
     l'étudiant reçoit l'email « Justificatif étudiant refusé » avec le motif.

## Règles

- Une seule première année étudiante par compte (`discount_applied_at`).
- Pas de cumul : ni code promo, ni parrainage.
- Après un refus, l'étudiant peut déposer un autre justificatif tant que la
  remise n'a jamais servi.
- Un refus qui échoue côté Stripe ne modifie rien : la demande reste en
  attente et peut être relancée.

## Fichiers

- `lib/student-offer.ts` : coupon, lecture des demandes, retrait de la remise
  et régularisation.
- `app/api/student-verification/route.ts` : dépôt du justificatif.
- `app/api/admin/student-verifications/route.ts` : liste, lien signé,
  décision.
- `app/admin/etudiants/page.tsx` : écran de vérification.
- `supabase/migrations/20261015_student_offer.sql` : table, bucket, email
  et automatisation (appliquée le 15/10/2026).
