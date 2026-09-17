-- Module « Région lombaire » : activités interactives.
--
-- Les rapports de vraisemblance du calculateur ne sont pas saisis à la main :
-- ils sont recalculés à partir de la sensibilité et de la spécificité des
-- fiches de tests de la plateforme. Un chiffre corrigé sur une fiche corrige
-- donc aussi l'exercice, et l'exercice ne peut pas contredire la fiche.

DO $do$
DECLARE
  v_module UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  DELETE FROM public.region_chapter_activities
   WHERE chapter_id IN (SELECT id FROM public.region_chapters WHERE module_id = v_module);

  -- ==========================================================================
  -- Calculateur de probabilité : radiculopathie
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'probabilite',
    'Calculateur : conflit disco-radiculaire',
    'Un patient consulte pour une douleur descendant sous le genou. Avant tout examen, estimons sa probabilité à 30 %. Cochez le résultat de chaque test et observez ce que la probabilité devient.',
    jsonb_build_object(
      'prevalence', 30,
      'prevalence_label', 'Douleur descendant sous le genou, en cabinet de thérapie manuelle',
      'tests', jsonb_agg(
        jsonb_build_object('name', t.name, 'se', t.sensitivity, 'sp', t.specificity)
        ORDER BY t.name
      )
    ),
    'Regardez ce que fait chaque test pris seul. Le Lasègue positif déplace à peine la probabilité, parce que son rapport de vraisemblance positif est proche de 1 : il est sensible, pas spécifique. Sa négativité, en revanche, fait tomber la probabilité. Le Lasègue croisé fait l’inverse. Et c’est la convergence de plusieurs tests qui déplace vraiment la décision, ce qu’aucun des trois ne fait seul.',
    0
  FROM public.region_chapters c
  JOIN public.orthopedic_tests t
    ON btrim(t.name) IN ('Test de Lasègue (SLR)', 'Test de Lasègue croisé', 'Slump test')
   AND t.sensitivity IS NOT NULL AND t.specificity IS NOT NULL
  WHERE c.module_id = v_module AND c.slug = 'valeur-des-tests'
  GROUP BY c.id;

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Que faites-vous de ce test ?',
    'Vous lisez la fiche d’un test dont le rapport de vraisemblance positif est de 1,3 et le rapport négatif de 0,29. Comment l’utilisez-vous ?',
    jsonb_build_object('multiple', false, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Sa positivité confirme le diagnostic', 'correct', false, 'feedback', 'Non. Un rapport positif de 1,3 déplace la probabilité de quelques points seulement. Positif, ce test n’apporte presque rien.'),
      jsonb_build_object('label', 'Sa négativité rend le diagnostic nettement moins probable', 'correct', true, 'feedback', 'Oui. Un rapport négatif de 0,29 divise les chances par trois environ. C’est un test d’exclusion, à faire en premier.'),
      jsonb_build_object('label', 'Il est inutile, autant ne pas le faire', 'correct', false, 'feedback', 'Non. Il est inutile pour confirmer, très utile pour écarter. C’est exactement le profil du Lasègue.'),
      jsonb_build_object('label', 'Il faut le combiner à un test de profil identique', 'correct', false, 'feedback', 'Non. Combiner deux tests sensibles et peu spécifiques n’apporte pas d’information nouvelle. Il faut lui associer un test spécifique.')
    )),
    'Règle de lecture : au dessus de 10 le test positif emporte la décision, en dessous de 0,1 le test négatif l’emporte, et entre 0,5 et 2 le test n’a presque rien changé.',
    1
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'valeur-des-tests';

  -- ==========================================================================
  -- Tri des drapeaux rouges
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'tri_drapeaux',
    'Classez ces situations par degré d’urgence',
    'Pour chaque situation, choisissez la conduite : urgence le jour même, avis médical sous quelques jours, ou surveillance avec traitement.',
    jsonb_build_object(
      'niveaux', jsonb_build_array('Urgence le jour même', 'Avis sous quelques jours', 'Surveillance et traitement'),
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Hypoesthésie du périnée apparue hier, avec difficulté à initier la miction', 'niveau', 'Urgence le jour même', 'feedback', 'Syndrome de la queue de cheval, forme incomplète. C’est précisément le stade où la décompression change le pronostic sphinctérien.'),
        jsonb_build_object('label', 'Lombalgie nouvelle chez un patient traité pour un cancer de la prostate il y a quatre ans', 'niveau', 'Avis sous quelques jours', 'feedback', 'L’antécédent de cancer est le seul drapeau rouge dont la valeur isolée est établie. Il suffit à justifier un avis.'),
        jsonb_build_object('label', 'Lombalgie aiguë depuis trois jours, réveils nocturnes aux changements de position', 'niveau', 'Surveillance et traitement', 'feedback', 'La douleur nocturne positionnelle est banale dans la lombalgie commune. Ce n’est pas un drapeau rouge.'),
        jsonb_build_object('label', 'Douleur lombaire permanente, fièvre à 38,5, infiltration rachidienne il y a trois semaines', 'niveau', 'Urgence le jour même', 'feedback', 'Suspicion de spondylodiscite ou d’abcès épidural sur geste rachidien récent. Le retard diagnostique se compte en semaines dans la littérature.'),
        jsonb_build_object('label', 'Fessalgie à bascule depuis 14 mois, raideur matinale d’une heure, talalgie associée', 'niveau', 'Avis sous quelques jours', 'feedback', 'Quatre critères ASAS sur cinq : avis rhumatologique. Le traitement manuel peut se poursuivre en parallèle.'),
        jsonb_build_object('label', 'Homme de 74 ans, tabagique, douleur lombaire profonde permanente qu’aucune position ne modifie, masse abdominale battante', 'niveau', 'Urgence le jour même', 'feedback', 'Anévrisme de l’aorte abdominale. Aucune manœuvre abdominale ni traction, orientation immédiate.'),
        jsonb_build_object('label', 'Extension de l’hallux à 4 sur 5 à droite, stable depuis deux semaines, douleur contrôlée', 'niveau', 'Avis sous quelques jours', 'feedback', 'Déficit moteur modéré et stable : avis, et surveillance motrice à chaque séance avec une date limite fixée à l’avance.'),
        jsonb_build_object('label', 'Lombalgie d’extension chez une gymnaste de 15 ans, depuis cinq semaines', 'niveau', 'Avis sous quelques jours', 'feedback', 'Spondylolyse jusqu’à preuve du contraire. Le test d’hyperextension unipodale ne permet pas de l’écarter, c’est l’imagerie qui tranche.')
      )
    ),
    'Le tri ne se fait pas en comptant des cases cochées. Il se fait sur un faisceau, sur un item à forte valeur, ou sur une évolution qui ne ressemble pas à ce qu’on attendait.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'drapeaux-rouges';

  -- ==========================================================================
  -- Queue de cheval
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'vrai_faux',
    'Vrai ou faux',
    'Quatre affirmations sur le syndrome de la queue de cheval.',
    jsonb_build_object('statements', jsonb_build_array(
      jsonb_build_object('label', 'Tant qu’il n’y a pas de rétention urinaire, on peut attendre la consultation de la semaine suivante.', 'correct', false, 'feedback', 'Faux, et c’est l’erreur la plus coûteuse. La récupération sphinctérienne est bien meilleure quand la décompression intervient avant la rétention.'),
      jsonb_build_object('label', 'La perte de la sensation du passage de l’urine est un signe précoce.', 'correct', true, 'feedback', 'Vrai. C’est souvent le premier signe, et il n’est presque jamais rapporté spontanément.'),
      jsonb_build_object('label', 'Demander « avez-vous des troubles sphinctériens ? » suffit à dépister.', 'correct', false, 'feedback', 'Faux. Cette formulation obtient des réponses négatives à tort. Il faut décrire concrètement : démarrage de la miction, sensation de vidange, sensibilité en s’essuyant.'),
      jsonb_build_object('label', 'Tout patient reparti avec une radiculalgie doit connaître les signes qui imposent d’aller aux urgences.', 'correct', true, 'feedback', 'Vrai. Dix secondes de consigne, donnée aussi par écrit, déplacent le risque de façon décisive.')
    )),
    NULL,
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'queue-de-cheval';

  -- ==========================================================================
  -- Fausses croyances
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'vrai_faux',
    'Ce que disent vraiment les données',
    'Six affirmations entendues tous les jours en cabinet. Lesquelles sont soutenues par la littérature ?',
    jsonb_build_object('statements', jsonb_build_array(
      jsonb_build_object('label', 'Corriger la posture d’un patient réduit son risque de lombalgie.', 'correct', false, 'feedback', 'Non soutenu. Les revues de revues ne retrouvent pas de lien constant entre posture et lombalgie. Ce qui compte est la variation, pas la position.'),
      jsonb_build_object('label', 'Apprendre à soulever en pliant les genoux prévient la lombalgie.', 'correct', false, 'feedback', 'Non soutenu. Les essais de formation au port de charge, y compris sur de grands effectifs en entreprise, ne réduisent ni l’incidence ni la récidive.'),
      jsonb_build_object('label', 'Le craquement signe la remise en place de l’articulation.', 'correct', false, 'feedback', 'Non. Le bruit de cavitation ne traduit pas un repositionnement et ne prédit pas le résultat clinique.'),
      jsonb_build_object('label', 'Chez des adultes sans aucune douleur, une majorité de quarantenaires ont une dégénérescence discale à l’imagerie.', 'correct', true, 'feedback', 'Vrai. C’est le chiffre à connaître pour répondre à un patient inquiet de son compte rendu.'),
      jsonb_build_object('label', 'Le gainage du transverse fait mieux qu’un exercice général bien mené.', 'correct', false, 'feedback', 'Non soutenu. Les méta-analyses ne retrouvent pas de supériorité des exercices de stabilisation sur un autre exercice actif.'),
      jsonb_build_object('label', 'Une douleur modérée pendant l’exercice, qui revient à son niveau habituel en moins d’une heure, est acceptable.', 'correct', true, 'feedback', 'Vrai. Les programmes autorisant une douleur modérée donnent des résultats au moins équivalents, avec un bénéfice à court terme sur l’incapacité.')
    )),
    'Chacune de ces phrases, prononcée en consultation, sera répétée par le patient pendant des années. C’est ce que montre le travail de Darlow.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'fausses-croyances';

  -- ==========================================================================
  -- Tests à abandonner
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Le test des pouces',
    'Quelle est la raison la plus forte de ne pas décider à partir du test de flexion debout ?',
    jsonb_build_object('multiple', false, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Il est douloureux pour le patient', 'correct', false, 'feedback', 'Non, ce n’est pas le problème : le test est indolore.'),
      jsonb_build_object('label', 'L’amplitude à détecter est inférieure au seuil de perception manuelle, la fiabilité inter-examinateurs est faible, et l’asymétrie de départ est banale', 'correct', true, 'feedback', 'Oui, et les trois s’additionnent. La sacro-iliaque bouge d’environ deux degrés et un à deux millimètres, deux praticiens ne trouvent pas le même côté, et les repères pelviens sont asymétriques chez des gens qui n’ont pas mal.'),
      jsonb_build_object('label', 'Il faut un matériel spécifique pour le réaliser correctement', 'correct', false, 'feedback', 'Non. Le problème n’est pas la réalisation, c’est ce que le résultat permet de conclure.'),
      jsonb_build_object('label', 'Il n’a jamais été étudié', 'correct', false, 'feedback', 'Au contraire : il a été étudié, et c’est pour cela qu’on sait qu’il ne tient pas.')
    )),
    'L’expérience de Tullberg est la plus démonstrative : après une manipulation jugée correctrice par les praticiens eux-mêmes, la mesure ne retrouve aucun changement de position du sacrum sur l’iliaque.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'tests-a-abandonner';

  -- ==========================================================================
  -- Cas guidé : radiculopathie
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'cas_etape',
    'Cas guidé : douleur descendant dans la jambe',
    'Avancez étape par étape. Chaque choix est corrigé avant de passer à la suite.',
    jsonb_build_object('steps', jsonb_build_array(
      jsonb_build_object(
        'situation', 'Femme de 41 ans. Lombalgie depuis trois semaines, puis depuis dix jours une douleur qui descend à la face postérieure de cuisse et de jambe jusqu’au bord latéral du pied, avec fourmillements du même territoire. Pire assise et à la toux.',
        'question', 'Quelle est votre première action ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Poser les questions de dépistage du syndrome de la queue de cheval', 'correct', true, 'feedback', 'Oui. Toute radiculalgie impose ce dépistage, avant tout examen physique et avec des formulations concrètes.'),
          jsonb_build_object('label', 'Demander une IRM lombaire', 'correct', false, 'feedback', 'Non. Sans drapeau rouge ni déficit progressif, l’imagerie ne changerait pas la prise en charge à ce stade.'),
          jsonb_build_object('label', 'Réaliser d’emblée un Lasègue', 'correct', false, 'feedback', 'Trop tôt. Le tri de sécurité passe avant le test diagnostique.')
        )
      ),
      jsonb_build_object(
        'situation', 'Dépistage négatif. À l’examen : Lasègue positif à 45 degrés reproduisant la douleur habituelle, majorée par la dorsiflexion. Lasègue croisé négatif. Slump positif.',
        'question', 'Que concluez-vous à ce stade ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Le diagnostic est établi, la topographie et la neurodynamique suffisent', 'correct', false, 'feedback', 'Presque. Il manque le troisième plan : le déficit. Deux plans sur trois rendent probable, trois sur trois rendent solide.'),
          jsonb_build_object('label', 'Il faut chercher un déficit systématisé avant de conclure', 'correct', true, 'feedback', 'Oui. Myotome, réflexe et territoire sensitif de la même racine. C’est ce qui fait passer de radiculalgie à radiculopathie, et qui désigne le niveau.'),
          jsonb_build_object('label', 'Le Lasègue croisé négatif écarte le conflit disco-radiculaire', 'correct', false, 'feedback', 'Non. Le Lasègue croisé est peu sensible : sa négativité n’écarte rien. C’est sa positivité qui aurait pesé.')
        )
      ),
      jsonb_build_object(
        'situation', 'Flexion plantaire : huit relevés unipodaux à droite contre vingt à gauche. Réflexe achilléen diminué à droite. Pas d’autre déficit, état stable depuis dix jours.',
        'question', 'Quelle prise en charge proposez-vous ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Adresser en urgence pour avis chirurgical', 'correct', false, 'feedback', 'Non. Un déficit modéré et stable ne relève pas de l’urgence. C’est un déficit sévère ou rapidement progressif qui l’imposerait.'),
          jsonb_build_object('label', 'Traiter, surveiller le déficit à chaque séance, et fixer d’avance une date de réévaluation', 'correct', true, 'feedback', 'Oui. Radiculopathie S1 avec déficit modéré stable : neuromobilisation en sliders, gestion de la charge, éducation sur l’histoire naturelle, consigne écrite de queue de cheval, et un point à six semaines.'),
          jsonb_build_object('label', 'Manipuler en haute vélocité pour lever le conflit', 'correct', false, 'feedback', 'Non. Rien ne permet de lever un conflit discal par une manipulation, et la phase irritable appelle plutôt de la basse vélocité et de la neuromobilisation prudente.')
        )
      )
    )),
    'Le fil du cas : le tri de sécurité passe avant le diagnostic, le diagnostic se construit sur la convergence de trois plans, et la décision thérapeutique dépend de la sévérité et de la progression du déficit, pas de l’intensité de la douleur.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'radiculopathie';

  -- ==========================================================================
  -- Sténose contre claudication vasculaire
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Neurogène ou vasculaire',
    'Quels éléments orientent vers une claudication neurogène plutôt que vasculaire ? Plusieurs réponses possibles.',
    jsonb_build_object('multiple', true, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Le patient marche mieux en poussant un caddie', 'correct', true, 'feedback', 'Oui. La flexion ouvre le canal : c’est le fil conducteur du tableau sténosant.'),
      jsonb_build_object('label', 'Le périmètre de marche est strictement le même chaque jour', 'correct', false, 'feedback', 'Non, c’est l’inverse. La reproductibilité du périmètre oriente vers l’artérite ; la sténose varie d’un jour à l’autre.'),
      jsonb_build_object('label', 'Il monte les escaliers plus facilement qu’il ne les descend', 'correct', true, 'feedback', 'Oui. La montée met le rachis en légère flexion. En artérite, la montée est au contraire moins bien tolérée.'),
      jsonb_build_object('label', 'Les symptômes cèdent en une minute dès qu’il s’arrête debout', 'correct', false, 'feedback', 'Non. La récupération rapide à l’arrêt simple, sans avoir besoin de s’asseoir, oriente vers le vasculaire.'),
      jsonb_build_object('label', 'Il pédale sans difficulté alors qu’il ne peut pas marcher dix minutes', 'correct', true, 'feedback', 'Oui. Le vélo se fait en flexion, la demande musculaire reste élevée : c’est très discriminant.')
    )),
    'Les deux pathologies coexistent souvent chez le sujet âgé. Trouver l’une n’autorise pas à écarter l’autre : la palpation des pouls fait partie de l’examen de toute claudication après 60 ans.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'stenose';

  -- ==========================================================================
  -- Calculateur sacro-iliaque
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'probabilite',
    'Calculateur : douleur de ceinture pelvienne',
    'Femme en post-partum, fessalgie unilatérale. Probabilité de départ estimée à 25 %. Faites varier les résultats.',
    jsonb_build_object(
      'prevalence', 25,
      'prevalence_label', 'Fessalgie unilatérale en post-partum',
      'tests', jsonb_agg(
        jsonb_build_object('name', t.name, 'se', t.sensitivity, 'sp', t.specificity)
        ORDER BY t.name
      )
    ),
    'L’ASLR est le seul test de la ceinture pelvienne dont la valeur diagnostique tient vraiment, et il mesure une incapacité fonctionnelle plutôt qu’une douleur provoquée. Observez l’écart entre ce qu’il déplace et ce que déplacent les tests de provocation pris isolément : c’est la raison d’être du cluster.',
    0
  FROM public.region_chapters c
  JOIN public.orthopedic_tests t
    ON btrim(t.name) IN ('Active Straight Leg Raise (ASLR)', 'Test de distraction', 'Thigh thrust test')
   AND t.sensitivity IS NOT NULL AND t.specificity IS NOT NULL
  WHERE c.module_id = v_module AND c.slug = 'ceinture-pelvienne'
  GROUP BY c.id;

  -- ==========================================================================
  -- Thérapie manuelle
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Ce que le NICE recommande aujourd’hui',
    'Depuis la mise à jour de juillet 2026, comment le NICE formule-t-il sa recommandation sur la thérapie manuelle ?',
    jsonb_build_object('multiple', false, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Elle peut être proposée seule en première intention', 'correct', false, 'feedback', 'Non. Aucune instance ne la recommande comme traitement autonome.'),
      jsonb_build_object('label', 'Elle est à envisager uniquement dans un programme de traitement qui comprend de l’exercice', 'correct', true, 'feedback', 'Oui, c’est la formulation de la recommandation 1.2.7. La mention « avec ou sans thérapie psychologique » qu’elle portait a été supprimée en juillet 2026.'),
      jsonb_build_object('label', 'Elle n’est plus recommandée du tout', 'correct', false, 'feedback', 'Non. Ce qui a été retiré concerne les thérapies psychologiques et les programmes combinés, pas la thérapie manuelle.'),
      jsonb_build_object('label', 'Elle est réservée à la lombalgie chronique de plus de trois mois', 'correct', false, 'feedback', 'Non, la recommandation ne pose pas cette restriction de durée.')
    )),
    'C’est la conséquence pratique la plus importante du chapitre : une séance de thérapie manuelle sans exercice associé ne correspond à aucune recommandation actuelle.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'therapie-manuelle';

  -- ==========================================================================
  -- Principes de traitement
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'vrai_faux',
    'Ce que recommandent les instances',
    'Cinq affirmations sur l’état actuel des recommandations.',
    jsonb_build_object('statements', jsonb_build_array(
      jsonb_build_object('label', 'L’OMS déconseille les tractions, les corsets lombaires et la neurostimulation transcutanée dans la lombalgie chronique primaire.', 'correct', true, 'feedback', 'Vrai, avec les opioïdes et les myorelaxants, ce sont les interventions que l’OMS recommande de ne pas proposer.'),
      jsonb_build_object('label', 'La HAS considère l’activité physique comme le traitement principal de la lombalgie commune.', 'correct', true, 'feedback', 'Vrai. C’est la formulation de la fiche mémo de 2019.'),
      jsonb_build_object('label', 'Le NICE recommande toujours les programmes combinés physiques et psychologiques.', 'correct', false, 'feedback', 'Faux depuis le 29 juillet 2026 : la recommandation 1.2.14 a été retirée, en partie parce que des travaux qui la fondaient ont été rétractés.'),
      jsonb_build_object('label', 'En l’absence de drapeau rouge, l’imagerie n’est pas indiquée dans un épisode aigu, même avec radiculalgie.', 'correct', true, 'feedback', 'Vrai, et c’est explicite dans la fiche mémo de la HAS comme dans la NG59.'),
      jsonb_build_object('label', 'Les recommandations de l’OMS sur la lombalgie chronique primaire sont des recommandations fortes.', 'correct', false, 'feedback', 'Faux. Elles sont toutes conditionnelles, sur une certitude de preuve allant de modérée à très faible.')
    )),
    'Savoir qu’une recommandation a changé, et pourquoi, vaut mieux que de connaître par cœur une liste figée. Les dates comptent autant que le contenu.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'principes-traitement';

  -- ==========================================================================
  -- Lombalgie inflammatoire
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Rythme inflammatoire',
    'Lesquels de ces éléments font partie des cinq critères ASAS de lombalgie inflammatoire ? Plusieurs réponses possibles.',
    jsonb_build_object('multiple', true, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Âge de début inférieur à 40 ans', 'correct', true, 'feedback', 'Oui, premier critère.'),
      jsonb_build_object('label', 'Amélioration par l’exercice', 'correct', true, 'feedback', 'Oui. C’est l’inverse du rythme mécanique.'),
      jsonb_build_object('label', 'Absence d’amélioration par le repos', 'correct', true, 'feedback', 'Oui, et c’est souvent ce que le patient exprime en disant qu’il se lève la nuit pour marcher.'),
      jsonb_build_object('label', 'Tests de provocation sacro-iliaque positifs', 'correct', false, 'feedback', 'Non. Ils peuvent être positifs dans une sacro-iliite, mais ils ne distinguent pas mécanique et inflammatoire et ne font pas partie des critères.'),
      jsonb_build_object('label', 'Douleur nocturne avec amélioration au lever', 'correct', true, 'feedback', 'Oui, cinquième critère avec l’installation progressive.')
    )),
    'Quatre critères sur cinq définissent la lombalgie inflammatoire. Ces critères ne font pas le diagnostic de spondyloarthrite : ils désignent les patients chez qui il faut le chercher.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'lombalgie-inflammatoire';

  -- ==========================================================================
  -- Biais du praticien
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Pourquoi tout semble marcher',
    'Un praticien constate que 85 % de ses patients lombalgiques vont mieux après deux séances. Qu’est-ce que cette observation démontre ?',
    jsonb_build_object('multiple', false, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Que sa technique est efficace', 'correct', false, 'feedback', 'Non. La même observation serait faite avec une technique inutile, parce que le patient consulte au pic et que l’histoire naturelle est favorable.'),
      jsonb_build_object('label', 'Que son diagnostic était juste', 'correct', false, 'feedback', 'Non. Un bon résultat ne valide pas l’hypothèse tissulaire, il valide qu’on a fait quelque chose d’utile.'),
      jsonb_build_object('label', 'Rien qui permette de départager sa technique d’une autre', 'correct', true, 'feedback', 'Exact. Régression vers la moyenne et histoire naturelle produisent ce résultat quelle que soit la méthode. C’est une limite de méthode, pas de compétence.'),
      jsonb_build_object('label', 'Que ses patients étaient peu sévères', 'correct', false, 'feedback', 'Non, et c’est un raisonnement qui ne se vérifie pas : le mécanisme opère quelle que soit la sévérité initiale.')
    )),
    'Les trois garde-fous qui répondent à ce problème : un signe comparable choisi avant la technique, un critère d’échec fixé d’avance, une date de réévaluation annoncée au patient.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'biais-du-praticien';

  -- ==========================================================================
  -- Imagerie
  -- ==========================================================================
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Ce patient a-t-il besoin d’une imagerie ?',
    'Homme de 35 ans, lombalgie aiguë depuis huit jours, sans irradiation, sans antécédent, examen neurologique normal. Il demande une IRM parce que son collègue en a eu une.',
    jsonb_build_object('multiple', false, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Lui expliquer que ce n’est pas nécessaire et passer au traitement', 'correct', false, 'feedback', 'Incomplet. Refuser sans donner de critère de déclenchement laisse le patient chercher ailleurs.'),
      jsonb_build_object('label', 'Reconnaître sa demande, expliquer pourquoi l’imagerie ne changerait rien, et dire ce qui la rendrait utile plus tard', 'correct', true, 'feedback', 'Oui. C’est le troisième temps, le critère de déclenchement, qui manque presque toujours et qui est celui qui rassure.'),
      jsonb_build_object('label', 'L’adresser pour une radiographie, moins irradiante qu’un scanner', 'correct', false, 'feedback', 'Non. La question n’est pas le choix de l’examen, c’est son indication, qui n’existe pas ici.'),
      jsonb_build_object('label', 'Accepter, puisque le patient sera plus rassuré', 'correct', false, 'feedback', 'Non. Les essais montrent l’inverse : l’imagerie précoce ne rassure pas durablement, elle augmente le recours aux soins sans améliorer les résultats.')
    )),
    'La HAS demande aussi d’expliquer l’absence de corrélation systématique entre les signes radiologiques et les symptômes, y compris lorsque l’examen est indiqué.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'imagerie';

END $do$;
