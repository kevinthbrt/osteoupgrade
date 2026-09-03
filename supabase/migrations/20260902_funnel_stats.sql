-- Agrégation des statistiques de funnel en SQL
--
-- Les compteurs étaient calculés en ramenant toutes les lignes de
-- `funnel_events` et `funnel_leads` pour les compter côté application.
-- PostgREST plafonne le nombre de lignes renvoyées par requête : au-delà, les
-- compteurs se seraient figés silencieusement, sans erreur ni indice. Un
-- compteur faux est pire qu'un compteur absent, puisqu'on décide dessus.
--
-- Cette fonction fait l'agrégation là où elle doit se faire, et renvoie une
-- ligne par funnel quelle que soit la volumétrie.

CREATE OR REPLACE FUNCTION public.funnel_stats(p_funnel_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  funnel_id uuid,
  views bigint,
  cta_clicks bigint,
  optins bigint,
  checkouts bigint,
  leads bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    f.id,
    count(e.id) FILTER (WHERE e.type = 'view'),
    count(e.id) FILTER (WHERE e.type = 'cta_click'),
    count(e.id) FILTER (WHERE e.type = 'optin'),
    count(e.id) FILTER (WHERE e.type = 'checkout_started'),
    (SELECT count(*) FROM public.funnel_leads l WHERE l.funnel_id = f.id)
  FROM public.funnels f
  LEFT JOIN public.funnel_events e ON e.funnel_id = f.id
  WHERE p_funnel_ids IS NULL OR f.id = ANY (p_funnel_ids)
  GROUP BY f.id
$$;

-- Appelée uniquement côté serveur avec la clé service-role. Aucune raison de
-- l'exposer au navigateur : la fréquentation d'une campagne n'a pas à être
-- lisible par un visiteur.
REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.funnel_stats(uuid[]) TO service_role;
