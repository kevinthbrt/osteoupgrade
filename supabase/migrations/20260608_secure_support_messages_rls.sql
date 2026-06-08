-- Sécurise public.support_messages.
--
-- Contexte : la migration 20260602_support_messages.sql créait une policy
-- "service_role_all" USING(true) WITH CHECK(true) SANS restriction de rôle.
-- Une telle policy s'applique à TOUS les rôles (dont anon/authenticated) et
-- n'offre donc aucune protection : n'importe qui muni de la clé anon pouvait
-- lire/modifier toute la table.
--
-- Tous les accès applicatifs à support_messages passent par le service_role
-- (routes API Next.js via supabaseAdmin), qui contourne le RLS. On peut donc
-- activer le RLS sans aucune policy : anon/authenticated n'ont aucun accès
-- direct, le service_role continue de fonctionner normalement.

DROP POLICY IF EXISTS "service_role_all" ON public.support_messages;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages FORCE ROW LEVEL SECURITY;
