-- Facturation annuelle et programme partenaire écoles.
--
-- 1. `profiles.billing_interval` : rythme de facturation de l'abonnement en
--    cours ('month' ou 'year'), écrit par le webhook Stripe. Sans lui, le site
--    ne sait pas distinguer un abonné annuel d'un abonné mensuel (l'offre,
--    `plan`, est la même) : il lui annoncerait un prélèvement mensuel et le
--    compterait au tarif mensuel dans le MRR.
--
-- 2. `partner_programs` et `partner_program_members` : une école partenaire
--    (ex : une école d'ostéopathie au Canada) transmet un code d'accès à ses
--    stagiaires. Le saisir rattache le compte au programme, ce qui ouvre les
--    tarifs annuels partenaires (-30 % sur l'annuel).
--
--    L'appartenance vit dans une table à part et non dans `profiles` : la
--    politique RLS de mise à jour de `profiles` laissait l'utilisateur modifier
--    toutes ses colonnes sauf `role` (corrigé depuis par
--    20261014_protect_profile_columns.sql). Une colonne de profil serait donc
--    modifiable depuis le navigateur, et le tarif partenaire accessible à
--    n'importe qui. Ici, aucune politique d'écriture : seules les routes
--    serveur (clé service-role) rattachent un compte, après vérification du
--    code.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IS NULL OR billing_interval IN ('month', 'year'));

COMMENT ON COLUMN public.profiles.billing_interval IS
  'Rythme de facturation de l''abonnement Stripe en cours (month ou year), écrit par le webhook. NULL : inconnu (abonnement antérieur) ou aucun abonnement.';

-- Les abonnements existants sont tous mensuels, sauf ceux des membres
-- fondateurs, dont le tarif est annuel.
UPDATE public.profiles
SET billing_interval = CASE WHEN is_founding_member THEN 'year' ELSE 'month' END
WHERE billing_interval IS NULL
  AND stripe_subscription_id IS NOT NULL
  AND plan <> 'free';

CREATE TABLE IF NOT EXISTS public.partner_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- Stocké en majuscules, comparé en majuscules.
  access_code text NOT NULL UNIQUE CHECK (access_code = upper(access_code) AND length(access_code) >= 6),
  active boolean NOT NULL DEFAULT true,
  -- Date au-delà de laquelle le code n'ouvre plus de nouveaux rattachements.
  ends_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.partner_programs IS
  'Écoles partenaires : leur code d''accès ouvre aux stagiaires les tarifs annuels partenaires.';

CREATE TABLE IF NOT EXISTS public.partner_program_members (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.partner_programs(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_program_members_program
  ON public.partner_program_members (program_id);

COMMENT ON TABLE public.partner_program_members IS
  'Comptes rattachés à une école partenaire. Écrit uniquement par le serveur (clé service-role), après vérification du code d''accès.';

ALTER TABLE public.partner_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_program_members ENABLE ROW LEVEL SECURITY;

-- Aucune politique, ni en lecture ni en écriture : seul le serveur (clé
-- service-role) lit et écrit ces tables. Les codes d'accès ne doivent jamais
-- atteindre le navigateur, et le rattachement d'un stagiaire est toujours lu
-- côté serveur (lib/partner-programs.ts), y compris pour l'affichage.
--
-- Appliquée en production le 15/10/2026, par morceaux (les commandes qui
-- demandent un verrou exclusif sur `profiles` dépassent sinon le délai du
-- connecteur Supabase). Rattrapage : 3 abonnés annuels, 6 mensuels.
