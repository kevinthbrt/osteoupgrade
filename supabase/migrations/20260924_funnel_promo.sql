-- Remise personnelle par lead de funnel.
--
-- Chaque inscription crée un code promotionnel Stripe à usage unique, valable
-- sept jours à compter de cette inscription. Le code et sa date sont conservés
-- ici pour deux raisons : un renvoi du formulaire doit retrouver le même code
-- plutôt que d'en créer un second, et la date affichée dans les emails doit
-- rester celle de la première inscription.

BEGIN;

ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS promo_code_id text,
  ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;

COMMENT ON COLUMN public.funnel_leads.promo_code_id IS
  'Identifiant Stripe du code (promo_...). Stocké pour appliquer la remise au paiement sans redemander la liste à Stripe.';

COMMENT ON COLUMN public.funnel_leads.promo_code IS
  'Code promotionnel Stripe personnel, à usage unique. NULL si Stripe était indisponible à l''inscription.';
COMMENT ON COLUMN public.funnel_leads.promo_expires_at IS
  'Expiration du code, figée à la première inscription : un renvoi du formulaire ne la repousse pas.';

-- Retrouver un lead par son code, pour le service client comme pour un
-- rapprochement après paiement.
CREATE INDEX IF NOT EXISTS funnel_leads_promo_code_idx
  ON public.funnel_leads (promo_code)
  WHERE promo_code IS NOT NULL;

-- ── Échéance affichée sans blocage du paiement ─────────────────────────────
--
-- Le mode `relative` existant fait deux choses à la fois : il affiche un
-- compte à rebours ET fait refuser le paiement une fois la date passée. Pour
-- une remise, seule la première est souhaitable : passé le délai, le prospect
-- doit pouvoir s'abonner au plein tarif, pas se heurter à une porte fermée.
ALTER TABLE public.funnels
  ADD COLUMN IF NOT EXISTS deadline_blocks_checkout boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.funnels.deadline_blocks_checkout IS
  'true : l''échéance ferme la vente (offre limitée). false : elle n''est qu''un affichage (remise limitée).';

COMMIT;
