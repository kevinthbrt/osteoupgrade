-- Un questionnaire se cite comme un test ou un exercice : depuis le chapitre
-- qui l'enseigne, et à cet endroit-là. Le sortir dans un outil séparé obligeait
-- le praticien à quitter le cours au moment précis où il apprend à s'en servir.
--
-- Même principe que le reste du parcours : le chapitre cite la brique, il ne la
-- recopie pas. Une formulation corrigée une fois l'est partout.

CREATE TABLE IF NOT EXISTS public.region_chapter_questionnaires (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID NOT NULL REFERENCES public.region_chapters(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  note             TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (chapter_id, questionnaire_id)
);

ALTER TABLE public.region_chapter_questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS region_chapter_questionnaires_lecture ON public.region_chapter_questionnaires;
CREATE POLICY region_chapter_questionnaires_lecture ON public.region_chapter_questionnaires
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.region_chapters c
      JOIN public.region_modules m ON m.id = c.module_id
     WHERE c.id = region_chapter_questionnaires.chapter_id
       AND (m.status = 'published' OR public.is_admin())
  ));

DROP POLICY IF EXISTS region_chapter_questionnaires_ecriture ON public.region_chapter_questionnaires;
CREATE POLICY region_chapter_questionnaires_ecriture ON public.region_chapter_questionnaires
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.region_chapter_questionnaires IS
  'Questionnaires cités par un chapitre. Les items restent réservés aux abonnés par la politique de questionnaire_items.';
