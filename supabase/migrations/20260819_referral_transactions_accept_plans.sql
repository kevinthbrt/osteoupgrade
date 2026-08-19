-- Phase 2 du passage à 3 offres (cf. docs/PRICING_3_OFFRES.md).
--
-- `referral_transactions.subscription_type` historise l'offre souscrite par le
-- filleul. Sa contrainte CHECK n'acceptait que les valeurs de l'ancien modèle
-- (premium_silver / premium_gold / premium) : le webhook y écrivait 'premium'
-- via les metadata Stripe. Le webhook y écrit désormais l'offre elle-même,
-- ce que la contrainte aurait rejeté — un parrainage validé aurait échoué à
-- l'insertion, faisant perdre l'historique de la récompense.
--
-- Les anciennes valeurs sont conservées : les lignes déjà en base doivent
-- rester valides.

ALTER TABLE public.referral_transactions
  DROP CONSTRAINT IF EXISTS referral_transactions_subscription_type_check;

ALTER TABLE public.referral_transactions
  ADD CONSTRAINT referral_transactions_subscription_type_check
  CHECK (subscription_type = ANY (ARRAY[
    -- offres actuelles
    'osteoflow'::text,
    'osteoupgrade'::text,
    'bundle'::text,
    -- valeurs historiques, conservées pour les lignes existantes
    'premium'::text,
    'premium_silver'::text,
    'premium_gold'::text
  ]));
