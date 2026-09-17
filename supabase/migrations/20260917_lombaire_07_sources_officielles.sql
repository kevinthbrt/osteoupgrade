DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  -- ==========================================================================
  -- 1. Liens vers les sources primaires
  -- ==========================================================================
  UPDATE public.region_chapter_references
     SET url = 'https://www.nice.org.uk/guidance/ng59'
   WHERE citation ILIKE '%NICE guideline NG59%' OR citation ILIKE '%National Institute for Health and Care Excellence%';

  UPDATE public.region_chapter_references
     SET url = 'https://www.ncbi.nlm.nih.gov/books/NBK599212/'
   WHERE citation ILIKE '%WHO guideline for non-surgical management%' OR citation ILIKE '%Organisation mondiale de la santé%';

  -- ==========================================================================
  -- 2. Chapitre « principes-traitement » : mise à jour NICE de juillet 2026
  -- ==========================================================================
  SELECT id INTO v_chapter FROM public.region_chapters WHERE module_id = v_module AND slug = 'principes-traitement';

  UPDATE public.region_chapter_sections
     SET body_html = '<p><strong>Exercice</strong> : recommandé par toutes les instances, sans supériorité établie d’une modalité sur une autre. C’est l’intervention la mieux soutenue. La HAS en fait « le traitement principal » de la lombalgie commune.</p><p><strong>Éducation et auto-prise en charge</strong> : recommandées, avec un effet net sur les croyances et sur le recours aux soins.</p><p><strong>Thérapie manuelle</strong> : recommandée, mais avec une condition désormais explicite. Depuis la mise à jour de juillet 2026, la recommandation 1.2.7 du NICE se lit « envisager la thérapie manuelle, manipulation, mobilisation ou techniques de tissus mous, uniquement dans le cadre d’un programme de traitement qui comprend de l’exercice ». La mention « avec ou sans thérapie psychologique » qu’elle portait auparavant a été supprimée. L’OMS classe la manipulation vertébrale et le massage parmi les interventions qui « peuvent être proposées », en recommandation conditionnelle.</p><p><strong>Approches psychologiques et programmes combinés</strong> : c’est le point qui a bougé, et il mérite d’être compris plutôt que récité. Voir la section suivante.</p><p><strong>Ce que l’OMS déconseille explicitement</strong> : opioïdes, myorelaxants, tractions, corsets et ceintures lombaires, neurostimulation transcutanée.</p>',
         callout = 'preuve'
   WHERE chapter_id = v_chapter AND title = 'Ce qui est recommandé, et à quel niveau';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter AND title = 'Quand deux instances ne disent plus la même chose';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Quand deux instances ne disent plus la même chose',
   '<p>Le 29 juillet 2026, le NICE a <strong>retiré</strong> deux recommandations de la NG59 : la 1.2.13, sur les thérapies psychologiques d’approche cognitivo-comportementale, et la 1.2.14, sur les programmes combinés physiques et psychologiques. Motif annoncé : ces recommandations reposaient en partie sur des travaux <strong>rétractés depuis leur publication</strong>, et le comité a jugé qu’une réécriture complète ne modifierait probablement pas la pratique. Dans le même mouvement, la recommandation 1.1.3 a été amendée : la stratification du risque n’oriente plus vers un programme combiné physique et psychologique, elle oriente vers « des programmes d’exercice, avec ou sans thérapie manuelle ».</p><p>L’OMS, de son côté, maintient dans son guide de 2023 que les interventions psychologiques et la prise en charge biopsychosociale multicomposante par une équipe pluridisciplinaire peuvent être proposées, en recommandation conditionnelle et sur une certitude de preuve modérée à très faible.</p><p>Les deux positions ne sont pas contradictoires au sens strict : l’une retire une recommandation dont la base probante s’est effondrée, l’autre maintient une option faible. Mais elles ne conduisent pas au même discours, et un enseignement honnête doit le dire au lieu de choisir la version qui l’arrange.</p><p><strong>Ce qu’il faut en retenir pour la consultation.</strong> Repérer les facteurs psychosociaux reste justifié : ils prédisent l’évolution, c’est indépendant de cette controverse. Ce qui est fragilisé, c’est le raccourci « risque élevé donc programme psychologique structuré ». Adapter son explication, son dosage et sa progression au profil du patient reste défendable ; promettre un bénéfice propre à une thérapie psychologique formalisée l’est moins qu’il y a un an.</p>',
   'preuve', 25);

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter AND title = 'Ce que dit la HAS, et ce qu’elle ajoute';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce que dit la HAS, et ce qu’elle ajoute',
   '<p>La fiche mémo de la Haute Autorité de Santé, adoptée le 27 mars 2019, est la référence opposable en France et elle apporte deux éléments que les recommandations anglo-saxonnes formulent moins nettement.</p><p><strong>Une classification par durée et par risque</strong>, plus utile en consultation que la seule opposition aigu contre chronique : la poussée aiguë, la lombalgie <strong>à risque de chronicité</strong>, qui dure moins de trois mois mais s’accompagne de facteurs de mauvais pronostic, et la lombalgie chronique au delà de trois mois. La catégorie intermédiaire est celle sur laquelle on peut encore agir, et c’est précisément celle qu’on ne nomme pas quand on raisonne en deux cases.</p><p><strong>Un chiffre à connaître</strong> : dans environ 90 % des cas, la lombalgie commune évolue favorablement en moins de quatre à six semaines. C’est la phrase à donner au patient, et elle vient d’une instance qu’il peut vérifier.</p><p>La HAS place l’activité physique comme traitement principal, recommande le repérage précoce du risque de chronicité par un outil validé, et rappelle qu’en l’absence de drapeau rouge, l’imagerie n’a pas d’indication dans un épisode aigu, avec ou sans radiculalgie.</p>',
   'cle', 26);

  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.', 2019, 'recommandation', 'La référence française : classification par durée et par risque, activité physique en traitement principal, imagerie non indiquée en aigu.', 'https://www.has-sante.fr/upload/docs/application/pdf/2019-04/fm_lombalgie_v2_2.pdf', 4),
  (v_chapter, 'National Institute for Health and Care Excellence. NG59, mise à jour du 29 juillet 2026 : retrait des recommandations 1.2.13 et 1.2.14, amendement des recommandations 1.1.3 et 1.2.7.', 2026, 'recommandation', 'Le retrait des recommandations sur les thérapies psychologiques et les programmes combinés, motivé en partie par des travaux rétractés.', 'https://www.nice.org.uk/guidance/ng59/chapter/Update-information', 5);

  -- ==========================================================================
  -- 3. Chapitre « classification » : la grille HAS
  -- ==========================================================================
  SELECT id INTO v_chapter FROM public.region_chapters WHERE module_id = v_module AND slug = 'classification';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter AND title = 'La seconde grille : durée et risque (HAS)';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'La seconde grille : durée et risque (HAS)',
   '<p>Le tri en trois catégories dit ce que le patient <strong>a</strong>. La grille de la HAS dit où il en est de sa <strong>trajectoire</strong>, et les deux se superposent sans se contredire.</p><p><strong>Poussée aiguë</strong> : intensification temporaire des symptômes, avec retentissement fonctionnel possible.</p><p><strong>Lombalgie à risque de chronicité</strong> : moins de trois mois d’évolution, mais avec des facteurs de mauvais pronostic repérés. C’est la catégorie décisive, parce que c’est la seule où l’on peut encore infléchir la trajectoire, et c’est celle qui disparaît quand on raisonne seulement en aigu contre chronique.</p><p><strong>Lombalgie chronique</strong> : plus de trois mois.</p><p>La HAS recommande le repérage précoce de ce risque par un outil validé, STarT Back ou Örebro, dès la première consultation. Le chapitre sur les drapeaux jaunes détaille la passation et ce qu’on en fait.</p>',
   'cle', 5);

  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.', 2019, 'recommandation', 'La grille française par durée et par risque, dont la catégorie « à risque de chronicité ».', 'https://www.has-sante.fr/upload/docs/application/pdf/2019-04/fm_lombalgie_v2_2.pdf', 4);

  -- ==========================================================================
  -- 4. Chapitre « drapeaux-jaunes » : ce que le retrait NICE change
  -- ==========================================================================
  SELECT id INTO v_chapter FROM public.region_chapters WHERE module_id = v_module AND slug = 'drapeaux-jaunes';

  UPDATE public.region_chapter_sections
     SET body_html = '<p>Neuf items, deux minutes de passation. Le score total et un sous-score psychosocial classent le patient en risque faible, moyen ou élevé. L’essai randomisé de Hill, publié dans le Lancet, avait montré qu’orienter le traitement selon ce classement améliorait les résultats fonctionnels et réduisait les coûts et les arrêts de travail. La HAS recommande ce repérage précoce, et le NICE recommande toujours d’envisager une stratification du risque au premier contact.</p><p><strong>Ce qui a changé en juillet 2026.</strong> Le NICE a amendé la recommandation 1.1.3 : la stratification n’oriente plus vers un programme combiné physique et psychologique, mais vers « des programmes d’exercice, avec ou sans thérapie manuelle ». La stratification reste donc recommandée, c’est la destination du patient à risque élevé qui a été revue.</p><p>Application actuelle : risque faible, rassurer, conseiller, une ou deux séances suffisent souvent. Risque moyen, thérapie manuelle et exercice structurés. Risque élevé, suivi plus soutenu, exercice progressif, travail explicite sur les croyances et les obstacles, et discussion pluridisciplinaire si rien ne bouge. Ce qui n’est plus soutenu par le NICE, c’est de présenter un programme psychologique formalisé comme la suite attendue d’un score élevé.</p>'
   WHERE chapter_id = v_chapter AND title = 'Le STarT Back Tool';

  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.', 2019, 'recommandation', 'Le repérage précoce du risque de chronicité par un outil validé, recommandé en France.', 'https://www.has-sante.fr/upload/docs/application/pdf/2019-04/fm_lombalgie_v2_2.pdf', 3),
  (v_chapter, 'National Institute for Health and Care Excellence. NG59, mise à jour du 29 juillet 2026.', 2026, 'recommandation', 'La stratification reste recommandée, la voie vers les programmes combinés a été retirée.', 'https://www.nice.org.uk/guidance/ng59/chapter/Update-information', 4);

  -- ==========================================================================
  -- 5. Chapitre « imagerie » : la position française sur la lombalgie chronique
  -- ==========================================================================
  SELECT id INTO v_chapter FROM public.region_chapters WHERE module_id = v_module AND slug = 'imagerie';

  UPDATE public.region_chapter_sections
     SET body_html = '<p>Une imagerie lombaire se justifie dans quatre situations. <strong>Suspicion de pathologie spécifique</strong> : faisceau de drapeaux rouges, antécédent de cancer, suspicion de fracture, de spondylodiscite ou de spondyloarthrite. <strong>Déficit neurologique</strong> significatif ou progressif. <strong>Projet interventionnel</strong> : bilan préopératoire ou préalable à une infiltration. <strong>Lombalgie chronique</strong> : la HAS recommande une IRM, ou un scanner en cas de contre-indication, lorsque la lombalgie dure depuis plus de trois mois.</p><p>Hors de ces situations, et en particulier dans l’épisode aigu avec ou sans radiculalgie, l’imagerie n’est pas indiquée. Ce n’est pas une question de coût : elle nuit, et la section suivante dit comment.</p><p>Nuance à tenir : cette quatrième indication ne signifie pas qu’une imagerie de lombalgie chronique expliquera la douleur. Elle ferme le doute sur une cause spécifique passée inaperçue, et elle s’accompagne obligatoirement de l’explication que la HAS demande de donner, celle de l’absence de corrélation systématique entre les signes radiologiques et les symptômes.</p>',
         callout = 'cle'
   WHERE chapter_id = v_chapter AND title = 'Les indications réelles';

  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.', 2019, 'recommandation', 'Pas d’imagerie en aigu sans drapeau rouge ; IRM recommandée au delà de trois mois, avec l’explication à donner au patient.', 'https://www.has-sante.fr/upload/docs/application/pdf/2019-04/fm_lombalgie_v2_2.pdf', 4);

  -- ==========================================================================
  -- 6. Chapitre « education-matching » : aligner l'axe « niveau de risque »
  -- ==========================================================================
  SELECT id INTO v_chapter FROM public.region_chapters WHERE module_id = v_module AND slug = 'education-matching';

  UPDATE public.region_chapter_sections
     SET body_html = '<p><strong>Axe 1, le tableau clinique</strong>, qui dit quoi faire. Centralisation en extension : programme directionnel. Sténose : flexion et endurance de marche. Radiculalgie : neuromobilisation, gestion de la charge, surveillance du déficit. Instabilité clinique : contrôle moteur. Ceinture pelvienne : transfert de charge et ceinture. Épisode récent avec règle de Flynn favorable : manipulation en première intention, dans un programme qui comprend de l’exercice.</p><p><strong>Axe 2, le niveau de risque</strong>, qui dit à quelle intensité. Risque faible : une à deux séances, conseils, autonomie rapide. Risque moyen : suivi structuré associant manuel et exercice. Risque élevé : suivi plus long, exercice progressif et exposition graduée, travail explicite sur les croyances et sur les obstacles au retour à l’activité.</p><p>Précision qui compte depuis la mise à jour du NICE de juillet 2026 : orienter un patient à risque élevé vers une thérapie psychologique formalisée ou un programme combiné n’est plus une recommandation du NICE, qui a retiré les deux recommandations correspondantes. L’OMS maintient l’option en recommandation conditionnelle. Ce qui reste solide dans les deux cas, c’est d’adapter votre explication, votre dosage et votre rythme au profil du patient, et d’adresser vers un accompagnement spécialisé lorsque la détresse psychologique dépasse ce qui relève de votre champ.</p>'
   WHERE chapter_id = v_chapter AND title = 'Adapter au profil : deux axes';

END $do$;
