-- Parcours lombaire : nouveaux tableaux et situations particulières
-- (docs/AUDIT_PARCOURS_LOMBAIRE.md, sections C3 et C4).
--
-- C3. Deux chapitres au répertoire des tableaux cliniques :
--   * « Hanche et fesse » : la douleur du grand trochanter, le syndrome
--     fessier profond et la coxarthrose, trois sources fréquentes de douleurs
--     prises pour lombaires ;
--   * « La fracture vertébrale ostéoporotique » : le parcours apprenait à la
--     soupçonner, pas à accompagner le patient une fois le diagnostic posé.
--
-- C4. Une partie « Situations particulières » de cinq chapitres : grossesse,
--     enfant et adolescent, sujet âgé, sportif, travail. Elle s'affiche après
--     « Traiter » grâce à PART_ORDER (lib/region-modules.ts).
--
-- L'ordre des chapitres est réécrit en entier à la fin, à partir de la liste
-- des slugs : la migration est rejouable et l'ordre ne dépend pas de l'état
-- antérieur. Un chapitre absent de la liste fait échouer la migration plutôt
-- que de se retrouver mal placé.

DO $do$
DECLARE
  v_module UUID;
  v_ch UUID;
  v_ordre TEXT[] := ARRAY[
    'epidemiologie', 'classification', 'valeur-des-tests',
    'drapeaux-rouges', 'queue-de-cheval', 'douleurs-viscerales-vasculaires', 'lombalgie-inflammatoire',
    'anamnese', 'drapeaux-jaunes', 'examen-physique', 'examen-neurologique',
    'mecanismes-douleur', 'profil-reponse', 'croiser-les-axes',
    'radiculopathie', 'stenose', 'discogenique', 'facettaire', 'instabilite', 'ceinture-pelvienne',
    'voisinage', 'hanche-et-fesse', 'fracture-osteoporotique', 'rachis-opere',
    'principes-traitement', 'therapie-manuelle', 'exercice-mckenzie', 'adjuvants', 'education-matching',
    'lombalgie-grossesse', 'enfant-adolescent', 'sujet-age', 'sportif', 'travail',
    'tests-a-abandonner', 'fausses-croyances', 'biais-du-praticien',
    'traitements-medicaux', 'imagerie', 'reorientation',
    'cas-cliniques', 'arbre-decisionnel'
  ];
  v_orphelins TEXT;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  ---------------------------------------------------------------------------
  -- C3. Hanche et fesse.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'hanche-et-fesse', 'Hanche et fesse : quand la douleur n’est pas lombaire',
    'Grand trochanter, syndrome fessier profond, coxarthrose',
    'Répertoire des tableaux cliniques', 'diagnostic',
    'Une douleur de fesse ou de face latérale de cuisse est vite étiquetée lombaire ou sciatique. Trois tableaux de hanche la produisent souvent, se reconnaissent à l’examen et se traitent autrement.',
    jsonb_build_array(
      'Examiner la hanche chez tout patient qui consulte pour une douleur de fesse ou de cuisse.',
      'Reconnaître la douleur du grand trochanter et la traiter par l’éducation et la charge progressive.',
      'Savoir ce qui est établi, et ce qui ne l’est pas, dans le syndrome fessier profond.',
      'Reconnaître une coxarthrose et en connaître le traitement de première intention.'),
    jsonb_build_array(
      'Une douleur de fesse impose d’examiner la hanche : rotations, FADIR, palpation du grand trochanter.',
      'Grand trochanter : l’éducation sur la compression du tendon et l’exercice progressif font mieux que l’infiltration.',
      'Le syndrome fessier profond n’a pas de test validé : c’est un diagnostic d’exclusion, après avoir écarté une radiculopathie.',
      'Coxarthrose : exercice et éducation en première intention, la thérapie manuelle en complément.'),
    45, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'hanche-et-fesse';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Pourquoi un chapitre sur la hanche',
   $h$<p>Une douleur de fesse, de face latérale de cuisse ou d’aine est souvent rangée sous « lombalgie » ou « sciatique », par le patient comme par le praticien. Trois tableaux de hanche la produisent fréquemment. Les manquer, c’est traiter le rachis pour rien, parfois pendant des mois.</p><p>Trois gestes suffisent à ne pas s’y tromper. Faire montrer où ça fait mal, du doigt. Examiner la hanche systématiquement : rotations, FADIR, palpation du grand trochanter. Et vérifier si l’examen lombaire et neurologique reproduit la plainte ou la laisse intacte.</p>$h$, 'cle', 0),
  (v_ch, 'La douleur du grand trochanter',
   $h$<p><strong>Le tableau.</strong> Douleur de la face latérale de la hanche, pouvant descendre sur la face latérale de la cuisse jusqu’au genou. Fréquente chez la femme après 40 ans. Aggravée en position couchée sur le côté, à la montée des escaliers, au lever d’une chaise, jambes croisées ou debout appuyé sur une hanche.</p><p><strong>L’examen.</strong> La palpation du grand trochanter reproduit la douleur habituelle, de même que l’appui sur une jambe tenu trente secondes. Pas de paresthésies systématisées, examen neurologique normal. La douleur vient le plus souvent d’une tendinopathie des moyen et petit fessiers, entretenue par la compression du tendon en adduction, plus que d’une bursite isolée. Elle peut coexister avec une atteinte L5, dont le territoire est voisin : c’est l’examen qui fait la part des choses.</p><p><strong>Ce qu’on fait.</strong> Dans l’essai LEAP, un programme d’éducation et d’exercice progressif a fait mieux qu’une infiltration de corticoïdes et que l’attente à huit semaines, et il gardait à un an l’avantage sur l’amélioration globale ressentie. L’éducation porte sur ce qui comprime le tendon : éviter de croiser les jambes, de se tenir sur une hanche, de dormir sur le côté douloureux ou sans coussin entre les genoux. L’exercice renforce les abducteurs de hanche, d’abord en contractions statiques puis en charge croissante. Ce qu’on évite : les étirements en adduction, souvent prescrits, qui compriment justement le tendon.</p>$h$, 'none', 1),
  (v_ch, 'Le syndrome fessier profond',
   $h$<p><strong>Ce qui est décrit.</strong> Une compression du nerf sciatique dans l’espace sous-fessier, par le piriforme ou par d’autres structures de la région. Douleur fessière profonde, aggravée en position assise, parfois irradiée à la face postérieure de cuisse, avec un point douloureux sous-fessier qui reproduit la douleur.</p><p><strong>Ce qui n’est pas établi.</strong> Aucun test clinique n’est validé. Les tests dits « du piriforme » mettent en tension toute la région, et un Lasègue peut être positif puisque c’est le nerf sciatique qui est concerné. Le diagnostic est donc d’exclusion : on ne le retient qu’après avoir écarté une radiculopathie lombaire, beaucoup plus fréquente, et une tendinopathie des ischio-jambiers.</p><p><strong>L’usage défendable.</strong> Comme pour le psoas ou la charnière thoraco-lombaire : une hypothèse, pas une explication à donner au patient. « Votre piriforme coince votre nerf » est invérifiable. Le traitement n’en dépend d’ailleurs pas beaucoup : éducation, fractionnement de la position assise, mobilisation neurale en sliders, renforcement de la hanche. Un avis spécialisé se discute en cas d’échec, l’imagerie et les gestes de ce territoire relevant d’équipes entraînées.</p>$h$, 'piege', 2),
  (v_ch, 'La coxarthrose',
   $h$<p><strong>Le tableau.</strong> Patient de plus de 45 ans, douleur liée à l’activité, raideur matinale brève, de moins de trente minutes. La douleur siège à l’aine, mais aussi à la fesse et à la face antérieure de cuisse, parfois jusqu’au genou, ce qui la fait prendre pour une cruralgie ou une douleur lombaire. Le diagnostic est clinique : le NICE ne demande pas d’imagerie quand ce tableau est typique.</p><p><strong>L’examen.</strong> La rotation interne est la première limitée et douloureuse, le FADIR reproduit la douleur. Chez le sujet âgé, coxarthrose et sténose lombaire coexistent souvent : l’examen dit laquelle produit la plainte du jour.</p><p><strong>Ce qu’on fait.</strong> L’exercice et l’éducation sont le traitement de première intention, avec la perte de poids en cas de surpoids. La thérapie manuelle a sa place en complément de l’exercice, pas à sa place. Un avis chirurgical se discute quand le retentissement reste majeur malgré un traitement conservateur bien conduit.</p><p><strong>À ne pas manquer.</strong> Chez un sujet âgé, une douleur de hanche avec impossibilité d’appui après une chute est une fracture du col jusqu’à preuve du contraire.</p>$h$, 'none', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Mellor R, Bennell K, Grimaldi A et al. Education plus exercise versus corticosteroid injection use versus a wait and see approach on global outcome and pain from gluteal tendinopathy: prospective, single blinded, randomised clinical trial (LEAP). BMJ.',
   2018, 'essai_randomise', 'Éducation et exercice font mieux que l’infiltration et que l’attente à huit semaines, et gardent l’avantage sur l’amélioration globale à un an.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5930290/', 0),
  (v_ch, 'Grimaldi A, Mellor R, Hodges P et al. Gluteal tendinopathy: a review of mechanisms, assessment and management. Sports Med.',
   2015, 'revue_systematique', 'La compression du tendon en adduction au cœur du mécanisme, et ce qu’elle change à l’éducation et à l’exercice.', NULL, 1),
  (v_ch, 'Hernando MF, Cerezal L, Pérez-Carro L et al. Deep gluteal syndrome: anatomy, imaging, and management of sciatic nerve entrapments in the subgluteal space. Skeletal Radiol.',
   2015, 'etude', 'Les structures en cause dans l’espace sous-fessier, au delà du seul piriforme.', NULL, 2),
  (v_ch, 'National Institute for Health and Care Excellence. Osteoarthritis in over 16s: diagnosis and management. NICE guideline NG226.',
   2022, 'recommandation', 'Diagnostic clinique sans imagerie dans le tableau typique, exercice et éducation en première intention.', 'https://www.nice.org.uk/guidance/ng226', 3);

  ---------------------------------------------------------------------------
  -- C3. Fracture vertébrale ostéoporotique.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'fracture-osteoporotique', 'La fracture vertébrale ostéoporotique',
    'La soupçonner, puis accompagner le patient après le diagnostic',
    'Répertoire des tableaux cliniques', 'diagnostic',
    'Beaucoup de fractures vertébrales passent pour un lumbago. Ce chapitre apprend à les soupçonner, puis à reprendre en charge le patient une fois le diagnostic posé, ce qui est la situation la plus fréquente au cabinet.',
    jsonb_build_array(
      'Reconnaître le tableau d’une fracture vertébrale ostéoporotique.',
      'Savoir quoi faire devant la suspicion.',
      'Construire une prise en charge active et sûre après le diagnostic.'),
    jsonb_build_array(
      'Douleur brutale après un effort minime chez un sujet âgé ou sous corticoïdes : penser fracture, adresser, ne pas manipuler.',
      'Après le diagnostic, le mouvement est le traitement : renforcement des extenseurs, équilibre, exercices en charge.',
      'On évite la flexion chargée et la rotation forcée, jamais le mouvement en général.',
      'La vertébroplastie ne fait pas mieux qu’une procédure simulée.'),
    40, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'fracture-osteoporotique';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Le tableau',
   $h$<p>Sujet âgé, le plus souvent une femme, avec une ostéoporose connue ou des facteurs de risque : corticothérapie prolongée, antécédent de fracture, ménopause précoce, faible poids. La douleur apparaît brutalement, souvent après un effort minime (se baisser, porter un sac, tousser), parfois sans aucune cause. Elle est localisée, aggravée debout et assis, soulagée allongé. La percussion des épineuses est douloureuse. Une perte de taille ou une cyphose qui s’accentue complètent le tableau.</p><p>Beaucoup de ces fractures ne sont jamais reconnues : elles passent pour un lumbago, guérissent en quelques semaines, et la suivante survient sans que l’ostéoporose ait été traitée. C’est pourquoi le chapitre sur les drapeaux rouges insiste sur l’association de l’âge, des corticoïdes et d’un traumatisme mineur.</p>$h$, 'none', 0),
  (v_ch, 'Devant la suspicion',
   $h$<p>Avis médical rapide, pour imagerie et antalgie. Aucune technique à haute vélocité. En attendant, garder le patient en mouvement dans la limite de la douleur plutôt que l’immobiliser.</p><p>Le niveau monte à l’urgence devant un déficit neurologique, une douleur intense que rien ne contrôle, ou un antécédent de cancer, qui fait craindre une fracture sur métastase.</p>$h$, 'reorientation', 1),
  (v_ch, 'Après le diagnostic : ce qu’on fait',
   $h$<p>C’est la situation la plus fréquente au cabinet : le patient arrive avec un diagnostic posé, souvent effrayé, et convaincu que bouger est dangereux. La douleur aiguë s’atténue généralement en quelques semaines à trois mois.</p><p><strong>L’exercice est le traitement.</strong> Les recommandations Too Fit To Fracture conseillent le renforcement des extenseurs du dos, le travail de l’équilibre et des exercices en charge, avec une progression adaptée. Ce qu’on évite, ce n’est pas le mouvement en général, ce sont la flexion du tronc sous charge et la rotation forcée en fin d’amplitude. On apprend au patient à se pencher en pliant les hanches pour ramasser ou porter.</p><p><strong>La thérapie manuelle.</strong> Pas de haute vélocité sur un rachis ostéoporotique. Les mobilisations douces et le travail des tissus mous restent possibles pour soulager.</p><p><strong>Les chutes.</strong> Une nouvelle chute est le principal risque de nouvelle fracture. L’évaluation de l’équilibre et un programme de prévention font partie de la prise en charge (voir le chapitre sur le sujet âgé).</p><p><strong>Le traitement de l’ostéoporose.</strong> Il relève du médecin, mais vérifier qu’il a été discuté fait partie de votre rôle : après une première fracture vertébrale, le risque d’en faire une autre est nettement augmenté.</p>$h$, 'pratique', 2),
  (v_ch, 'Vertébroplastie et cyphoplastie',
   $h$<p>Injecter du ciment dans la vertèbre fracturée paraît logique, et les patients le demandent. Les essais contre une procédure simulée, où le patient croit avoir été traité, ne montrent pas de bénéfice cliniquement pertinent sur la douleur ou la fonction, et la revue Cochrane de Buchbinder déconseille son usage en routine. C’est un exemple frappant de geste qui semblait marcher jusqu’à ce qu’on le compare à un placebo, comme l’explique le chapitre « Pourquoi tout semble marcher ».</p>$h$, 'preuve', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Giangregorio LM, Papaioannou A, MacIntyre NJ et al. Too Fit To Fracture: exercise recommendations for individuals with osteoporosis or osteoporotic vertebral fracture. Osteoporos Int.',
   2014, 'consensus', 'Renforcement, équilibre et exercices en charge recommandés ; éviter la flexion chargée et la rotation forcée.', NULL, 0),
  (v_ch, 'Buchbinder R, Johnston RV, Rischin KJ et al. Percutaneous vertebroplasty for osteoporotic vertebral compression fracture. Cochrane Database Syst Rev.',
   2018, 'revue_systematique', 'Pas de bénéfice cliniquement pertinent de la vertébroplastie face à une procédure simulée.', NULL, 1);

  ---------------------------------------------------------------------------
  -- C4. Situations particulières : grossesse.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'lombalgie-grossesse', 'Grossesse et post-partum',
    'Fréquente, pas normale pour autant',
    'Situations particulières', 'traitement',
    'La lombalgie et la douleur pelvienne touchent une grande partie des femmes enceintes, et sont souvent banalisées. Ce chapitre dit ce qui doit alerter, ce qu’on adapte, et ce qu’on propose.',
    jsonb_build_array(
      'Repérer les signes qui imposent d’adresser une femme enceinte sans délai.',
      'Adapter positions et techniques à la grossesse.',
      'Proposer une prise en charge active pendant la grossesse et après l’accouchement.'),
    jsonb_build_array(
      'Une douleur lombaire rythmée avec durcissement du ventre avant terme : maternité, sans attendre.',
      'Fièvre et signes urinaires : pyélonéphrite, plus fréquente pendant la grossesse, avis urgent.',
      'L’exercice adapté est recommandé pendant la grossesse ; le décubitus dorsal prolongé est évité en fin de grossesse.',
      '« C’est normal quand on est enceinte » n’est pas une prise en charge.'),
    35, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'lombalgie-grossesse';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Fréquente, pas normale pour autant',
   $h$<p>Plus de la moitié des femmes enceintes souffrent du dos ou du bassin à un moment de leur grossesse. Cette fréquence fait dire « c’est normal », ce qui revient souvent à ne rien proposer, alors que la douleur retentit sur le sommeil, le travail et la vie quotidienne, et persiste après l’accouchement chez une partie d’entre elles.</p><p>Deux tableaux se distinguent et se traitent un peu différemment : la lombalgie, au-dessus du sacrum, et la douleur de ceinture pelvienne, fessière ou pubienne, qui fait l’objet d’une section du chapitre consacré à la ceinture pelvienne, avec l’ASLR comme test central.</p>$h$, 'cle', 0),
  (v_ch, 'Ce qui doit alerter',
   $h$<p><strong>Une douleur lombaire rythmée</strong>, qui revient par vagues, avec un durcissement du ventre, avant le terme : c’est une contraction jusqu’à preuve du contraire. Orientation vers la maternité sans attendre.</p><p><strong>Fièvre, brûlures urinaires, douleur à l’ébranlement de la fosse lombaire</strong> : pyélonéphrite, plus fréquente pendant la grossesse et plus grave. Avis urgent.</p><p><strong>Maux de tête inhabituels, troubles visuels, douleur épigastrique en barre</strong>, surtout au troisième trimestre : signes possibles de pré-éclampsie. Urgence.</p><p>Les règles générales ne changent pas : les questions de queue de cheval restent systématiques devant une radiculalgie.</p>$h$, 'drapeau_rouge', 1),
  (v_ch, 'Ce qu’on fait',
   $h$<p><strong>Rester active.</strong> L’exercice adapté est recommandé pendant la grossesse, et les essais suggèrent qu’il réduit la douleur et les arrêts de travail liés au dos, avec un niveau de preuve encore faible. Marche, natation, renforcement adapté, exercices de transfert de charge pour la ceinture pelvienne.</p><p><strong>Adapter les positions.</strong> Décubitus latéral avec coussins, ou position assise. En fin de grossesse, on évite le décubitus dorsal prolongé, qui peut comprimer la veine cave et provoquer un malaise.</p><p><strong>La thérapie manuelle</strong> a sa place, en mobilisations douces et en travail des tissus mous, dans ces positions. Une ceinture pelvienne peut soulager les périodes de charge en cas de douleur de ceinture pelvienne.</p><p><strong>Expliquer.</strong> Le corps change de forme et de charge en quelques mois ; la douleur ne signifie pas un dommage, ni pour la mère ni pour l’enfant.</p>$h$, 'pratique', 2),
  (v_ch, 'Après l’accouchement',
   $h$<p>La plupart des douleurs s’atténuent dans les mois qui suivent. La reprise d’activité est progressive, et l’on travaille les gestes nouveaux du quotidien : porter l’enfant, le poser dans son lit, l’allaiter dans une position tenable. Une douleur de ceinture pelvienne qui persiste relève du travail de transfert de charge. Des troubles de la continence ou une gêne périnéale justifient une rééducation périnéale, auprès d’une sage-femme ou d’un kinésithérapeute formé.</p>$h$, 'none', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Liddle SD, Pennick V. Interventions for preventing and treating low-back and pelvic pain during pregnancy. Cochrane Database Syst Rev.',
   2015, 'revue_systematique', 'L’exercice pourrait réduire la douleur et les arrêts de travail liés au dos pendant la grossesse, avec une preuve de faible qualité.', NULL, 0),
  (v_ch, 'Vleeming A, Albert HB, Ostgaard HC et al. European guidelines for the diagnosis and treatment of pelvic girdle pain. Eur Spine J.',
   2008, 'recommandation', 'La référence pour la douleur de ceinture pelvienne de la grossesse.', NULL, 1);

  ---------------------------------------------------------------------------
  -- C4. Enfant et adolescent.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'enfant-adolescent', 'L’enfant et l’adolescent',
    'Fréquente à l’adolescence, rare et plus suspecte chez le jeune enfant',
    'Situations particulières', 'traitement',
    'La lombalgie devient fréquente à l’adolescence et se traite alors comme chez l’adulte. Chez le jeune enfant, elle est rare et une cause spécifique plus probable : le seuil pour adresser est plus bas.',
    jsonb_build_array(
      'Connaître les signes d’alerte propres à l’enfant.',
      'Reconnaître la spondylolyse, la maladie de Scheuermann et la discite.',
      'Prendre en charge un adolescent lombalgique sans lui donner une étiquette de dos fragile.'),
    jsonb_build_array(
      'Plus l’enfant est jeune, plus une lombalgie justifie un avis médical.',
      'Douleur nocturne persistante, fièvre, scoliose douloureuse, signes neurologiques : avis médical.',
      'Chez l’adolescent sportif, une lombalgie d’extension qui dure fait chercher une spondylolyse.',
      'Le poids du cartable n’est pas associé à la lombalgie de l’enfant.'),
    35, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'enfant-adolescent';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Deux âges, deux probabilités',
   $h$<p>À l’adolescence, la lombalgie devient fréquente et ressemble à celle de l’adulte : le plus souvent non spécifique, d’évolution favorable, et sensible aux mêmes facteurs (activité, sommeil, humeur). Les principes du parcours s’appliquent.</p><p>Chez le jeune enfant, elle est rare, et une cause spécifique est proportionnellement plus probable : infection, tumeur, malformation. Le seuil pour demander un avis médical est donc plus bas, d’autant plus que l’enfant est jeune.</p>$h$, 'cle', 0),
  (v_ch, 'Ce qui doit alerter',
   $h$<p>Une douleur nocturne qui réveille et persiste. Une fièvre ou une altération de l’état général. Chez le petit enfant, un refus de s’asseoir, de marcher ou de se pencher, qui évoque une discite. Une scoliose douloureuse : une scoliose idiopathique ne fait pas mal, et une scoliose qui fait mal fait chercher une lésion sous-jacente, comme un ostéome ostéoïde, classiquement responsable d’une douleur nocturne calmée par l’aspirine ou les anti-inflammatoires. Des signes neurologiques, une raideur rachidienne marquée. Chacun de ces signes justifie un avis médical.</p>$h$, 'drapeau_rouge', 1),
  (v_ch, 'Les tableaux à connaître',
   $h$<p><strong>La spondylolyse</strong> chez l’adolescent sportif pratiquant un sport en hyperextension : lombalgie d’extension, souvent unilatérale, détaillée dans le chapitre sur l’instabilité. Persistante au delà de deux à trois semaines, elle justifie un avis et une imagerie.</p><p><strong>La maladie de Scheuermann</strong> : cyphose thoracique ou thoraco-lombaire rigide de l’adolescent, qui ne se corrige pas en extension, avec une douleur d’effort. On propose de l’exercice et une surveillance ; un avis orthopédique est demandé si la cyphose est marquée ou évolutive.</p><p><strong>La hernie discale de l’adolescent</strong> existe, souvent chez un sportif, avec une raideur importante et un Lasègue très positif, parfois plus que la douleur ne le laisserait penser.</p>$h$, 'none', 2),
  (v_ch, 'Ce qu’on fait',
   $h$<p>Rassurer l’adolescent et ses parents, maintenir l’activité et le sport, en adaptant temporairement ce qui déclenche. Éviter les étiquettes qui suivent un enfant pendant des années : « dos fragile », « vertèbre déplacée », « il ne faut plus porter ». Le poids du cartable, souvent incriminé, n’est pas associé à la lombalgie dans les études. Impliquer les parents dans les consignes, sans en faire les gardiens d’une fragilité qui n’existe pas.</p>$h$, 'pratique', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Yamato TP, Maher CG, Traeger AC et al. Do schoolbags cause back pain in children and adolescents? A systematic review. Br J Sports Med.',
   2018, 'revue_systematique', 'Pas d’association démontrée entre le poids du cartable et la lombalgie de l’enfant.', NULL, 0),
  (v_ch, 'Masci L, Pike J, Malara F et al. Use of the one-legged hyperextension test and magnetic resonance imaging in the diagnosis of active spondylolysis. Br J Sports Med.',
   2006, 'etude', 'Le test d’hyperextension unipodale ne permet pas d’écarter une spondylolyse.', NULL, 1);

  ---------------------------------------------------------------------------
  -- C4. Sujet âgé.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'sujet-age', 'Le sujet âgé',
    'Plus de causes spécifiques, mêmes principes, techniques adaptées',
    'Situations particulières', 'traitement',
    'Avec l’âge, la probabilité d’une cause spécifique augmente, les traitements associés se multiplient et le risque de chute devient un enjeu. La lombalgie commune reste pourtant la plus fréquente, et se traite par le mouvement.',
    jsonb_build_array(
      'Ajuster le tri de sécurité au sujet âgé.',
      'Adapter techniques et examen à l’ostéoporose et aux traitements.',
      'Intégrer l’équilibre et la prévention des chutes à la prise en charge.'),
    jsonb_build_array(
      'L’âge seul n’est pas un drapeau rouge, mais il augmente la probabilité de fracture, de cancer, d’anévrisme et de sténose.',
      'Ostéoporose connue ou probable : pas de haute vélocité.',
      'Les programmes d’exercice avec travail de l’équilibre réduisent les chutes d’environ un quart.',
      '« C’est l’usure, à votre âge » est une explication fausse et démobilisante.'),
    35, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'sujet-age';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Ce qui change avec l’âge',
   $h$<p>L’âge seul n’est pas un drapeau rouge : c’est le cas de la majorité des patients d’un cabinet. Mais il augmente la probabilité de plusieurs causes spécifiques, qui doivent rester à l’esprit : fracture ostéoporotique, cancer ou métastase, anévrisme de l’aorte abdominale chez l’homme fumeur, sténose lombaire. Le tri de sécurité ne change pas de nature, il gagne en poids.</p><p>Les traitements associés comptent aussi. Un anticoagulant expose au saignement, une corticothérapie prolongée fragilise l’os, la polymédication favorise vertiges et chutes. Les demander fait partie de l’anamnèse.</p>$h$, 'cle', 0),
  (v_ch, 'Adapter l’examen et les techniques',
   $h$<p><strong>Ostéoporose connue ou probable</strong> : pas de technique à haute vélocité, préférence pour les mobilisations, et pas de flexion forcée sous charge.</p><p><strong>Anticoagulants</strong> : prudence avec les pressions fortes et les techniques invasives.</p><p><strong>La hanche</strong> est examinée systématiquement : la coxarthrose est fréquente et donne des douleurs prises pour lombaires.</p><p><strong>L’équilibre</strong> fait partie de l’examen : appui sur une jambe, lever d’une chaise, marche. C’est souvent là que se joue l’autonomie, plus que dans la douleur.</p>$h$, 'pratique', 1),
  (v_ch, 'L’exercice, et les chutes',
   $h$<p>L’exercice est aussi utile au sujet âgé qu’au plus jeune, et il apporte un bénéfice supplémentaire : les programmes qui associent renforcement et travail de l’équilibre réduisent le nombre de chutes d’environ un quart. Pour un patient ostéoporotique, une chute évitée est une fracture évitée. La marche, le renforcement des membres inférieurs et du tronc, et les exercices d’équilibre progressifs forment le socle. Dans la sténose, les programmes en flexion et la marche par intervalles s’y ajoutent.</p>$h$, 'preuve', 2),
  (v_ch, 'Ce qu’on dit',
   $h$<p>« C’est l’usure, à votre âge » est la phrase la plus fréquente et l’une des plus nuisibles : elle annonce une dégradation irréversible et décourage le mouvement. Les images d’arthrose et de discopathie sont présentes chez presque tous les sujets âgés sans douleur. Ce qu’on dit à la place : « votre dos a vécu, comme le reste, et il garde une grande capacité à se renforcer. On va s’en servir. » Et l’on fixe des objectifs concrets : marcher jusqu’au marché, jardiner, porter ses petits-enfants.</p>$h$, 'pratique', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Sherrington C, Fairhall NJ, Wallbank GK et al. Exercise for preventing falls in older people living in the community. Cochrane Database Syst Rev.',
   2019, 'revue_systematique', 'L’exercice, en particulier avec travail de l’équilibre, réduit les chutes d’environ un quart.', NULL, 0),
  (v_ch, 'Giangregorio LM, Papaioannou A, MacIntyre NJ et al. Too Fit To Fracture: exercise recommendations for individuals with osteoporosis or osteoporotic vertebral fracture. Osteoporos Int.',
   2014, 'consensus', 'Exercice recommandé dans l’ostéoporose, avec des précautions sur la flexion chargée.', NULL, 1);

  ---------------------------------------------------------------------------
  -- C4. Sportif.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'sportif', 'Le sportif : reprendre et prévenir',
    'Des critères plutôt qu’un délai',
    'Situations particulières', 'traitement',
    'Le sportif lombalgique veut savoir quand il pourra reprendre. Ce chapitre propose une reprise guidée par des critères plutôt que par un délai, les signes d’alerte propres au sport, et ce qui prévient réellement les récidives.',
    jsonb_build_array(
      'Guider la reprise du sport par des critères progressifs.',
      'Reconnaître les signes d’alerte propres au sportif.',
      'Savoir ce qui prévient les récidives, et ce qui ne les prévient pas.'),
    jsonb_build_array(
      'La reprise se décide sur des critères (douleur, contrôle, force, tolérance au geste), pas sur un nombre de semaines.',
      'Adolescent en extension, coureuse en déficit énergétique : penser spondylolyse et fracture de fatigue.',
      'L’exercice prévient les épisodes de lombalgie, surtout associé à l’éducation, avec un effet qui s’atténue avec le temps.',
      'Les preuves propres au sport sont minces : la progression est une méthode, pas un protocole validé.'),
    30, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'sportif';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Reprendre : des critères plutôt qu’un délai',
   $h$<p>« Dans combien de temps je peux reprendre ? » La réponse honnête n’est pas un nombre de semaines, c’est une progression, validée étape par étape. Les données propres à la lombalgie du sportif sont minces, et cette progression suit les principes de consensus sur le retour au sport plus qu’un protocole validé.</p><p><strong>Les critères.</strong> Une douleur absente ou stable pendant l’activité et dans les vingt-quatre heures qui suivent. Des amplitudes et un contrôle du mouvement suffisants pour le geste du sport. Une force et une endurance du tronc et des hanches proches de l’objectif. Et surtout la tolérance au geste lui-même, introduit progressivement : d’abord le volume, puis l’intensité, puis la vitesse et l’imprévu.</p><p><strong>Les étapes.</strong> Reprise de l’entraînement adapté, puis de l’entraînement complet, puis de la compétition. Chaque étape se valide sur les critères ; un retour en arrière n’est pas un échec, c’est l’information qui permet de doser la suivante.</p>$h$, 'pratique', 0),
  (v_ch, 'Ce qui doit alerter chez le sportif',
   $h$<p><strong>L’adolescent qui pratique un sport en extension</strong> (gymnastique, danse, lancers, tennis) et dont la lombalgie d’extension dure plus de deux à trois semaines : spondylolyse jusqu’à preuve du contraire, et le test d’hyperextension unipodale ne suffit pas à l’écarter.</p><p><strong>La coureuse d’endurance</strong> avec une douleur sacrée ou fessière d’apparition progressive, aggravée par l’appui : penser à une fracture de fatigue du sacrum, d’autant plus en cas de déficit énergétique, d’amaigrissement ou de troubles du cycle.</p><p>Et les drapeaux rouges habituels, que l’âge jeune et la bonne forme apparente font trop souvent oublier.</p>$h$, 'drapeau_rouge', 1),
  (v_ch, 'Prévenir les récidives',
   $h$<p>La méta-analyse de Steffens montre que l’exercice réduit le risque d’un nouvel épisode de lombalgie, surtout associé à l’éducation, alors que l’éducation seule, les ceintures et les semelles n’ont pas d’effet. L’effet s’atténue au delà d’un an : la prévention qui marche est celle qu’on continue. Pour le sportif, le plus simple est d’intégrer le renforcement du tronc et des hanches à l’entraînement habituel, plutôt que d’en faire un programme à part qu’il abandonnera.</p><p>La gestion de la charge compte aussi : les épisodes surviennent volontiers après une augmentation brutale du volume ou de l’intensité. Une progression régulière de l’entraînement est une mesure de prévention à part entière.</p>$h$, 'preuve', 2);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Ardern CL, Glasgow P, Schneiders A et al. 2016 Consensus statement on return to sport from the First World Congress in Sports Physical Therapy, Bern. Br J Sports Med.',
   2016, 'consensus', 'Le retour au sport comme une progression guidée par des critères, et non par un délai.', NULL, 0),
  (v_ch, 'Steffens D, Maher CG, Pereira LS et al. Prevention of low back pain: a systematic review and meta-analysis. JAMA Intern Med.',
   2016, 'meta_analyse', 'L’exercice, seul ou avec l’éducation, prévient la lombalgie ; l’éducation seule, les ceintures et les semelles, non.', NULL, 1);

  ---------------------------------------------------------------------------
  -- C4. Travail.
  ---------------------------------------------------------------------------
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES (v_module, 'travail', 'Le travail : maintenir et reprendre',
    'Le travail fait partie du traitement',
    'Situations particulières', 'traitement',
    'Rester au travail ou reprendre tôt améliore la récupération, et un arrêt qui se prolonge est l’un des meilleurs prédicteurs de chronicité. Ce chapitre donne ce que le thérapeute peut faire, et les dispositifs qui existent en France.',
    jsonb_build_array(
      'Intégrer le travail aux objectifs de la prise en charge.',
      'Connaître les dispositifs de maintien et de reprise du travail en France.',
      'Savoir ce qui prévient la lombalgie au travail, et ce qui ne la prévient pas.'),
    jsonb_build_array(
      'Le maintien ou la reprise précoce du travail, avec aménagement si besoin, est recommandé.',
      'Un arrêt de plus de 30 jours ouvre la visite de pré-reprise auprès du médecin du travail.',
      'Les ceintures lombaires et la formation au port de charge seule ne préviennent pas la lombalgie.',
      'Les objectifs de travail s’écrivent dès la première séance.'),
    30, 99)
  ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
    summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'travail';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Le travail fait partie du traitement',
   $h$<p>Les recommandations convergent : rester au travail, ou y retourner tôt, avec un aménagement temporaire si nécessaire, améliore la récupération. À l’inverse, un arrêt qui se prolonge est l’un des facteurs les plus liés au passage à la chronicité, et plus il dure, plus le retour est difficile. La HAS recommande de favoriser le maintien dans l’emploi dès la première consultation.</p><p>Le thérapeute n’a pas la main sur l’arrêt de travail, mais il a une influence réelle : ce qu’il dit du travail, les objectifs qu’il fixe, et ce qu’il écrit au médecin.</p>$h$, 'cle', 0),
  (v_ch, 'Ce que vous pouvez faire',
   $h$<p><strong>Interroger sur le travail.</strong> Les tâches réelles, les postures et les charges, la possibilité d’aménager, la relation avec l’employeur, et ce que le patient croit du lien entre son travail et son dos. « Mon travail m’abîme le dos » est un drapeau bleu, qui pèse sur la reprise.</p><p><strong>Fixer des objectifs de travail.</strong> Dès la première séance, l’objectif fonctionnel inclut le travail : reprendre tel poste, telle tâche, dans tel délai, éventuellement à temps partiel.</p><p><strong>Écrire.</strong> Un courrier au médecin traitant qui décrit les capacités actuelles, ce qui reste difficile et un aménagement réaliste aide à décider d’une reprise. Suggérer au patient de contacter le médecin du travail est souvent l’étape qui débloque la situation.</p>$h$, 'pratique', 1),
  (v_ch, 'Les dispositifs en France',
   $h$<p><strong>La visite de pré-reprise</strong> auprès du médecin du travail est possible pour tout arrêt de plus de 30 jours, à la demande du salarié, de son médecin traitant ou du médecin du travail. C’est le moment de préparer un aménagement de poste avant la reprise, et elle est trop peu utilisée.</p><p><strong>La visite de reprise</strong> est obligatoire après un arrêt d’au moins 60 jours pour une maladie ou un accident non professionnel, et d’au moins 30 jours pour un accident du travail. Le seuil de 60 jours est en vigueur depuis la réforme du 31 mars 2022.</p><p><strong>Le temps partiel thérapeutique</strong>, prescrit par le médecin traitant, permet une reprise progressive.</p><p>Ces règles évoluent : vérifier leur version à jour avant de les citer à un patient. La convention collective peut prévoir des seuils plus favorables.</p>$h$, 'pratique', 2),
  (v_ch, 'Ce qui ne prévient pas',
   $h$<p>La méta-analyse de Steffens est nette : l’exercice, seul ou associé à l’éducation, réduit le risque d’épisode de lombalgie et d’arrêt de travail, alors que les ceintures lombaires, les semelles et l’éducation seule n’ont pas d’effet. La formation aux gestes et postures, encore très répandue en entreprise, ne réduit pas l’incidence de la lombalgie, comme le détaille le chapitre sur les fausses croyances. Une prévention qui marche en entreprise ressemble donc davantage à de l’activité physique régulière qu’à un cours sur la bonne façon de soulever un carton.</p>$h$, 'preuve', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Steffens D, Maher CG, Pereira LS et al. Prevention of low back pain: a systematic review and meta-analysis. JAMA Intern Med.',
   2016, 'meta_analyse', 'Exercice efficace pour prévenir la lombalgie et l’arrêt de travail ; ceintures, semelles et éducation seule sans effet.', NULL, 0),
  (v_ch, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.',
   2019, 'recommandation', 'Favoriser le maintien dans l’emploi dès la première consultation.', NULL, 1),
  (v_ch, 'Code du travail : visites de préreprise et de reprise, règles en vigueur pour les arrêts commencés depuis le 31 mars 2022. Fiche officielle « Un salarié doit-il passer une visite médicale après un arrêt de travail ? ».',
   2022, 'recommandation', 'Visite de pré-reprise au delà de 30 jours d’arrêt, visite de reprise à 60 jours (30 jours pour un accident du travail).', 'https://code.travail.gouv.fr/fiche-service-public/un-salarie-doit-il-passer-une-visite-medicale-apres-un-arret-de-travail', 2);

  ---------------------------------------------------------------------------
  -- L'ordre complet du parcours.
  ---------------------------------------------------------------------------
  SELECT string_agg(slug, ', ') INTO v_orphelins
    FROM public.region_chapters
   WHERE module_id = v_module AND NOT (slug = ANY (v_ordre));
  IF v_orphelins IS NOT NULL THEN
    RAISE EXCEPTION 'Chapitres absents de la liste d’ordre : %', v_orphelins;
  END IF;

  UPDATE public.region_chapters c
     SET order_index = array_position(v_ordre, c.slug) - 1
   WHERE c.module_id = v_module;
END
$do$;
