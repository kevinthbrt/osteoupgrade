-- Corrections du parcours lombaire issues de l'audit du 28 novembre 2026
-- (docs/AUDIT_PARCOURS_LOMBAIRE.md, section A).
--
-- Trois incohérences avec l'axe du parcours lui-même :
--   * « Trois catégories » annonçait encore l'ancienne architecture, où les
--     tableaux tissulaires servaient à choisir le traitement ;
--   * le cas 1 concluait « probablement discogénique », et les cas cliniques
--     n'utilisaient pas la grille en quatre lignes qu'ils devaient intégrer ;
--   * le syndrome de la charnière thoraco-lombaire était présenté comme
--     établi, alors que le même chapitre exige du psoas qu'il soit démontré.
--
-- Des erreurs de fait :
--   * l'histoire naturelle annonçait un tiers de douleurs résiduelles à un an,
--     quand la revue citée (Itz 2013) en rapporte 65 % ;
--   * une référence du chapitre discogénique n'était pas identifiable, et la
--     phrase qui s'en réclamait lui prêtait un effet sur la peur du mouvement
--     que l'essai retenu à sa place (O'Keeffe 2022) ne retrouve pas ;
--   * la phrase proposée au patient dans ce même chapitre nommait le disque,
--     ce que la section précédente démontre impossible.
--
-- Et des précisions : la cruralgie et le psoas, le statut de la règle des
-- trois plans, la date de la NG59.
--
-- Rejouable : chaque section est réécrite en entier, chaque référence est
-- supprimée puis réinsérée.

DO $do$
DECLARE
  v_module UUID;
  v_ch UUID;
  v_n INTEGER;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  ---------------------------------------------------------------------------
  -- A1. « Trois catégories » : annoncer les quatre décisions.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'classification';
  UPDATE public.region_chapter_sections
     SET body_html = $h$<p>Le modèle en trois catégories est un outil de sécurité, pas une théorie de la douleur. Il ne guide pas le choix de la technique, il ne dit rien du pronostic, et il agrège dans sa troisième catégorie des tableaux cliniques très différents : le patient qui se centralise en extension et celui qui ne tolère que la flexion n’ont pas le même problème.</p><p>C’est pourquoi le parcours pose ensuite trois questions, une fois le tri fait : quel mécanisme de douleur domine, quel profil de réponse au traitement, et quel risque de chronicisation. Ce sont elles qui décident du traitement. Les tableaux cliniques (radiculopathie, sténose, ceinture pelvienne, discogénique, facettaire, instabilité) viennent après, dans un répertoire : savoir les reconnaître reste indispensable, mais ils affinent une décision déjà prise, ils ne la remplacent pas.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Les limites du modèle';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A1 : section « Les limites du modèle » introuvable'; END IF;

  -- A9. La NG59 enseignée est celle de juillet 2026.
  UPDATE public.region_chapter_references
     SET citation = 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s: assessment and management. NICE guideline NG59, publiée en 2016, mise à jour en 2020 et le 29 juillet 2026.',
         year = 2026
   WHERE chapter_id = v_ch AND citation LIKE 'National Institute for Health and Care Excellence. Low back pain and sciatica%';

  ---------------------------------------------------------------------------
  -- A5. Histoire naturelle : les chiffres de la revue citée.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'epidemiologie';
  UPDATE public.region_chapter_sections
     SET body_html = $h$<p>L’évolution est souvent favorable sur les premières semaines : l’essentiel de la réduction de douleur et d’incapacité se produit dans le premier mois, puis la courbe s’aplatit. Au delà de trois mois, l’amélioration devient lente.</p><p>Elle est pourtant moins favorable qu’on ne le dit souvent. Dans la revue d’Itz, qui regroupe des cohortes de soins primaires, environ un tiers des patients ont récupéré à trois mois, mais près des deux tiers déclarent encore une douleur un an après le début de l’épisode. Les récidives sont fréquentes : dans la cohorte de da Silva, 69 % des patients rétablis connaissent un nouvel épisode dans l’année, et 40 % un épisode qui limite leurs activités. Les chiffres varient beaucoup d’une étude à l’autre selon la définition retenue de la guérison et de la récidive.</p><p>Ces chiffres ne contredisent pas celui de la HAS, pour qui la lombalgie commune évolue favorablement en moins de quatre à six semaines dans 90 % des cas. S’améliorer nettement n’est pas guérir complètement : beaucoup de patients gardent une douleur faible et fluctuante, qui ne les empêche plus de vivre.</p><p>Deux erreurs symétriques en découlent. Attribuer l’amélioration du premier mois à sa technique, alors que l’histoire naturelle y suffisait souvent. Et à l’inverse, banaliser une douleur qui dure au delà de six à huit semaines en disant qu’elle passera, alors que c’est précisément le moment où la trajectoire se joue.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Ce que devient un épisode';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A5 : section « Ce que devient un épisode » introuvable'; END IF;

  UPDATE public.region_chapter_references
     SET takeaway = 'Histoire naturelle en soins primaires : un tiers des patients récupère dans les trois premiers mois, 65 % déclarent encore une douleur à un an.',
         url = 'https://pubmed.ncbi.nlm.nih.gov/22641374/'
   WHERE chapter_id = v_ch AND citation LIKE 'Itz CJ%';

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch AND citation LIKE 'da Silva T%';
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'da Silva T, Mills K, Brown BT et al. Recurrence of low back pain is common: a prospective inception cohort study. J Physiother.',
   2019, 'etude',
   'Sur 250 patients rétablis, 69 % font un nouvel épisode dans l’année et 40 % un épisode qui limite les activités.',
   'https://pubmed.ncbi.nlm.nih.gov/31208917/', 4);

  ---------------------------------------------------------------------------
  -- A7 et A8. Radiculopathie.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'radiculopathie';
  UPDATE public.region_chapter_sections
     SET body_html = $h$<p>Le diagnostic repose sur l’accord de trois éléments. La topographie : trajet systématisé, sous le genou, avec paresthésies dans le même territoire. La neurodynamique : Lasègue ou Slump reproduisant la douleur habituelle, modifié par la sensibilisation à distance ; Leri pour les racines hautes. Le déficit : moteur, sensitif ou réflexe correspondant à la même racine.</p><p>Deux plans sur trois rendent le diagnostic probable, trois sur trois le rendent solide, et un seul plan positif doit faire chercher autre chose. C’est une règle de raisonnement, pas un score validé : elle traduit le fait que chaque signe pris seul est peu informatif, alors que leur concordance sur une même racine l’est beaucoup plus.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Faire converger les trois plans';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A8 : section « Faire converger les trois plans » introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>L5</strong>, la plus fréquente, souvent par hernie L4-L5 : trajet fessier, face latérale de cuisse et de jambe, dos du pied jusqu’à l’hallux ; faiblesse de l’extension de l’hallux et du moyen fessier ; pas de réflexe propre.</p><p><strong>S1</strong>, par hernie L5-S1 : trajet fessier postérieur, face postérieure de cuisse et de jambe, talon et bord latéral du pied ; faiblesse de la flexion plantaire, difficulté à se hisser sur la pointe ; réflexe achilléen diminué ou aboli.</p><p><strong>L4</strong> : face antéro-interne de cuisse et de jambe ; faiblesse du tibial antérieur, marche sur les talons difficile ; réflexe rotulien diminué.</p><p><strong>L2 et L3</strong>, cruralgie : face antérieure de cuisse, Leri positif, faiblesse du psoas ou du quadriceps. Chez un sujet de plus de 50 ans, une cruralgie isolée impose de penser aussi à une neuropathie diabétique, à un hématome ou un abcès du psoas, et aux causes rétropéritonéales.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Situer le niveau';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A7 : section « Situer le niveau » introuvable'; END IF;

  ---------------------------------------------------------------------------
  -- A6 et A11. Discogénique : la bonne source, et ne pas nommer le disque.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'discogenique';
  UPDATE public.region_chapter_sections
     SET body_html = $h$<p>Les mots d’un compte rendu ou d’un praticien changent la façon dont le patient voit son dos. Dans l’essai d’O’Keeffe, les mêmes participants jugent l’imagerie, la chirurgie et un second avis plus nécessaires, et s’attendent à guérir moins bien, quand on leur parle de « hernie discale », de « dégénérescence » ou d’« arthrose » que quand on leur parle d’« épisode de mal de dos » ou de « lombalgie non spécifique ». L’effet est le plus net chez ceux qui ont déjà mal et qui ont déjà consulté, c’est à dire chez vos patients.</p><p>Exemple utilisable : « votre dos est sensibilisé et il réagit à la flexion prolongée ; ce sont des tissus qui se réparent bien et qui supportent très bien le mouvement, à condition de leur donner le bon sens au bon moment. Voilà ce qu’on va faire. » La phrase ne désigne aucun tissu, ce que l’examen ne permet pas, et elle dit ce qui compte pour le patient : ce qu’il ressent, ce qui va se passer, ce qu’il peut faire.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Les mots employés devant le patient';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A6 : section « Les mots employés devant le patient » introuvable'; END IF;

  DELETE FROM public.region_chapter_references
   WHERE chapter_id = v_ch AND (citation LIKE 'Barsky Reese%' OR citation LIKE 'O’Keeffe M%');
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'O’Keeffe M, Ferreira GE, Harris IA et al. Effect of diagnostic labelling on management intentions for non-specific low back pain: a randomized scenario-based experiment. Eur J Pain.',
   2022, 'essai_randomise',
   '« Hernie discale », « dégénérescence » et « arthrose » font juger l’imagerie et la chirurgie plus nécessaires et abaissent l’attente de guérison, par rapport à « épisode de mal de dos » ou « lombalgie non spécifique ».',
   'https://pubmed.ncbi.nlm.nih.gov/35616226/', 2);

  ---------------------------------------------------------------------------
  -- A4. Le syndrome de la charnière thoraco-lombaire : une hypothèse à tester.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'voisinage';
  UPDATE public.region_chapter_sections
     SET callout = 'none',
         body_html = $h$<p>Décrit par Robert Maigne. Selon ce modèle, une souffrance du segment T12-L1 serait ressentie beaucoup plus bas, par l’intermédiaire des branches postérieures des nerfs rachidiens : crête iliaque, fesse haute, parfois pli de l’aine ou région trochantérienne. L’anatomie de ces branches, qui croisent la crête iliaque, rend le trajet plausible.</p><p><strong>Ce qui est décrit.</strong> Une douleur de crête iliaque ou de fesse haute, unilatérale, avec un examen lombaire bas pauvre et une absence de réponse au traitement de L4-L5 et L5-S1. À l’examen, trois signes sont recherchés : la douleur à la pression des articulaires postérieures T12-L1, un point douloureux sur la crête iliaque, et un palper-rouler positif retrouvant une cellulalgie du même côté.</p><p><strong>Ce qui n’est pas établi.</strong> Le syndrome repose sur des descriptions cliniques et n’a pas été validé contre un critère de référence. La fiabilité du palper-rouler et de la pression segmentaire a été très peu étudiée, et une douleur provoquée en T12-L1 ne prouve pas que ce segment produit la douleur de la fesse. C’est la même exigence que pour le psoas, plus loin dans ce chapitre : un examen qui ne peut pas désigner un tissu ne permet pas de l’annoncer au patient.</p><p><strong>L’usage défendable.</strong> Une hypothèse à tester, pas un diagnostic à annoncer. Chez un patient dont la douleur de crête iliaque résiste au traitement de l’étage lombaire bas, un traitement d’épreuve de la charnière thoraco-lombaire est raisonnable, à une condition : choisir avant la technique un signe comparable (le mouvement douloureux, la pression du point de crête) et le remesurer juste après. S’il ne change pas en deux ou trois séances, l’hypothèse est abandonnée. Penser aussi aux nerfs clunéaux, présentés juste après, qui donnent un tableau très proche.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Le syndrome de la charnière thoraco-lombaire';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A4 : section « Le syndrome de la charnière thoraco-lombaire » introuvable'; END IF;

  ---------------------------------------------------------------------------
  -- A2, A3 et A4. Les cas cliniques raisonnent avec la grille en quatre lignes.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'cas-cliniques';

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Homme de 34 ans, douleur lombaire basse en barre depuis 4 jours, apparue en portant un carton en flexion-rotation. Pas d’irradiation sous la fesse. Pire assis et le matin, mieux en marchant. Aucun antécédent, aucun signe général. Travaille, n’est pas arrêté, dit « ça va passer comme la dernière fois ».</p><p><strong>Raisonnement.</strong> Catégorie 3, lombalgie non spécifique. Inutile de chercher le tissu en cause : la décision se jouera sur le comportement de la douleur au mouvement. Risque psychosocial faible, attente de guérison bonne. Le tri de sécurité est négatif.</p><p><strong>Examen.</strong> Flexion limitée et douloureuse, extension libre. Mouvements répétés en extension : centralisation nette. Lasègue négatif. Neuro normal. Segment L4-L5 douloureux et hypomobile. Règle de Flynn : 5 items sur 5.</p><p><strong>Les quatre lignes.</strong> Relève de moi : oui, tri négatif. Mécanisme : nociceptif dominant, douleur proportionnée et modifiable, centralisation en extension. Profil : modulation des symptômes. Risque : faible.</p><p><strong>Décision.</strong> Manipulation lombaire, réévaluation immédiate du signe comparable, press-up dix répétitions toutes les deux heures, aménagement de la position assise, poursuite du travail. Deux séances prévues, point à trois semaines.</p><p><strong>Erreur classique.</strong> Multiplier les séances sur un patient dont le pronostic spontané est excellent, et installer l’idée qu’il a « le dos fragile ».</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 1 : le lumbago du déménagement';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A2 : cas 1 introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Femme de 41 ans, lombalgie depuis 3 semaines puis douleur descendant à la face postérieure de cuisse, de jambe, jusqu’au bord latéral du pied depuis 10 jours. Fourmillements du même territoire. Pire assise et en toussant. Dort mal. Inquiète : sa mère a été opérée du dos.</p><p><strong>Raisonnement.</strong> Catégorie 2, radiculalgie probablement S1. Le tri de sécurité doit comporter explicitement les questions de queue de cheval.</p><p><strong>Examen.</strong> Queue de cheval : négatif. Lasègue positif à 45 degrés reproduisant la douleur habituelle, modifié par la dorsiflexion. Lasègue croisé négatif. Slump positif. Flexion plantaire : 8 relevés unipodaux contre 20 à gauche. Réflexe achilléen diminué.</p><p><strong>Les quatre lignes.</strong> Relève de moi : oui, sous surveillance, dépistage de queue de cheval négatif et consigne écrite donnée. Mécanisme : composante neuropathique probable, topographie S1 plausible avec signes sensitifs et déficit dans le même territoire. Profil : modulation des symptômes, avec un dosage prudent. Risque : moyen, à confirmer au STarT Back (inquiétude, sommeil perturbé, antécédent familial de chirurgie).</p><p><strong>Décision.</strong> Radiculopathie S1 avec déficit modéré. Pas d’imagerie à ce stade. Traitement : neuromobilisation en sliders, gestion de la charge et de la position assise, mobilisations, éducation sur l’histoire naturelle et la régression spontanée. Consigne écrite de queue de cheval. Réévaluation motrice à chaque séance, point à six semaines.</p><p><strong>Erreur classique.</strong> Passer aux tensioners trop tôt, et omettre la consigne écrite de queue de cheval.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 2 : la sciatique qui inquiète';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 : cas 2 introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Homme de 71 ans, lourdeurs et brûlures des deux cuisses et mollets à la marche depuis un an, apparaissant après 200 à 400 mètres selon les jours, obligeant à s’asseoir. Va mieux penché sur son caddie. Fait du vélo d’appartement sans problème. Ancien fumeur, hypertendu.</p><p><strong>Raisonnement.</strong> Claudication : neurogène ou vasculaire. Le soulagement par la flexion, la tolérance au vélo et la variabilité du périmètre orientent vers la sténose. Le terrain impose d’examiner les pouls.</p><p><strong>Examen.</strong> Pouls périphériques présents et symétriques. Extension lombaire douloureuse et reproduisant les symptômes, flexion soulageante. Rotation interne de hanche conservée. Neuro sans déficit franc. Romberg modifié perturbé.</p><p><strong>Les quatre lignes.</strong> Relève de moi : oui, pouls présents, pas de déficit, aucun signe d’alerte. Mécanisme : claudication neurogène, c’est à dire une composante neuropathique qui n’apparaît qu’à l’effort, sans déficit au repos. Profil : optimisation fonctionnelle, la limite étant la distance de marche et non la douleur au repos. Risque : lombalgie chronique au sens de la HAS, risque à mesurer au STarT Back.</p><p><strong>Décision.</strong> Sténose lombaire dégénérative. Programme en flexion, marche par intervalles sous le seuil, renforcement, mobilisations en ouverture, travail de l’équilibre. Point à huit semaines, avis chirurgical discuté si le périmètre ne progresse pas.</p><p><strong>Erreur classique.</strong> Ne pas prendre les pouls, et manquer une artériopathie associée chez un ancien fumeur hypertendu.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 3 : les jambes lourdes au supermarché';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 : cas 3 introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Femme de 27 ans, douleur fessière profonde, tantôt à droite tantôt à gauche, depuis 14 mois. Réveils en seconde partie de nuit, se lève et marche pour se soulager. Raideur matinale d’environ une heure. Va mieux en bougeant, moins bien au repos. Talalgie droite depuis six mois, mise sur le compte de la course à pied.</p><p><strong>Raisonnement.</strong> Le rythme est inflammatoire, pas mécanique. La bascule d’un côté à l’autre et l’enthésopathie associée orientent vers une spondyloarthrite axiale.</p><p><strong>Examen.</strong> Tests de provocation sacro-iliaque : trois positifs sur cinq. Mais quatre critères ASAS sur cinq sont réunis.</p><p><strong>Les quatre lignes.</strong> Relève de moi : pas en première intention. Le rythme inflammatoire et les quatre critères ASAS imposent un avis rhumatologique avant de classer cette douleur comme mécanique. Les trois autres lignes attendent cet avis ; l’exercice, lui, peut commencer sans attendre.</p><p><strong>Décision.</strong> Les tests positifs ne changent rien : c’est le rythme qui décide. Courrier rhumatologique argumenté, en nommant les quatre critères et la talalgie. Poursuite d’un travail actif en parallèle, l’exercice étant recommandé dans la spondyloarthrite.</p><p><strong>Erreur classique.</strong> Traiter une « sacro-iliaque bloquée » pendant des mois parce que les tests de provocation sont positifs, et retarder un diagnostic de plusieurs années.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 4 : la fessalgie de la jeune femme';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 : cas 4 introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Homme de 52 ans, douleur de la crête iliaque droite et de la fesse haute depuis huit mois. Trois praticiens avant vous, traitements portés sur L5-S1 et sur la sacro-iliaque, amélioration transitoire à chaque fois. Pas d’irradiation sous la fesse. Pas de signe général.</p><p><strong>Raisonnement.</strong> Une douleur basse avec un examen lombaire bas pauvre, et qui résiste au traitement de l’étage évident, invite à élargir les hypothèses : charnière thoraco-lombaire, nerfs clunéaux, hanche. Ce sont des hypothèses à tester, pas des diagnostics : aucune n’a de test validé.</p><p><strong>Examen.</strong> Palper-rouler franchement positif et asymétrique à droite. Point douloureux exquis sur la crête iliaque droite, à 7 cm de la ligne médiane, reproduisant la douleur habituelle. Pression des articulaires T12-L1 douloureuse à droite. Tests sacro-iliaques : un seul positif sur cinq. Hanche : amplitudes conservées, FADIR négatif.</p><p><strong>Les quatre lignes.</strong> Relève de moi : oui, tri négatif. Mécanisme : nociceptif probable, douleur localisée et reproduite à la pression ; huit mois d’évolution imposent de vérifier l’absence de critères nociplastiques. Profil : modulation des symptômes. Risque : à mesurer, probablement moyen à élevé après trois prises en charge sans résultat durable.</p><p><strong>Décision.</strong> Un traitement d’épreuve, annoncé comme tel au patient. Signe comparable choisi avant : la pression du point de crête iliaque et le mouvement qui reproduit la douleur. Mobilisation de la charnière thoraco-lombaire, puis remesure immédiate. Si le signe change franchement et que l’effet tient d’une séance à l’autre, on poursuit en y ajoutant de l’exercice. S’il ne change pas en deux ou trois séances, l’hypothèse est abandonnée, et l’on ne cherche pas une quatrième structure à traiter passivement : on passe à un programme actif et on réévalue le risque.</p><p><strong>Erreur classique.</strong> Il y en a deux, symétriques. Continuer à traiter l’étage où le patient montre sa douleur. Et remplacer une explication non démontrée par une autre, en annonçant « c’est votre charnière » au moment où l’on devient le quatrième praticien.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 5 : le patient résistant';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A4 : cas 5 introuvable'; END IF;

  UPDATE public.region_chapter_sections
     SET body_html = $h$<p><strong>Anamnèse.</strong> Homme de 68 ans, lombalgie depuis six semaines, d’aggravation progressive, sans facteur déclenchant. Aucune position ne soulage, y compris allongé. Réveils nocturnes avec impossibilité de se rendormir. A perdu du poids sans le chercher. Tabagique. Antécédent de cancer de la prostate traité il y a quatre ans, considéré comme guéri.</p><p><strong>Raisonnement.</strong> Deux éléments à forte valeur : l’antécédent de cancer et l’absence totale de facteur soulageant. L’amaigrissement et la douleur nocturne non positionnelle complètent le faisceau.</p><p><strong>Examen.</strong> Mobilité lombaire peu limitée, douleur mal reproduite par le mouvement, examen neurologique normal, percussion des épineuses sensible en L2.</p><p><strong>Les quatre lignes.</strong> Relève de moi : non. Les trois autres lignes ne se posent pas : classer le mécanisme ou le profil n’a aucun sens tant qu’une cause spécifique n’est pas écartée.</p><p><strong>Décision.</strong> Aucun traitement manuel. Courrier pour avis médical rapide, mentionnant l’antécédent, l’amaigrissement, la douleur non mécanique et nocturne, et la sensibilité à la percussion. Le patient est rappelé sous 48 heures pour vérifier que la consultation a eu lieu.</p><p><strong>Erreur classique.</strong> Traiter une séance « pour voir », parce que le patient est venu pour ça et qu’il repartirait déçu.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Cas 6 : la lombalgie qui ne ressemble à rien';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 : cas 6 introuvable'; END IF;

  ---------------------------------------------------------------------------
  -- A9. Réorienter : même date pour la NG59.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'reorientation';
  UPDATE public.region_chapter_references
     SET citation = 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s: assessment and management. NICE guideline NG59, publiée en 2016, mise à jour en 2020 et le 29 juillet 2026.',
         year = 2026
   WHERE chapter_id = v_ch AND citation LIKE 'National Institute for Health and Care Excellence. Low back pain and sciatica%';
END
$do$;
