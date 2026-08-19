-- Phase 0 du passage à 3 offres (cf. docs/PRICING_3_OFFRES.md).
--
-- Introduit `profiles.plan`, future source de vérité des droits d'accès, SANS
-- modifier le moindre comportement applicatif : à l'issue de cette migration,
-- aucun code ne lit `plan`, et `profiles.role` continue de piloter exactement
-- les mêmes accès qu'avant (policies RLS, RPC SECURITY DEFINER, endpoints
-- servis au client desktop).
--
-- La sûreté repose sur un trigger de synchronisation BIDIRECTIONNELLE :
--
--   * chemin hérité (aujourd'hui) — le webhook Stripe et l'admin écrivent
--     `role` ; le trigger en déduit `plan`. Rien à changer côté application.
--   * chemin cible (à partir de la phase 2) — l'application écrira `plan` ;
--     le trigger en déduit `role`, ce qui laisse tout le code existant
--     fonctionner sans réécriture.
--
-- Correspondance retenue (cf. docs/PRICING_3_OFFRES.md §2) :
--
--   plan            role miroir   MyOsteoFlow   OsteoUpgrade
--   free            free          non           non (hors is_free_access)
--   osteoflow       trial         oui           non
--   osteoupgrade    premium       non           oui
--   bundle          premium       oui           oui
--
-- `osteoflow` → `trial` n'est pas un hasard : le rôle `trial` a déjà
-- exactement la sémantique « MyOsteoFlow seul, sans contenu premium »
-- (cf. 20260715_trial_role_myosteoflow_only.sql).
--
-- Rollback : DROP TRIGGER + DROP FUNCTION + ALTER TABLE ... DROP COLUMN plan.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Colonne `plan`
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan = ANY (ARRAY['free'::text, 'osteoflow'::text, 'osteoupgrade'::text, 'bundle'::text]));

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles (plan);

COMMENT ON COLUMN public.profiles.plan IS
  'Offre souscrite (source de vérité des droits). `role` en est le miroir dérivé, maintenu par trigger_sync_profile_plan_role. Voir docs/PRICING_3_OFFRES.md.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Fonctions de correspondance
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.plan_to_role(p_plan text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'bundle'       THEN 'premium'
    WHEN 'osteoupgrade' THEN 'premium'
    WHEN 'osteoflow'    THEN 'trial'
    ELSE 'free'
  END;
$$;

CREATE OR REPLACE FUNCTION public.role_to_plan(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    -- 'admin' n'est pas une offre : on lui associe le périmètre le plus large,
    -- mais le trigger ci-dessous ne rétrograde jamais un admin.
    WHEN 'admin'   THEN 'bundle'
    WHEN 'premium' THEN 'bundle'
    WHEN 'trial'   THEN 'osteoflow'
    ELSE 'free'
  END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Backfill (avant la création du trigger : aucune interférence possible)
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.profiles
   SET plan = public.role_to_plan(role)
 WHERE plan IS DISTINCT FROM public.role_to_plan(role);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Trigger de synchronisation bidirectionnelle
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_plan_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Une insertion ne renseigne en pratique que `role` (handle_new_user).
    -- On complète la colonne restée à sa valeur par défaut, sans jamais
    -- écraser une valeur explicitement fournie par l'appelant.
    IF NEW.plan = 'free' AND NEW.role <> 'free' THEN
      NEW.plan := public.role_to_plan(NEW.role);
    ELSIF NEW.role = 'free' AND NEW.plan <> 'free' THEN
      NEW.role := public.plan_to_role(NEW.plan);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    -- Chemin cible : `plan` fait foi et redéfinit le rôle miroir.
    -- Exception : un admin n'est jamais rétrogradé par un changement d'offre.
    IF NOT (OLD.role = 'admin' AND NEW.role = 'admin') THEN
      NEW.role := public.plan_to_role(NEW.plan);
    END IF;

  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Chemin hérité : le webhook Stripe et /admin/users écrivent encore
    -- `role`. C'est ce cas qui garantit qu'aucun déploiement n'est requis
    -- pour que `plan` reste juste.
    NEW.plan := public.role_to_plan(NEW.role);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_profile_plan_role ON public.profiles;
CREATE TRIGGER trigger_sync_profile_plan_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan_role();

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Helpers d'entitlement (définis, pas encore utilisés)
-- ─────────────────────────────────────────────────────────────────────────
-- Destinés à remplacer progressivement les `role IN ('premium','admin')`
-- disséminés dans les policies RLS et les RPC. Aucun appelant en phase 0.

CREATE OR REPLACE FUNCTION public.has_osteoflow(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_user_id
       AND (role = 'admin' OR plan IN ('osteoflow', 'bundle'))
  );
$$;

CREATE OR REPLACE FUNCTION public.has_osteoupgrade(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_user_id
       AND (role = 'admin' OR plan IN ('osteoupgrade', 'bundle'))
  );
$$;

-- SECURITY DEFINER : on restreint l'exécution aux rôles applicatifs, jamais
-- à `anon` ni à `public` (même politique que 20260624_harden_trigger_functions_grants.sql).
REVOKE ALL ON FUNCTION public.has_osteoflow(uuid)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_osteoupgrade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_osteoflow(uuid)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_osteoupgrade(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.plan_to_role(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.role_to_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_to_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.role_to_plan(text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Trigger de parrainage : écouter aussi `plan`
-- ─────────────────────────────────────────────────────────────────────────
-- `AFTER UPDATE OF role` ne se déclenche que si `role` figure dans le SET de
-- la requête — pas s'il est modifié par un trigger BEFORE. Sans cet ajout,
-- une future écriture portant uniquement sur `plan` (phase 2) cesserait
-- silencieusement de créer les codes de parrainage.
-- La fonction appelée est inchangée, et reste idempotente (ON CONFLICT DO NOTHING).

DROP TRIGGER IF EXISTS trigger_create_referral_code_on_premium ON public.profiles;
CREATE TRIGGER trigger_create_referral_code_on_premium
AFTER INSERT OR UPDATE OF role, plan ON public.profiles
FOR EACH ROW
WHEN (NEW.role = ANY (ARRAY['premium'::text, 'admin'::text]))
EXECUTE FUNCTION public.create_referral_code_for_premium();
