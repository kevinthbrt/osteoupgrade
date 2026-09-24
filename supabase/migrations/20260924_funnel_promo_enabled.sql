-- Remise personnelle activable funnel par funnel.
--
-- Jusqu'ici, toute inscription sur n'importe quel funnel publié créait un code
-- de remise Stripe. Une page qui offre une formation sans rien vendre en
-- distribuait donc aussi, et la page ne pouvait pas annoncer honnêtement une
-- remise qu'elle ne maîtrisait pas. Le réglage est désormais explicite, et
-- désactivé par défaut.

BEGIN;

ALTER TABLE public.funnels
  ADD COLUMN IF NOT EXISTS promo_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.funnels.promo_enabled IS
  'true : chaque inscription reçoit un code de remise personnel, annoncé sur la page et appliqué au paiement.';

-- Le seul funnel qui l'utilise à ce jour.
UPDATE public.funnels SET promo_enabled = true WHERE slug = 'effet-placebo';

COMMIT;
