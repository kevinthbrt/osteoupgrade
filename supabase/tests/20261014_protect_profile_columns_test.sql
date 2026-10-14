-- Essai de 20261014_protect_profile_columns.sql, sans rien modifier.
--
-- À coller tel quel dans l'éditeur SQL de Supabase : tout s'exécute dans une
-- seule transaction, qui se termine volontairement par une erreur
-- « ESSAI OK (annule volontairement) : T1 ok; T2 refuse ok; ... ».
-- Cette erreur annule tout : la base reste intacte. Tout autre message
-- signale un problème à corriger avant d'appliquer la migration.
--
-- Utilisateurs de test : un abonné non admin (9fcd…) et un admin (5dc1…).

SET LOCAL lock_timeout = '8s';
-- Verrouille les colonnes sensibles de `profiles`.
--
-- La politique RLS « Enable update for users based on id » n'interdisait que
-- le changement de `role`. Un utilisateur connecté pouvait donc, avec la clé
-- publique, modifier tout le reste de sa ligne depuis le navigateur :
--   - `is_founding_member` : accès au tarif Fondateur (-50 % à vie), que
--     /api/stripe/checkout accorde sur la foi de cette colonne ;
--   - `trial_used_at` : un second essai gratuit ;
--   - `subscription_*`, `stripe_*`, `is_complimentary`, `partner_discount_*`,
--     `admin_tags`, `email`… : de quoi brouiller le suivi et les envois.
--
-- Liste blanche plutôt que liste noire : une colonne ajoutée plus tard est
-- protégée d'office. Le navigateur n'écrit que les colonnes ci-dessous
-- (inscription, page Paramètres) ; tout le reste passe par la clé
-- service-role (webhook Stripe, routes serveur), qui n'est pas concernée.
--
-- `current_user` et non `auth.role()` : une fonction SECURITY DEFINER
-- appelée par un utilisateur garde ses claims JWT, mais s'exécute sous le
-- rôle de son propriétaire. Seules les requêtes directes de PostgREST
-- tournent sous `authenticated` ou `anon`.

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  -- Colonnes que l'utilisateur peut modifier sur sa propre ligne.
  colonnes_libres CONSTANT text[] := ARRAY['full_name', 'newsletter_opt_in', 'cgu_accepted_at', 'updated_at'];
  ancien jsonb;
  nouveau jsonb;
  colonne text;
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  ancien := to_jsonb(OLD);
  nouveau := to_jsonb(NEW);

  FOR colonne IN SELECT jsonb_object_keys(nouveau) LOOP
    IF NOT (colonne = ANY (colonnes_libres))
       AND (nouveau -> colonne) IS DISTINCT FROM (ancien -> colonne) THEN
      RAISE EXCEPTION 'La colonne % ne peut pas être modifiée depuis le navigateur.', colonne
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Nom choisi pour passer avant `trigger_sync_profile_plan_role` (ordre
-- alphabétique des triggers BEFORE) : on contrôle ce que la requête demande,
-- avant toute dérivation automatique.
DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

-- Le profil est créé à l'inscription par `handle_new_user` (SECURITY DEFINER,
-- propriétaire postgres, RLS contournée). Aucune page n'insère de profil
-- depuis le navigateur : cette politique ne servait qu'à permettre d'en
-- créer un avec `is_founding_member = true` si la ligne venait à manquer.
DROP POLICY IF EXISTS "Enable insert for auth users" ON public.profiles;
DO $$
DECLARE
  u uuid := '9fcdd823-86dc-4cc9-a3e8-f357167e7fe1';
  a uuid := '5dc1d76a-cba3-4128-94f7-3d37dd518099';
  n int;
  res text := '';
BEGIN
  -- 1. Utilisateur connecté : changer son nom passe
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
  UPDATE profiles SET full_name = full_name || ' test', newsletter_opt_in = NOT coalesce(newsletter_opt_in,false) WHERE id = u;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'T1 nom: % ligne', n; END IF;
  res := res || 'T1 ok; ';

  -- 2. Se déclarer fondateur : refuse
  BEGIN
    UPDATE profiles SET is_founding_member = true WHERE id = u;
    RAISE EXCEPTION 'T2 ECHEC: fondateur accepte';
  EXCEPTION WHEN insufficient_privilege THEN res := res || 'T2 refuse ok; ';
  END;

  -- 3. Effacer son essai : refuse
  BEGIN
    UPDATE profiles SET trial_used_at = NULL, stripe_customer_id = 'cus_x' WHERE id = u;
    RAISE EXCEPTION 'T3 ECHEC';
  EXCEPTION WHEN insufficient_privilege THEN res := res || 'T3 refuse ok; ';
  END;

  -- 4. admin_tags : refuse
  BEGIN
    UPDATE profiles SET admin_tags = ARRAY['vip'] WHERE id = u;
    RAISE EXCEPTION 'T4 ECHEC';
  EXCEPTION WHEN insufficient_privilege THEN res := res || 'T4 refuse ok; ';
           WHEN others THEN res := res || 'T4 autre:' || SQLERRM || '; ';
  END;

  -- 5. Admin connecté : peut modifier un autre profil
  PERFORM set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  UPDATE profiles SET is_founding_member = true WHERE id = u;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'T5 admin: % ligne', n; END IF;
  res := res || 'T5 admin ok; ';

  -- 6. Clé service-role (webhook) : libre
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  UPDATE profiles SET is_founding_member = false, subscription_status = subscription_status, trial_used_at = trial_used_at WHERE id = u;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'T6 service: % ligne', n; END IF;
  res := res || 'T6 service ok; ';

  -- 7. Plus de politique d'insertion
  SELECT count(*) INTO n FROM pg_policies WHERE tablename='profiles' AND cmd='INSERT';
  res := res || 'T7 politiques insert=' || n;

  RAISE EXCEPTION 'ESSAI OK (annule volontairement) : %', res;
END $$;
