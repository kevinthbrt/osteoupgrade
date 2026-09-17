-- Module « Région lombaire » : partie « Diagnostiquer ».
-- Sept tableaux cliniques : radiculopathie, sténose, discogénique, facettaire,
-- instabilité et spondylolisthésis, ceinture pelvienne, diagnostics de voisinage.
--
-- Les jointures utilisent btrim() sur les noms de tests : certaines fiches
-- historiques portent une espace finale (« Test de FABER »), qui ferait échouer
-- une égalité stricte sans aucun message d'erreur.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'radiculopathie',
    'Radiculopathie et conflit disco-radiculaire',
    'Le tableau où le diagnostic clinique est le plus solide',
    'Diagnostiquer', 'diagnostic',
    'La radiculalgie est l’une des rares situations lombaires où l’examen clinique permet vraiment de conclure, à condition de faire converger topographie, neurodynamique et déficit. Ce chapitre couvre le diagnostic, le niveau atteint, le pronostic et les critères de réorientation.',
    jsonb_build_array(
      'Distinguer radiculalgie, radiculopathie et douleur somatique référée',
      'Situer le niveau atteint à partir du territoire et du déficit',
      'Annoncer un pronostic réaliste et fixer les critères d’avis chirurgical'
    ),
    jsonb_build_array(
      'Radiculalgie : douleur de trajet. Radiculopathie : radiculalgie plus déficit objectif. Les deux se traitent, mais la seconde se surveille.',
      'L’évolution spontanée est favorable dans la grande majorité des cas : deux tiers des hernies symptomatiques régressent cliniquement en six à douze semaines.',
      'La taille de la hernie ne prédit ni la douleur ni l’évolution : les hernies les plus volumineuses régressent souvent le mieux.',
      'La chirurgie accélère le soulagement mais les résultats à un an rejoignent ceux du traitement conservateur, sauf déficit progressif ou queue de cheval.'
    ),
    55, 11
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Trois mots à ne pas confondre',
   '<p><strong>Radiculalgie</strong> : douleur de topographie radiculaire, en bande étroite, descendant sous le genou, souvent avec paresthésies, sans déficit objectif. <strong>Radiculopathie</strong> : la même chose avec un déficit moteur, sensitif ou réflexe objectivable. <strong>Douleur somatique référée</strong> : douleur issue du disque, des articulaires ou des ligaments, projetée dans la fesse et la cuisse, plus diffuse, mal délimitée, ne dépassant habituellement pas le genou, sans systématisation ni déficit.</p><p>La confusion entre la troisième et les deux premières est la plus fréquente, et elle change tout : le discours au patient, le pronostic annoncé, et l’intérêt d’une imagerie.</p>',
   'piege', 0),
  (v_chapter, 'Faire converger les trois plans',
   '<p>Le diagnostic repose sur l’accord de trois éléments. La topographie : trajet systématisé, sous le genou, avec paresthésies dans le même territoire. La neurodynamique : Lasègue ou Slump reproduisant la douleur habituelle, modifié par la sensibilisation à distance ; Leri pour les racines hautes. Le déficit : moteur, sensitif ou réflexe correspondant à la même racine.</p><p>Deux plans sur trois rendent le diagnostic probable, trois sur trois le rendent solide. Un seul plan positif doit faire chercher autre chose.</p>',
   'cle', 1),
  (v_chapter, 'Situer le niveau',
   '<p><strong>L5</strong>, la plus fréquente, souvent par hernie L4-L5 : trajet fessier, face latérale de cuisse et de jambe, dos du pied jusqu’à l’hallux ; faiblesse de l’extension de l’hallux et du moyen fessier ; pas de réflexe propre.</p><p><strong>S1</strong>, par hernie L5-S1 : trajet fessier postérieur, face postérieure de cuisse et de jambe, talon et bord latéral du pied ; faiblesse de la flexion plantaire, difficulté à se hisser sur la pointe ; réflexe achilléen diminué ou aboli.</p><p><strong>L4</strong> : face antéro-interne de cuisse et de jambe ; faiblesse du tibial antérieur, marche sur les talons difficile ; réflexe rotulien diminué.</p><p><strong>L2 et L3</strong>, cruralgie : face antérieure de cuisse, Leri positif, faiblesse du psoas ou du quadriceps. Chez un sujet de plus de 50 ans, une cruralgie isolée impose de penser aussi au diabète, au psoas et aux causes rétropéritonéales.</p>',
   'pratique', 2),
  (v_chapter, 'Pronostic et ce qu’on annonce',
   '<p>L’histoire naturelle est favorable : la majorité des radiculalgies discales s’améliorent nettement en six à douze semaines, et les études d’imagerie répétée montrent une régression spontanée fréquente de la hernie, d’autant plus marquée que la hernie est volumineuse et extrudée. Cette information change le vécu du patient : elle transforme une menace permanente en un problème qui a une durée.</p><p>Ce qu’il ne faut pas dire : que la hernie va se remettre en place, qu’elle est causée par un déplacement vertébral, ou qu’il faudra opérer si cela ne passe pas en quinze jours.</p>',
   'none', 3),
  (v_chapter, 'Réorientation et chirurgie',
   '<p>Avis urgent : syndrome de la queue de cheval, déficit moteur sévère ou rapidement progressif. Avis rapide : déficit moteur significatif stable, douleur non contrôlée malgré un traitement médical bien conduit. Discussion chirurgicale : radiculalgie invalidante persistant au delà de six à huit semaines de traitement conservateur bien mené, avec concordance clinique et radiologique.</p><p>Ce que disent les essais : la chirurgie accélère nettement le soulagement des premières semaines, mais l’écart s’amenuise et les résultats à un et deux ans sont comparables. Cela fait de l’indication un arbitrage entre vitesse de soulagement et risque opératoire, pas une fatalité.</p>',
   'reorientation', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Conflit disco-radiculaire', 'principal', 'Le mécanisme le plus fréquent chez l’adulte jeune et d’âge moyen.', 0),
    ('Radiculopathie lombaire (toutes causes)', 'principal', 'Le cadre général : toute radiculopathie n’est pas discale.', 1),
    ('Sténose foramen intervertébral', 'differentiel', 'Cause fréquente de radiculalgie après 60 ans, de rythme différent.', 2),
    ('Douleurs Somatiques Référées Lombaires', 'differentiel', 'Le différentiel le plus fréquent et le plus souvent manqué.', 3),
    ('Tendinopathie proximale des ischios', 'differentiel', 'Fessalgie basse de l’ischion, reproduite à la mise en charge en étirement.', 4),
    ('Neuropathies fémorale / obturatrice', 'differentiel', 'À évoquer devant une cruralgie atypique, notamment chez le diabétique.', 5)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de Lasègue (SLR)', 'Premier test, pour écarter.', 0),
    ('Test de Lasègue croisé', 'Second test, pour confirmer.', 1),
    ('Slump test', 'Le plus sensible des trois, avec sensibilisation cervicale.', 2),
    ('Test de Leri', 'Indispensable devant une cruralgie.', 3),
    ('Phénomène de Centralisation (McKenzie)', 'Une radiculalgie qui centralise a un pronostic nettement meilleur.', 4),
    ('Myotome - L5 - Extension de l''hallux', 'Déficit le plus fréquent.', 5),
    ('Myotome - SI - Flexion plantaire', 'À tester en relevés unipodaux répétés.', 6)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'La convergence des trois plans, seule façon de conclure cliniquement.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Faisceau d''arguments de radiculopathie lombaire'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Chiu CC, Chuang TY, Chang KH et al. The probability of spontaneous regression of lumbar herniated disc: a systematic review. Clin Rehabil.', 2015, 'revue_systematique', 'Taux de régression spontanée par type de hernie : l’argument central du discours au patient.', 0),
  (v_chapter, 'Peul WC, van Houwelingen HC, van den Hout WB et al. Surgery versus prolonged conservative treatment for sciatica. N Engl J Med.', 2007, 'essai_randomise', 'La chirurgie accélère le soulagement, les résultats à un an convergent.', 1),
  (v_chapter, 'Jensen RK, Kongsted A, Kjaer P, Koes B. Diagnosis and treatment of sciatica. BMJ.', 2019, 'revue_systematique', 'Synthèse clinique moderne : diagnostic, pronostic, traitements.', 2),
  (v_chapter, 'Verwoerd AJ, Peul WC, Willemsen SP et al. Diagnostic accuracy of history taking to assess lumbosacral nerve root compression. Spine J.', 2014, 'etude', 'Ce que l’interrogatoire seul permet, avant tout test.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'stenose',
    'Sténose lombaire dégénérative',
    'Claudication neurogène : reconnaître, distinguer du vasculaire, traiter',
    'Diagnostiquer', 'diagnostic',
    'Le tableau dominant du patient lombalgique après 60 ans. Le diagnostic est essentiellement clinique, et sa principale difficulté est la distinction avec la claudication artérielle et avec la coxarthrose.',
    jsonb_build_array(
      'Reconnaître une claudication neurogène à l’interrogatoire',
      'Distinguer claudication neurogène, vasculaire et douleur de hanche',
      'Proposer une prise en charge conservatrice pertinente et repérer l’indication chirurgicale'
    ),
    jsonb_build_array(
      'Le signe le plus discriminant est le soulagement par la flexion : le patient va mieux penché sur un caddie, assis, ou en montée.',
      'La distance de marche est variable d’un jour à l’autre dans la sténose, reproductible dans l’artérite.',
      'L’évolution est le plus souvent lentement progressive ou stable : la sténose n’évolue pas fatalement vers la paralysie, et il faut le dire.',
      'La chirurgie est indiquée sur le retentissement fonctionnel, pas sur le calibre du canal.'
    ),
    50, 12
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le tableau',
   '<p>Patient de plus de 60 ans, douleurs et lourdeurs des deux membres inférieurs apparaissant à la marche et en station debout prolongée, parfois avec paresthésies, obligeant à s’arrêter et surtout à s’asseoir ou à se pencher en avant. Le soulagement par la flexion est le fil conducteur de tout le tableau : le patient marche mieux en poussant un caddie, monte les escaliers plus facilement qu’il ne les descend, et pédale sans difficulté alors qu’il ne peut pas marcher dix minutes.</p><p>La lombalgie est souvent au second plan, voire absente. Ce sont les jambes qui font consulter.</p>',
   'none', 0),
  (v_chapter, 'Neurogène ou vasculaire',
   '<p>Cinq points départagent. <strong>Position de soulagement</strong> : s’asseoir ou se pencher dans la sténose, simplement s’arrêter debout dans l’artérite. <strong>Effet de la flexion</strong> : la montée et le vélo sont mieux tolérés dans la sténose, moins bien dans l’artérite. <strong>Reproductibilité</strong> : périmètre variable dans la sténose, constant dans l’artérite. <strong>Délai de récupération</strong> : quelques minutes dans l’artérite, plus long dans la sténose. <strong>Examen</strong> : pouls périphériques, température et trophicité cutanées, souffles vasculaires.</p><p>Le test du tapis roulant en deux temps formalise cette distinction quand l’interrogatoire ne suffit pas. Les deux pathologies coexistent fréquemment chez le sujet âgé : trouver l’une n’autorise pas à écarter l’autre.</p>',
   'cle', 1),
  (v_chapter, 'Et la hanche',
   '<p>Troisième larron souvent oublié : la coxarthrose donne une douleur inguinale ou fessière à la marche, avec limitation de la rotation interne de hanche. Le test de FABER, le FADIR et la mesure des amplitudes de hanche font partie de l’examen de toute claudication du sujet âgé. Une sténose radiologique et une coxarthrose coexistent volontiers, et c’est l’examen clinique qui dit laquelle des deux produit la plainte du jour.</p>',
   'piege', 2),
  (v_chapter, 'Ce que les tests apportent',
   '<p>Aucun test isolé ne fait le diagnostic. Le cluster de Cook regroupe les éléments dont la combinaison est la plus discriminante, en donnant une place centrale aux items d’interrogatoire. L’imagerie confirme, mais elle ne suffit jamais : les sténoses radiologiques asymptomatiques sont fréquentes après 60 ans, et un canal étroit sur l’IRM d’un patient dont la plainte n’a pas le rythme correspondant n’explique pas sa douleur.</p>',
   'preuve', 3),
  (v_chapter, 'Traiter et orienter',
   '<p>Le traitement conservateur associe exercice en flexion, travail de l’endurance de marche par intervalles sous le seuil des symptômes, renforcement, et thérapie manuelle des segments adjacents et des hanches. Les programmes combinant exercice et thérapie manuelle donnent des résultats au moins comparables aux prises en charge médicales usuelles à moyen terme.</p><p>La chirurgie de décompression se discute devant un retentissement fonctionnel important et persistant malgré un traitement conservateur bien conduit, ou devant un déficit progressif. Elle apporte un bénéfice plus net et plus rapide sur la claudication que sur la lombalgie, ce qu’il faut avoir dit avant que le patient consulte le chirurgien.</p>',
   'reorientation', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Sténose lombaire centrale', 'principal', 'Claudication neurogène bilatérale, soulagée par la flexion.', 0),
    ('Sténose foramen intervertébral', 'principal', 'Forme latérale : radiculalgie unilatérale du sujet âgé, aggravée en extension.', 1),
    ('Claudication vasculaire des MI', 'differentiel', 'Le différentiel majeur, souvent associé chez le même patient.', 2),
    ('Spondylolisthésis', 'differentiel', 'Cause fréquente de sténose dégénérative, notamment L4-L5 chez la femme après 60 ans.', 3),
    ('Anévrisme de l’aorte abdominale', 'drapeau_rouge', 'À évoquer devant une douleur permanente non modifiée par la posture.', 4)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test du tapis roulant en deux temps', 'Formalise la distinction neurogène contre vasculaire.', 0),
    ('Test de Romberg modifié', 'L’instabilité posturale est fréquente et sous-évaluée dans la sténose.', 1),
    ('Test de FABER', 'Dépistage de la hanche, à ne jamais omettre dans une claudication du sujet âgé.', 2),
    ('Rotation Interne Passive de Hanche', 'Une rotation interne limitée et douloureuse oriente vers la coxarthrose.', 3),
    ('Déviation de la marche', 'Observation de la marche, avant et après mise en charge prolongée.', 4)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'Le cluster de référence pour la sténose lombaire : la combinaison d’items d’interrogatoire prime sur les tests physiques.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Cluster de Cook'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Cook CE, Brown C, Michaud K, Sizer P. The clinical value of a cluster of patient history and observational findings as a diagnostic support tool for lumbar spine stenosis. Physiother Res Int.', 2011, 'etude', 'Le cluster utilisé dans ce chapitre et sa construction.', 0),
  (v_chapter, 'de Schepper EI, Overdevest GM, Suri P et al. Diagnosis of lumbar spinal stenosis: an updated systematic review of the accuracy of diagnostic tests. Spine.', 2013, 'revue_systematique', 'Valeur diagnostique comparée des signes cliniques et de l’imagerie.', 1),
  (v_chapter, 'Ammendolia C, Stuber KJ, Rok E et al. Nonoperative treatment for lumbar spinal stenosis with neurogenic claudication. Cochrane Database Syst Rev.', 2013, 'revue_systematique', 'Ce que vaut le traitement conservateur, exercice et thérapie manuelle compris.', 2),
  (v_chapter, 'Weinstein JN, Tosteson TD, Lurie JD et al. Surgical versus nonoperative treatment for lumbar spinal stenosis: SPORT randomized and observational cohorts. Spine.', 2010, 'essai_randomise', 'Résultats comparés de la chirurgie et du traitement conservateur à quatre ans.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'discogenique',
    'Douleur discogénique et lombalgie non spécifique',
    'Le tableau le plus fréquent, et le plus difficile à prouver',
    'Diagnostiquer', 'diagnostic',
    'Le disque est probablement la source la plus fréquente de lombalgie, et c’est aussi celle qu’aucun test clinique ne permet d’affirmer. Ce chapitre décrit le tableau, ce que les tests apportent réellement, et comment traiter sans surdiagnostiquer.',
    jsonb_build_array(
      'Reconnaître le tableau évocateur d’une douleur d’origine discale',
      'Situer honnêtement les limites diagnostiques et le statut de la discographie',
      'Utiliser la préférence directionnelle comme axe de traitement'
    ),
    jsonb_build_array(
      'Tableau évocateur : douleur en barre lombaire basse, aggravée par la position assise prolongée et la flexion, difficulté à se redresser après être resté penché.',
      'Aucun test clinique ne permet d’affirmer l’origine discale : la discographie provoquée, seule référence, est elle-même contestée.',
      'La préférence directionnelle est bien plus utile que l’étiquette tissulaire, parce qu’elle dit quoi faire.',
      'Nommer « hernie » ou « disque usé » devant un patient sans nécessité aggrave le pronostic.'
    ),
    45, 13
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le tableau évocateur',
   '<p>Douleur lombaire basse, souvent décrite en barre, parfois centrale, irradiant vers les fesses et la face postérieure des cuisses sans dépasser le genou. Aggravation par la position assise prolongée, la conduite, la flexion antérieure, le port de charge, la toux. Difficulté et douleur au moment de se redresser après avoir été penché. Raideur matinale brève. Amélioration en marchant, en s’allongeant, en changeant de position.</p><p>Chez le sujet jeune et d’âge moyen, ce tableau est le plus fréquent de tous. Il reste une probabilité, pas une certitude.</p>',
   'none', 0),
  (v_chapter, 'Pourquoi on ne peut pas l’affirmer',
   '<p>La revue de Hancock a examiné l’ensemble des tests cliniques proposés pour identifier le disque, l’articulaire postérieure ou la sacro-iliaque comme source de la douleur : aucun ne permet de conclure avec une fiabilité suffisante. La référence utilisée dans ces études, la discographie provoquée, pose elle-même problème, avec un taux de faux positifs non négligeable et une reproductibilité discutée.</p><p>La conséquence n’est pas de renoncer, mais de déplacer la question : au lieu de « quel tissu ? », demander « quel mouvement modifie la douleur, et dans quel sens ? ». Cette question a une réponse fiable, et elle donne le traitement.</p>',
   'preuve', 1),
  (v_chapter, 'La préférence directionnelle comme axe de travail',
   '<p>Chez une majorité de ces patients, les mouvements répétés en extension centralisent la douleur, et l’exposition prolongée à la flexion la périphérise. Cette réponse définit un programme immédiat : positions de repos en légère lordose, exercices d’extension répétée à domicile plusieurs fois par jour, aménagement de la position assise, reprise progressive de la flexion une fois la centralisation obtenue.</p><p>Une minorité présente l’inverse, une préférence en flexion, en particulier chez les sujets plus âgés ou en présence d’une composante sténosante. Le test tranche ; l’a priori se trompe régulièrement.</p>',
   'pratique', 2),
  (v_chapter, 'Les mots employés devant le patient',
   '<p>Les essais sur le langage clinique convergent : entendre « dégénérescence discale », « hernie », « usure » augmente la perception de gravité, la peur du mouvement et la demande d’imagerie et de chirurgie, sans améliorer les résultats. Les formulations neutres et actives font mieux.</p><p>Exemple utilisable : « votre disque est sensibilisé et il réagit à la flexion prolongée ; c’est un tissu qui se répare bien et qui supporte très bien le mouvement, à condition de lui donner le bon sens au bon moment. Voilà ce qu’on va faire. »</p>',
   'cle', 3),
  (v_chapter, 'Ce qui doit faire changer d’hypothèse',
   '<p>Une douleur qui descend sous le genou avec paresthésies systématisées : chercher la radiculopathie. Une douleur unilatérale haute, sur la crête iliaque, avec palper-rouler positif : penser à la charnière thoraco-lombaire. Une douleur qui ne cède dans aucune position : quitter le champ mécanique. Une douleur de rythme inflammatoire chez un sujet jeune : penser à la spondyloarthrite.</p>',
   'piege', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Douleur discogénique', 'principal', 'Le tableau du chapitre.', 0),
    ('Douleurs Somatiques Référées Lombaires', 'principal', 'Mécanisme de projection à la fesse et à la cuisse, sans atteinte radiculaire.', 1),
    ('Douleur facettaire lombaire', 'differentiel', 'Tableau voisin, dominé par l’extension plutôt que la flexion.', 2),
    ('Conflit disco-radiculaire', 'differentiel', 'Même structure, mais avec conflit radiculaire : la topographie tranche.', 3)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Phénomène de Centralisation (McKenzie)', 'Le test central de ce chapitre : il oriente et il traite.', 0),
    ('Hypomobilité segmentaire lombaire (pression postéro-antérieure)', 'Repère de douleur segmentaire, à ne pas présenter comme un blocage.', 1),
    ('Test de Lasègue (SLR)', 'Sa négativité conforte l’absence de conflit radiculaire.', 2)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hancock MJ, Maher CG, Latimer J et al. Systematic review of tests to identify the disc, SIJ or facet joint as the source of low back pain. Eur Spine J.', 2007, 'revue_systematique', 'Aucun test clinique ne permet d’identifier le tissu source de façon fiable.', 0),
  (v_chapter, 'Carragee EJ, Alamin TF, Miller JL, Carragee JM. Discographic, MRI and psychosocial determinants of low back pain disability and remission. Spine J.', 2005, 'etude', 'Les limites de la discographie comme référence diagnostique.', 1),
  (v_chapter, 'Barsky Reese J, Nicholls E, Hill JC et al. The effect of diagnostic labelling on patient perceptions of low back pain: a systematic review. Eur J Pain et travaux apparentés sur le langage clinique.', 2021, 'revue_systematique', 'Les étiquettes diagnostiques modifient la perception de gravité et les préférences de traitement.', 2),
  (v_chapter, 'Long A, Donelson R, Fung T. Does it matter which exercise? A randomized control trial of exercise for low back pain. Spine.', 2004, 'essai_randomise', 'Prescrire l’exercice selon la préférence directionnelle fait mieux qu’un programme standard.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'facettaire',
    'Douleur facettaire lombaire',
    'Un diagnostic clinique que la littérature ne valide pas, et ce qu’on en fait',
    'Diagnostiquer', 'diagnostic',
    'L’articulaire postérieure est une source réelle de lombalgie, mais aucun signe ni cluster clinique ne permet de l’identifier de façon fiable. Ce chapitre explique pourquoi, et ce qu’il reste d’utilisable en pratique.',
    jsonb_build_array(
      'Décrire le tableau classiquement attribué à l’articulaire postérieure',
      'Expliquer pourquoi les critères de Revel et le test de Kemp ne suffisent pas',
      'Traiter un tableau en extension sans affirmer une origine facettaire'
    ),
    jsonb_build_array(
      'Tableau évocateur : lombalgie aggravée par l’extension et l’extension-rotation, soulagée par la flexion, chez un sujet plutôt âgé.',
      'Les critères de Revel et le test de Kemp n’ont pas résisté à la validation contre bloc de branche médiane.',
      'La référence diagnostique reste le bloc anesthésique de branche médiane, donc hors de portée de l’examen clinique.',
      'On peut traiter efficacement un tableau en extension sans prétendre en nommer le tissu.'
    ),
    40, 14
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le tableau classique',
   '<p>Lombalgie basse, souvent unilatérale ou à prédominance d’un côté, aggravée par l’extension, l’extension combinée à la rotation, la station debout prolongée et le passage de la position assise à debout. Soulagement par la flexion et par la position assise. Douleur projetée à la fesse et à la face postérieure de cuisse, ne dépassant pas le genou. Raideur matinale brève. Palpation douloureuse en regard des articulaires.</p><p>Ce tableau existe et il est reconnaissable. Le problème n’est pas de le décrire, c’est de prouver qu’il vient bien de l’articulaire.</p>',
   'none', 0),
  (v_chapter, 'Ce que la validation a donné',
   '<p>Revel avait proposé sept critères dont la combinaison paraissait identifier les répondeurs au bloc facettaire. Les tentatives de validation ultérieures, contre bloc de branche médiane contrôlé, n’ont pas retrouvé cette performance. Le test de Kemp, le plus utilisé, souffre d’une spécificité insuffisante : il est positif dans de nombreuses autres situations, à commencer par la sténose foraminale.</p><p>La position de la littérature aujourd’hui est claire : il n’existe pas de signe clinique ni de cluster validé permettant d’identifier l’articulaire postérieure comme source de la douleur. Seul le bloc anesthésique de branche médiane, réalisé en double, fait référence.</p>',
   'preuve', 1),
  (v_chapter, 'Ce qui reste utilisable',
   '<p>Trois choses. La <strong>direction</strong> : un patient qui s’aggrave en extension et se soulage en flexion a un comportement mécanique exploitable, quel que soit le tissu. La <strong>localisation</strong> : la douleur segmentaire provoquée unilatérale reste un repère de traitement manuel. La <strong>réponse au traitement d’épreuve</strong> : mobilisation ou manipulation du segment concerné, avec réévaluation immédiate du signe comparable.</p><p>Ce qui n’est pas utilisable : annoncer au patient une arthrose facettaire responsable de sa douleur, alors qu’une arthrose facettaire est présente chez la quasi-totalité des sujets de plus de 60 ans, symptomatiques ou non.</p>',
   'cle', 2),
  (v_chapter, 'Le différentiel à ne pas manquer',
   '<p>Une douleur aggravée en extension chez un sujet âgé, avec irradiation au membre inférieur et soulagement en flexion, doit d’abord faire penser à une sténose. Chez un adolescent sportif avec lombalgie d’extension, c’est la spondylolyse qu’il faut évoquer, et le test d’hyperextension unipodale ne suffira pas à l’écarter.</p>',
   'piege', 3),
  (v_chapter, 'Quand adresser',
   '<p>Un tableau en extension, unilatéral, résistant à plusieurs semaines de traitement manuel et d’exercice bien conduits, chez un patient dont le retentissement fonctionnel reste important, peut justifier un avis pour discussion d’un bloc diagnostique de branche médiane, éventuellement suivi d’une thermocoagulation. Le bénéfice de ces gestes reste débattu et dépend étroitement de la rigueur de la sélection : c’est un avis à demander, pas une promesse à faire.</p>',
   'reorientation', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Douleur facettaire lombaire', 'principal', 'Le tableau du chapitre.', 0),
    ('Sténose foramen intervertébral', 'differentiel', 'Même comportement en extension, avec irradiation radiculaire.', 1),
    ('Spondylolisthésis', 'differentiel', 'Autre cause de douleur en extension.', 2),
    ('Douleur discogénique', 'differentiel', 'Comportement inverse, dominé par la flexion et la position assise.', 3)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de Kemp', 'Le test historique du chapitre : à connaître, et à ne pas surinterpréter.', 0),
    ('Hypomobilité segmentaire lombaire (pression postéro-antérieure)', 'Repère de traitement, pas preuve d’origine facettaire.', 1),
    ('Phénomène de Centralisation (McKenzie)', 'Identifie la direction exploitable, quelle que soit l’étiquette tissulaire.', 2)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Revel M, Poiraudeau S, Auleley GR et al. Capacity of the clinical picture to characterize low back pain relieved by facet joint anesthesia. Spine.', 1998, 'etude', 'Les critères d’origine, à connaître pour comprendre ce qui a ensuite été infirmé.', 0),
  (v_chapter, 'Laslett M, McDonald B, Aprill CN et al. Clinical predictors of screening lumbar zygapophyseal joint blocks: development of clinical prediction rules. Spine J.', 2006, 'etude', 'Tentative de validation : les performances attendues ne sont pas retrouvées.', 1),
  (v_chapter, 'Maas ET, Ostelo RW, Niemisto L et al. Radiofrequency denervation for chronic low back pain. Cochrane Database Syst Rev.', 2015, 'revue_systematique', 'Ce que vaut réellement la thermocoagulation, à savoir avant d’adresser.', 2),
  (v_chapter, 'Kalichman L, Li L, Kim DH et al. Facet joint osteoarthritis and low back pain in the community-based population. Spine.', 2008, 'etude', 'La prévalence de l’arthrose facettaire asymptomatique, argument contre l’étiquetage radiologique.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'instabilite',
    'Instabilité clinique, spondylolyse et spondylolisthésis',
    'Trois notions souvent confondues, trois conduites différentes',
    'Diagnostiquer', 'diagnostic',
    'L’instabilité clinique n’est pas l’instabilité radiologique, et le spondylolisthésis n’est pas une indication automatique à quoi que ce soit. Ce chapitre sépare les trois notions et donne la conduite pour chacune.',
    jsonb_build_array(
      'Distinguer instabilité clinique, spondylolyse et spondylolisthésis',
      'Reconnaître le tableau d’instabilité clinique et appliquer la règle de Hicks',
      'Conduire le cas de l’adolescent sportif avec lombalgie d’extension'
    ),
    jsonb_build_array(
      'L’instabilité clinique est un tableau fonctionnel : sensation de dérobement, douleur en fin d’amplitude, difficulté à se redresser, mouvements aberrants.',
      'La règle de Hicks identifie qui répond à un programme de contrôle moteur : c’est une règle de traitement, pas un diagnostic.',
      'Chez l’adolescent sportif, une lombalgie d’extension qui dure plus de trois semaines impose une imagerie : le test clinique ne rattrapera pas un diagnostic manqué de spondylolyse.',
      'Le spondylolisthésis dégénératif de l’adulte est surtout une cause de sténose : c’est la claudication qui fait le tableau, pas le glissement.'
    ),
    50, 15
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Trois notions à séparer',
   '<p><strong>L’instabilité clinique</strong> est un tableau fonctionnel : le patient décrit des dérobements, des blocages, une douleur qui apparaît en fin d’amplitude ou au retour de flexion, une difficulté à tenir une position. L’imagerie est le plus souvent normale.</p><p><strong>La spondylolyse</strong> est une fracture de fatigue de l’isthme, typique de l’adolescent sportif en hyperextension répétée, gymnastique, danse, tennis, football.</p><p><strong>Le spondylolisthésis</strong> est un glissement d’une vertèbre sur la sous-jacente, par lyse isthmique chez le sujet jeune, ou dégénératif chez l’adulte, le plus souvent en L4-L5 et plus fréquemment chez la femme après 60 ans.</p>',
   'none', 0),
  (v_chapter, 'Le tableau d’instabilité clinique',
   '<p>Signes rapportés : douleur au changement de position, difficulté à se redresser après flexion avec besoin de prendre appui sur les cuisses, sensation de faiblesse ou de dérobement, épisodes de blocage aigu récidivants, soulagement transitoire par une ceinture.</p><p>Signes observés : mouvements aberrants à la flexion-extension debout, test d’instabilité en procubitus positif, test d’extension passive positif, hypermobilité générale.</p><p>La règle de Hicks combine quatre de ces éléments et identifie les patients susceptibles de répondre à un programme de stabilisation. Elle prédit une réponse, elle ne prouve pas une instabilité.</p>',
   'cle', 1),
  (v_chapter, 'L’adolescent sportif',
   '<p>Lombalgie d’extension chez un adolescent pratiquant un sport en hyperextension, unilatérale, reproduite par l’extension en appui unipodal : la spondylolyse doit être évoquée. Le piège est de se fier au test d’hyperextension unipodale, dont la confrontation à l’IRM a montré qu’il n’était ni sensible ni spécifique. Un test négatif ne permet pas d’écarter.</p><p>Conduite : toute lombalgie d’extension persistant au delà de deux à trois semaines chez un adolescent sportif justifie un avis et une imagerie. Une lyse active prise à temps peut consolider sous repos sportif ; méconnue, elle évolue vers la pseudarthrose et le glissement.</p>',
   'drapeau_rouge', 2),
  (v_chapter, 'Le spondylolisthésis dégénératif de l’adulte',
   '<p>Chez l’adulte de plus de 60 ans, le glissement en lui-même est rarement l’explication de la plainte. Ce qui fait consulter, c’est la sténose qu’il produit, avec sa claudication neurogène, ou une lombalgie mécanique banale. Le degré de glissement corrèle mal avec les symptômes.</p><p>Le traitement manuel n’est pas contre-indiqué. Les techniques à haute vélocité sur le segment glissé sont à éviter au profit des mobilisations, du travail des segments adjacents et des hanches, et du renforcement. Les gestes en extension forcée sont à limiter chez les patients dont la claudication s’aggrave en extension.</p>',
   'pratique', 3),
  (v_chapter, 'Ce qu’on propose',
   '<p>Instabilité clinique avec règle de Hicks positive : programme de contrôle moteur progressif, débuté par le contrôle segmentaire et le gainage en position neutre, puis intégré à des mouvements fonctionnels chargés. La littérature montre que ces programmes font mieux que rien, sans supériorité franche sur un exercice général bien mené : c’est la sélection du patient, plus que le contenu, qui fait la différence.</p><p>Spondylolyse confirmée : repos sportif encadré, travail du contrôle en évitement de l’hyperextension, reprise progressive, avec avis médical et suivi d’imagerie selon le stade.</p>',
   'none', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Spondylolisthésis', 'principal', 'Lyse isthmique du sujet jeune, dégénératif de l’adulte : deux tableaux différents.', 0),
    ('Sténose lombaire centrale', 'differentiel', 'Conséquence fréquente du spondylolisthésis dégénératif, et vraie cause des symptômes.', 1),
    ('Douleur facettaire lombaire', 'differentiel', 'Autre tableau en extension.', 2),
    ('Fracture tassement Lombaire', 'drapeau_rouge', 'À évoquer devant une lombalgie d’apparition brutale chez un sujet fragile.', 3)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test d''Instabilité en Procubitus (PIT)', 'Item central de la règle de Hicks.', 0),
    ('Mouvements aberrants lombaires', 'Observation de la flexion et du retour.', 1),
    ('Passive Extension Test', 'Test d’extension passive, utile dans la suspicion d’instabilité.', 2),
    ('Élévation de jambe tendue supérieure à 91 degrés', 'Ici marqueur d’hyperlaxité, pas test neurodynamique.', 3),
    ('Test d''hyperextension unipodale (Stork test)', 'À connaître pour savoir qu’un test négatif n’écarte pas une spondylolyse.', 4)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'Règle de réponse au traitement : elle désigne qui bénéficiera d’un programme de contrôle moteur.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Règle d''instabilité clinique de Hicks (programme de stabilisation)'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hicks GE, Fritz JM, Delitto A, McGill SM. Preliminary development of a clinical prediction rule for determining which patients with low back pain will respond to a stabilization exercise program. Arch Phys Med Rehabil.', 2005, 'etude', 'La règle utilisée dans ce chapitre et ses quatre items.', 0),
  (v_chapter, 'Masci L, Pike J, Malara F et al. Use of the one-legged hyperextension test and magnetic resonance imaging in the diagnosis of active spondylolysis. Br J Sports Med.', 2006, 'etude', 'Le test d’hyperextension unipodale ne permet ni de retenir ni d’écarter la spondylolyse.', 1),
  (v_chapter, 'Cook C, Brismee JM, Sizer PS. Subjective and objective descriptors of clinical lumbar spine instability: a Delphi study. Man Ther.', 2006, 'consensus', 'Ce que les experts s’accordent à considérer comme des signes d’instabilité clinique.', 2),
  (v_chapter, 'Smith BE, Littlewood C, May S. An update of stabilisation exercises for low back pain: a systematic review with meta-analysis. BMC Musculoskelet Disord.', 2014, 'meta_analyse', 'Les exercices de stabilisation ne font pas mieux qu’un autre exercice bien conduit.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'ceinture-pelvienne',
    'Ceinture pelvienne et sacro-iliaque',
    'Le seul domaine lombo-pelvien où un cluster diagnostique tient debout',
    'Diagnostiquer', 'diagnostic',
    'Contrairement au disque et à l’articulaire postérieure, la sacro-iliaque dispose d’un cluster de tests validé contre bloc anesthésique. Ce chapitre en donne l’usage exact, et traite à part la douleur de ceinture pelvienne de la grossesse.',
    jsonb_build_array(
      'Appliquer et interpréter le cluster de Laslett dans le bon ordre',
      'Reconnaître une douleur de ceinture pelvienne liée à la grossesse et la traiter',
      'Abandonner les tests de position et de mobilité sacro-iliaque au profit des tests de provocation'
    ),
    jsonb_build_array(
      'Trois tests de provocation positifs sur cinq, après avoir écarté une centralisation : c’est la séquence validée.',
      'Les tests de palpation de position et de mobilité de la sacro-iliaque ont une fiabilité inter-examinateurs très faible : ils ne doivent pas servir à décider.',
      'Chez la femme enceinte ou en post-partum, l’ASLR est le test le plus utile et il oriente directement le traitement.',
      'Une sacro-iliite inflammatoire peut rendre les tests de provocation positifs : c’est le rythme qui tranche, pas le test.'
    ),
    50, 16
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le tableau',
   '<p>Douleur fessière profonde, unilatérale, centrée sous l’épine iliaque postéro-supérieure, pouvant irradier à la face postérieure de cuisse sans dépasser le genou, parfois à l’aine. Aggravation par le passage assis-debout, la montée d’escalier, l’appui unipodal, le décubitus latéral du côté douloureux, les positions asymétriques prolongées. Le patient désigne volontiers sa douleur avec un doigt, en regard de l’épine iliaque postéro-supérieure : c’est le signe de Fortin.</p><p>Contexte évocateur : grossesse et post-partum, traumatisme en torsion ou chute sur la fesse, inégalité de longueur, arthrodèse lombaire sus-jacente.</p>',
   'none', 0),
  (v_chapter, 'La séquence de Laslett, dans l’ordre',
   '<p><strong>Étape 1</strong> : écarter une origine lombaire par les mouvements répétés. Si la douleur centralise, ce n’est pas une sacro-iliaque, et les tests de provocation seront trompeurs.</p><p><strong>Étape 2</strong> : réaliser les tests de provocation : distraction, compression, thigh thrust, sacral thrust, Gaenslen. Trois positifs sur cinq, ou deux positifs parmi distraction et thigh thrust qui sont les plus performants, rendent l’origine sacro-iliaque probable.</p><p><strong>Étape 3</strong> : interpréter avec le contexte. Chez une femme enceinte ou en post-partum, ajouter l’ASLR, qui mesure le transfert de charge plutôt que la douleur provoquée.</p><p>Cette séquence a été validée contre bloc anesthésique intra-articulaire, ce qui la place dans une catégorie à part parmi les tests lombo-pelviens.</p>',
   'preuve', 1),
  (v_chapter, 'Ce qu’il faut cesser d’utiliser',
   '<p>Les tests de position (hauteur des épines iliaques, base sacrée, test de Gillet, test de flexion debout et assis) ont une fiabilité inter-examinateurs médiocre et ne prédisent pas la réponse au bloc anesthésique. Deux praticiens ne trouvent pas la même chose sur le même patient, et ce qu’ils trouvent ne correspond pas à la source de la douleur.</p><p>Cela ne signifie pas que la sacro-iliaque ne fait pas mal : cela signifie que c’est la provocation de la douleur, et non la perception d’un défaut de position ou de mobilité, qui porte l’information.</p>',
   'piege', 2),
  (v_chapter, 'La ceinture pelvienne de la grossesse et du post-partum',
   '<p>Tableau fréquent, souvent banalisé. Douleur pubienne, fessière, ou les deux, apparue pendant la grossesse ou après l’accouchement, avec difficulté à se retourner dans le lit, à monter un escalier, à tenir debout longtemps. L’ASLR est ici le test central : sa positivité, et surtout son amélioration franche sous compression pelvienne manuelle, signent un défaut de transfert de charge et indiquent le traitement.</p><p>Traitement : ceinture pelvienne pendant les périodes de charge, exercices de transfert de charge et de contrôle lombo-pelvien, conseils d’aménagement, et thérapie manuelle des segments adjacents. Les programmes d’exercice spécifiques ont montré un bénéfice réel, y compris à distance de l’accouchement.</p>',
   'pratique', 3),
  (v_chapter, 'Ne pas manquer l’inflammatoire',
   '<p>Une fessalgie à bascule, nocturne, chez un sujet jeune, avec raideur matinale prolongée, est une sacro-iliite jusqu’à preuve du contraire, même si les tests de provocation sont positifs. Les tests ne distinguent pas une articulation douloureuse mécaniquement d’une articulation enflammée. Le tri repose sur le rythme, le terrain et les manifestations associées, détaillés dans le chapitre sur la lombalgie inflammatoire.</p>',
   'drapeau_rouge', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Sacro-iliite inflammatoire (SpA)', 'differentiel', 'Le différentiel à ne jamais manquer devant une fessalgie.', 0),
    ('Sacro-iliite infectieuse', 'drapeau_rouge', 'Fièvre et douleur intense : urgence.', 1),
    ('Anomalie de transition lombo-sacrée', 'differentiel', 'Source fréquente de douleur lombo-sacrée basse chronique.', 2),
    ('Tendinopathie proximale des ischios', 'differentiel', 'Fessalgie basse, sur l’ischion, reproduite en mise en charge et en étirement.', 3),
    ('Névralgie des nerfs clunéaux', 'differentiel', 'Douleur de la crête iliaque et de la fesse haute, avec point exquis.', 4)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de distraction', 'L’un des deux tests les plus performants du cluster.', 0),
    ('Thigh thrust test', 'L’autre test le plus performant du cluster.', 1),
    ('Test de Compression', 'Troisième test de provocation.', 2),
    ('Sacral thrust test', 'Quatrième test de provocation.', 3),
    ('Test de Gaenslen', 'Cinquième test, le moins performant des cinq.', 4),
    ('Signe de Fortin', 'Le patient désigne sa douleur d’un doigt sous l’épine iliaque postéro-supérieure.', 5),
    ('Active Straight Leg Raise (ASLR)', 'Le test central de la douleur de ceinture pelvienne, en particulier en péripartum.', 6),
    ('Test de FABER', 'À interpréter avec prudence : positif dans les atteintes de hanche comme de sacro-iliaque.', 7),
    ('Phénomène de Centralisation (McKenzie)', 'Étape préalable : une douleur qui centralise n’est pas sacro-iliaque.', 8)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'Le cluster validé contre bloc anesthésique : trois tests positifs sur cinq, après avoir écarté une origine lombaire.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Cluster de Laslett'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Laslett M, Aprill CN, McDonald B, Young SB. Diagnosis of sacroiliac joint pain: validity of individual provocation tests and composites of tests. Man Ther.', 2005, 'etude', 'Le cluster de référence et la séquence complète, préalable lombaire compris.', 0),
  (v_chapter, 'Szadek KM, van der Wurff P, van Tulder MW et al. Diagnostic validity of criteria for sacroiliac joint pain: a systematic review. J Pain.', 2009, 'revue_systematique', 'Confirme la supériorité des tests de provocation groupés sur les tests de position.', 1),
  (v_chapter, 'Mens JM, Vleeming A, Snijders CJ et al. Validity of the active straight leg raise test for measuring disease severity in patients with posterior pelvic pain after pregnancy. Spine.', 2002, 'etude', 'Valeur de l’ASLR et usage de la compression pelvienne.', 2),
  (v_chapter, 'Vleeming A, Albert HB, Ostgaard HC et al. European guidelines for the diagnosis and treatment of pelvic girdle pain. Eur Spine J.', 2008, 'recommandation', 'Recommandation européenne sur la douleur de ceinture pelvienne, diagnostic et traitement.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'voisinage',
    'Les diagnostics de voisinage',
    'Maigne, clunéaux, psoas, ischio-jambiers, méralgie, charnière lombo-sacrée',
    'Diagnostiquer', 'diagnostic',
    'Six tableaux qui imitent la lombalgie ou la fessalgie et qui échappent à l’examen lombaire classique parce qu’on ne les cherche pas. Ce sont les diagnostics qui font la différence sur les patients dits résistants.',
    jsonb_build_array(
      'Reconnaître un syndrome de la charnière thoraco-lombaire et le traiter à l’étage responsable',
      'Identifier une névralgie clunéale, une méralgie paresthésique et une tendinopathie proximale des ischio-jambiers',
      'Évoquer une anomalie de transition lombo-sacrée devant une douleur basse chronique'
    ),
    jsonb_build_array(
      'Syndrome de Maigne : douleur ressentie en lombaire basse ou sur la crête iliaque, produite à la charnière thoraco-lombaire.',
      'Névralgie clunéale : point exquis sur la crête iliaque, à environ 7 cm de la ligne médiane, avec reproduction de la douleur à la pression.',
      'Méralgie paresthésique : brûlure et hypoesthésie de la face antéro-latérale de cuisse, sans déficit moteur, sans douleur lombaire.',
      'Tendinopathie proximale des ischio-jambiers : douleur d’ischion en position assise prolongée et en course, reproduite en charge et en étirement.'
    ),
    50, 17
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le syndrome de la charnière thoraco-lombaire',
   '<p>Décrit par Robert Maigne. La souffrance siège au segment T12-L1, et la douleur est ressentie beaucoup plus bas, par l’intermédiaire des branches postérieures des nerfs rachidiens : crête iliaque, fesse haute, parfois pli de l’aine ou région trochantérienne.</p><p>Ce qui doit y faire penser : une douleur de crête iliaque ou de fesse haute, unilatérale, avec un examen lombaire bas pauvre et une absence de réponse au traitement de L4-L5 et L5-S1. Trois signes cliniques le confirment : la douleur à la pression des articulaires postérieures T12-L1, un point douloureux à la crête iliaque, et un palper-rouler positif retrouvant une cellulalgie du même côté.</p><p>Le traitement porte sur la charnière thoraco-lombaire, pas sur le rachis lombaire bas. C’est exactement pour cela que ces patients sont étiquetés résistants : on traite un étage qui n’est pas en cause.</p>',
   'cle', 0),
  (v_chapter, 'La névralgie des nerfs clunéaux',
   '<p>Les nerfs clunéaux supérieurs franchissent la crête iliaque dans un tunnel ostéo-fibreux et peuvent y être comprimés. Le tableau : douleur de la fesse haute et de la crête iliaque, parfois irradiée à la face postérieure de cuisse, avec un point exquis à la pression sur la crête, à environ 7 cm de la ligne médiane, dont la pression reproduit la douleur habituelle, y compris l’irradiation.</p><p>Le signe distinctif est la précision du point : le patient sursaute, et la douleur reproduite est sa douleur, pas une simple sensibilité locale. C’est un diagnostic souvent confondu avec une sacro-iliaque ou une sciatique tronquée.</p>',
   'none', 1),
  (v_chapter, 'La méralgie paresthésique',
   '<p>Compression du nerf cutané latéral de la cuisse, le plus souvent à l’épine iliaque antéro-supérieure sous l’arcade inguinale. Brûlures, picotements, hypoesthésie de la face antéro-latérale de cuisse, sans aucun déficit moteur et sans douleur lombaire. Facteurs favorisants : surpoids, grossesse, ceinture ou vêtement serré, port d’une ceinture de travail, station debout prolongée.</p><p>Le diagnostic différentiel avec une cruralgie L3 se fait sur deux points : dans la méralgie il n’y a ni déficit moteur du quadriceps ni modification du réflexe rotulien, et le territoire est purement latéral.</p>',
   'none', 2),
  (v_chapter, 'Psoas et ischio-jambiers proximaux',
   '<p>La <strong>tendinopathie proximale des ischio-jambiers</strong> donne une douleur profonde de l’ischion, très caractéristique en position assise prolongée, aggravée par la course, les foulées longues et les étirements. Le test de Puranen-Orava, les tests en charge et en étirement la reproduisent. Elle est régulièrement prise pour une sciatique tronquée ou une sacro-iliaque.</p><p>Le <strong>psoas</strong>, douloureux ou raccourci, donne une douleur inguinale et lombaire basse, reproduite à la contraction résistée en flexion de hanche et à l’étirement au test de Thomas. Chez l’adulte, une douleur de psoas d’apparition récente sans cause mécanique doit rappeler qu’un abcès ou une pathologie rétropéritonéale existent.</p>',
   'none', 3),
  (v_chapter, 'L’anomalie de transition lombo-sacrée',
   '<p>Sacralisation de L5 ou lombalisation de S1, présente chez environ 10 % de la population. Le plus souvent asymptomatique, elle peut donner une douleur lombo-sacrée basse chronique, unilatérale, par surcharge de la néo-articulation transverso-sacrée ou du segment sus-jacent, qui subit une contrainte accrue.</p><p>Son intérêt principal est un intérêt de repérage : la numérotation des étages change, ce qui produit des erreurs de correspondance entre l’imagerie et la clinique, et donc des traitements portés au mauvais niveau.</p>',
   'piege', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Syndrome de Maigne (lombalgie de Maigne)', 'principal', 'Douleur basse produite à la charnière thoraco-lombaire.', 0),
    ('Névralgie des nerfs clunéaux', 'principal', 'Point exquis de crête iliaque reproduisant la douleur habituelle.', 1),
    ('Méralgie paresthésique', 'principal', 'Territoire purement sensitif antéro-latéral, sans déficit moteur.', 2),
    ('Tendinopathie proximale des ischios', 'principal', 'Douleur d’ischion en position assise et à la course.', 3),
    ('Syndrome du psoas / tendinopathie', 'principal', 'Douleur inguinale et lombaire basse, reproduite en contraction résistée.', 4),
    ('Anomalie de transition lombo-sacrée', 'principal', 'Source possible de douleur basse chronique et de confusion de niveau.', 5),
    ('Neuropathies fémorale / obturatrice', 'differentiel', 'Différentiel de la méralgie et de la cruralgie.', 6)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Palper-rouler de la charnière thoraco-lombaire', 'Signe d’appel du syndrome de Maigne, complété par la pression des articulaires T12-L1.', 0),
    ('Test de Thomas', 'Étirement du psoas, à interpréter avec la contraction résistée.', 1),
    ('Flexion Active de hanche', 'Contraction résistée du psoas.', 2),
    ('Test de Leri', 'Différentiel avec une souffrance des racines hautes.', 3)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Maigne R. Diagnosis and Treatment of Pain of Vertebral Origin. CRC Press.', 2006, 'ouvrage', 'La description de référence du syndrome de la charnière thoraco-lombaire.', 0),
  (v_chapter, 'Maigne JY, Doursounian L. Entrapment neuropathy of the medial superior cluneal nerve. Spine.', 1997, 'etude', 'Description anatomique et clinique de la névralgie clunéale.', 1),
  (v_chapter, 'Cheatham SW, Kolber MJ, Salamh PA. Meralgia paresthetica: a review of the literature. Int J Sports Phys Ther.', 2013, 'revue_systematique', 'Présentation clinique, facteurs favorisants et prise en charge.', 2),
  (v_chapter, 'Goom TS, Malliaras P, Reiman MP, Purdam CR. Proximal hamstring tendinopathy: clinical aspects of assessment and management. J Orthop Sports Phys Ther.', 2016, 'consensus', 'Diagnostic et progression de charge de la tendinopathie proximale des ischio-jambiers.', 3),
  (v_chapter, 'Konin GP, Walz DM. Lumbosacral transitional vertebrae: classification, imaging findings, and clinical relevance. AJNR Am J Neuroradiol.', 2010, 'revue_systematique', 'Classification de Castellvi et conséquences sur le repérage des niveaux.', 4);

END $do$;
