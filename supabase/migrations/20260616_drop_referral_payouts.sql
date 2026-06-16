-- Migration: Suppression du système de cagnotte / virement (RIB) du parrainage
-- Le parrainage récompense désormais par "1 mois offert" (crédit de solde Stripe),
-- il n'y a plus de commission monétaire ni de demande de virement.
-- On supprime la table des demandes de paiement, devenue inutile.

DROP TABLE IF EXISTS public.referral_payouts CASCADE;
