-- Module « Région lombaire » : partie « Déjouer les pièges ».
--
-- Trois chapitres consacrés à ce qu'il faut désapprendre : les tests
-- historiques dont la validité ne tient pas, les croyances transmises aux
-- patients, et les biais de raisonnement qui font qu'on continue.
--
-- Cette partie est le contrepoids du reste du parcours. Le module
-- enseignait quoi faire ; il manquait ce qu'il faut cesser de faire, qui
-- occupe une part considérable de la pratique courante en thérapie manuelle.
--
-- Elle s'insère entre « Traiter » et « Orienter » : le lecteur a vu les outils
-- valides, il peut maintenant trier ce qu'il en reste dans ses habitudes.

-- ============================================================================
-- 1. FICHES DES TESTS OBSOLÈTES
-- ============================================================================
--
-- Ces tests entrent dans le référentiel `/tests` comme les autres, avec les
-- colonnes de valeur diagnostique vides et l'explication dans `interest`.
-- Les taire aurait été plus simple, mais ils sont enseignés partout : un
-- praticien qui cherche « test de flexion debout » doit trouver ici pourquoi
-- il ne peut pas décider avec, plutôt que de ne rien trouver et de continuer.

INSERT INTO public.orthopedic_tests (name, category, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
SELECT * FROM (VALUES
  (
    'Test de flexion debout (test des pouces)',
    'Sacro-iliaque',
    'Patient debout, praticien assis derrière lui, pouces posés sous les épines iliaques postéro-supérieures. Le patient se penche lentement en avant. Le test est classiquement décrit comme positif du côté où le pouce monte le premier ou monte davantage, ce qui est interprété comme une restriction de mobilité de la sacro-iliaque de ce côté.',
    'Historiquement proposé pour identifier le côté d''une dysfonction sacro-iliaque et pour choisir le côté à traiter.',
    'À ne pas utiliser pour décider. Trois raisons convergentes. La fiabilité inter-examinateurs est faible : deux praticiens examinant le même patient ne trouvent pas le même côté plus souvent que le hasard ne le prédit. La mobilité réelle de la sacro-iliaque, mesurée par stéréophotogrammétrie, est de l''ordre de deux degrés de rotation et d''un à deux millimètres de translation, sous le seuil de ce qu''une pulpe de pouce peut distinguer à travers la peau, le tissu adipeux et l''aponévrose. Enfin la position des épines iliaques postéro-supérieures est fréquemment asymétrique chez des sujets sans aucune douleur, par simple variation de morphologie osseuse. Ce que le test détecte de façon reproductible n''est donc pas une dysfonction mais une asymétrie anatomique, et l''examinateur qui attend un résultat le trouve. Ce qui le remplace : les tests de provocation groupés du cluster de Laslett, validés contre bloc anesthésique.',
    'Sturesson B et al. Movements of the sacroiliac joints: a roentgen stereophotogrammetric analysis. Spine. 1989. van der Wurff P et al. Clinical tests of the sacroiliac joint: a systematic methodological review. Man Ther. 2000. Preece SJ et al. Variation in pelvic morphology may prevent the identification of anterior pelvic tilt. J Man Manip Ther. 2008.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Test de flexion assise (Piedallu)',
    'Sacro-iliaque',
    'Même principe que le test de flexion debout, patient assis, les membres inférieurs étant ainsi neutralisés. Le test est décrit comme positif du côté où l''épine iliaque postéro-supérieure monte le plus.',
    'Historiquement proposé pour distinguer une origine sacro-iliaque d''une origine sous-pelvienne, en comparant le résultat debout et assis.',
    'À ne pas utiliser pour décider. La neutralisation des membres inférieurs ne résout pas le problème de fond : la mobilité observée reste très inférieure au seuil de détection manuelle, et la fiabilité inter-examinateurs reste faible. La comparaison debout contre assis, censée localiser le niveau du problème, ajoute une seconde mesure peu fiable à une première, ce qui dégrade la décision au lieu de l''affiner.',
    'van der Wurff P et al. Man Ther. 2000. Riddle DL, Freburger JK. Evaluation of the presence of sacroiliac joint region dysfunction using a combination of tests: a multicenter intertester reliability study. Phys Ther. 2002.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Test de Gillet (test cinétique, test de la cigogne)',
    'Sacro-iliaque',
    'Patient debout, un pouce du praticien sur l''épine iliaque postéro-supérieure, l''autre sur le sacrum au même niveau. Le patient porte le genou homolatéral vers la poitrine. Le test est décrit comme positif lorsque l''épine iliaque postéro-supérieure ne descend pas par rapport au sacrum, ce qui est interprété comme une sacro-iliaque bloquée.',
    'Historiquement proposé pour évaluer la mobilité de la sacro-iliaque en charge.',
    'À ne pas utiliser pour décider. Mêmes limites que le test de flexion debout, avec une difficulté supplémentaire : le mouvement recherché est ici masqué par le déplacement du bassin entier que provoque la mise en appui unipodal. Les études de fiabilité rapportent des accords faibles, y compris entre praticiens expérimentés et formés au même protocole.',
    'van der Wurff P et al. Man Ther. 2000. Riddle DL, Freburger JK. Phys Ther. 2002.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Palpation de position des repères pelviens',
    'Sacro-iliaque',
    'Comparaison de la hauteur des épines iliaques postéro-supérieures, des épines iliaques antéro-supérieures, des crêtes iliaques et de la base sacrée, en décubitus, assis ou debout, à la recherche d''une antériorisation, d''une postériorisation ou d''une torsion de l''iliaque.',
    'Historiquement utilisée pour nommer une dysfonction positionnelle du bassin et pour en déduire la technique correctrice.',
    'À ne pas utiliser pour décider, et surtout à ne pas verbaliser devant le patient. L''asymétrie des repères pelviens est fréquente chez des sujets asymptomatiques et tient largement à la variation de morphologie osseuse, qui ne change pas avec un traitement. L''expérience décisive est celle de Tullberg : après une manipulation jugée correctrice par les praticiens eux-mêmes, la mesure stéréophotogrammétrique ne retrouve aucune modification de la position du sacrum par rapport à l''iliaque. Ce qui a changé, c''est la douleur, pas la position. Dire « votre bassin était décalé, je l''ai remis » installe chez le patient une représentation de fragilité mécanique durable pour une correction qui n''a pas eu lieu.',
    'Tullberg T et al. Manipulation does not alter the position of the sacroiliac joint: a roentgen stereophotogrammetric analysis. Spine. 1998. Preece SJ et al. J Man Manip Ther. 2008.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Évaluation manuelle de l''inégalité de longueur des membres inférieurs',
    'Lombaire',
    'Comparaison de la position des malléoles en décubitus dorsal ou en procubitus, éventuellement répétée après flexion des genoux ou après un mouvement dit de correction, à la recherche d''une jambe dite courte.',
    'Historiquement utilisée pour expliquer une lombalgie par un déséquilibre de bassin et pour justifier une talonnette.',
    'À ne pas utiliser pour décider. La mesure manuelle est peu reproductible et surestime largement les différences réelles mesurées en imagerie. Sur le fond, les inégalités inférieures à environ vingt millimètres ne sont pas associées à la lombalgie dans les études de population, et elles concernent une grande partie des sujets sans douleur. Une inégalité importante, d''origine connue et documentée par imagerie, se discute avec le médecin ; une jambe courte trouvée à la main sur une table ne justifie ni un diagnostic ni une compensation.',
    'Grundy PF, Roberts CJ. Does unequal leg length cause back pain? A case-control study. Lancet. 1984. Knutson GA. Anatomic and functional leg-length inequality: a review and recommendation for clinical decision-making. Chiropr Osteopat. 2005.',
    NULL, NULL, NULL, NULL
  )
) AS t(name, category, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
WHERE NOT EXISTS (
  SELECT 1 FROM public.orthopedic_tests existing WHERE existing.name = t.name
);

-- ============================================================================
-- 2. CHAPITRES
-- ============================================================================

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  -- La nouvelle partie s'intercale : « Orienter » et « Intégrer » reculent de
  -- trois rangs. Pas de contrainte d'unicité sur order_index, la mise à jour
  -- directe suffit et reste rejouable (les slugs sont explicites).
  UPDATE public.region_chapters SET order_index = 26 WHERE module_id = v_module AND slug = 'imagerie';
  UPDATE public.region_chapters SET order_index = 27 WHERE module_id = v_module AND slug = 'reorientation';
  UPDATE public.region_chapters SET order_index = 28 WHERE module_id = v_module AND slug = 'cas-cliniques';

  -- --------------------------------------------------------------------------
  -- Chapitre : les tests à abandonner
  -- --------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'tests-a-abandonner',
    'Les tests qu’il faut cesser d’utiliser',
    'Le test des pouces et les autres évaluations de position et de mobilité',
    'Déjouer les pièges', 'examen',
    'Une part importante de ce qui est enseigné en thérapie manuelle repose sur des tests de position et de mobilité dont ni la fiabilité ni la validité ne tiennent à l’examen. Ce chapitre les reprend un par un, explique pourquoi ils échouent, et dit par quoi les remplacer.',
    jsonb_build_array(
      'Expliquer pourquoi le test de flexion debout ne permet pas de conclure',
      'Reconnaître les trois familles de tests à abandonner : position, mobilité palpée, longueur de membre',
      'Remplacer chacun par un outil dont la valeur est établie'
    ),
    jsonb_build_array(
      'La mobilité réelle de la sacro-iliaque est d’environ deux degrés et d’un à deux millimètres : c’est sous le seuil de ce qu’une pulpe de pouce peut détecter à travers les tissus.',
      'Après une manipulation jugée correctrice, la mesure ne retrouve aucun changement de position du sacrum sur l’iliaque. Ce qui change, c’est la douleur.',
      'L’asymétrie des repères pelviens est fréquente chez des sujets sans aucune douleur, et tient surtout à la morphologie osseuse.',
      'Ce qui les remplace existe et est validé : provocation groupée, préférence directionnelle, signe comparable réévalué.'
    ),
    45, 23
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le test des pouces, en détail',
   '<p>Le geste est connu de tous : praticien assis derrière le patient debout, pouces sous les épines iliaques postéro-supérieures, flexion antérieure lente, et l’on note le côté où le pouce monte le premier. Ce côté est déclaré bloqué, et il devient celui qu’on traite.</p><p>Trois obstacles se cumulent, et chacun suffirait.</p><p><strong>L’amplitude à détecter n’existe pas à l’échelle de la main.</strong> Les mesures par stéréophotogrammétrie, avec billes de tantale implantées dans l’os, donnent une rotation sacro-iliaque de l’ordre de deux degrés et une translation d’un à deux millimètres. Le test demande de percevoir une différence entre deux côtés, donc une fraction de cela, à travers la peau, le tissu adipeux et l’aponévrose thoraco-lombaire, pendant que le patient bouge.</p><p><strong>La fiabilité inter-examinateurs est faible.</strong> Deux praticiens qui examinent le même patient ne s’accordent pas beaucoup plus que ne le prédirait le hasard, y compris lorsqu’ils ont été formés au même protocole et calibrés avant l’étude.</p><p><strong>Le point de départ est asymétrique chez tout le monde.</strong> La position des épines iliaques postéro-supérieures varie d’un côté à l’autre chez une grande part des sujets sans douleur, par simple variation de morphologie osseuse. Le test mesure donc de façon reproductible quelque chose de réel, mais ce quelque chose est une forme d’os, pas une dysfonction.</p>',
   'preuve', 0),
  (v_chapter, 'L’expérience qui tranche',
   '<p>Tullberg et ses collaborateurs ont mesuré, par stéréophotogrammétrie, la position du sacrum par rapport à l’iliaque avant et après une manipulation sacro-iliaque. Les praticiens avaient examiné les patients, identifié une dysfonction, manipulé, puis réexaminé et jugé la dysfonction corrigée.</p><p>La mesure n’a retrouvé aucune modification de position. Ce que les praticiens percevaient comme une correction n’en était pas une.</p><p>Ce résultat ne dit pas que la manipulation ne sert à rien : les patients allaient mieux. Il dit que l’explication que nous en donnions était fausse, et que le test qui avait servi à décider avant, puis à vérifier après, ne mesurait pas ce qu’il prétendait mesurer.</p>',
   'cle', 1),
  (v_chapter, 'Les autres tests de la même famille',
   '<p><strong>Le test de flexion assise (Piedallu)</strong> neutralise les membres inférieurs mais se heurte aux mêmes obstacles. Comparer son résultat à celui du test debout, pour localiser le problème, revient à ajouter une mesure peu fiable à une autre : la décision se dégrade au lieu de s’affiner.</p><p><strong>Le test de Gillet</strong>, ou test de la cigogne, ajoute une difficulté propre : le mouvement recherché est noyé dans le déplacement du bassin entier que provoque la mise en appui unipodal.</p><p><strong>La palpation de position</strong> des épines iliaques, des crêtes et de la base sacrée nomme une antériorisation, une postériorisation, une torsion. Elle décrit une asymétrie fréquente chez des gens qui n’ont pas mal.</p><p><strong>L’évaluation manuelle de la longueur des membres inférieurs</strong> est peu reproductible et surestime les différences réelles. Sur le fond, les inégalités inférieures à environ vingt millimètres ne sont pas associées à la lombalgie dans les études de population.</p>',
   'none', 2),
  (v_chapter, 'Et la palpation du segment lombaire fautif',
   '<p>Le problème n’épargne pas le rachis lombaire. Les revues de fiabilité de la palpation rachidienne concluent à un accord faible sur l’identification du segment en cause, et à une correspondance médiocre entre l’hypomobilité perçue et la mobilité réellement mesurée.</p><p>Nuance importante, parce qu’elle sépare deux gestes qu’on confond : la <strong>douleur segmentaire provoquée</strong> à la pression postéro-antérieure est nettement plus reproductible que le <strong>jugement de mobilité</strong>. Chercher où ça fait mal reste utile. Affirmer qu’un segment est bloqué ne l’est pas.</p><p>C’est pour cette raison que la règle de Flynn retient l’hypomobilité comme item d’une règle de décision, avec ses autres items, et non comme un constat autonome.</p>',
   'piege', 3),
  (v_chapter, 'Ce qui les remplace',
   '<p>Le but n’est pas d’examiner moins, c’est d’examiner avec des outils qui tiennent.</p><p><strong>À la place des tests de mobilité sacro-iliaque :</strong> la séquence de Laslett. Écarter d’abord une origine lombaire par les mouvements répétés, puis les tests de provocation, trois positifs sur cinq. C’est le seul ensemble lombo-pelvien validé contre bloc anesthésique.</p><p><strong>À la place de la recherche du segment bloqué :</strong> l’évaluation par mouvements répétés et la préférence directionnelle. Elle est reproductible, elle a une valeur pronostique établie, et elle donne le traitement du jour et l’auto-traitement du soir.</p><p><strong>À la place de la vérification post-technique par palpation :</strong> le signe comparable. On choisit avant la technique le mouvement ou le test qui reproduit la douleur, on le remesure juste après. La réponse est immédiate, elle est vérifiable par le patient lui-même, et elle ne dépend d’aucune finesse de perception.</p>',
   'pratique', 4),
  (v_chapter, 'Pourquoi ces tests survivent malgré tout',
   '<p>Parce qu’ils fonctionnent, du point de vue de celui qui les pratique. On examine, on trouve une asymétrie, on traite, on réexamine, l’asymétrie a changé et le patient va mieux. La boucle se referme et se confirme, plusieurs fois par jour, pendant des années.</p><p>Ce que la boucle ne montre pas : l’asymétrie de départ existait déjà avant la douleur et existe chez le voisin qui n’a pas mal ; la perception de l’après est faite par quelqu’un qui sait ce qu’il vient de faire ; et l’amélioration du patient serait survenue, pour une bonne part, de toute façon. Le chapitre suivant sur les biais de raisonnement détaille ces trois mécanismes.</p><p>Abandonner ces tests ne retire donc presque rien au résultat clinique. Cela retire une explication fausse, ce qui est un gain, parce que cette explication est ensuite transmise au patient.</p>',
   'cle', 5);

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de flexion debout (test des pouces)', 'Le cas d’école du chapitre : amplitude indétectable, fiabilité faible, asymétrie de départ banale.', 0),
    ('Test de flexion assise (Piedallu)', 'Neutraliser les membres inférieurs ne résout pas le problème de fond.', 1),
    ('Test de Gillet (test cinétique, test de la cigogne)', 'Le mouvement recherché est masqué par le déplacement du bassin en appui unipodal.', 2),
    ('Palpation de position des repères pelviens', 'Décrit une morphologie, pas une dysfonction, et ne bouge pas après traitement.', 3),
    ('Évaluation manuelle de l''inégalité de longueur des membres inférieurs', 'Peu reproductible, et sans lien établi avec la lombalgie en dessous de 20 mm.', 4),
    ('Hypomobilité segmentaire lombaire (pression postéro-antérieure)', 'Le contre-exemple utile : la douleur provoquée est plus fiable que le jugement de mobilité.', 5),
    ('Test de distraction', 'Ce qui remplace : provocation validée contre bloc anesthésique.', 6),
    ('Thigh thrust test', 'Ce qui remplace : provocation validée contre bloc anesthésique.', 7),
    ('Phénomène de Centralisation (McKenzie)', 'Ce qui remplace : reproductible, pronostique, et directement traduisible en traitement.', 8)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'L’alternative validée aux tests de position et de mobilité sacro-iliaque.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Cluster de Laslett'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Tullberg T, Blomberg S, Branth B, Johnsson R. Manipulation does not alter the position of the sacroiliac joint: a roentgen stereophotogrammetric analysis. Spine.', 1998, 'etude', 'La référence décisive : la correction perçue n’existe pas à la mesure.', 0),
  (v_chapter, 'Sturesson B, Selvik G, Uden A. Movements of the sacroiliac joints: a roentgen stereophotogrammetric analysis. Spine.', 1989, 'etude', 'L’amplitude réelle de la sacro-iliaque, et donc l’impossibilité de la palper.', 1),
  (v_chapter, 'van der Wurff P, Hagmeijer RH, Meyne W. Clinical tests of the sacroiliac joint: a systematic methodological review. Man Ther.', 2000, 'revue_systematique', 'Revue de la fiabilité et de la validité des tests de mobilité sacro-iliaque.', 2),
  (v_chapter, 'Riddle DL, Freburger JK. Evaluation of the presence of sacroiliac joint region dysfunction using a combination of tests: a multicenter intertester reliability study. Phys Ther.', 2002, 'etude', 'Étude multicentrique de fiabilité, sur des praticiens formés au protocole.', 3),
  (v_chapter, 'Seffinger MA, Najm WI, Mishra SI et al. Reliability of spinal palpation for diagnosis of back and neck pain: a systematic review. Spine.', 2004, 'revue_systematique', 'Le même constat appliqué à la palpation rachidienne.', 4),
  (v_chapter, 'Grundy PF, Roberts CJ. Does unequal leg length cause back pain? A case-control study. Lancet.', 1984, 'etude', 'L’inégalité de longueur et la lombalgie : absence de lien en dessous de 20 mm.', 5);

  -- --------------------------------------------------------------------------
  -- Chapitre : les fausses croyances transmises aux patients
  -- --------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'fausses-croyances',
    'Les fausses croyances qu’on transmet aux patients',
    'Sept phrases courantes, ce qu’elles produisent, et par quoi les remplacer',
    'Déjouer les pièges', 'traitement',
    'Ce qu’un praticien dit en fin de séance reste des années. Ce chapitre reprend les croyances les plus répandues sur le dos, montre ce que la littérature en dit, et donne pour chacune une formulation de remplacement utilisable telle quelle.',
    jsonb_build_array(
      'Identifier les croyances iatrogènes les plus répandues sur la lombalgie',
      'Citer ce que les données établissent sur la posture, le port de charge et le gainage',
      'Remplacer chaque formulation par une phrase exacte et utilisable en consultation'
    ),
    jsonb_build_array(
      'La posture et la courbure lombaire ne sont pas associées de façon constante à la lombalgie : il n’y a pas de bonne posture à imposer.',
      'Apprendre à soulever en pliant les genoux ne prévient pas la lombalgie : les essais de formation au port de charge sont négatifs.',
      'Le gainage et le travail du transverse ne font pas mieux qu’un exercice général bien mené.',
      'Le craquement ne remet rien en place, et son absence ne change pas le résultat du traitement.'
    ),
    50, 24
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Pourquoi ce chapitre existe',
   '<p>L’étude de Darlow a interrogé des lombalgiques sur ce que des soignants leur avaient dit, parfois des années auparavant. Les phrases reviennent mot pour mot, et elles orientent encore le comportement : ce qu’ils osent faire, ce qu’ils évitent, ce qu’ils croient irréversible.</p><p>Une explication fausse ne se contente pas d’être inexacte. Elle devient une consigne de vie, et elle nous survit.</p>',
   'cle', 0),
  (v_chapter, '« Vous avez une vertèbre déplacée, un bassin décalé »',
   '<p><strong>Ce qui est faux.</strong> Aucune mesure ne retrouve de déplacement corrigé après manipulation, et l’asymétrie palpée existe chez des sujets sans douleur. Le chapitre précédent détaille les mesures.</p><p><strong>Ce que ça produit.</strong> Un patient qui se croit mécaniquement de travers, qui revient pour être « remis en place » à chaque épisode, qui n’ose plus certains mouvements de peur de se redéplacer, et dont la récupération dépend désormais de vous.</p><p><strong>À la place.</strong> « Ce segment est douloureux et il bouge moins bien en ce moment. Je vais lui redonner de la mobilité et calmer la douleur, et ensuite c’est le mouvement qui entretiendra le résultat. »</p>',
   'none', 1),
  (v_chapter, '« C’est votre posture, tenez-vous droit »',
   '<p><strong>Ce que disent les données.</strong> Les revues qui ont cherché une association entre courbure lombaire, posture assise ou debout et lombalgie ne trouvent pas de lien constant. Les lombalgiques ne se tiennent pas d’une façon reconnaissable, et corriger une posture ne prévient pas la douleur. Ce qui compte davantage est la <strong>variation</strong> : c’est l’immobilité prolongée dans n’importe quelle position qui pose problème, pas la position elle-même.</p><p><strong>Ce que ça produit.</strong> Une vigilance posturale permanente, épuisante, qui augmente la tension musculaire et la focalisation sur le dos, et un patient persuadé qu’il s’abîme chaque fois qu’il se relâche.</p><p><strong>À la place.</strong> « Il n’y a pas de bonne position, il y a des positions qu’on garde trop longtemps. La meilleure posture est la prochaine : changez souvent, levez-vous régulièrement. »</p>',
   'piege', 2),
  (v_chapter, '« Il faut plier les genoux, ne jamais arrondir le dos »',
   '<p><strong>Ce que disent les données.</strong> Les essais et revues sur la formation au port de charge, y compris en milieu professionnel et sur de grands effectifs, ne montrent pas de réduction de l’incidence ou de la récidive de la lombalgie. Et les travaux comparant la flexion lombaire pendant le port de charge chez des sujets avec et sans douleur ne retrouvent pas de relation constante : arrondir le dos n’est pas, en soi, la cause.</p><p><strong>Ce que ça produit.</strong> L’évitement de la flexion, qui est un mouvement quotidien incontournable, la perte de tolérance du rachis à ce mouvement, et une anxiété à chaque fois qu’il faut ramasser quelque chose.</p><p><strong>À la place.</strong> « Votre dos sait plier. Ce qui compte n’est pas la technique du geste, c’est la charge et la répétition par rapport à ce que vous avez l’habitude de faire. On va augmenter progressivement ce que vous tolérez. »</p>',
   'preuve', 3),
  (v_chapter, '« Il faut muscler la sangle abdominale, gainer le transverse »',
   '<p><strong>Ce que disent les données.</strong> Les exercices de stabilisation ne font pas mieux qu’un exercice général bien conduit. Le retard d’activation du transverse, longtemps présenté comme causal, n’a pas résisté aux travaux ultérieurs. Le renforcement reste utile, mais pour la raison ordinaire qui rend l’exercice utile, pas parce qu’il corrigerait un verrou.</p><p><strong>Ce que ça produit.</strong> Un patient qui contracte son ventre en permanence, ce qui augmente la raideur et la compression, et qui croit que son dos tient grâce à un muscle qu’il doit surveiller.</p><p><strong>À la place.</strong> « On va renforcer, oui, mais parce qu’un dos plus endurant supporte mieux votre journée, pas parce qu’il y a un muscle défaillant à réparer. »</p>',
   'none', 4),
  (v_chapter, '« Avec l’arthrose et la hernie que vous avez… »',
   '<p><strong>Ce que disent les données.</strong> Chez des sujets sans aucune douleur, la dégénérescence discale concerne une majorité des quarantenaires et les protrusions environ un tiers. L’arthrose facettaire est quasi universelle après 60 ans. Ces images sont des marqueurs d’âge, pas des explications de symptôme.</p><p><strong>Ce que ça produit.</strong> Une perception de gravité et d’irréversibilité, une demande d’imagerie et de chirurgie plus forte, et un évitement durable. Les travaux sur le vocabulaire des comptes rendus montrent que l’effet touche aussi le soignant qui les lit.</p><p><strong>À la place.</strong> « Ces images sont présentes chez la plupart des gens de votre âge qui n’ont jamais eu mal. C’est comme les rides : le signe que le dos a vécu, pas qu’il est abîmé. »</p>',
   'none', 5),
  (v_chapter, '« Reposez-vous, évitez de porter, mettez une ceinture »',
   '<p><strong>Ce que disent les données.</strong> Le repos au lit est déconseillé par toutes les recommandations et ralentit la récupération. Le port prolongé d’une ceinture lombaire à visée thérapeutique n’est pas recommandé. L’évitement d’activité est l’un des meilleurs prédicteurs d’incapacité à un an.</p><p><strong>À la place.</strong> « Restez actif, y compris au travail si c’est possible. Ce sera inconfortable les premiers jours, ce n’est pas dangereux, et c’est ce qui accélère la récupération. Une douleur modérée qui revient à son niveau habituel en moins d’une heure est acceptable. »</p>',
   'none', 6),
  (v_chapter, '« Ça a bien craqué, c’est remis »',
   '<p><strong>Ce que disent les données.</strong> Le bruit de cavitation ne traduit pas un repositionnement et ne prédit pas le résultat clinique : les essais montrent des améliorations comparables avec ou sans craquement audible.</p><p><strong>Ce que ça produit.</strong> Un patient qui juge la séance à son bruit, qui se fait craquer le dos lui-même plusieurs fois par jour, et qui revient parce que « ça n’a pas craqué la dernière fois ».</p><p><strong>À la place.</strong> Ne pas commenter le bruit. Commenter ce qui a changé : « regardez, ce mouvement qui vous faisait mal tout à l’heure. » Le signe comparable est un bien meilleur argument, et il est vrai.</p>',
   'piege', 7),
  (v_chapter, 'La règle générale',
   '<p>Avant de prononcer une explication, se poser deux questions. Est-ce que je peux la soutenir avec autre chose que ma formation initiale ? Et si le patient la répète dans dix ans à un autre soignant, est-ce qu’elle l’aura aidé ou limité ?</p><p>Une explication qui réduit la menace, qui rend le mouvement possible et qui rend le patient autonome vaut mieux qu’une explication précise mais fausse. Et quand on ne sait pas, le dire est une option : « je ne peux pas vous dire quel tissu exactement, et ça ne change pas ce qu’on va faire » est une phrase honnête qui ne fait aucun dégât.</p>',
   'cle', 8);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Darlow B, Dowell A, Baxter GD et al. The enduring impact of what clinicians say to people with low back pain. Ann Fam Med.', 2013, 'etude', 'Les phrases des soignants, retrouvées mot pour mot des années après.', 0),
  (v_chapter, 'Swain CTV, Pan F, Owen PJ et al. No consensus on causality of spine postures or physical exposure and low back pain: a systematic review of systematic reviews. J Biomech.', 2020, 'revue_systematique', 'Revue de revues : pas de lien constant entre posture et lombalgie.', 1),
  (v_chapter, 'Verbeek JH, Martimo KP, Karppinen J et al. Manual material handling advice and assistive devices for preventing and treating back pain in workers. Cochrane Database Syst Rev.', 2011, 'revue_systematique', 'La formation au port de charge ne prévient pas la lombalgie.', 2),
  (v_chapter, 'Saraceni N, Kent P, Ng L et al. To flex or not to flex? Is there a relationship between lumbar spine flexion during lifting and low back pain? A systematic review with meta-analysis. J Orthop Sports Phys Ther.', 2020, 'meta_analyse', 'Arrondir le dos en soulevant n’est pas associé de façon constante à la douleur.', 3),
  (v_chapter, 'Lederman E. The myth of core stability. J Bodyw Mov Ther.', 2010, 'revue_systematique', 'La déconstruction argumentée du modèle de stabilité du tronc.', 4),
  (v_chapter, 'Smith BE, Littlewood C, May S. An update of stabilisation exercises for low back pain: a systematic review with meta-analysis. BMC Musculoskelet Disord.', 2014, 'meta_analyse', 'Les exercices de stabilisation ne battent pas un autre exercice actif.', 5),
  (v_chapter, 'Flynn TW, Fritz JM, Wainner RS, Whitman JM. The audible pop is not necessary for successful spinal high-velocity thrust manipulation in individuals with low back pain. Arch Phys Med Rehabil.', 2003, 'essai_randomise', 'Le craquement ne conditionne pas le résultat.', 6),
  (v_chapter, 'Brinjikji W, Luetmer PH, Comstock B et al. Systematic literature review of imaging features of spinal degeneration in asymptomatic populations. AJNR.', 2015, 'revue_systematique', 'Les chiffres à opposer à « avec l’arthrose que vous avez ».', 7);

  -- --------------------------------------------------------------------------
  -- Chapitre : les biais de raisonnement du praticien
  -- --------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'biais-du-praticien',
    'Pourquoi tout semble marcher',
    'Les biais de raisonnement qui font survivre les pratiques inutiles',
    'Déjouer les pièges', 'raisonnement',
    'Un praticien voit ses patients aller mieux, quelle que soit sa méthode. Ce chapitre explique les mécanismes qui produisent cette impression, et donne les garde-fous concrets qui permettent de savoir si un traitement a réellement servi.',
    jsonb_build_array(
      'Expliquer la régression vers la moyenne et son effet sur l’expérience clinique',
      'Reconnaître le biais de confirmation dans sa propre palpation',
      'Mettre en place des garde-fous : signe comparable, critère d’échec, date de réévaluation'
    ),
    jsonb_build_array(
      'Le patient consulte au pic de sa douleur : l’amélioration qui suit serait en grande partie survenue de toute façon.',
      'Ce que l’on palpe après une technique est perçu par quelqu’un qui sait ce qu’il vient de faire.',
      'Un patient qui va mieux ne prouve ni le diagnostic, ni le mécanisme invoqué.',
      'Trois garde-fous suffisent : un signe comparable choisi avant, un critère d’échec fixé d’avance, une date de réévaluation annoncée.'
    ),
    40, 25
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'La régression vers la moyenne',
   '<p>Un patient ne consulte pas au hasard : il consulte quand ça va mal, souvent au pic. Or une douleur fluctue. Mesurée à son maximum, elle a mécaniquement plus de chances de baisser que de monter, indépendamment de tout traitement. Ajoutez l’histoire naturelle de la lombalgie, franchement favorable sur les premières semaines, et une part importante de l’amélioration observée est acquise avant d’avoir posé les mains.</p><p>Ce mécanisme ne fait aucune distinction entre les méthodes. Il favorise exactement autant une technique fondée sur les preuves et une technique inutile. C’est pour cela que l’expérience clinique, seule, ne peut pas départager deux traitements.</p>',
   'cle', 0),
  (v_chapter, 'Le biais de confirmation, et la palpation',
   '<p>La palpation est particulièrement exposée, parce qu’elle produit une donnée subjective au moment même où l’examinateur a une attente. On palpe après avoir formulé une hypothèse, après avoir vu le patient se pencher, après avoir traité. On trouve alors ce qui est cohérent avec ce qu’on attend, sans aucune mauvaise foi : c’est le fonctionnement normal de la perception.</p><p>Les études de fiabilité inter-examinateurs mesurent exactement cet écart, et c’est pour cela qu’elles sont plus sévères que notre expérience quotidienne : elles retirent l’attente partagée.</p><p>Test simple à faire sur soi : demander à un collègue d’examiner un patient avant vous, chacun notant son résultat sans le dire. La fréquence des désaccords surprend.</p>',
   'piege', 1),
  (v_chapter, 'Confondre l’effet et le mécanisme',
   '<p>L’erreur la plus courante du raisonnement clinique : le patient va mieux après la technique, donc l’explication que j’ai donnée de son problème était juste. Elle ne l’est pas nécessairement. La manipulation soulage, c’est documenté ; le repositionnement vertébral qu’on invoquait pour l’expliquer n’existe pas, c’est documenté aussi. Les deux faits coexistent sans difficulté.</p><p>La conséquence pratique est importante : un bon résultat ne valide pas le diagnostic. Il valide qu’on a fait quelque chose d’utile, ce qui est déjà bien, mais n’autorise pas à confirmer l’hypothèse tissulaire devant le patient.</p>',
   'cle', 2),
  (v_chapter, 'La spécificité illusoire',
   '<p>Nous choisissons un étage, une direction, un paramètre, avec une précision que ni la palpation ni l’imagerie ne soutiennent. Les travaux sur la spécificité segmentaire de la manipulation montrent d’ailleurs que les effets ne se limitent pas au segment visé.</p><p>Cela n’invalide pas la technique, cela recadre ce qu’on peut en dire. Choisir un étage sur la douleur provoquée reste raisonnable. Affirmer qu’on a agi sur L4-L5 et pas sur L3-L4 ne l’est pas, et ce niveau de précision n’a jamais été montré nécessaire au résultat.</p>',
   'none', 3),
  (v_chapter, 'Les trois garde-fous',
   '<p><strong>Le signe comparable.</strong> Avant toute technique, choisir le mouvement ou le test qui reproduit la douleur, et le noter. Le remesurer juste après. C’est le seul moyen de savoir, dans la minute, si ce qu’on vient de faire a servi, et c’est le patient qui constate, pas vous.</p><p><strong>Le critère d’échec, fixé d’avance.</strong> Décider dès la première séance ce qui constituera un échec : quel niveau d’amélioration, à quelle échéance. Sans ce critère posé avant, on trouve toujours une raison de continuer une séance de plus.</p><p><strong>La date de réévaluation, annoncée au patient.</strong> Elle transforme la réorientation en étape prévue plutôt qu’en aveu, et elle protège des séries de séances qui se prolongent par habitude.</p>',
   'pratique', 4),
  (v_chapter, 'Ce que ce chapitre ne dit pas',
   '<p>Il ne dit pas que la thérapie manuelle est un placebo, ni que l’expérience clinique ne vaut rien. L’effet de la manipulation et des mobilisations est réel et documenté, du même ordre que celui des autres traitements recommandés. L’expérience clinique reste irremplaçable pour conduire un interrogatoire, reconnaître un tableau inhabituel, doser, et faire alliance avec un patient.</p><p>Ce qu’elle ne peut pas faire, c’est départager deux traitements ni valider un mécanisme. C’est une limite de méthode, pas un jugement sur la compétence.</p>',
   'none', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Whitney SN, Vogel HJ. Regression to the mean and clinical decision making, et travaux apparentés sur l’interprétation de l’évolution spontanée en pratique clinique.', 2010, 'etude', 'Le mécanisme statistique qui fait paraître efficace n’importe quelle intervention.', 0),
  (v_chapter, 'Hartman SE. Why do ineffective treatments seem helpful? A brief review. Chiropr Osteopat.', 2009, 'revue_systematique', 'Synthèse courte et directe des mécanismes traités dans ce chapitre.', 1),
  (v_chapter, 'Bialosky JE, Beneciuk JM, Bishop MD et al. Unraveling the mechanisms of manual therapy: modeling an approach. J Orthop Sports Phys Ther.', 2018, 'revue_systematique', 'Ce que l’on sait des mécanismes, et pourquoi l’effet n’autorise pas à les déduire.', 2),
  (v_chapter, 'Chiradejnant A, Maher CG, Latimer J, Stepkovitch N. Efficacy of therapist-selected versus randomly selected mobilisation techniques for the treatment of low back pain. Aust J Physiother.', 2003, 'essai_randomise', 'Technique choisie par le praticien contre technique tirée au sort : la spécificité du choix pèse moins qu’on ne le croit.', 3),
  (v_chapter, 'Seffinger MA, Najm WI, Mishra SI et al. Reliability of spinal palpation for diagnosis of back and neck pain: a systematic review. Spine.', 2004, 'revue_systematique', 'La mesure de l’écart entre deux examinateurs, une fois l’attente partagée retirée.', 4);

END $do$;
