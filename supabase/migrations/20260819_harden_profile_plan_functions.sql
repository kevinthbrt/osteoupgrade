-- Durcissement des fonctions introduites par 20260819_add_profile_plan.sql,
-- suite aux avertissements du linter Supabase.
--
-- 1. `plan_to_role` / `role_to_plan` : search_path figé. Ce sont des CASE purs
--    sans accès aux tables, donc sans risque réel, mais on aligne sur la
--    politique du projet (20260624_harden_trigger_functions_grants.sql).
--
-- 2. `has_osteoflow` / `has_osteoupgrade` passent de SECURITY DEFINER à
--    SECURITY INVOKER. En DEFINER, un utilisateur connecté pouvait interroger
--    l'offre de N'IMPORTE QUEL compte en passant son uuid
--    (lint 0029_authenticated_security_definer_function_executable).
--    En INVOKER, la lecture de `profiles` repasse par la RLS existante
--    ("Users can view own profile" USING auth.uid() = id) : l'appelant ne voit
--    que sa propre ligne, et l'uuid d'un tiers renvoie simplement false.
--    Le service_role (webhook Stripe, routes serveur) contourne la RLS et
--    conserve donc une vision complète.
--
--    À ne jamais utiliser dans une policy RLS portant sur `profiles`
--    elle-même : la lecture serait récursive.

CREATE OR REPLACE FUNCTION public.plan_to_role(p_plan text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
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
SET search_path = ''
AS $$
  SELECT CASE p_role
    WHEN 'admin'   THEN 'bundle'
    WHEN 'premium' THEN 'bundle'
    WHEN 'trial'   THEN 'osteoflow'
    ELSE 'free'
  END;
$$;

DROP FUNCTION IF EXISTS public.has_osteoflow(uuid);
DROP FUNCTION IF EXISTS public.has_osteoupgrade(uuid);

CREATE FUNCTION public.has_osteoflow(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_user_id
       AND (role = 'admin' OR plan IN ('osteoflow', 'bundle'))
  );
$$;

CREATE FUNCTION public.has_osteoupgrade(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_user_id
       AND (role = 'admin' OR plan IN ('osteoupgrade', 'bundle'))
  );
$$;

REVOKE ALL ON FUNCTION public.has_osteoflow(uuid)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_osteoupgrade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_osteoflow(uuid)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_osteoupgrade(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.plan_to_role(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.role_to_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_to_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.role_to_plan(text) TO authenticated, service_role;
