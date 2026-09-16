-- Module « Région lombaire » : parties « Orienter » et « Intégrer ».
-- Trois chapitres : imagerie, réorientation, cas cliniques intégratifs.

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
    v_module, 'imagerie',
    'L’imagerie lombaire',
    'Quand elle sert, quand elle nuit, et comment en parler',
    'Orienter', 'reorientation',
    'L’imagerie lombaire prescrite hors indication est associée à de moins bons résultats, à plus d’interventions et à une aggravation des croyances. Ce chapitre donne les indications réelles et les mots pour répondre à une demande.',
    jsonb_build_array(
      'Citer les indications reconnues d’une imagerie lombaire',
      'Expliquer à un patient pourquoi une imagerie n’est pas indiquée, sans le braquer',
      'Lire un compte rendu d’IRM sans se laisser conduire par lui'
    ),
    jsonb_build_array(
      'Pas d’imagerie en l’absence de drapeau rouge ou de projet chirurgical : c’est le point sur lequel toutes les recommandations s’accordent.',
      'Les anomalies dégénératives sont si fréquentes chez les sujets asymptomatiques qu’elles ne prouvent presque jamais la cause de la douleur.',
      'Les essais montrent que l’imagerie précoce ne change pas les résultats cliniques et augmente le recours aux soins.',
      'Un compte rendu se lit en le confrontant à la clinique, jamais l’inverse.'
    ),
    40, 23
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Les indications réelles',
   '<p>Une imagerie lombaire se justifie dans quatre situations. <strong>Suspicion de pathologie spécifique</strong> : faisceau de drapeaux rouges, antécédent de cancer, suspicion de fracture, de spondylodiscite ou de spondyloarthrite. <strong>Déficit neurologique</strong> significatif ou progressif. <strong>Projet interventionnel</strong> : bilan préopératoire ou préalable à une infiltration. <strong>Absence d’évolution</strong> après une prise en charge conservatrice bien conduite, lorsque le résultat de l’imagerie changerait la conduite.</p><p>Hors de ces situations, elle n’est pas indiquée, et ce n’est pas une question de coût : elle nuit.</p>',
   'cle', 0),
  (v_chapter, 'Pourquoi elle nuit',
   '<p>La méta-analyse de Chou publiée dans le Lancet a comparé imagerie précoce et prise en charge sans imagerie dans la lombalgie sans drapeau rouge : aucune différence sur la douleur, la fonction ou la qualité de vie, et davantage d’examens et d’interventions dans le groupe imagé. Les études de cohortes vont dans le même sens, avec des arrêts de travail plus longs et un recours chirurgical plus fréquent chez les patients imagés tôt.</p><p>Le mécanisme est facile à comprendre : une IRM trouve toujours quelque chose. Chez les sujets sans aucune douleur, la revue de Brinjikji retrouve des dégénérescences discales chez une majorité de quarantenaires et des protrusions chez environ un tiers. Ce « quelque chose » devient une explication, l’explication devient une inquiétude, et l’inquiétude devient un comportement d’évitement.</p>',
   'preuve', 1),
  (v_chapter, 'Lire un compte rendu sans se faire conduire',
   '<p>Trois règles. Lire la clinique d’abord, l’image ensuite : une image ne devient pertinente que si elle correspond au niveau et au côté que l’examen a désignés. Distinguer ce qui est banal de ce qui est significatif : discopathie, protrusion, arthrose facettaire, Modic sont fréquents et peu informatifs ; une hernie extrudée concordante, une sténose serrée avec claudication correspondante, une lyse isthmique le sont davantage. Se méfier du vocabulaire : les comptes rendus emploient des termes qui alarment les patients pour décrire des situations banales.</p>',
   'pratique', 2),
  (v_chapter, 'Répondre à la demande d’imagerie',
   '<p>Ne pas répondre « ce n’est pas nécessaire » et passer à autre chose : le patient entendra qu’on ne le prend pas au sérieux. Une réponse en trois temps fonctionne mieux. Reconnaître la demande : « vous voulez savoir ce qu’il y a, c’est normal. » Expliquer le raisonnement : « une IRM montre chez presque tout le monde des images d’usure, y compris chez des gens qui n’ont jamais eu mal ; dans votre cas elle ne changerait pas le traitement. » Donner le critère de déclenchement : « si vous n’allez pas mieux d’ici X semaines, ou si l’un de ces signes apparaît, alors elle deviendra utile et je vous adresserai. »</p><p>Le troisième temps est celui qui manque le plus souvent, et c’est celui qui rassure.</p>',
   'pratique', 3),
  (v_chapter, 'Le patient qui arrive avec son IRM',
   '<p>Situation quotidienne. Ne pas ignorer le document : le patient l’a payé, attendu et lu. Le reprendre avec lui, nommer ce qui est banal, dire ce qui correspond ou non à son tableau, et conclure explicitement sur ce que cela change au traitement, le plus souvent rien.</p><p>C’est un des moments les plus efficaces de la consultation : bien mené, il désamorce des mois de croyances installées par un compte rendu.</p>',
   'none', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Chou R, Fu R, Carrino JA, Deyo RA. Imaging strategies for low-back pain: systematic review and meta-analysis. Lancet.', 2009, 'meta_analyse', 'L’imagerie précoce ne change pas les résultats cliniques et augmente le recours aux soins.', 0),
  (v_chapter, 'Brinjikji W, Luetmer PH, Comstock B et al. Systematic literature review of imaging features of spinal degeneration in asymptomatic populations. AJNR.', 2015, 'revue_systematique', 'Les chiffres à citer devant un patient inquiet de son compte rendu.', 1),
  (v_chapter, 'Webster BS, Bauer AZ, Choi Y et al. Iatrogenic consequences of early magnetic resonance imaging in acute, work-related, disabling low back pain. Spine.', 2013, 'etude', 'Imagerie précoce et allongement des arrêts de travail.', 2),
  (v_chapter, 'Rajasekaran S, Dilip Chand Raja S, Pushpa BT et al. The catastrophization effects of an MRI report on the patient and surgeon. Eur Spine J.', 2021, 'etude', 'L’effet du vocabulaire du compte rendu sur le patient comme sur le soignant.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'reorientation',
    'Réorienter : qui, quand, comment',
    'Passer la main est un acte de soin, pas un échec',
    'Orienter', 'reorientation',
    'Ce chapitre rassemble tous les critères de réorientation du parcours en un arbre unique, et donne les modèles de courrier qui obtiennent effectivement un rendez-vous.',
    jsonb_build_array(
      'Classer une réorientation en trois niveaux d’urgence',
      'Choisir le bon interlocuteur selon le tableau',
      'Rédiger un courrier qui obtient un rendez-vous et une réponse'
    ),
    jsonb_build_array(
      'Trois niveaux : urgence le jour même, avis rapide sous quelques jours, avis programmé.',
      'Un courrier utile nomme les constats, pas les impressions, et pose une question précise.',
      'Réorienter n’interrompt pas nécessairement le suivi : les deux prises en charge peuvent coexister.',
      'Annoncer à la première séance le délai de réévaluation rend la réorientation naturelle le moment venu.'
    ),
    40, 24
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Niveau 1 : le jour même',
   '<p>Syndrome de la queue de cheval, même incomplet. Déficit moteur sévère ou rapidement progressif. Suspicion d’infection rachidienne avec fièvre ou terrain à risque. Suspicion de fissuration ou de rupture d’anévrisme aortique. Douleur abdominale ou lombaire intense avec malaise, pâleur ou instabilité.</p><p>Conduite : orientation vers les urgences, organisée et non simplement conseillée, avec un courrier nommant la suspicion et la chronologie des signes. Aucun traitement manuel avant avis.</p>',
   'drapeau_rouge', 0),
  (v_chapter, 'Niveau 2 : sous quelques jours',
   '<p>Antécédent de cancer avec lombalgie nouvelle. Faisceau évoquant une fracture vertébrale. Quatre critères ASAS sur cinq chez un sujet jeune. Déficit moteur modéré et stable. Douleur non mécanique persistante. Lombalgie fébrile sans signe de gravité immédiate. Adolescent sportif avec lombalgie d’extension de plus de deux à trois semaines.</p><p>Conduite : courrier au médecin traitant ou au spécialiste concerné, avec les constats et la question posée. Le traitement manuel peut se poursuivre prudemment selon le tableau, et le dire dans le courrier évite le malentendu.</p>',
   'reorientation', 1),
  (v_chapter, 'Niveau 3 : avis programmé',
   '<p>Radiculalgie invalidante persistant au delà de six à huit semaines de traitement bien conduit. Sténose avec retentissement fonctionnel important malgré le conservateur. Tableau en extension résistant pouvant relever d’un bloc diagnostique. Absence d’évolution à six à huit semaines chez un patient à risque élevé, pour un accompagnement psychologique ou un programme pluridisciplinaire. Suspicion de cause viscérale ou gynécologique chronique.</p>',
   'none', 2),
  (v_chapter, 'Ce qui fait qu’un courrier fonctionne',
   '<p>Quatre éléments. <strong>Des constats, pas des impressions</strong> : « extension de l’hallux à 4 sur 5 à droite, réflexe achilléen aboli » plutôt que « déficit neurologique ». <strong>Une chronologie</strong> : depuis quand, comment cela évolue, ce qui a été fait et avec quel résultat. <strong>Une question précise</strong> : ce que vous attendez de ce confrère, pas « merci de voir ». <strong>Ce que vous continuez à faire</strong> : cela évite les consignes contradictoires et le patient pris entre deux discours.</p>',
   'pratique', 3),
  (v_chapter, 'Trois modèles',
   '<p><strong>Urgence.</strong> « Patiente de 44 ans, lombosciatalgie droite depuis 10 jours. Depuis hier : hypoesthésie périnéale, difficulté à initier la miction, faiblesse bilatérale des releveurs. Suspicion de syndrome de la queue de cheval. Je l’adresse aux urgences ce jour, elle s’y rend immédiatement. »</p><p><strong>Avis rapide.</strong> « Patient de 72 ans, antécédent de cancer de la prostate traité en 2019, lombalgie nouvelle depuis 5 semaines, d’aggravation progressive, non modifiée par la position, réveils nocturnes non positionnels, pas de déficit. Aucun traitement d’épreuve entrepris. Je vous l’adresse pour avis et discussion d’une imagerie. »</p><p><strong>Avis programmé.</strong> « Patient de 38 ans, lombosciatalgie S1 gauche depuis 9 semaines, Lasègue positif à 40 degrés, réflexe achilléen diminué, force conservée. Huit séances associant thérapie manuelle, neuromobilisation et exercice : amélioration de 30 % environ, plateau depuis trois semaines, retentissement professionnel important. Je vous l’adresse pour avis sur la suite, notamment discussion d’une imagerie et d’une infiltration. Je poursuis le suivi en parallèle. »</p>',
   'pratique', 4),
  (v_chapter, 'Réorienter sans casser la relation',
   '<p>Le patient entend souvent « je ne peux plus rien pour vous ». Le formuler autrement : « nous avons obtenu X, nous sommes sur un plateau, il nous manque un avis pour savoir si on continue comme ça ou si on change de stratégie. Je continue à vous suivre pendant ce temps. »</p><p>Annoncer dès la première séance la date de réévaluation rend ce moment attendu au lieu d’être vécu comme un abandon.</p>',
   'cle', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Finucane LM, Downie A, Mercer C et al. International framework for red flags for potential serious spinal pathologies. J Orthop Sports Phys Ther.', 2020, 'consensus', 'Le cadre de décision gradué sur lequel s’appuie cet arbre.', 0),
  (v_chapter, 'Greenhalgh S, Finucane L, Mercer C, Selfe J. Assessment and management of cauda equina syndrome. Musculoskelet Sci Pract.', 2018, 'consensus', 'Conduite pratique de l’urgence numéro un.', 1),
  (v_chapter, 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s. NICE guideline NG59.', 2020, 'recommandation', 'Critères de recours aux avis spécialisés et à la chirurgie.', 2);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'cas-cliniques',
    'Cas cliniques intégratifs',
    'Six consultations, du raisonnement à la décision',
    'Intégrer', 'cas_clinique',
    'Six vignettes qui reprennent tout le parcours : l’anamnèse, les hypothèses, les tests choisis et pourquoi, la décision, et l’erreur classique dans chaque cas.',
    jsonb_build_array(
      'Conduire un raisonnement complet de l’anamnèse à la décision',
      'Choisir les tests en fonction de l’hypothèse plutôt que par habitude',
      'Repérer l’erreur classique de chaque tableau'
    ),
    jsonb_build_array(
      'Dans chaque cas, l’interrogatoire a déjà décidé de l’essentiel avant le premier test.',
      'Les erreurs les plus fréquentes ne sont pas des erreurs techniques mais des erreurs de tri.',
      'Un test choisi sans hypothèse produit du bruit qu’on interprétera à tort.'
    ),
    60, 25
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Cas 1 : le lumbago du déménagement',
   '<p><strong>Anamnèse.</strong> Homme de 34 ans, douleur lombaire basse en barre depuis 4 jours, apparue en portant un carton en flexion-rotation. Pas d’irradiation sous la fesse. Pire assis et le matin, mieux en marchant. Aucun antécédent, aucun signe général. Travaille, n’est pas arrêté, dit « ça va passer comme la dernière fois ».</p><p><strong>Raisonnement.</strong> Catégorie 3, lombalgie non spécifique, probablement discogénique. Risque psychosocial faible, attente de guérison bonne. Le tri de sécurité est négatif.</p><p><strong>Examen.</strong> Flexion limitée et douloureuse, extension libre. Mouvements répétés en extension : centralisation nette. Lasègue négatif. Neuro normal. Segment L4-L5 douloureux et hypomobile. Règle de Flynn : 5 items sur 5.</p><p><strong>Décision.</strong> Manipulation lombaire, réévaluation immédiate du signe comparable, press-up dix répétitions toutes les deux heures, aménagement de la position assise, poursuite du travail. Deux séances prévues, point à trois semaines.</p><p><strong>Erreur classique.</strong> Multiplier les séances sur un patient dont le pronostic spontané est excellent, et installer l’idée qu’il a « le dos fragile ».</p>',
   'none', 0),
  (v_chapter, 'Cas 2 : la sciatique qui inquiète',
   '<p><strong>Anamnèse.</strong> Femme de 41 ans, lombalgie depuis 3 semaines puis douleur descendant à la face postérieure de cuisse, de jambe, jusqu’au bord latéral du pied depuis 10 jours. Fourmillements du même territoire. Pire assise et en toussant. Dort mal. Inquiète : sa mère a été opérée du dos.</p><p><strong>Raisonnement.</strong> Catégorie 2, radiculalgie probablement S1. Le tri de sécurité doit comporter explicitement les questions de queue de cheval.</p><p><strong>Examen.</strong> Queue de cheval : négatif. Lasègue positif à 45 degrés reproduisant la douleur habituelle, modifié par la dorsiflexion. Lasègue croisé négatif. Slump positif. Flexion plantaire : 8 relevés unipodaux contre 20 à gauche. Réflexe achilléen diminué.</p><p><strong>Décision.</strong> Radiculopathie S1 avec déficit modéré. Pas d’imagerie à ce stade. Traitement : neuromobilisation en sliders, gestion de la charge et de la position assise, mobilisations, éducation sur l’histoire naturelle et la régression spontanée. Consigne écrite de queue de cheval. Réévaluation motrice à chaque séance, point à six semaines.</p><p><strong>Erreur classique.</strong> Passer aux tensioners trop tôt, et omettre la consigne écrite de queue de cheval.</p>',
   'none', 1),
  (v_chapter, 'Cas 3 : les jambes lourdes au supermarché',
   '<p><strong>Anamnèse.</strong> Homme de 71 ans, lourdeurs et brûlures des deux cuisses et mollets à la marche depuis un an, apparaissant après 200 à 400 mètres selon les jours, obligeant à s’asseoir. Va mieux penché sur son caddie. Fait du vélo d’appartement sans problème. Ancien fumeur, hypertendu.</p><p><strong>Raisonnement.</strong> Claudication : neurogène ou vasculaire. Le soulagement par la flexion, la tolérance au vélo et la variabilité du périmètre orientent vers la sténose. Le terrain impose d’examiner les pouls.</p><p><strong>Examen.</strong> Pouls périphériques présents et symétriques. Extension lombaire douloureuse et reproduisant les symptômes, flexion soulageante. Rotation interne de hanche conservée. Neuro sans déficit franc. Romberg modifié perturbé.</p><p><strong>Décision.</strong> Sténose lombaire dégénérative. Programme en flexion, marche par intervalles sous le seuil, renforcement, mobilisations en ouverture, travail de l’équilibre. Point à huit semaines, avis chirurgical discuté si le périmètre ne progresse pas.</p><p><strong>Erreur classique.</strong> Ne pas prendre les pouls, et manquer une artériopathie associée chez un ancien fumeur hypertendu.</p>',
   'none', 2),
  (v_chapter, 'Cas 4 : la fessalgie de la jeune femme',
   '<p><strong>Anamnèse.</strong> Femme de 27 ans, douleur fessière profonde, tantôt à droite tantôt à gauche, depuis 14 mois. Réveils en seconde partie de nuit, se lève et marche pour se soulager. Raideur matinale d’environ une heure. Va mieux en bougeant, moins bien au repos. Talalgie droite depuis six mois, mise sur le compte de la course à pied.</p><p><strong>Raisonnement.</strong> Le rythme est inflammatoire, pas mécanique. La bascule d’un côté à l’autre et l’enthésopathie associée orientent vers une spondyloarthrite axiale.</p><p><strong>Examen.</strong> Tests de provocation sacro-iliaque : trois positifs sur cinq. Mais quatre critères ASAS sur cinq sont réunis.</p><p><strong>Décision.</strong> Les tests positifs ne changent rien : c’est le rythme qui décide. Courrier rhumatologique argumenté, en nommant les quatre critères et la talalgie. Poursuite d’un travail actif en parallèle, l’exercice étant recommandé dans la spondyloarthrite.</p><p><strong>Erreur classique.</strong> Traiter une « sacro-iliaque bloquée » pendant des mois parce que les tests de provocation sont positifs, et retarder un diagnostic de plusieurs années.</p>',
   'piege', 3),
  (v_chapter, 'Cas 5 : le patient résistant',
   '<p><strong>Anamnèse.</strong> Homme de 52 ans, douleur de la crête iliaque droite et de la fesse haute depuis huit mois. Trois praticiens avant vous, traitements portés sur L5-S1 et sur la sacro-iliaque, amélioration transitoire à chaque fois. Pas d’irradiation sous la fesse. Pas de signe général.</p><p><strong>Raisonnement.</strong> Une douleur basse avec un examen lombaire bas pauvre et une résistance au traitement de l’étage évident doit faire remonter : charnière thoraco-lombaire, nerfs clunéaux.</p><p><strong>Examen.</strong> Palper-rouler franchement positif et asymétrique à droite. Point douloureux exquis sur la crête iliaque droite, à 7 cm de la ligne médiane, reproduisant la douleur habituelle. Pression des articulaires T12-L1 douloureuse à droite. Tests sacro-iliaques : un seul positif sur cinq.</p><p><strong>Décision.</strong> Syndrome de la charnière thoraco-lombaire, avec participation clunéale. Traitement porté sur T12-L1, travail des tissus mous de la zone de cellulalgie, éducation sur l’origine de la douleur.</p><p><strong>Erreur classique.</strong> Continuer à traiter l’étage où le patient montre sa douleur.</p>',
   'cle', 4),
  (v_chapter, 'Cas 6 : la lombalgie qui ne ressemble à rien',
   '<p><strong>Anamnèse.</strong> Homme de 68 ans, lombalgie depuis six semaines, d’aggravation progressive, sans facteur déclenchant. Aucune position ne soulage, y compris allongé. Réveils nocturnes avec impossibilité de se rendormir. A perdu du poids sans le chercher. Tabagique. Antécédent de cancer de la prostate traité il y a quatre ans, considéré comme guéri.</p><p><strong>Raisonnement.</strong> Deux éléments à forte valeur : l’antécédent de cancer et l’absence totale de facteur soulageant. L’amaigrissement et la douleur nocturne non positionnelle complètent le faisceau.</p><p><strong>Examen.</strong> Mobilité lombaire peu limitée, douleur mal reproduite par le mouvement, examen neurologique normal, percussion des épineuses sensible en L2.</p><p><strong>Décision.</strong> Aucun traitement manuel. Courrier pour avis médical rapide, mentionnant l’antécédent, l’amaigrissement, la douleur non mécanique et nocturne, et la sensibilité à la percussion. Le patient est rappelé sous 48 heures pour vérifier que la consultation a eu lieu.</p><p><strong>Erreur classique.</strong> Traiter une séance « pour voir », parce que le patient est venu pour ça et qu’il repartirait déçu.</p>',
   'drapeau_rouge', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Bardin LD, King P, Maher CG. Diagnostic triage for low back pain: a practical approach for primary care. Med J Aust.', 2017, 'consensus', 'Le cadre de tri appliqué dans chacune de ces vignettes.', 0),
  (v_chapter, 'Finucane LM, Downie A, Mercer C et al. International framework for red flags for potential serious spinal pathologies. J Orthop Sports Phys Ther.', 2020, 'consensus', 'La conduite graduée illustrée par les cas 4 et 6.', 1);

END $do$;
