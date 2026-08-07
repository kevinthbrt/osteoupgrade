-- Comptes offerts (accès premium accordé manuellement, sans facturation)
--
-- Certains comptes sont passés en premium à la main — dépannage, partenariat,
-- service rendu — sans qu'aucun paiement Stripe ne soit associé. Ils gonflaient
-- artificiellement le nombre de premium et le taux de conversion des stats.
-- Ce drapeau permet de les isoler : ils gardent tous leurs accès, mais sont
-- comptabilisés à part dans /admin/stats.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_complimentary BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_complimentary IS
  'Accès premium offert manuellement (non facturé). Exclu des KPI premium et du taux de conversion.';

-- Index partiel : la liste des comptes offerts reste minuscule, on ne scanne
-- jamais toute la table pour la retrouver.
CREATE INDEX IF NOT EXISTS idx_profiles_is_complimentary
  ON public.profiles (is_complimentary)
  WHERE is_complimentary = TRUE;

-- Compte offert existant : accès premium accordé à titre gracieux, sans abonnement Stripe.
UPDATE public.profiles
SET is_complimentary = TRUE
WHERE email = 'garcia.oliw@gmail.com'
  AND stripe_subscription_id IS NULL;
