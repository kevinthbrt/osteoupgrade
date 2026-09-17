-- Les questionnaires rejoignent les chapitres qui les enseignent.
--
-- Trois corrections en une.
--
-- 1. Les renvois vers l'outil séparé sont remplacés : le questionnaire est
--    maintenant dans le chapitre, plus bas, et le texte le dit.
-- 2. Les rattachements sont créés, chaque instrument sous le chapitre qui en
--    parle.
-- 3. L'EIFEL et l'Oswestry n'étaient discutés nulle part. Les ajouter au
--    catalogue sans que le cours en parle aurait été incohérent : la grille de
--    décision reçoit donc le passage qui manquait sur la mesure de l'incapacité
--    et sur son suivi, et c'est là qu'ils sont rattachés.

DO $do$
DECLARE
  v_module UUID;
  v_jaunes UUID;
  v_mecanismes UUID;
  v_grille UUID;
  v_ordre INTEGER;
  v_liens INTEGER;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  SELECT id INTO v_jaunes FROM public.region_chapters WHERE module_id = v_module AND slug = 'drapeaux-jaunes';
  SELECT id INTO v_mecanismes FROM public.region_chapters WHERE module_id = v_module AND slug = 'mecanismes-douleur';
  SELECT id INTO v_grille FROM public.region_chapters WHERE module_id = v_module AND slug = 'croiser-les-axes';

  -- =========================================================================
  -- 1. Retirer les renvois vers l'outil séparé, et dire où c'est maintenant.
  -- =========================================================================
  UPDATE public.region_chapter_sections
     SET body_html = replace(body_html,
       $v$<p><strong>Le faire passer.</strong> Les neuf items, leur cotation et le classement en trois niveaux sont dans <a href="/outils/questionnaires/start-back">Outils, questionnaires cliniques</a>. Le sous-score psychosocial y est calculé à part, parce que c'est lui qui sépare un risque moyen d'un risque élevé dès que le total atteint quatre.</p>$v$,
       $n$<p><strong>Le faire passer.</strong> Les neuf items sont plus bas dans ce chapitre, avec leur cotation. Le sous-score psychosocial y est calculé à part, parce que c'est lui qui sépare un risque moyen d'un risque élevé dès que le total atteint quatre.</p>$n$)
   WHERE chapter_id = v_jaunes AND title = 'Le STarT Back Tool';

  UPDATE public.region_chapter_sections
     SET body_html = replace(body_html,
       $v$<p>Le FABQ est disponible dans <a href="/outils/questionnaires/fabq">Outils, questionnaires cliniques</a>, avec ses deux sous-échelles calculées séparément : c'est la sous-échelle travail qui pèse sur le pronostic professionnel, et c'est elle que demande la règle de Flynn.</p>$v$,
       $n$<p>Le FABQ est plus bas dans ce chapitre, avec ses deux sous-échelles calculées séparément : c'est la sous-échelle travail qui pèse sur le pronostic professionnel, et c'est elle que demande la règle de Flynn.</p>$n$)
   WHERE chapter_id = v_jaunes AND title = 'Les autres outils utiles';

  UPDATE public.region_chapter_sections
     SET body_html = replace(body_html,
       $v$<p>Les dix items du DN4 et le seuil de quatre sont dans <a href="/outils/questionnaires/dn4">Outils, questionnaires cliniques</a>. Rappel de méthode : les deux premières questions s'interrogent, les deux dernières se remplissent après l'examen, un DN4 rempli sans examiner ne veut rien dire.</p>$v$,
       $n$<p>Les dix items du DN4 et le seuil de quatre sont plus bas dans ce chapitre. Rappel de méthode : les deux premières questions s'interrogent, les deux dernières se remplissent après l'examen, un DN4 rempli sans examiner ne veut rien dire.</p>$n$)
   WHERE chapter_id = v_mecanismes AND title = 'Douleur neuropathique';

  -- =========================================================================
  -- 2. Le passage qui manquait : mesurer pour pouvoir comparer.
  -- =========================================================================
  SELECT coalesce(max(order_index), -1) + 1 INTO v_ordre
    FROM public.region_chapter_sections WHERE chapter_id = v_grille;

  DELETE FROM public.region_chapter_sections
   WHERE chapter_id = v_grille AND title = 'Mesurer, pour pouvoir comparer';

  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_grille, 'Mesurer, pour pouvoir comparer',
   $h$<p>La grille dit quoi faire. Elle ne dit pas encore si cela a marché, et c'est une autre question, que l'on tranche presque toujours de mémoire : le patient « va mieux ». Trois semaines plus tard, ni lui ni vous ne savez de combien, ni depuis quand.</p><p>Une échelle d'incapacité remplie à la première consultation règle le problème pour deux minutes de travail. Ce qui compte n'est pas le chiffre du jour, c'est l'écart avec le suivant.</p><p><strong>L'EIFEL</strong>, adaptation française du Roland-Morris, est la plus rapide : vingt-quatre phrases, on coche celles qui décrivent la journée. Une variation de deux à trois points est considérée comme cliniquement significative, ce qui donne un repère net pour décider de poursuivre ou de changer de direction.</p><p><strong>L'Oswestry</strong> est plus fin et plus long, et il donne un pourcentage d'incapacité, plus parlant pour un courrier. Sa particularité est utile à connaître : une section qui ne concerne pas le patient se laisse vide et sort du calcul, elle ne compte pas pour zéro.</p><p>Un seul des deux suffit, et le même d'une fois sur l'autre. Changer d'outil en cours de suivi, c'est perdre la comparaison, qui était toute la raison de le remplir.</p><p><strong>Le piège à connaître.</strong> Ces scores mesurent ce que le patient dit de sa vie quotidienne, pas l'état de son dos. Un score qui ne bouge pas chez quelqu'un qui a repris son travail et son sport ne veut pas dire que rien n'a changé : il veut dire que l'outil ne mesure pas ce qui a changé. C'est l'objectif fonctionnel écrit, lui, qui répond à cette question.</p>$h$,
   'pratique', v_ordre);

  -- =========================================================================
  -- 3. Les rattachements.
  -- =========================================================================
  DELETE FROM public.region_chapter_questionnaires
   WHERE chapter_id IN (v_jaunes, v_mecanismes, v_grille);

  INSERT INTO public.region_chapter_questionnaires (chapter_id, questionnaire_id, note, order_index)
  SELECT v_jaunes, id, 'À faire remplir en salle d''attente. Le sous-score psychosocial décide du niveau dès que le total atteint quatre.', 0
    FROM public.questionnaires WHERE slug = 'start-back';

  INSERT INTO public.region_chapter_questionnaires (chapter_id, questionnaire_id, note, order_index)
  SELECT v_jaunes, id, 'La sous-échelle travail est celle qui pèse sur le pronostic, et l''item que demande la règle de Flynn.', 1
    FROM public.questionnaires WHERE slug = 'fabq';

  INSERT INTO public.region_chapter_questionnaires (chapter_id, questionnaire_id, note, order_index)
  SELECT v_mecanismes, id, 'Les deux premières questions s''interrogent, les deux dernières se remplissent après l''examen.', 0
    FROM public.questionnaires WHERE slug = 'dn4';

  INSERT INTO public.region_chapter_questionnaires (chapter_id, questionnaire_id, note, order_index)
  SELECT v_grille, id, 'Le plus rapide des deux. Une variation de deux à trois points est cliniquement significative.', 0
    FROM public.questionnaires WHERE slug = 'eifel';

  INSERT INTO public.region_chapter_questionnaires (chapter_id, questionnaire_id, note, order_index)
  SELECT v_grille, id, 'Plus fin, et son pourcentage se cite mieux dans un courrier. Une section sans objet se laisse vide.', 1
    FROM public.questionnaires WHERE slug = 'oswestry';

  -- Vérification : cinq rattachements, et plus aucun renvoi vers l'outil
  -- séparé qui, lui, disparaît.
  SELECT count(*) INTO v_liens FROM public.region_chapter_questionnaires;
  IF v_liens <> 5 THEN
    RAISE EXCEPTION 'Cinq rattachements attendus, % trouvés', v_liens;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.region_chapter_sections s
      JOIN public.region_chapters c ON c.id = s.chapter_id
     WHERE c.module_id = v_module AND s.body_html LIKE '%outils/questionnaires%'
  ) THEN
    RAISE EXCEPTION 'Un renvoi vers l''outil séparé subsiste dans le module.';
  END IF;
END $do$;
