-- Statistiques de funnel : trafic interne exclu, personnes plutôt qu'actions,
-- et deux mesures pour comprendre où le visiteur s'arrête.
--
-- Constat du 28/09 sur effet-placebo : « 6 leads, 4 vers paiement » pour deux
-- adresses réelles, toutes deux de test. Les compteurs additionnaient des
-- événements : chaque renvoi du formulaire, chaque essai de paiement par un
-- administrateur comptait comme un prospect. Et 58 visiteurs venus des réseaux
-- pour aucune inscription, sans moyen de savoir s'ils avaient vu le formulaire
-- ni s'ils avaient essayé de le remplir.

BEGIN;

-- ── Colonnes ──────────────────────────────────────────────────────────────

ALTER TABLE public.funnel_events
  ADD COLUMN IF NOT EXISTS internal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS detail text,
  ADD COLUMN IF NOT EXISTS app text;

COMMENT ON COLUMN public.funnel_events.internal IS
  'Événement produit par un administrateur connecté (test, relecture). Exclu des statistiques.';
COMMENT ON COLUMN public.funnel_events.detail IS
  'Précision courte, sans donnée personnelle : la raison d''un échec d''inscription.';
COMMENT ON COLUMN public.funnel_events.app IS
  'Navigateur intégré d''où vient la visite (instagram, facebook) ou autre. Déduit du user-agent, qui n''est pas conservé.';

ALTER TABLE public.funnel_events
  DROP CONSTRAINT IF EXISTS funnel_events_type_check;
ALTER TABLE public.funnel_events
  ADD CONSTRAINT funnel_events_type_check CHECK (type IN (
    'view', 'form_view', 'cta_click', 'optin', 'optin_error', 'checkout_started'
  ));

ALTER TABLE public.funnel_events
  DROP CONSTRAINT IF EXISTS funnel_events_app_check;
ALTER TABLE public.funnel_events
  ADD CONSTRAINT funnel_events_app_check CHECK (app IS NULL OR app IN ('instagram', 'facebook', 'autre'));

-- ── Rattrapage : les tests d'avant publication ─────────────────────────────
--
-- La page n'a été diffusée que le 27/09. Tout visiteur apparu avant est un
-- testeur, et ses événements le sont aussi, y compris ceux qu'il a produits
-- après le 27/09 depuis le même navigateur.
UPDATE public.funnel_events
SET internal = true
WHERE visitor_id IN (
  SELECT DISTINCT visitor_id FROM public.funnel_events
  WHERE visitor_id IS NOT NULL
    AND created_at < timestamptz '2026-09-27 00:00:00+02'
);

-- Les inscriptions de test n'ont pas toujours de visitor_id (route
-- d'inscription) : on les rattrape par leur lead.
UPDATE public.funnel_events
SET internal = true
WHERE type = 'optin'
  AND created_at < timestamptz '2026-09-27 00:00:00+02';

-- ── Fonction ──────────────────────────────────────────────────────────────
--
-- Le type de retour change : Postgres impose de supprimer la fonction avant de
-- la recréer.
DROP FUNCTION IF EXISTS public.funnel_stats(uuid[]);

CREATE FUNCTION public.funnel_stats(p_funnel_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  funnel_id uuid,
  views bigint,           -- pages vues
  visitors bigint,        -- visiteurs distincts
  form_views bigint,      -- visiteurs arrivés jusqu'au formulaire
  cta_clicks bigint,      -- clics sur un bouton
  optins bigint,          -- envois réussis du formulaire
  leads bigint,           -- personnes inscrites (adresses distinctes)
  optin_errors bigint,    -- envois du formulaire en échec
  checkouts bigint,       -- personnes parties vers le paiement
  inapp_visitors bigint,  -- visiteurs venus d'Instagram ou Facebook
  internal_events bigint  -- événements de test écartés
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    f.id,
    count(e.id) FILTER (WHERE NOT e.internal AND e.type = 'view'),
    count(DISTINCT e.visitor_id) FILTER (WHERE NOT e.internal AND e.type = 'view'),
    count(DISTINCT e.visitor_id) FILTER (WHERE NOT e.internal AND e.type = 'form_view'),
    count(e.id) FILTER (WHERE NOT e.internal AND e.type = 'cta_click'),
    count(e.id) FILTER (WHERE NOT e.internal AND e.type = 'optin'),
    count(DISTINCT e.lead_id) FILTER (WHERE NOT e.internal AND e.type = 'optin'),
    count(e.id) FILTER (WHERE NOT e.internal AND e.type = 'optin_error'),
    count(DISTINCT e.visitor_id) FILTER (WHERE NOT e.internal AND e.type = 'checkout_started'),
    count(DISTINCT e.visitor_id) FILTER (
      WHERE NOT e.internal AND e.type = 'view' AND e.app IN ('instagram', 'facebook')
    ),
    count(e.id) FILTER (WHERE e.internal)
  FROM public.funnels f
  LEFT JOIN public.funnel_events e ON e.funnel_id = f.id
  WHERE p_funnel_ids IS NULL OR f.id = ANY (p_funnel_ids)
  GROUP BY f.id
$$;

REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.funnel_stats(uuid[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.funnel_stats(uuid[]) TO service_role;

COMMIT;
