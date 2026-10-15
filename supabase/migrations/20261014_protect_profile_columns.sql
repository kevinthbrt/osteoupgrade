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

-- État en production (15/10/2026) : fonction et trigger appliqués et
-- vérifiés sur la vraie table. Le DROP POLICY ci-dessous n'a pas pu passer :
-- il attend un verrou exclusif sur `profiles` que le trafic du site ne lui
-- laisse pas, et le connecteur Supabase coupe au bout de 60 s. Le risque
-- restant est faible (chaque compte a déjà sa ligne, l'insertion échoue sur
-- la clé primaire) ; à relancer seul, à une heure creuse.
--
-- Le profil est créé à l'inscription par `handle_new_user` (SECURITY DEFINER,
-- propriétaire postgres, RLS contournée). Aucune page n'insère de profil
-- depuis le navigateur : cette politique ne servait qu'à permettre d'en
-- créer un avec `is_founding_member = true` si la ligne venait à manquer.
DROP POLICY IF EXISTS "Enable insert for auth users" ON public.profiles;
