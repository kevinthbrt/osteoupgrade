-- Le module citait le STarT Back, le FABQ, l'Örebro et le DN4 sans jamais
-- permettre de les faire passer. Maintenant qu'ils existent dans l'outil,
-- les sections concernées y renvoient.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
  v_touches INTEGER := 0;
  v_n INTEGER;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  -- Drapeaux jaunes : le STarT Back, et les autres outils.
  SELECT id INTO v_chapter FROM public.region_chapters
   WHERE module_id = v_module AND slug = 'drapeaux-jaunes';

  UPDATE public.region_chapter_sections
     SET body_html = body_html ||
       $h$<p><strong>Le faire passer.</strong> Les neuf items, leur cotation et le classement en trois niveaux sont dans <a href="/outils/questionnaires/start-back">Outils, questionnaires cliniques</a>. Le sous-score psychosocial y est calculé à part, parce que c'est lui qui sépare un risque moyen d'un risque élevé dès que le total atteint quatre.</p>$h$
   WHERE chapter_id = v_chapter AND title = 'Le STarT Back Tool'
     AND body_html NOT LIKE '%outils/questionnaires%';
  GET DIAGNOSTICS v_n = ROW_COUNT; v_touches := v_touches + v_n;

  UPDATE public.region_chapter_sections
     SET body_html = body_html ||
       $h$<p>Le FABQ est disponible dans <a href="/outils/questionnaires/fabq">Outils, questionnaires cliniques</a>, avec ses deux sous-échelles calculées séparément : c'est la sous-échelle travail qui pèse sur le pronostic professionnel, et c'est elle que demande la règle de Flynn.</p>$h$
   WHERE chapter_id = v_chapter AND title = 'Les autres outils utiles'
     AND body_html NOT LIKE '%outils/questionnaires%';
  GET DIAGNOSTICS v_n = ROW_COUNT; v_touches := v_touches + v_n;

  -- Mécanismes de la douleur : le DN4.
  SELECT id INTO v_chapter FROM public.region_chapters
   WHERE module_id = v_module AND slug = 'mecanismes-douleur';

  UPDATE public.region_chapter_sections
     SET body_html = body_html ||
       $h$<p>Les dix items du DN4 et le seuil de quatre sont dans <a href="/outils/questionnaires/dn4">Outils, questionnaires cliniques</a>. Rappel de méthode : les deux premières questions s'interrogent, les deux dernières se remplissent après l'examen, un DN4 rempli sans examiner ne veut rien dire.</p>$h$
   WHERE chapter_id = v_chapter AND title = 'Douleur neuropathique'
     AND body_html NOT LIKE '%outils/questionnaires%';
  GET DIAGNOSTICS v_n = ROW_COUNT; v_touches := v_touches + v_n;

  -- Le lien ne sert à rien si la cible n'existe pas : mieux vaut échouer ici
  -- que de publier un renvoi mort dans un chapitre.
  IF NOT EXISTS (SELECT 1 FROM public.questionnaires WHERE slug IN ('start-back', 'fabq', 'dn4') HAVING count(*) = 3) THEN
    RAISE EXCEPTION 'Questionnaires cibles absents : appliquer d''abord la migration questionnaires_lombaire';
  END IF;

  IF v_touches = 0 THEN
    RAISE NOTICE 'Aucune section modifiée : les liens étaient déjà en place.';
  END IF;
END $do$;
