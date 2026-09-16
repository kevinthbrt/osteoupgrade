-- Parcours régionaux : activités interactives.
--
-- Un chapitre qui se lit ne se retient pas. Ces tables ajoutent au parcours
-- ce qui manquait : des questions auxquelles le lecteur répond, avec une
-- correction argumentée, et un calculateur de probabilité qui rend tangible
-- ce que le chapitre sur les rapports de vraisemblance explique en mots.
--
-- Un seul type de ligne, un `kind` et un `payload` JSON : les formats
-- d'activité évoluent plus vite qu'un schéma, et une table par format aurait
-- imposé une migration à chaque nouvelle idée pédagogique.

CREATE TABLE IF NOT EXISTS public.region_chapter_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT,
  prompt TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT region_chapter_activities_kind_check CHECK (kind IN (
    'qcm', 'vrai_faux', 'cas_etape', 'probabilite', 'tri_drapeaux'
  ))
);

COMMENT ON TABLE public.region_chapter_activities IS 'Activités interactives d''un chapitre. Le format exact de `payload` dépend de `kind`, voir docs/PARCOURS_REGIONAUX.md.';
COMMENT ON COLUMN public.region_chapter_activities.payload IS 'qcm : {options:[{label, correct, feedback}], multiple}. vrai_faux : {statements:[{label, correct, feedback}]}. cas_etape : {steps:[{situation, question, options:[...]}]}. probabilite : {prevalence, tests:[{name, lr_pos, lr_neg}]}. tri_drapeaux : {items:[{label, niveau, feedback}], niveaux:[...]}.';

CREATE INDEX IF NOT EXISTS idx_region_chapter_activities_chapter
  ON public.region_chapter_activities(chapter_id, order_index);

-- Une tentative par activité et par utilisateur : on garde le dernier état,
-- pas l'historique. Le but est de savoir où l'on en est, pas de noter.
CREATE TABLE IF NOT EXISTS public.region_activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.region_chapter_activities(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_region_activity_attempts_user
  ON public.region_activity_attempts(user_id);

ALTER TABLE public.region_chapter_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_activity_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture des activités des chapitres visibles"
  ON public.region_chapter_activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.region_chapters c
      JOIN public.region_modules m ON m.id = c.module_id
      WHERE c.id = region_chapter_activities.chapter_id
        AND (m.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY "Écriture des activités réservée aux admins"
  ON public.region_chapter_activities FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Chacun lit ses réponses"
  ON public.region_activity_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chacun enregistre ses réponses"
  ON public.region_activity_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chacun met à jour ses réponses"
  ON public.region_activity_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chacun efface ses réponses"
  ON public.region_activity_attempts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_region_chapter_activities_updated_at ON public.region_chapter_activities;
CREATE TRIGGER trg_region_chapter_activities_updated_at
  BEFORE UPDATE ON public.region_chapter_activities
  FOR EACH ROW EXECUTE FUNCTION public.touch_region_updated_at();
