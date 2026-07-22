-- Visibilité admin pour les codes de réduction partenaire (ex: IFCOPS -10%/1an).
-- Jusqu'ici, l'usage d'un code partenaire n'était visible que côté Stripe
-- (aucune trace en base), ce qui empêchait de les voir dans /admin/users et
-- /admin/stats. On stocke ici le dernier code partenaire appliqué à
-- l'abonnement d'un utilisateur (détecté au webhook checkout.session.completed).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_discount_name text,
  ADD COLUMN IF NOT EXISTS partner_discount_code text;

COMMENT ON COLUMN public.profiles.partner_discount_name IS 'Nom du partenaire (ex: IFCOPS) dont le code de réduction a été appliqué à la souscription, si applicable.';
COMMENT ON COLUMN public.profiles.partner_discount_code IS 'Code promo partenaire Stripe utilisé à la souscription, si applicable.';

CREATE INDEX IF NOT EXISTS idx_profiles_partner_discount_name
  ON public.profiles (partner_discount_name)
  WHERE partner_discount_name IS NOT NULL;

-- Nouveau type de notification admin (bell) pour l'usage d'un code partenaire.
ALTER TABLE public.admin_notifications
  DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_type_check
  CHECK (type = ANY (ARRAY['bug_report'::text, 'new_subscription'::text, 'referral'::text, 'signup'::text, 'partner_discount'::text, 'other'::text]));
