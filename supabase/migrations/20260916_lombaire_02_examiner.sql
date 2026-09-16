-- Module « Région lombaire » : partie « Interroger et examiner ».
-- Quatre chapitres : anamnèse, drapeaux jaunes, examen physique, examen
-- neurologique et neurodynamique.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent : appliquer d abord 20260916_lombaire_01_comprendre_trier.sql';
  END IF;

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'anamnese',
    'L’anamnèse lombaire structurée',
    'Là où se fait 80 % du diagnostic',
    'Interroger et examiner', 'anamnese',
    'Un interrogatoire conduit dans le bon ordre classe le patient, formule une hypothèse et déclenche le tri de sécurité avant que l’examen physique commence. Ce chapitre propose une trame complète et les formulations qui font la différence.',
    jsonb_build_array(
      'Conduire une anamnèse lombaire complète en dix minutes, sans oublier le tri de sécurité',
      'Utiliser la topographie et le comportement de la douleur pour formuler une hypothèse',
      'Repérer les incohérences entre le récit et le tableau attendu'
    ),
    jsonb_build_array(
      'La topographie et le comportement de la douleur orientent plus que n’importe quel test.',
      'Trois questions font le tri de sécurité : antécédents, rythme de la douleur, signes de queue de cheval.',
      'Demander ce qui aggrave ET ce qui soulage : une douleur qu’aucune position ne soulage n’est pas mécanique.',
      'La question « qu’est-ce que vous pensez qu’il se passe dans votre dos ? » révèle souvent le vrai obstacle à la guérison.'
    ),
    40, 7
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'La trame en six temps',
   '<p><strong>1. Le motif et l’histoire.</strong> Depuis quand, comment cela a commencé, y avait-il un facteur déclenchant, comment cela a évolué depuis. Un début brutal en flexion-rotation avec charge, une installation progressive sans cause, un réveil un matin sans raison : ces trois récits n’ouvrent pas les mêmes hypothèses.</p><p><strong>2. La topographie.</strong> Faire montrer, ne pas se contenter d’écouter. Le patient qui dit « ça descend dans la jambe » désigne parfois la fesse et le haut de cuisse, ce qui n’est pas une sciatique. Noter le point maximal, l’irradiation, sa limite distale, la présence de paresthésies et leur territoire.</p><p><strong>3. Le comportement.</strong> Qu’est-ce qui aggrave, qu’est-ce qui soulage, comment se passe la nuit, comment se passe le matin, comment évolue la douleur au fil de la journée. C’est ici que se joue le tri mécanique contre non mécanique et mécanique contre inflammatoire.</p>',
   'none', 0),
  (v_chapter, 'La trame en six temps (suite)',
   '<p><strong>4. Le tri de sécurité.</strong> Antécédents personnels, en insistant sur le cancer, la corticothérapie, l’ostéoporose, l’immunodépression, les infections récentes, les gestes rachidiens récents. Puis les questions de queue de cheval, systématiques dès qu’il y a une radiculalgie. Puis les signes généraux : fièvre, amaigrissement, altération de l’état général.</p><p><strong>5. Le retentissement.</strong> Ce que le patient ne peut plus faire, au travail, à la maison, dans ses loisirs, et depuis combien de temps. C’est ce qui donne les objectifs du traitement, et c’est aussi la mesure du résultat.</p><p><strong>6. Les représentations et le contexte.</strong> Ce que le patient croit avoir, ce qu’on lui a dit, ce qu’il attend, ce qu’il craint, sa situation professionnelle, un éventuel litige ou arrêt prolongé.</p>',
   'none', 1),
  (v_chapter, 'Les formulations qui changent les réponses',
   '<p>« Est-ce que ça descend dans la jambe ? » produit des faux positifs, beaucoup de patients répondant oui pour une douleur de fesse. Préférer : « montrez-moi avec votre main jusqu’où ça va, au plus loin. »</p><p>« Ça vous réveille la nuit ? » ne distingue rien. Préférer : « quand vous vous réveillez, est-ce parce que vous avez bougé, ou est-ce que la douleur vous réveille toute seule ? et une fois réveillé, arrivez-vous à retrouver une position confortable ? »</p><p>« Qu’est-ce qui vous soulage ? » est la question la plus rentable de l’interrogatoire, et la plus souvent oubliée. L’absence totale de facteur soulageant est un signal fort.</p>',
   'pratique', 2),
  (v_chapter, 'La question sur les représentations',
   '<p>« À votre avis, qu’est-ce qui se passe dans votre dos ? » prend trente secondes et fait apparaître ce qui va bloquer la récupération : « j’ai le dos usé », « on m’a dit que j’avais le dos d’un homme de 80 ans », « j’ai peur de finir en fauteuil », « mon père a été opéré et il s’est retrouvé plus mal ». Ces phrases prédisent l’évolution mieux que l’examen physique, et elles indiquent exactement ce qu’il faudra corriger dans l’explication donnée en fin de séance.</p>',
   'cle', 3),
  (v_chapter, 'Ce que l’anamnèse doit avoir produit',
   '<p>En sortant de l’interrogatoire, trois éléments doivent être posés : une catégorie de tri (spécifique, radiculaire, non spécifique), une ou deux hypothèses de tableau clinique à tester, et une estimation du risque de chronicisation. L’examen physique qui suit ne sert qu’à confirmer ou à infirmer. Si vous entrez dans l’examen sans hypothèse, vous allez dérouler une batterie de tests et interpréter le bruit.</p>',
   'cle', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Bardin LD, King P, Maher CG. Diagnostic triage for low back pain: a practical approach for primary care. Med J Aust.', 2017, 'consensus', 'Trame d’interrogatoire orientée tri, directement transposable.', 0),
  (v_chapter, 'Petty NJ, Ryder D. Musculoskeletal Examination and Assessment. Elsevier.', 2017, 'ouvrage', 'Référence méthodologique sur la conduite de l’examen subjectif et objectif.', 1),
  (v_chapter, 'Main CJ, Foster N, Buchbinder R. How important are back pain beliefs and expectations for satisfactory recovery from back pain? Best Pract Res Clin Rheumatol.', 2010, 'revue_systematique', 'Pourquoi interroger les croyances change le pronostic.', 2);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'drapeaux-jaunes',
    'Drapeaux jaunes et stratification du risque',
    'Prédire la chronicisation vaut mieux que nommer un tissu',
    'Interroger et examiner', 'anamnese',
    'Les facteurs psychosociaux prédisent l’incapacité à un an mieux que tout élément anatomique. Ce chapitre présente les facteurs à repérer, les outils de mesure utilisables en consultation et ce qu’on en fait concrètement.',
    jsonb_build_array(
      'Citer les principaux drapeaux jaunes et savoir les repérer sans questionnaire',
      'Utiliser le STarT Back Tool pour classer un patient en risque faible, moyen ou élevé',
      'Adapter l’intensité et le contenu de la prise en charge au niveau de risque'
    ),
    jsonb_build_array(
      'Catastrophisme, kinésiophobie, faible attente de guérison, insatisfaction professionnelle et détresse psychologique sont les cinq facteurs les mieux documentés.',
      'Le STarT Back Tool prend deux minutes et classe en trois niveaux de risque, avec une prise en charge différenciée validée en essai randomisé.',
      'Repérer un drapeau jaune ne veut pas dire adresser en psychologie : cela veut dire changer ce qu’on explique et comment on dose.',
      'Les drapeaux jaunes se repèrent aussi dans les mots employés par le patient, sans aucun questionnaire.'
    ),
    40, 8
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce que recouvre le terme',
   '<p>Les drapeaux jaunes sont les facteurs psychologiques et comportementaux associés à un risque accru de passage à la chronicité et d’incapacité durable. Les mieux établis : le catastrophisme (anticiper le pire, ruminer, se sentir impuissant), la kinésiophobie et l’évitement, une faible attente de guérison, la détresse psychologique et l’humeur dépressive, et les stratégies d’adaptation passives.</p><p>S’y ajoutent des facteurs professionnels, parfois appelés drapeaux bleus et noirs : insatisfaction au travail, perception que le travail est nocif pour le dos, absence de possibilité d’aménagement, arrêt prolongé, procédure d’indemnisation en cours.</p>',
   'none', 0),
  (v_chapter, 'Le STarT Back Tool',
   '<p>Neuf items, deux minutes de passation. Le score total et un sous-score psychosocial classent le patient en risque faible, moyen ou élevé. L’essai randomisé de Hill publié dans le Lancet a montré qu’orienter le traitement selon ce classement, plutôt que de traiter tout le monde pareil, améliorait les résultats fonctionnels et réduisait les coûts et les arrêts de travail.</p><p>Application : risque faible, rassurer, conseiller, une ou deux séances suffisent souvent. Risque moyen, thérapie manuelle et exercice structurés. Risque élevé, approche associant exercice et travail sur les croyances, séances plus rapprochées, et recours possible à un accompagnement psychologique.</p>',
   'preuve', 1),
  (v_chapter, 'Les autres outils utiles',
   '<p>Le FABQ mesure les croyances de peur et d’évitement, avec une sous-échelle travail qui prédit particulièrement bien le retour à l’activité professionnelle. C’est aussi un item de la règle de Flynn. L’échelle de Tampa mesure la kinésiophobie, l’échelle de catastrophisme de Sullivan la rumination et l’impuissance. L’Örebro est plus long mais performant sur le pronostic professionnel.</p><p>En pratique de cabinet, un outil suffit. Le STarT Back est le meilleur rapport entre temps passé et décision modifiée.</p>',
   'pratique', 2),
  (v_chapter, 'Les repérer sans questionnaire',
   '<p>Certaines phrases sont des drapeaux jaunes en clair. « Je n’ose plus rien faire depuis. » « Le kiné m’a dit de ne plus jamais me pencher. » « Tant que j’aurai mal, je ne peux pas bouger. » « Je veux savoir ce que j’ai avant de faire quoi que ce soit. » « De toute façon avec l’arthrose que j’ai... »</p><p>Les comportements comptent autant : un patient qui se déplace avec une rigidité excessive, qui demande de l’aide pour se relever de la table alors qu’il en est capable, qui interrompt un mouvement bien avant la douleur.</p>',
   'pratique', 3),
  (v_chapter, 'Ce qu’on en fait',
   '<p>Repérer un drapeau jaune ne signifie pas adresser en psychothérapie ni renoncer au traitement manuel. Cela change trois choses. Ce qu’on explique : corriger explicitement la croyance erronée, avec des mots choisis. Comment on dose : privilégier l’exposition graduée à l’activité redoutée plutôt que le repos. Ce qu’on mesure : suivre la fonction et la reprise d’activité, pas seulement l’intensité de la douleur.</p><p>Le recours à un psychologue ou à un programme pluridisciplinaire se discute pour les risques élevés qui ne bougent pas après six à huit semaines.</p>',
   'cle', 4);

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, 'Le score de peur et d’évitement lié au travail : à la fois item de la règle de Flynn et facteur pronostique majeur.', 0
  FROM public.orthopedic_tests t WHERE t.name = 'FABQ-Travail inférieur à 19'
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hill JC, Whitehurst DG, Lewis M et al. Comparison of stratified primary care management for low back pain with current best practice (STarT Back): a randomised controlled trial. Lancet.', 2011, 'essai_randomise', 'La démonstration que stratifier selon le risque psychosocial améliore les résultats et réduit les coûts.', 0),
  (v_chapter, 'Nicholas MK, Linton SJ, Watson PJ, Main CJ. Early identification and management of psychological risk factors (yellow flags) in patients with low back pain. Phys Ther.', 2011, 'consensus', 'Le cadre de référence sur les drapeaux jaunes et leur prise en charge par les thérapeutes.', 1),
  (v_chapter, 'Wertli MM, Rasmussen-Barr E, Held U et al. Fear-avoidance beliefs: a moderator of treatment efficacy in patients with low back pain. Spine J.', 2014, 'revue_systematique', 'Les croyances d’évitement modifient la réponse au traitement, ce qui justifie de les mesurer.', 2);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'examen-physique',
    'L’examen physique lombaire',
    'Observation, mouvement, mouvements répétés, palpation',
    'Interroger et examiner', 'examen',
    'Un examen lombaire utile est court, hiérarchisé et centré sur la reproduction de la douleur habituelle. Ce chapitre décrit ce qui apporte de l’information, ce qui n’en apporte pas, et pourquoi les mouvements répétés sont le geste le plus rentable de l’examen.',
    jsonb_build_array(
      'Conduire un examen lombaire hiérarchisé en reliant chaque geste à une hypothèse',
      'Utiliser les mouvements répétés et identifier une préférence directionnelle',
      'Situer la valeur réelle de la palpation et des tests de mobilité segmentaire'
    ),
    jsonb_build_array(
      'Le geste le plus rentable de l’examen lombaire est le test en mouvements répétés : il oriente le diagnostic et le traitement du même coup.',
      'La centralisation de la douleur est le signe dont la valeur pronostique est la mieux établie.',
      'La palpation localise mal : la fiabilité inter-examinateurs de la recherche du segment fautif est médiocre.',
      'Un examen qui ne reproduit pas la douleur habituelle du patient n’a pas encore commencé.'
    ),
    50, 9
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Observation',
   '<p>Posture debout, position antalgique, déviation latérale du tronc, aplatissement ou accentuation de la lordose, asymétrie du bassin, trophicité musculaire, cicatrices. La déviation latérale antalgique, souvent appelée attitude scoliotique antalgique, a une valeur d’orientation réelle dans le conflit disco-radiculaire, et sa réductibilité au cours du traitement est un marqueur de réponse.</p><p>Observer aussi comment le patient se déshabille, monte sur la table, se relève : le mouvement spontané est plus informatif que le mouvement commandé.</p>',
   'none', 0),
  (v_chapter, 'Mouvements actifs et amplitude',
   '<p>Flexion, extension, inclinaisons, rotations, en notant l’amplitude, la qualité du mouvement, la douleur reproduite et son évolution en fin d’amplitude. Ce qui compte n’est pas le nombre de degrés mais deux choses : le mouvement qui reproduit la douleur habituelle, et la modification de la douleur quand on répète ce mouvement.</p><p>L’amplitude isolée est un mauvais indicateur : elle ne corrèle ni avec la douleur, ni avec l’incapacité, ni avec le pronostic.</p>',
   'none', 1),
  (v_chapter, 'Les mouvements répétés et la préférence directionnelle',
   '<p>Le principe, issu de la méthode McKenzie, est de faire répéter un mouvement de fin d’amplitude, dix à quinze fois, et d’observer l’effet sur la douleur et sur sa topographie. Trois réponses possibles : centralisation (la douleur distale remonte vers le rachis, même si la douleur lombaire augmente), périphérisation (elle descend), ou absence de changement.</p><p>La centralisation identifie une préférence directionnelle, le plus souvent en extension, parfois en flexion, parfois avec une composante latérale. Sa valeur pronostique est la mieux documentée de tout l’examen lombaire : les patients qui centralisent ont une évolution nettement plus favorable, et la direction qui centralise donne directement le traitement et l’auto-traitement.</p><p>C’est aussi le seul élément d’examen qui, à lui seul, fournit une prescription d’exercice pour le soir même.</p>',
   'cle', 2),
  (v_chapter, 'Palpation et mobilité segmentaire',
   '<p>La palpation cherche trois choses : la douleur provoquée segmentaire, une marche d’escalier entre deux épineuses évoquant un spondylolisthésis, et une hypomobilité en pression postéro-antérieure. Il faut savoir que la fiabilité inter-examinateurs du repérage du segment fautif est faible, et que la correspondance entre « segment bloqué » palpé et mobilité réellement mesurée est mauvaise.</p><p>Cela ne rend pas la palpation inutile : la douleur segmentaire provoquée reste un élément de la règle de Flynn et un repère de traitement. Cela interdit en revanche d’annoncer au patient qu’une vertèbre est déplacée ou bloquée, affirmation que l’examen ne permet pas.</p>',
   'piege', 3),
  (v_chapter, 'La hiérarchie à respecter',
   '<p>Dans l’ordre : observation, mouvements actifs, mouvements répétés, examen neurologique s’il y a une plainte distale, tests neurodynamiques, tests de provocation ciblés selon l’hypothèse, palpation. Terminer par un test de contrôle : reprendre le mouvement le plus douloureux après la séquence pour disposer d’un marqueur de réévaluation immédiat.</p><p>Ce marqueur, appelé signe comparable, est ce qui permettra de dire si la technique appliquée a servi à quelque chose, dans la minute plutôt qu’à la séance suivante.</p>',
   'pratique', 4);

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Phénomène de Centralisation (McKenzie)', 'Le signe le plus rentable de l’examen : diagnostic, pronostic et prescription d’exercice en un seul geste.', 0),
    ('Mouvements aberrants lombaires', 'Observation de la flexion et du retour : item de la règle de Hicks.', 1),
    ('Hypomobilité segmentaire lombaire (pression postéro-antérieure)', 'Fiabilité limitée : à utiliser comme item de règle, pas comme constat objectif.', 2),
    ('Test de Kemp', 'Test d’extension-rotation historiquement rattaché aux articulaires postérieures, dont la spécificité est insuffisante.', 3),
    ('Test de Schober modifié', 'Mesure de mobilité, utile au suivi plus qu’au diagnostic.', 4)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON t.name = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'May S, Aina A. Centralization and directional preference: a systematic review. Man Ther.', 2012, 'revue_systematique', 'Prévalence, valeur pronostique et fiabilité du phénomène de centralisation.', 0),
  (v_chapter, 'Werneke MW, Hart DL, Cutrone G et al. Association between directional preference and centralization in patients with low back pain. J Orthop Sports Phys Ther.', 2011, 'etude', 'Distingue proprement préférence directionnelle et centralisation, souvent confondues.', 1),
  (v_chapter, 'Seffinger MA, Najm WI, Mishra SI et al. Reliability of spinal palpation for diagnosis of back and neck pain: a systematic review. Spine.', 2004, 'revue_systematique', 'La revue de référence sur la faible fiabilité de la palpation diagnostique.', 2),
  (v_chapter, 'Laird RA, Gilbert J, Kent P, Keating JL. Comparing lumbo-pelvic kinematics in people with and without back pain: a systematic review. BMC Musculoskelet Disord.', 2014, 'revue_systematique', 'Ce que les différences de mobilité mesurées valent réellement entre lombalgiques et non lombalgiques.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'examen-neurologique',
    'Examen neurologique et tests neurodynamiques',
    'Situer la racine, mesurer le déficit, interpréter la mise en tension',
    'Interroger et examiner', 'examen',
    'Dès qu’une douleur descend sous le genou ou qu’il existe des paresthésies, l’examen neurologique devient obligatoire. Ce chapitre couvre l’examen par racine, les tests neurodynamiques et leur interprétation correcte.',
    jsonb_build_array(
      'Conduire un examen moteur, sensitif et réflexe systématisé de L2 à S1',
      'Réaliser et interpréter Lasègue, Lasègue croisé, Slump et Leri',
      'Distinguer une mise en tension neurale positive d’une simple tension musculaire postérieure'
    ),
    jsonb_build_array(
      'Un test neurodynamique n’est positif que s’il reproduit la douleur habituelle du patient, dans son territoire, et qu’il est modifié par la sensibilisation à distance.',
      'Le Lasègue sert à écarter, le Lasègue croisé à retenir : ce sont deux tests différents faits du même geste.',
      'Chercher le déficit racine par racine : L4 relève le talon et le réflexe rotulien, L5 relève l’hallux, S1 la flexion plantaire et le réflexe achilléen.',
      'Un déficit moteur progressif est un motif d’avis médical rapide, pas une indication à intensifier le traitement manuel.'
    ),
    55, 10
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'L’examen racine par racine',
   '<p><strong>L2 et L3</strong> : flexion de hanche et extension du genou, sensibilité de la face antérieure de cuisse, réflexe rotulien pour L3. <strong>L4</strong> : tibial antérieur, marche sur les talons, face interne de jambe, réflexe rotulien. <strong>L5</strong> : extenseur propre de l’hallux, moyen fessier, face latérale de jambe et dos du pied, pas de réflexe propre fiable. <strong>S1</strong> : triceps sural, marche sur la pointe des pieds ou relevés unipodaux répétés, bord latéral du pied, réflexe achilléen.</p><p>Le test fonctionnel vaut mieux que le testing manuel pour S1 : demander dix relevés sur la pointe d’un pied révèle une faiblesse qu’une poussée manuelle ne détecte pas, le triceps étant trop puissant.</p>',
   'pratique', 0),
  (v_chapter, 'Ce que vaut chaque signe',
   '<p>Pris isolément, les signes neurologiques ont une sensibilité médiocre et une spécificité correcte : leur présence compte, leur absence n’exclut pas. La revue Cochrane de van der Windt est nette sur ce point, y compris pour le déficit sensitif dont la valeur est la plus faible des trois.</p><p>La valeur diagnostique monte quand les trois plans concordent sur la même racine : douleur de topographie, test neurodynamique positif, et déficit moteur ou réflexe correspondant.</p>',
   'preuve', 1),
  (v_chapter, 'Les tests neurodynamiques et la règle des trois conditions',
   '<p>Un test neurodynamique n’est pas positif parce qu’il tire. Trois conditions : il reproduit la douleur habituelle du patient, dans son territoire ; il apparaît dans une amplitude comparable à celle où les symptômes se déclenchent dans la vie quotidienne ; et il est modifié par une manœuvre de sensibilisation à distance, dorsiflexion de cheville ou flexion cervicale, qui met en tension le tissu neural sans changer la tension musculaire locale.</p><p>Cette troisième condition est celle qui distingue une vraie mise en tension neurale d’une simple raideur des ischio-jambiers, et c’est celle qu’on oublie le plus souvent.</p>',
   'cle', 2),
  (v_chapter, 'Les quatre tests à maîtriser',
   '<p><strong>Lasègue</strong> : décubitus dorsal, élévation passive jambe tendue, sensible et peu spécifique, surtout informatif pour les racines L5 et S1. <strong>Lasègue croisé</strong> : élévation du côté sain reproduisant la douleur du côté atteint, peu sensible et très spécifique. <strong>Slump</strong> : assis, enroulement du rachis, flexion cervicale, extension du genou, dorsiflexion ; plus sensible que le Lasègue, avec une bonne modulation par la flexion cervicale. <strong>Leri, ou test du nerf fémoral</strong> : procubitus, flexion du genou puis extension de hanche, pour les racines hautes L2 à L4, indispensable devant une cruralgie.</p>',
   'pratique', 3),
  (v_chapter, 'Quand le déficit change la conduite',
   '<p>Un déficit moteur coté à 3 sur 5 ou moins, un déficit qui s’aggrave d’une consultation à l’autre, un déficit bilatéral, ou l’association à des troubles sphinctériens imposent un avis médical rapide ou urgent selon le contexte. Une radiculalgie avec déficit stable et modéré peut être suivie et traitée, avec une réévaluation motrice à chaque séance et une date limite fixée à l’avance.</p><p>Noter précisément le déficit initial est ce qui permettra de dire s’il s’aggrave. « Léger déficit du releveur » ne permet rien ; « extension de l’hallux à 4 sur 5 à droite, marche sur les talons possible mais fatigable après 10 mètres » permet de comparer.</p>',
   'reorientation', 4);

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de Lasègue (SLR)', 'Sensible, peu spécifique : sa négativité est plus informative que sa positivité.', 0),
    ('Test de Lasègue croisé', 'Peu sensible, très spécifique : décisif quand il est positif.', 1),
    ('Slump test', 'Plus sensible que le Lasègue, avec une sensibilisation par la flexion cervicale facile à réaliser.', 2),
    ('Test de Leri', 'Le test des racines hautes, indispensable devant une cruralgie.', 3),
    ('Myotome - L2 - Flexion de hanche', 'Testing moteur racine par racine.', 4),
    ('Myotome - L3 - Extension genou (quadriceps)', 'Testing moteur racine par racine.', 5),
    ('Myotome - L4 - Dorsiflexion+Supination/tibial anterior', 'Compléter par la marche sur les talons.', 6),
    ('Myotome - L5 - Extension de l''hallux', 'La racine la plus souvent atteinte avec S1.', 7),
    ('Myotome - SI - Flexion plantaire', 'Tester par relevés unipodaux répétés plutôt qu’à la main.', 8),
    ('Signe de Babinski', 'Recherche d’une atteinte centrale : un syndrome pyramidal n’est pas une radiculopathie lombaire.', 9),
    ('Signe de la sonnette', 'Signe d’orientation francophone, sans valeur diagnostique établie.', 10)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON t.name = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'La convergence topographie, neurodynamique et déficit est ce qui fait le diagnostic.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Faisceau d''arguments de radiculopathie lombaire'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note = EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'van der Windt DA, Simons E, Riphagen II et al. Physical examination for lumbar radiculopathy due to disc herniation in patients with low-back pain. Cochrane Database Syst Rev.', 2010, 'revue_systematique', 'La revue de référence sur la valeur diagnostique de chaque signe neurologique et neurodynamique.', 0),
  (v_chapter, 'Nee RJ, Butler D. Management of peripheral neuropathic pain: integrating neurobiology, neurodynamics, and clinical evidence. Phys Ther Sport.', 2006, 'revue_systematique', 'Les conditions d’interprétation d’un test neurodynamique, dont la sensibilisation à distance.', 1),
  (v_chapter, 'Majlesi J, Togay H, Unalan H, Toprak S. The sensitivity and specificity of the slump and the straight leg raising tests in patients with lumbar disc herniation. J Clin Rheumatol.', 2008, 'etude', 'Comparaison directe du Slump et du Lasègue sur la même population.', 2),
  (v_chapter, 'Suri P, Rainville J, Katz JN et al. The accuracy of the physical examination for the diagnosis of midlumbar and low lumbar nerve root impingement. Spine.', 2011, 'etude', 'Valeur de l’examen pour situer le niveau atteint, racines hautes comprises.', 3);

END $do$;
