-- Simulateur de consultation.
--
-- Le praticien mène l'anamnèse en langage libre, un modèle répond dans le rôle
-- du patient, et les examens cliniques sont lus dans le cas, jamais inventés
-- par le modèle : un test donne le même résultat à chaque fois qu'on le
-- demande, et deux praticiens qui examinent le même patient trouvent la même
-- chose. C'est la condition pour que la conclusion soit corrigeable.
--
-- Les cas ne sont lisibles que par la clé service-role et par un administrateur.
-- Un cas contient sa propre solution : le rendre lisible au navigateur
-- reviendrait à afficher la réponse dans la console.

CREATE TABLE IF NOT EXISTS public.region_simulation_cases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES public.region_modules(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  label         TEXT NOT NULL,
  difficulty    TEXT NOT NULL DEFAULT 'intermediaire'
                CHECK (difficulty IN ('decouverte', 'intermediaire', 'expert')),
  -- Ce que le praticien voit en entrant : motif, âge, profession.
  presentation  JSONB NOT NULL,
  -- Ce que sait le patient et qu'il ne dira que si on le lui demande.
  secret        JSONB NOT NULL,
  -- Résultats d'examen propres au cas, indexés par le code de l'examen.
  -- Les examens absents renvoient le résultat normal du catalogue.
  exams         JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Correction : la conclusion attendue est la clé d'une feuille de l'arbre
  -- de décision du parcours, ce qui évite d'entretenir deux vérités.
  expected      JSONB NOT NULL,
  debrief       TEXT,
  status        TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, slug)
);

CREATE TABLE IF NOT EXISTS public.region_simulation_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id       UUID NOT NULL REFERENCES public.region_simulation_cases(id) ON DELETE CASCADE,
  -- [{ role: 'praticien' | 'patient', texte }]
  transcript    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ code, libelle, resultat }]
  exams         JSONB NOT NULL DEFAULT '[]'::jsonb,
  verdict       JSONB,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS region_simulation_sessions_user_idx
  ON public.region_simulation_sessions(user_id, started_at DESC);

ALTER TABLE public.region_simulation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_simulation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS region_simulation_cases_admin_read ON public.region_simulation_cases;
CREATE POLICY region_simulation_cases_admin_read ON public.region_simulation_cases
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS region_simulation_cases_admin_write ON public.region_simulation_cases;
CREATE POLICY region_simulation_cases_admin_write ON public.region_simulation_cases
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Une session se lit, mais ne s'écrit pas depuis le navigateur : sinon le
-- verdict serait modifiable par celui qu'il évalue.
DROP POLICY IF EXISTS region_simulation_sessions_owner_read ON public.region_simulation_sessions;
CREATE POLICY region_simulation_sessions_owner_read ON public.region_simulation_sessions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

COMMENT ON TABLE public.region_simulation_cases IS
  'Cas du simulateur de consultation. Contient la solution : lecture réservée à la clé service-role et aux administrateurs.';
COMMENT ON COLUMN public.region_simulation_cases.expected IS
  'Conclusion attendue, dont la clé issue renvoie à une feuille de l''arbre de décision du parcours.';
