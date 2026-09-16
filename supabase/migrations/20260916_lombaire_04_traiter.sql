-- Module « Région lombaire » : partie « Traiter ».
--
-- Ce fichier porte le catalogue de techniques. Une technique existe
-- indépendamment de sa vidéo : celles qui sont déjà tournées sont reliées à
-- `practice_videos` par leur titre, les autres sont marquées `to_film = true`
-- avec un brief de tournage. La page d'administration en tire la liste des
-- démonstrations à produire.

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
    v_module, 'principes-traitement',
    'Ce que recommandent réellement les guidelines',
    'Le socle commun, et ce qui est désormais déconseillé',
    'Traiter', 'traitement',
    'NICE, l’American College of Physicians, la série du Lancet et la recommandation de l’Organisation mondiale de la santé convergent sur un socle étonnamment stable. Ce chapitre le résume et liste ce qui n’est plus recommandé.',
    jsonb_build_array(
      'Citer le socle commun des recommandations internationales',
      'Nommer les traitements passifs désormais déconseillés et savoir l’expliquer à un patient qui les demande',
      'Situer la thérapie manuelle à sa juste place dans ce socle'
    ),
    jsonb_build_array(
      'Socle commun : rester actif, éducation, exercice, thérapie manuelle en appoint, et pas d’imagerie en l’absence de drapeau rouge.',
      'Le repos au lit est déconseillé. Il aggrave l’évolution.',
      'Tous les traitements efficaces ont des effets modestes et comparables : le choix se fait sur le patient, pas sur la supériorité d’une technique.',
      'La thérapie manuelle est recommandée comme composante d’un traitement incluant l’exercice, pas comme traitement isolé.'
    ),
    40, 18
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le socle commun',
   '<p>Quatre éléments reviennent dans toutes les recommandations récentes. <strong>Rassurer et informer</strong> : expliquer la nature bénigne de la lombalgie commune, son évolution attendue, l’absence d’intérêt de l’imagerie. <strong>Maintenir l’activité</strong> : poursuivre les activités quotidiennes et professionnelles autant que possible, reprendre progressivement plutôt que d’attendre l’absence de douleur. <strong>Proposer de l’exercice</strong> : n’importe quelle forme d’exercice, adaptée aux préférences et aux capacités du patient. <strong>Adapter au risque</strong> : prendre en compte les facteurs psychosociaux dans l’intensité de la prise en charge.</p><p>La thérapie manuelle figure dans ces recommandations, mais toujours au même endroit : comme composante d’un ensemble incluant l’exercice, et non comme traitement autonome.</p>',
   'cle', 0),
  (v_chapter, 'Ce qui n’est plus recommandé',
   '<p>Le repos au lit : déconseillé sans ambiguïté, il ralentit la récupération. Les tractions mécaniques : non recommandées dans la lombalgie, avec ou sans radiculalgie. Les ceintures et corsets à visée thérapeutique de longue durée : non recommandés. L’électrothérapie passive isolée, dont le TENS en traitement de fond, et les ultrasons : bénéfice non démontré. Le paracétamol seul dans la lombalgie aiguë : inefficace contre placebo. L’imagerie systématique : non seulement inutile en l’absence de drapeau rouge, mais associée à de moins bons résultats et à plus d’interventions.</p>',
   'preuve', 1),
  (v_chapter, 'Ce qui est recommandé, et à quel niveau',
   '<p><strong>Exercice</strong> : recommandé partout, sans supériorité établie d’une modalité sur une autre. C’est l’intervention la mieux soutenue. <strong>Éducation et auto-prise en charge</strong> : recommandées, avec un effet net sur les croyances et l’usage des soins. <strong>Thérapie manuelle</strong> : recommandée en association, effet modeste à court terme sur douleur et fonction. <strong>Approches psychologiques</strong> : recommandées dans les formes persistantes ou à risque élevé. <strong>Programmes multidisciplinaires</strong> : recommandés dans la lombalgie chronique invalidante.</p>',
   'none', 2),
  (v_chapter, 'Ce que « effet modeste » veut dire en consultation',
   '<p>Dans les essais, l’écart entre un traitement actif et son comparateur se chiffre souvent entre 5 et 15 points sur 100 en douleur ou en incapacité. Ce n’est pas rien, et cela peut compter pour un patient donné, mais cela interdit deux discours : promettre une disparition de la douleur, et prétendre qu’une technique fait nettement mieux que les autres.</p><p>Ce que cela autorise, en revanche : associer plusieurs interventions modestes, choisir celle qui correspond au patient et à ses préférences, et soigner ce qui entoure la technique, c’est à dire l’explication, l’attente créée et la reprise d’activité.</p>',
   'cle', 3),
  (v_chapter, 'Répondre à un patient qui demande un traitement déconseillé',
   '<p>« Vous ne me faites pas de radio ? » Expliquer que l’imagerie ne change pas le traitement en l’absence de signal d’alerte, qu’elle montre chez presque tout le monde des images d’usure sans rapport avec la douleur, et qu’elle est associée à plus d’examens et d’interventions sans meilleur résultat. Ajouter ce qui déclencherait, chez lui, une imagerie.</p><p>« Il me faudrait une bonne traction. » Dire que la traction a été étudiée et qu’elle n’a pas montré d’effet supérieur, et proposer ce qui en a montré un.</p><p>Refuser sans expliquer laisse le patient chercher ailleurs. Expliquer avec un critère de déclenchement clair le laisse rassuré et coopérant.</p>',
   'pratique', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s. NICE guideline NG59.', 2020, 'recommandation', 'La recommandation la plus détaillée sur ce qui est recommandé et ce qui ne l’est pas.', 0),
  (v_chapter, 'Qaseem A, Wilt TJ, McLean RM, Forciea MA. Noninvasive treatments for acute, subacute, and chronic low back pain: a clinical practice guideline from the American College of Physicians. Ann Intern Med.', 2017, 'recommandation', 'Place les traitements non pharmacologiques en première intention.', 1),
  (v_chapter, 'Foster NE, Anema JR, Cherkin D et al. Prevention and treatment of low back pain: evidence, challenges, and promising directions. Lancet.', 2018, 'revue_systematique', 'Le tableau comparatif des interventions et de leur niveau de preuve.', 2),
  (v_chapter, 'Organisation mondiale de la santé. WHO guideline for non-surgical management of chronic primary low back pain in adults.', 2023, 'recommandation', 'Position internationale la plus récente, interventions recommandées et déconseillées.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'therapie-manuelle',
    'Thérapie manuelle lombaire',
    'HVLA, mobilisations et mobilisations avec mouvement : indications, dosage, sécurité',
    'Traiter', 'traitement',
    'Ce que la manipulation apporte vraiment, à qui la proposer, comment choisir entre haute et basse vélocité, et comment intégrer les mobilisations avec mouvement de Mulligan. Chaque technique est reliée à sa démonstration quand elle existe.',
    jsonb_build_array(
      'Situer l’effet de la manipulation lombaire au regard de la littérature récente',
      'Choisir entre haute vélocité, mobilisation et mobilisation avec mouvement selon le patient',
      'Doser, réévaluer immédiatement, et connaître les contre-indications'
    ),
    jsonb_build_array(
      'La manipulation lombaire produit un effet modeste, comparable à celui des autres traitements recommandés, et supérieur à l’absence de traitement.',
      'Le choix entre haute et basse vélocité relève de la tolérance, de l’irritabilité et de la préférence du patient plus que d’une supériorité démontrée.',
      'Il n’existe pas de preuve que l’on repositionne une vertèbre : le bruit articulaire ne prédit pas le résultat.',
      'Réévaluer le signe comparable immédiatement après la technique est ce qui sépare un traitement d’un rituel.'
    ),
    60, 19
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce que dit la littérature',
   '<p>La revue systématique de Rubinstein publiée dans le BMJ, portant sur la lombalgie chronique, conclut à un effet de la thérapie manipulative comparable à celui des autres traitements recommandés, avec une amélioration modérée de la fonction à court terme et un effet plus faible sur la douleur. Les effets indésirables rapportés sont transitoires et mineurs : courbatures, majoration passagère.</p><p>Deux lectures sont possibles, et les deux sont fausses. « Ça ne marche pas » : non, l’effet existe et il est du même ordre que celui des interventions recommandées. « C’est le meilleur traitement » : non plus, rien ne le démontre supérieur à l’exercice ou aux autres approches.</p>',
   'preuve', 0),
  (v_chapter, 'Comment ça agit, et ce qu’il faut cesser de dire',
   '<p>Les mécanismes documentés sont neurophysiologiques et mécaniques transitoires : modulation de la douleur par des voies descendantes, effet sur l’excitabilité motrice, modification passagère du seuil de pression douloureux, effets non spécifiques liés au contexte et à l’attente. Les déplacements vertébraux corrigés durablement ne sont pas documentés, et la cavitation, ce bruit auquel patients et praticiens accordent tant d’importance, ne prédit pas le résultat clinique.</p><p>Conséquence sur le discours : « je vais redonner de la mobilité à ce segment et calmer la douleur » est défendable. « Votre vertèbre était déplacée, je l’ai remise » ne l’est pas, et crée une dépendance au geste.</p>',
   'cle', 1),
  (v_chapter, 'À qui proposer une manipulation',
   '<p>La règle de Flynn donne le meilleur repère disponible : épisode récent de moins de seize jours, pas de symptôme sous le genou, faibles croyances d’évitement liées au travail, au moins un segment hypomobile, au moins une hanche à plus de 35 degrés de rotation interne. Quatre items sur cinq désignent le patient chez qui l’amélioration rapide est la plus probable.</p><p>Les réserves sont connues et doivent être dites : la validation externe n’a pas toujours confirmé, et l’écart dépend du comparateur. La règle sert à hiérarchiser une première intention, pas à garantir un résultat.</p>',
   'none', 2),
  (v_chapter, 'Haute vélocité ou basse vélocité',
   '<p>Aucune supériorité nette de l’une sur l’autre n’est établie dans la lombalgie. Le choix se fait donc sur des critères cliniques. <strong>Basse vélocité</strong> quand l’irritabilité est élevée, chez le sujet âgé ou ostéoporotique, en cas d’appréhension marquée, sur un segment porteur d’un spondylolisthésis, ou lorsqu’on veut doser finement la réponse. <strong>Haute vélocité</strong> chez un patient peu irritable, avec segment hypomobile douloureux, épisode récent, et sans contre-indication.</p><p>Dans les deux cas, la réévaluation immédiate du signe comparable décide de la suite : garder, ajuster ou changer.</p>',
   'pratique', 3),
  (v_chapter, 'Les mobilisations avec mouvement de Mulligan',
   '<p>Le principe des SNAG lombaires : appliquer un glissement accessoire soutenu sur l’apophyse épineuse ou transverse pendant que le patient réalise activement le mouvement douloureux. La règle est stricte : la technique doit rendre le mouvement indolore immédiatement, sinon il faut changer le niveau, la direction ou l’intensité, ou abandonner.</p><p>Cet impératif d’indolorité immédiate est ce qui rend la méthode intéressante pédagogiquement : elle ne laisse aucune place à l’espoir qu’il faut « laisser le temps de travailler ». Le niveau de preuve reste modéré et repose sur des essais de taille limitée, avec des résultats encourageants à court terme sur douleur et amplitude.</p>',
   'none', 4),
  (v_chapter, 'Sécurité et contre-indications',
   '<p>Contre-indications absolues à la haute vélocité lombaire : suspicion de fracture, de tumeur ou d’infection, syndrome de la queue de cheval, déficit neurologique progressif, ostéoporose sévère, spondyloarthrite en poussée avec rachis fragilisé, anticoagulation mal équilibrée avec risque hémorragique, anévrisme aortique connu.</p><p>Prudence et préférence pour la basse vélocité : radiculalgie aiguë très irritable, grossesse, spondylolisthésis au segment concerné, patient très appréhensif, première séance chez un patient dont on ne connaît pas la réactivité.</p>',
   'drapeau_rouge', 5);

  DELETE FROM public.region_chapter_techniques WHERE chapter_id = v_chapter;

  INSERT INTO public.region_chapter_techniques (chapter_id, name, approach, description_html, indications, contraindications, dosage, evidence_level, evidence_summary, practice_video_id, to_film, film_brief, order_index)
  SELECT v_chapter, x.name, x.approach, x.descr, x.indic, x.contre, x.dosage, x.niveau, x.preuve, pv.id, x.to_film, x.brief, x.ord
  FROM (VALUES
    ('Lumbar roll L1-L4', 'hvla',
     '<p>Manipulation en décubitus latéral, prise classique du rachis lombaire haut et moyen, verrouillage par le haut et par le bas, impulsion de faible amplitude dans le sens du paramètre choisi.</p>',
     'Lombalgie commune peu irritable, segment hypomobile douloureux de L1 à L4, règle de Flynn favorable.',
     'Suspicion de fracture, tumeur, infection, déficit neurologique progressif, ostéoporose sévère, appréhension majeure.',
     'Une à deux impulsions par séance, réévaluation immédiate du signe comparable.',
     'modere', 'Effet comparable à celui des autres traitements recommandés, sur la fonction surtout, à court terme (Rubinstein 2019).',
     'L1-L4 Lumbar Roll', false, NULL, 0),
    ('Lumbar roll L5-S1', 'hvla',
     '<p>Même principe appliqué à la charnière lombo-sacrée, avec un verrouillage et une orientation d’impulsion adaptés au segment.</p>',
     'Lombalgie basse, segment L5-S1 douloureux et hypomobile, patient peu irritable.',
     'Mêmes contre-indications que pour la haute vélocité lombaire, avec prudence supplémentaire en cas de spondylolisthésis L5-S1.',
     'Une à deux impulsions, réévaluation immédiate.',
     'modere', 'Même base de preuves que la manipulation lombaire en général.',
     'L5-S1 Lumbar Roll', false, NULL, 1),
    ('Pull and kick L1-L4', 'hvla',
     '<p>Variante de la manipulation en décubitus latéral, avec traction du bras sous-jacent et impulsion par le membre inférieur.</p>',
     'Alternative au lumbar roll selon la morphologie du patient et le confort de prise.',
     'Identiques à la haute vélocité lombaire.',
     'Une impulsion, réévaluation immédiate.',
     'modere', 'Variante technique de la manipulation lombaire, même base de preuves.',
     'L1-L4 Pull + Kick', false, NULL, 2),
    ('Push and kick L5-S1', 'hvla',
     '<p>Variante avec appui thoracique et impulsion par le membre inférieur, adaptée à la charnière lombo-sacrée.</p>',
     'Alternative à la prise classique, utile chez les morphologies difficiles.',
     'Identiques à la haute vélocité lombaire.',
     'Une impulsion, réévaluation immédiate.',
     'modere', 'Variante technique, même base de preuves.',
     'L5-S1 Push + Kick', false, NULL, 3),
    ('Mobilisation postéro-antérieure centrale', 'lvla',
     '<p>Pressions postéro-antérieures rythmées sur les apophyses épineuses, patient en procubitus, en dosant selon la douleur provoquée et la résistance perçue.</p>',
     'Douleur segmentaire provoquée, irritabilité modérée à élevée, alternative à la haute vélocité.',
     'Suspicion de fracture, infection, tumeur. Prudence en cas d’ostéoporose.',
     'Trois à quatre séries de trente secondes à une minute, en grade adapté, réévaluation entre chaque série.',
     'modere', 'Effet comparable à celui de la manipulation dans la lombalgie, avec un meilleur contrôle du dosage.',
     'Mobilisation P-A sur Epineuses avec Lombaires en Extension', false, NULL, 4),
    ('Mobilisation postéro-antérieure transversaire', 'lvla',
     '<p>Pressions unilatérales sur les apophyses transverses, du côté douloureux, en procubitus.</p>',
     'Douleur unilatérale, tableau en extension, segment douloureux latéralisé.',
     'Mêmes réserves que la mobilisation centrale.',
     'Trois à quatre séries, réévaluation immédiate.',
     'modere', 'Même base de preuves que les mobilisations lombaires.',
     'Mobilisation P-A Transversaire', false, NULL, 5),
    ('Mobilisation en ouverture facettaire L5-S1', 'lvla',
     '<p>Mise en position de flexion et d’inclinaison contrôlée, puis mobilisation rythmée visant l’ouverture du segment lombo-sacré.</p>',
     'Tableau en extension, sténose foraminale, patient soulagé par la flexion.',
     'Radiculalgie très irritable périphérisant en flexion.',
     'Séries courtes, arrêt immédiat en cas de périphérisation.',
     'faible', 'Peu de données spécifiques : rationnel mécanique et réponse immédiate du patient guident la décision.',
     'Mobilisation L5-S1 en Ouverture Facettaire', false, NULL, 6),
    ('Mobilisation rythmique lombaire en procubitus', 'lvla',
     '<p>Mobilisation oscillatoire de faible amplitude, à visée antalgique, chez un patient très irritable.</p>',
     'Phase aiguë très douloureuse, première prise de contact, patient appréhensif.',
     'Suspicion de pathologie spécifique.',
     'Une à trois minutes, en oscillation indolore.',
     'faible', 'Effet antalgique transitoire, utile pour ouvrir une fenêtre de mouvement avant de travailler.',
     'Mobilisation Rythmique Lombaire en Procubitus', false, NULL, 7),
    ('Mobilisation lombaire en flexion en latérocubitus', 'lvla',
     '<p>Mobilisation segmentaire en flexion, patient en décubitus latéral, membres inférieurs utilisés comme bras de levier.</p>',
     'Préférence directionnelle en flexion, sténose, tableau en extension douloureux.',
     'Périphérisation en flexion, tableau discogénique aigu s’aggravant en flexion.',
     'Séries de dix à quinze oscillations, réévaluation.',
     'faible', 'Choisie sur la réponse immédiate du patient plutôt que sur une preuve spécifique.',
     'Mobilisation Lombaire en Flexion Latérocubitus', false, NULL, 8),
    ('Mobilisation lombaire en extension en latérocubitus', 'lvla',
     '<p>Mobilisation segmentaire en extension, en décubitus latéral.</p>',
     'Préférence directionnelle en extension, tableau discogénique centralisant en extension.',
     'Sténose symptomatique s’aggravant en extension, spondylolyse active.',
     'Séries de dix à quinze oscillations, réévaluation.',
     'faible', 'Choisie sur la réponse immédiate, en cohérence avec la préférence directionnelle repérée à l’examen.',
     'Mobilisation Lombaire en Extension en Latérocubitus', false, NULL, 9)
  ) AS x(name, approach, descr, indic, contre, dosage, niveau, preuve, video_title, to_film, brief, ord)
  LEFT JOIN public.practice_videos pv ON pv.title = x.video_title;

  INSERT INTO public.region_chapter_techniques (chapter_id, name, approach, description_html, indications, contraindications, dosage, evidence_level, evidence_summary, to_film, film_brief, order_index) VALUES
  (v_chapter, 'SNAG lombaire en extension (Mulligan)', 'mwm',
   '<p>Patient assis ou debout. Le praticien applique un glissement accessoire soutenu, dirigé le long du plan de l’articulaire postérieure, sur l’épineuse ou l’apophyse transverse du segment choisi, pendant que le patient réalise activement l’extension douloureuse. Le glissement est maintenu pendant tout le mouvement, aller et retour.</p><p>Règle absolue : le mouvement doit devenir indolore immédiatement. Si la douleur persiste, changer de niveau, de direction ou d’intensité, puis renoncer.</p>',
   'Lombalgie mécanique avec un mouvement directionnel douloureux reproductible, en extension.',
   'Douleur non mécanique, irritabilité extrême, pathologie spécifique suspectée.',
   'Trois séries de six à dix répétitions si et seulement si le mouvement est indolore sous glissement.',
   'modere', 'Essais de taille limitée montrant un bénéfice à court terme sur douleur et amplitude. Le critère d’indolorité immédiate rend la technique auto-vérifiante.',
   true, 'Montrer le repérage du niveau, l’orientation exacte du glissement le long du plan facettaire, le maintien du glissement pendant tout le mouvement actif, la vérification de l’indolorité, et deux corrections quand le mouvement reste douloureux (changement de niveau puis d’angle).', 10),
  (v_chapter, 'SNAG lombaire en flexion (Mulligan)', 'mwm',
   '<p>Même principe appliqué à la flexion douloureuse, patient assis, avec surveillance de la réponse en cours de mouvement.</p>',
   'Lombalgie dont la flexion est le mouvement douloureux reproductible.',
   'Périphérisation en flexion, radiculalgie irritable.',
   'Trois séries de six à dix répétitions, sous condition d’indolorité.',
   'modere', 'Même base de preuves que le SNAG en extension.',
   true, 'Insister sur la stabilisation du bassin, la progression du glissement pendant la descente, et sur la conduite à tenir si la douleur descend dans la jambe : arrêt immédiat.', 11),
  (v_chapter, 'Bent leg raise (Mulligan)', 'mwm',
   '<p>Technique en décubitus dorsal : genou fléchi, hanche portée en flexion dans l’axe de l’épaule, avec poussée isométrique du patient contre l’épaule du praticien, puis gain progressif d’amplitude.</p>',
   'Douleur lombaire basse ou fessière avec limitation de la flexion de hanche, en alternative à la mise en tension neurale directe.',
   'Radiculalgie très irritable, pathologie de hanche douloureuse en flexion.',
   'Trois à cinq répétitions, en respectant l’absence de douleur.',
   'faible', 'Données limitées, rationnel clinique solide chez les patients ne tolérant pas les techniques directes.',
   true, 'Montrer le placement dans l’axe de l’épaule, la progression par contractions isométriques successives, et le repère de fin de technique.', 12);

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'Le meilleur repère disponible pour choisir à qui proposer une manipulation lombaire en première intention.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Règle de prédiction clinique de Flynn (manipulation lombaire)'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note=EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Rubinstein SM, de Zoete A, van Middelkoop M et al. Benefits and harms of spinal manipulative therapy for the treatment of chronic low back pain: systematic review and meta-analysis. BMJ.', 2019, 'meta_analyse', 'La référence actuelle sur l’effet et la sécurité de la manipulation lombaire.', 0),
  (v_chapter, 'Rubinstein SM, Terwee CB, Assendelft WJ et al. Spinal manipulative therapy for acute low-back pain. Cochrane Database Syst Rev.', 2012, 'revue_systematique', 'Le versant aigu : effet comparable aux autres interventions recommandées.', 1),
  (v_chapter, 'Bialosky JE, Beneciuk JM, Bishop MD et al. Unraveling the mechanisms of manual therapy: modeling an approach. J Orthop Sports Phys Ther.', 2018, 'revue_systematique', 'Les mécanismes documentés, et ceux qui ne le sont pas.', 2),
  (v_chapter, 'Hidalgo B, Detrembleur C, Hall T et al. The efficacy of manual therapy and exercise for different stages of non-specific low back pain: an update of systematic reviews. J Man Manip Ther.', 2014, 'revue_systematique', 'Thérapie manuelle et exercice associés : la combinaison recommandée.', 3),
  (v_chapter, 'Hussien HM, Abdel-Raoof NA, Kattabei OM, Ahmed HH. Effect of Mulligan concept lumbar SNAG on chronic nonspecific low back pain. J Chiropr Med.', 2017, 'essai_randomise', 'Un des essais disponibles sur les SNAG lombaires, à la taille d’échantillon limitée.', 4);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'exercice-mckenzie',
    'Exercice, McKenzie et contrôle moteur',
    'L’intervention la mieux soutenue, et comment la prescrire vraiment',
    'Traiter', 'traitement',
    'L’exercice est le traitement le mieux documenté de la lombalgie, et le plus mal prescrit. Ce chapitre traite du choix de la modalité, de la méthode McKenzie, du contrôle moteur et du dosage réel.',
    jsonb_build_array(
      'Prescrire un exercice adapté à la préférence directionnelle du patient',
      'Construire une progression de contrôle moteur et de renforcement',
      'Doser, expliquer et suivre l’observance'
    ),
    jsonb_build_array(
      'Aucune modalité d’exercice n’est nettement supérieure aux autres : la meilleure est celle que le patient fera.',
      'Prescrire selon la préférence directionnelle fait mieux qu’un programme standard chez les patients qui en présentent une.',
      'Les exercices de stabilisation ne battent pas un exercice général bien mené : c’est la sélection du patient qui compte.',
      'L’effet de l’exercice dépend du volume réalisé, pas du volume prescrit : l’observance est le vrai paramètre.'
    ),
    55, 20
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce que les comparaisons montrent',
   '<p>Les revues comparant les modalités d’exercice, Pilates, contrôle moteur, renforcement, aérobie, yoga, McKenzie, aboutissent à des différences faibles et rarement cliniquement significatives. L’exercice bat l’absence d’exercice ; une modalité ne bat pas nettement l’autre.</p><p>Ce résultat est libérateur en pratique : il autorise à choisir selon la préférence du patient, son accès, son histoire sportive et ce qu’il tiendra dans le temps, plutôt que selon une doctrine.</p>',
   'preuve', 0),
  (v_chapter, 'La méthode McKenzie en pratique',
   '<p>L’apport principal n’est pas l’extension, c’est la démarche : évaluer par mouvements répétés, classer selon la réponse, prescrire dans la direction qui centralise, et réévaluer à chaque séance. Les patients qui présentent une préférence directionnelle et qui sont traités dans cette direction s’améliorent plus que ceux qui reçoivent un programme standard ou une direction opposée.</p><p>Programme type d’un patient centralisant en extension : press-up en procubitus, dix répétitions toutes les deux heures, extension debout avant et après les activités en flexion, correction de la position assise, et reprise progressive de la flexion une fois la centralisation stable.</p><p>Chez le patient centralisant en flexion, souvent plus âgé ou sténosé, on inverse : flexion répétée en décubitus, genoux-poitrine, aménagement de la marche.</p>',
   'pratique', 1),
  (v_chapter, 'Le contrôle moteur, pour qui',
   '<p>La méta-analyse de Smith conclut que les exercices de stabilisation ne font pas mieux qu’un autre exercice actif bien conduit. Cela ne les rend pas inutiles : cela déplace la question vers la sélection. La règle de Hicks désigne les patients chez qui ce travail a le plus de chances de produire un effet : sujet jeune, hyperlaxe, mouvements aberrants, test d’instabilité positif.</p><p>Progression : contrôle segmentaire en décubitus, puis positions statiques en neutre (planche modifiée, gainage latéral), puis dissociation tronc-membres (dead bug, bird-dog), puis résistance à la rotation (Pallof press), puis mouvement fonctionnel chargé (hip hinge, port de charge).</p>',
   'none', 2),
  (v_chapter, 'Le dosage, la partie qu’on rate',
   '<p>Trois erreurs courantes. Prescrire trop d’exercices : au delà de trois, l’observance chute. Prescrire sans fréquence précise : « faites-le régulièrement » n’est pas une prescription. Ne jamais revérifier l’exécution : un exercice mal exécuté ne produit pas l’effet attendu et entretient la conviction que rien ne marche.</p><p>Format utilisable : deux à trois exercices, une fréquence chiffrée, une durée, un critère d’arrêt, un critère de progression, et une démonstration refaite par le patient devant vous avant qu’il parte.</p>',
   'cle', 3),
  (v_chapter, 'Ce qu’on dit sur la douleur pendant l’exercice',
   '<p>Une douleur modérée pendant l’exercice, qui revient à son niveau de départ en moins d’une heure et qui ne s’aggrave pas d’un jour sur l’autre, est acceptable. Les essais d’exercice en douleur autorisée montrent des résultats au moins équivalents à ceux des programmes évitant toute douleur, avec un bénéfice à court terme sur l’incapacité.</p><p>Dire cette règle explicitement au patient change beaucoup : sans elle, la moindre sensation à l’exercice sera interprétée comme un dégât et interrompra le programme.</p>',
   'pratique', 4);

  INSERT INTO public.region_chapter_exercises (chapter_id, exercise_id, note, order_index)
  SELECT v_chapter, e.id, x.note, x.ord
  FROM (VALUES
    ('Press-up lombaire (McKenzie extension)', 'Exercice de référence du patient centralisant en extension.', 0),
    ('Extension debout répétée', 'À intercaler dans la journée, avant et après les tâches en flexion.', 1),
    ('Flexion lombaire répétée en décubitus', 'Pour le patient centralisant en flexion, fréquent dans la sténose.', 2),
    ('Genoux-poitrine alternés', 'Alternative douce en préférence de flexion.', 3),
    ('Cat-camel', 'Mobilité et reprise du mouvement en phase irritable.', 4),
    ('Bascules du bassin', 'Contrôle segmentaire de départ.', 5),
    ('Dead bug', 'Dissociation tronc-membres, étape 3 de la progression.', 6),
    ('Bird-dog', 'Dissociation en charge, étape 3 de la progression.', 7),
    ('Pallof press élastique', 'Résistance à la rotation, étape 4.', 8),
    ('Hip hinge au mur', 'Mouvement fonctionnel, préparation au port de charge.', 9),
    ('Pont fessier', 'Renforcement de la chaîne postérieure.', 10),
    ('Planche modifiée', 'Position statique en neutre, étape 2.', 11),
    ('Gainage latéral modifié', 'Position statique en neutre, étape 2.', 12)
  ) AS x(exercise_name, note, ord)
  JOIN public.rehab_exercises e ON btrim(e.name) = x.exercise_name
  ON CONFLICT (chapter_id, exercise_id) DO UPDATE SET note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  DELETE FROM public.region_chapter_techniques WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_techniques (chapter_id, name, approach, description_html, indications, contraindications, dosage, evidence_level, evidence_summary, to_film, film_brief, order_index) VALUES
  (v_chapter, 'Évaluation par mouvements répétés (protocole McKenzie)', 'mckenzie',
   '<p>Séquence complète : extension en procubitus puis debout, flexion en décubitus puis debout, et si nécessaire glissement latéral. Dix à quinze répétitions par direction, avec relevé de l’effet sur l’intensité et surtout sur la topographie de la douleur.</p>',
   'Tout patient lombalgique non spécifique, dès la première consultation.',
   'Suspicion de pathologie spécifique non encore écartée.',
   'Une direction à la fois, avec relevé écrit avant et après.',
   'fort', 'La centralisation est le signe dont la valeur pronostique est la mieux établie de tout l’examen lombaire (May et Aina 2012).',
   true, 'Filmer la séquence complète en continu, avec verbalisation de la question posée au patient après chaque série (« où est la douleur maintenant, pas seulement combien »), et montrer un cas de centralisation et un cas de périphérisation.', 0),
  (v_chapter, 'Correction du glissement latéral (side glide)', 'mckenzie',
   '<p>Chez un patient présentant une déviation latérale antalgique, correction manuelle du glissement latéral contre le mur ou par prise du praticien, avant de tester à nouveau l’extension.</p>',
   'Déviation latérale antalgique, fréquente dans le conflit disco-radiculaire aigu.',
   'Aggravation ou périphérisation pendant la correction.',
   'Séries courtes, réévaluation de la déviation et de la topographie.',
   'modere', 'Étape nécessaire avant de travailler l’extension chez un patient dévié : l’extension seule échoue tant que la déviation persiste.',
   true, 'Montrer la reconnaissance de la déviation, le sens de correction, la position des mains, et la vérification que l’extension devient possible après correction.', 1),
  (v_chapter, 'Progression de contrôle moteur en cinq étapes', 'exercice',
   '<p>Étape 1, contrôle segmentaire en décubitus. Étape 2, positions statiques en neutre. Étape 3, dissociation tronc-membres. Étape 4, résistance à la rotation. Étape 5, mouvement fonctionnel chargé et port de charge.</p><p>Critère de passage : exécution correcte, sans compensation visible, sur le volume cible, deux séances de suite.</p>',
   'Patient répondant à la règle de Hicks, lombalgie récidivante, sensation de dérobement.',
   'Aucune en soi : la progression s’adapte au niveau d’irritabilité.',
   'Deux à trois exercices à la fois, cinq séances par semaine, progression toutes les deux à trois semaines.',
   'modere', 'Les programmes de stabilisation font mieux que rien, sans supériorité sur un exercice général : la sélection du patient est le facteur décisif.',
   true, 'Filmer les cinq étapes à la suite avec, pour chacune, l’erreur d’exécution la plus fréquente et sa correction. C’est l’erreur qui manque dans la plupart des vidéos d’exercice.', 2);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hayden JA, Ellis J, Ogilvie R et al. Exercise therapy for chronic low back pain. Cochrane Database Syst Rev.', 2021, 'revue_systematique', 'La référence sur l’efficacité de l’exercice et l’absence de supériorité d’une modalité.', 0),
  (v_chapter, 'Long A, Donelson R, Fung T. Does it matter which exercise? Spine.', 2004, 'essai_randomise', 'Prescrire selon la préférence directionnelle bat un programme standard.', 1),
  (v_chapter, 'Smith BE, Littlewood C, May S. An update of stabilisation exercises for low back pain. BMC Musculoskelet Disord.', 2014, 'meta_analyse', 'Les exercices de stabilisation ne battent pas un autre exercice actif.', 2),
  (v_chapter, 'Smith BE, Hendrick P, Smith TO et al. Should exercises be painful in the management of chronic musculoskeletal pain? Br J Sports Med.', 2017, 'meta_analyse', 'Autoriser une douleur modérée pendant l’exercice donne des résultats au moins équivalents.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'adjuvants',
    'Adjuvants : puncture sèche, neurodynamique et le reste',
    'Ce qui peut aider, ce qui n’aide pas, et ce qui nuit',
    'Traiter', 'traitement',
    'Puncture sèche, mobilisation neurale, tissus mous, TENS, tractions, ventouses : passage en revue honnête du niveau de preuve de chaque adjuvant et de sa place réelle dans un plan de traitement.',
    jsonb_build_array(
      'Situer le niveau de preuve de la puncture sèche dans la lombalgie',
      'Prescrire une mobilisation neurale correctement dosée',
      'Répondre à une demande de traitement passif non recommandé'
    ),
    jsonb_build_array(
      'Puncture sèche : bénéfice à court terme sur douleur et fonction, effet qui ne se maintient pas seul. À utiliser comme fenêtre, pas comme traitement.',
      'Neuromobilisation : intérêt dans la radiculalgie, avec une progression stricte des sliders vers les tensioners.',
      'Tractions mécaniques : non recommandées, y compris avec radiculalgie.',
      'Les adjuvants n’ont de sens que s’ils ouvrent la voie à l’actif : jamais seuls, jamais prolongés.'
    ),
    45, 21
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'La puncture sèche',
   '<p>Les revues récentes concluent à un bénéfice à court terme sur la douleur et la fonction dans la lombalgie, avec une qualité de preuve modérée à faible et une hétérogénéité importante des protocoles. L’effet à moyen et long terme n’est pas démontré lorsque la technique est employée seule.</p><p>Position défendable : la puncture sèche peut ouvrir une fenêtre d’amélioration exploitée immédiatement par du mouvement et de l’exercice. Elle ne constitue pas un traitement de fond, et un plan de traitement qui ne comporterait que des séances de puncture n’est pas conforme aux recommandations.</p><p>Cadre légal et formation : le geste est invasif, sa pratique est encadrée différemment selon les pays et les professions. Vérifier son droit d’exercice et son assurance avant toute pratique.</p>',
   'preuve', 0),
  (v_chapter, 'La mobilisation neurale',
   '<p>Indiquée dans la radiculalgie et dans les tableaux avec mécanosensibilité neurale. Deux modalités. Les <strong>sliders</strong>, qui font coulisser le tissu neural en augmentant la tension à une extrémité tout en la relâchant à l’autre, sont peu agressifs et se travaillent en premier. Les <strong>tensioners</strong>, qui augmentent la tension aux deux extrémités, sont réservés aux phases moins irritables.</p><p>Règle de progression : commencer par des sliders en amplitude infra-douloureuse, deux à trois séries de dix, deux fois par jour, et ne passer aux tensioners que si l’irritabilité a baissé et que les symptômes ne se périphérisent pas dans les vingt-quatre heures.</p>',
   'pratique', 1),
  (v_chapter, 'Tissus mous et adjuvants passifs',
   '<p>Le massage et le travail des tissus mous procurent un soulagement à court terme et une amélioration du confort, sans effet démontré à distance. Ils ont une utilité réelle comme entrée en matière chez un patient très appréhensif, à condition de ne pas structurer le plan de traitement autour d’eux.</p><p>Le TENS en traitement de fond, les ultrasons et la diathermie ne sont pas soutenus par les données. Les ventouses et le taping ont un niveau de preuve faible, avec des effets non spécifiques probables.</p>',
   'none', 2),
  (v_chapter, 'Ce qui est déconseillé',
   '<p>Les tractions mécaniques ne sont pas recommandées, y compris en présence d’une radiculalgie : les revues ne retrouvent pas de bénéfice cliniquement pertinent. Le port prolongé d’une ceinture lombaire à visée thérapeutique n’est pas recommandé et entretient une représentation de fragilité. Le repos au lit est délétère.</p><p>Ces trois éléments sont régulièrement demandés par les patients, et régulièrement encore prescrits. Savoir pourquoi ils ne sont pas recommandés permet de répondre sans se contenter d’un refus.</p>',
   'piege', 3),
  (v_chapter, 'La règle qui organise tous les adjuvants',
   '<p>Un adjuvant se justifie s’il ouvre une fenêtre que l’on exploite dans la même séance par du mouvement actif, et si le patient repart avec quelque chose à faire lui-même. Un adjuvant qui se répète de séance en séance sans jamais déboucher sur de l’actif n’est plus un adjuvant, c’est le traitement, et ce traitement là n’a pas de niveau de preuve.</p>',
   'cle', 4);

  DELETE FROM public.region_chapter_techniques WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_techniques (chapter_id, name, approach, description_html, indications, contraindications, dosage, evidence_level, evidence_summary, to_film, film_brief, order_index) VALUES
  (v_chapter, 'Puncture sèche des muscles paravertébraux lombaires', 'dry_needling',
   '<p>Repérage du point douloureux du multifide ou de l’érecteur du rachis, asepsie, insertion perpendiculaire à profondeur contrôlée, recherche ou non de la réponse de secousse locale selon le protocole retenu.</p>',
   'Douleur myofasciale lombaire associée, en appoint d’un traitement actif, lorsque la douleur limite l’accès au mouvement.',
   'Refus du patient, troubles de la coagulation, anticoagulants selon le protocole, infection locale, grossesse selon les zones, immunodépression, phobie des aiguilles.',
   'Une séance, réévaluation immédiate, exploitation de la fenêtre par du mouvement actif dans la même séance.',
   'faible', 'Bénéfice à court terme sur douleur et fonction, qualité de preuve modérée à faible, pas d’effet démontré à long terme en technique isolée.',
   true, 'Montrer le repérage anatomique, les repères de sécurité en profondeur (rappel du risque pneumothorax pour les étages hauts), l’asepsie complète, l’angulation, et la réévaluation immédiate suivie d’un exercice actif.', 0),
  (v_chapter, 'Puncture sèche du carré des lombes et du moyen fessier', 'dry_needling',
   '<p>Repérage et traitement des points douloureux du carré des lombes et du moyen fessier, fréquemment impliqués dans les douleurs lombaires basses et fessières.</p>',
   'Douleur lombaire latérale ou fessière avec points myofasciaux reproduisant la douleur habituelle.',
   'Mêmes contre-indications que ci-dessus. Attention particulière au repérage du carré des lombes.',
   'Une séance, exploitation immédiate par du mouvement.',
   'faible', 'Même base de preuves que la puncture sèche lombaire en général.',
   true, 'Insister sur les repères de sécurité du carré des lombes (rein, plèvre) et sur le décubitus latéral comme position de sécurité.', 1),
  (v_chapter, 'Slider du nerf sciatique', 'neurodynamique',
   '<p>En position assise ou en décubitus : extension du genou associée à une extension cervicale, puis flexion du genou associée à une flexion cervicale, de sorte que la tension augmente à une extrémité et diminue à l’autre.</p>',
   'Radiculalgie avec mécanosensibilité neurale, phase irritable.',
   'Déficit moteur progressif, périphérisation persistante après réalisation.',
   'Deux à trois séries de dix, deux fois par jour, en amplitude infra-douloureuse.',
   'modere', 'Bénéfice rapporté sur la douleur et la fonction dans la radiculalgie, en association au reste du traitement.',
   true, 'Montrer l’alternance exacte des deux extrémités, le repère d’amplitude infra-douloureuse, et la version domicile à donner au patient.', 2),
  (v_chapter, 'Tensioner du nerf sciatique', 'neurodynamique',
   '<p>Mise en tension simultanée aux deux extrémités : extension du genou avec dorsiflexion et flexion cervicale, maintenue brièvement puis relâchée.</p>',
   'Radiculalgie peu irritable, après plusieurs jours de sliders bien tolérés.',
   'Phase aiguë irritable, déficit progressif.',
   'Deux séries de huit à dix, une fois par jour, avec contrôle des symptômes à vingt-quatre heures.',
   'faible', 'À réserver aux phases tardives : la progression trop rapide vers les tensioners est la cause la plus fréquente d’aggravation.',
   true, 'Montrer la différence de sensation entre slider et tensioner, et expliquer le critère de passage de l’un à l’autre.', 3),
  (v_chapter, 'Techniques de tissus mous lombo-pelviennes', 'tissus_mous',
   '<p>Travail des érecteurs du rachis, du carré des lombes, du psoas accessible et des fessiers, en pression soutenue ou en technique de relâchement.</p>',
   'Appréhension importante, phase aiguë douloureuse, préparation à un geste plus spécifique.',
   'Aucune spécifique en dehors des contre-indications générales.',
   'Cinq à dix minutes au maximum, suivies immédiatement d’actif.',
   'faible', 'Soulagement à court terme sans effet démontré à distance : utile comme entrée en matière, jamais comme plan de traitement.',
   true, 'Montrer trois prises efficaces et surtout la transition immédiate vers un exercice actif, qui est le point du chapitre.', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hu HT, Gao H, Ma RJ et al. Is dry needling effective for low back pain? A systematic review and PRISMA-compliant meta-analysis. Medicine (Baltimore).', 2018, 'meta_analyse', 'Bénéfice à court terme, qualité de preuve limitée.', 0),
  (v_chapter, 'Basson A, Olivier B, Ellis R et al. The effectiveness of neural mobilization for neuromusculoskeletal conditions: a systematic review and meta-analysis. J Orthop Sports Phys Ther.', 2017, 'meta_analyse', 'Effet de la mobilisation neurale, notamment dans la radiculalgie.', 1),
  (v_chapter, 'Wegner I, Widyahening IS, van Tulder MW et al. Traction for low-back pain with or without sciatica. Cochrane Database Syst Rev.', 2013, 'revue_systematique', 'Les tractions ne montrent pas de bénéfice cliniquement pertinent.', 2),
  (v_chapter, 'Furlan AD, Giraldo M, Baskwill A et al. Massage for low-back pain. Cochrane Database Syst Rev.', 2015, 'revue_systematique', 'Soulagement à court terme, sans effet maintenu.', 3);

  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'education-matching',
    'Éducation et adaptation au profil',
    'Ce qu’on dit, et à qui on propose quoi',
    'Traiter', 'traitement',
    'L’explication donnée en fin de consultation agit sur le pronostic. Ce chapitre donne des formulations utilisables, les erreurs de langage à éliminer, et la façon d’adapter le plan de traitement au profil du patient.',
    jsonb_build_array(
      'Formuler une explication qui réduit la menace sans nier la douleur',
      'Éliminer de son vocabulaire les formulations iatrogènes',
      'Construire un plan de traitement différent selon le niveau de risque et le tableau clinique'
    ),
    jsonb_build_array(
      'L’éducation à la douleur associée au mouvement améliore l’incapacité et les croyances, plus que l’éducation seule.',
      'Certaines phrases courantes de la thérapie manuelle augmentent mesurablement la peur et la demande de soins.',
      'Le plan de traitement se construit sur deux axes : le tableau clinique, qui dit quoi faire, et le niveau de risque, qui dit à quelle intensité.',
      'Fixer dès la première séance le nombre de séances prévues et le critère de réévaluation évite la dépendance au soin.'
    ),
    45, 22
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce que l’éducation change',
   '<p>Les essais sur l’éducation à la neurophysiologie de la douleur montrent un effet sur les croyances, le catastrophisme et l’incapacité, surtout lorsqu’elle est associée à un programme de mouvement et non délivrée seule. Elle ne remplace pas le traitement : elle le rend possible, en levant ce qui empêchait le patient de bouger.</p><p>L’effet est d’autant plus net que le patient présente des croyances d’évitement marquées, ce qui rejoint exactement la stratification du chapitre sur les drapeaux jaunes.</p>',
   'preuve', 0),
  (v_chapter, 'Les phrases à supprimer',
   '<p>« Votre bassin est décalé. » « Vous avez une vertèbre déplacée. » « Vous avez un dos de personne de 80 ans. » « Il ne faut plus jamais porter de cette façon. » « Votre disque est écrasé. » « Vous avez le dos fragile. »</p><p>Chacune installe une représentation de fragilité structurelle irréversible, que le patient répétera ensuite à son entourage et à ses futurs soignants pendant des années. Aucune n’est soutenue par les données, et plusieurs sont directement contredites par elles.</p>',
   'piege', 1),
  (v_chapter, 'Les formulations de remplacement',
   '<p>Sur la nature du problème : « votre dos est sensibilisé en ce moment, il réagit fort à des mouvements qu’il tolère habituellement très bien. »</p><p>Sur l’imagerie : « ces images d’usure sont présentes chez la plupart des gens de votre âge qui n’ont jamais eu mal, c’est comme les rides, c’est le signe que le dos a vécu, pas qu’il est abîmé. »</p><p>Sur le mouvement : « le dos aime le mouvement et la charge progressive, il n’aime pas l’immobilité. Vous ne pouvez pas l’abîmer en bougeant. »</p><p>Sur le pronostic : « la grande majorité des épisodes comme le vôtre s’améliorent nettement en quelques semaines, et ce qu’on va faire sert à raccourcir ce délai et à réduire les récidives. »</p>',
   'pratique', 2),
  (v_chapter, 'Adapter au profil : deux axes',
   '<p><strong>Axe 1, le tableau clinique</strong>, qui dit quoi faire. Centralisation en extension : programme directionnel. Sténose : flexion et endurance de marche. Radiculalgie : neuromobilisation, gestion de la charge, surveillance du déficit. Instabilité clinique : contrôle moteur. Ceinture pelvienne : transfert de charge et ceinture. Épisode récent avec règle de Flynn favorable : manipulation en première intention.</p><p><strong>Axe 2, le niveau de risque</strong>, qui dit à quelle intensité. Risque faible : une à deux séances, conseils, autonomie rapide. Risque moyen : suivi structuré associant manuel et exercice. Risque élevé : suivi plus long, travail explicite sur les croyances, exposition graduée, recours pluridisciplinaire si absence d’évolution à six à huit semaines.</p>',
   'cle', 3),
  (v_chapter, 'Cadrer le nombre de séances dès le début',
   '<p>Annoncer à la première séance : le nombre de séances envisagé, ce qu’on attend comme évolution, et la date à laquelle on refera le point pour décider de continuer, d’arrêter ou de réorienter. Cette annonce protège de deux dérives symétriques : le patient qui revient tous les mois pendant dix ans, et celui qui abandonne après deux séances parce qu’il pensait que ce serait réglé.</p><p>Elle donne aussi un critère d’échec explicite, ce qui est la condition pour réorienter sans que cela ressemble à un abandon.</p>',
   'reorientation', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Louw A, Zimney K, Puentedura EJ, Diener I. The efficacy of pain neuroscience education on musculoskeletal pain: a systematic review. Physiother Theory Pract.', 2016, 'revue_systematique', 'Effet de l’éducation à la douleur, surtout en association au mouvement.', 0),
  (v_chapter, 'Darlow B, Dowell A, Baxter GD et al. The enduring impact of what clinicians say to people with low back pain. Ann Fam Med.', 2013, 'etude', 'Ce que les phrases des soignants produisent, des années après.', 1),
  (v_chapter, 'O’Sullivan P, Caneiro JP, O’Keeffe M et al. Cognitive functional therapy: an integrated behavioral approach for the targeted management of disabling low back pain. Phys Ther.', 2018, 'consensus', 'Un cadre complet pour articuler explication, exposition et mouvement.', 2),
  (v_chapter, 'Hill JC, Whitehurst DG, Lewis M et al. STarT Back randomised controlled trial. Lancet.', 2011, 'essai_randomise', 'La preuve que différencier l’intensité de la prise en charge selon le risque améliore les résultats.', 3);

END $do$;
