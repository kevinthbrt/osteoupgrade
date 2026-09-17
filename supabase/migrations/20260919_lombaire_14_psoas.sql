-- Le psoas était présenté comme un diagnostic lombaire.
--
-- Le paragraphe disait « le psoas, douloureux ou raccourci, donne une douleur
-- inguinale et lombaire basse », reproduite au test de Thomas. C'est le modèle
-- du muscle raccourci qui tirerait sur le rachis, et il n'est pas établi :
-- la fiabilité du test de Thomas est moyenne, aucune étude ne relie
-- l'extensibilité des fléchisseurs de hanche à la lombalgie commune, et aucun
-- test ne désigne le psoas comme source d'une douleur lombaire.
--
-- Le parcours se contredisait donc lui-même, puisque trois de ses chapitres
-- démontrent qu'on ne nomme pas un tissu à partir d'un examen qui ne peut pas
-- le nommer. Ce qui reste vrai est gardé : la douleur inguinale liée à
-- l'ilio-psoas, qui est une entité reconnue, et l'abcès du psoas, qui est le
-- véritable enjeu de ce muscle en consultation.
--
-- La section mêlait ischio-jambiers et psoas, ce qui interdisait de marquer le
-- piège sans étiqueter aussi la partie qui, elle, tient. Elle est donc scindée.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
  v_sections INTEGER;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  SELECT id INTO v_chapter FROM public.region_chapters
   WHERE module_id = v_module AND slug = 'voisinage';
  IF v_chapter IS NULL THEN
    RAISE EXCEPTION 'Chapitre voisinage absent';
  END IF;

  -- 1. L'ancienne section ne garde que les ischio-jambiers.
  UPDATE public.region_chapter_sections
     SET title = 'La tendinopathie proximale des ischio-jambiers',
         body_html = $h$<p>Une douleur profonde de l’ischion, très caractéristique en position assise prolongée, aggravée par la course, les foulées longues et les étirements. Le test de Puranen-Orava, les tests en charge et en étirement la reproduisent, et leur regroupement a été évalué contre imagerie.</p><p>Elle est régulièrement prise pour une sciatique tronquée ou une sacro-iliaque. Ce qui l’en distingue : la douleur se montre du doigt sur l’ischion, elle est réveillée par l’appui assis plutôt que par la mise en tension neurale, et les tests neurodynamiques restent négatifs.</p>$h$,
         callout = 'none',
         order_index = 3
   WHERE chapter_id = v_chapter
     AND title IN ('Psoas et ischio-jambiers proximaux', 'La tendinopathie proximale des ischio-jambiers');

  -- 2. L'anomalie de transition laisse la place au nouveau paragraphe.
  UPDATE public.region_chapter_sections
     SET order_index = 5
   WHERE chapter_id = v_chapter AND title = 'L’anomalie de transition lombo-sacrée';

  -- 3. Le psoas, dans sa propre section, marquée comme un piège.
  DELETE FROM public.region_chapter_sections
   WHERE chapter_id = v_chapter AND title = 'Le psoas : ce qui est établi, et ce qui ne l’est pas';

  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le psoas : ce qui est établi, et ce qui ne l’est pas',
   $h$<p><strong>Ce qui tient.</strong> Une douleur de l’aine reproduite par la flexion de hanche contre résistance, et parfois à l’étirement, correspond à une entité reconnue : la douleur inguinale liée à l’ilio-psoas, telle que la nomme l’accord de Doha sur les douleurs inguinales du sportif. C’est une douleur de l’aine, locale, et elle se traite comme telle.</p><p><strong>Ce qui ne tient pas.</strong> Le modèle du psoas « raccourci » qui tirerait sur le rachis et produirait la lombalgie. La fiabilité du test de Thomas est moyenne, aucune étude n’établit de lien entre l’extensibilité des fléchisseurs de hanche et la lombalgie commune, et surtout aucun test clinique ne permet de désigner le psoas comme la source d’une douleur lombaire. Le retenir comme diagnostic lombaire, c’est refaire exactement ce que trois chapitres de ce parcours démontrent impossible : nommer un tissu à partir d’un examen qui ne peut pas le nommer.</p><p>La nuance est donc pratique, pas académique. Trouver un test de Thomas limité chez un lombalgique autorise à travailler l’extensibilité de hanche si cela gêne un geste précis. Cela n’autorise pas à annoncer au patient que son psoas est la cause de son mal de dos, ni à construire un traitement sur cette explication.</p><p><strong>Ce qu’il faut garder de ce muscle.</strong> Chez l’adulte, une douleur de psoas d’apparition récente sans cause mécanique, a fortiori avec fièvre, terrain diabétique, immunodépression ou infection récente, doit faire penser à un abcès du psoas ou à une pathologie rétropéritonéale. C’est le véritable enjeu de ce muscle en consultation, et il relève de l’axe 1, pas du répertoire des tableaux mécaniques.</p>$h$,
   'piege', 4);

  -- 4. Les notes des tests liés disaient la même chose que l'ancien paragraphe.
  UPDATE public.region_chapter_tests
     SET note = 'Extensibilité des fléchisseurs de hanche. Ne désigne pas le psoas comme source d’une douleur lombaire : voir la section qui lui est consacrée.'
   WHERE chapter_id = v_chapter
     AND test_id IN (SELECT id FROM public.orthopedic_tests WHERE btrim(name) = 'Test de Thomas');

  UPDATE public.region_chapter_tests
     SET note = 'Contraction résistée de l’ilio-psoas : reproduit une douleur de l’aine, pas une lombalgie.'
   WHERE chapter_id = v_chapter
     AND test_id IN (SELECT id FROM public.orthopedic_tests WHERE btrim(name) = 'Flexion Active de hanche');

  -- 5. La source de la terminologie retenue.
  DELETE FROM public.region_chapter_references
   WHERE chapter_id = v_chapter AND citation LIKE 'Weir A%';

  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter,
   'Weir A et al. Doha agreement meeting on terminology and definitions in groin pain in athletes. Br J Sports Med, 2015.',
   2015, 'consensus',
   'La terminologie retenue pour la douleur inguinale liée à l’ilio-psoas, définie par la clinique et non par l’imagerie.',
   'https://pubmed.ncbi.nlm.nih.gov/26031643/', 6);

  -- Vérification : la scission doit laisser six sections, et le piège doit
  -- exister. Une section perdue passerait inaperçue à la relecture.
  SELECT count(*) INTO v_sections FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  IF v_sections <> 6 THEN
    RAISE EXCEPTION 'Le chapitre voisinage devrait compter 6 sections, il en compte %', v_sections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.region_chapter_sections
     WHERE chapter_id = v_chapter AND callout = 'piege' AND title LIKE 'Le psoas%'
  ) THEN
    RAISE EXCEPTION 'La section sur le psoas est absente ou n''est pas marquée comme un piège.';
  END IF;
END $do$;
