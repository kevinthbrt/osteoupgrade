-- Questionnaires cliniques validés.
--
-- Le parcours lombaire recommandait le STarT Back dès la première consultation,
-- le simulateur en renvoyait un score, et la règle de Flynn exige un FABQ-Travail :
-- la formation demandait au praticien des outils qu'elle ne lui donnait pas.
--
-- Deux points de conception.
--
-- Le calcul du score ne vit pas en base. Chaque instrument a sa règle, parfois
-- tordue : le STarT Back combine un total et un sous-score psychosocial, l'ODI
-- se rapporte aux sections réellement remplies. Ces règles sont dans
-- lib/questionnaires.ts, testables et lisibles ; la base ne porte que les seuils
-- et leur interprétation.
--
-- La licence est une colonne, pas une note de bas de page. Le STarT Back est
-- libre pour les organismes publics et la recherche non commerciale, mais un
-- usage commercial demande un accord à Keele ; l'ODI passe par le Mapi Research
-- Trust. `licence_statut` rend cet état visible dans l'administration tant qu'il
-- n'est pas régularisé, plutôt que de le laisser se perdre.

CREATE TABLE IF NOT EXISTS public.questionnaires (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL UNIQUE,
  code                  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  purpose               TEXT NOT NULL,
  region                TEXT NOT NULL DEFAULT 'lombaire',
  duration_minutes      INTEGER,
  instructions          TEXT,
  -- Nom de la règle de calcul, implémentée dans lib/questionnaires.ts.
  methode               TEXT NOT NULL DEFAULT 'somme'
                        CHECK (methode IN ('somme', 'start_back', 'odi', 'sous_echelles')),
  -- [{ cle, libelle, min, max, niveau, conduite }]
  interpretation        JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_citation       TEXT,
  source_url            TEXT,
  licence               TEXT,
  licence_statut        TEXT NOT NULL DEFAULT 'a_verifier'
                        CHECK (licence_statut IN ('libre', 'a_verifier', 'demande_a_faire', 'demandee', 'obtenue')),
  licence_url           TEXT,
  -- Faux tant que la formulation n'est pas celle de la traduction validée.
  traduction_officielle BOOLEAN NOT NULL DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  order_index           INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questionnaire_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  order_index      INTEGER NOT NULL,
  label            TEXT NOT NULL,
  aide             TEXT,
  -- [{ label, valeur }] : propre à l'item, car un même questionnaire mélange
  -- parfois des échelles différentes (le neuvième item du STarT Back).
  echelle          JSONB NOT NULL,
  sous_echelle     TEXT,
  UNIQUE (questionnaire_id, order_index)
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questionnaires_lecture ON public.questionnaires;
CREATE POLICY questionnaires_lecture ON public.questionnaires
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS questionnaires_ecriture ON public.questionnaires;
CREATE POLICY questionnaires_ecriture ON public.questionnaires
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS questionnaire_items_lecture ON public.questionnaire_items;
CREATE POLICY questionnaire_items_lecture ON public.questionnaire_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.questionnaires q
     WHERE q.id = questionnaire_items.questionnaire_id
       AND (q.status = 'published' OR public.is_admin())
  ));

DROP POLICY IF EXISTS questionnaire_items_ecriture ON public.questionnaire_items;
CREATE POLICY questionnaire_items_ecriture ON public.questionnaire_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.questionnaires IS
  'Questionnaires cliniques. Les règles de calcul sont dans lib/questionnaires.ts, la base ne porte que les seuils.';
COMMENT ON COLUMN public.questionnaires.licence_statut IS
  'Suivi de la régularisation : certains instruments demandent un accord pour un usage commercial.';
COMMENT ON COLUMN public.questionnaires.traduction_officielle IS
  'Faux tant que la formulation n''est pas celle de la traduction validée fournie avec la licence.';
