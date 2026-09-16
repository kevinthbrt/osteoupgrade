-- Module « Région lombaire » : création du module et des sept premiers
-- chapitres (comprendre, puis trier).
--
-- Le module est créé en `draft` : le contenu clinique est relu avant d'être
-- servi aux abonnés. Il est visible des administrateurs dès maintenant, la
-- policy de lecture laissant passer `is_admin()`.
--
-- Le texte utilise l'apostrophe typographique, ce qui évite tout doublement
-- d'apostrophe dans les chaînes SQL.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN

  INSERT INTO public.region_modules (
    region, slug, title, subtitle, intro_html, objectives, prerequisites,
    estimated_hours, status, order_index
  ) VALUES (
    'lombaire',
    'lombaire',
    'Région lombaire',
    'Diagnostiquer, traiter et réorienter une lombalgie, du premier motif de consultation au cas complexe',
    '<p>La lombalgie est le premier motif de consultation en thérapie manuelle et la première cause mondiale d’années vécues avec incapacité. C’est aussi le domaine où l’écart est le plus grand entre ce que la littérature établit et ce qui se pratique encore : imagerie prescrite trop tôt, diagnostics structurels affirmés sans preuve, techniques choisies par habitude plutôt que par indication.</p><p>Ce parcours prend le problème dans l’ordre où il se pose en consultation. D’abord écarter ce qui ne relève pas de nous. Ensuite reconnaître le tableau clinique, en sachant ce que chaque test apporte vraiment. Enfin choisir un traitement dont l’effet est documenté, et savoir dire quand il faut passer la main.</p><p>Chaque chapitre cite les tests orthopédiques, les clusters, les pathologies et les vidéos déjà présents sur la plateforme : les valeurs de sensibilité et de spécificité affichées sont celles des fiches, corrigées à un seul endroit.</p>',
    jsonb_build_array(
      'Trier une lombalgie en trois catégories dès la première consultation, et savoir laquelle impose un avis médical',
      'Reconnaître les drapeaux rouges sans surdiagnostiquer, en connaissant la valeur réelle de chacun',
      'Conduire un examen lombaire complet et interpréter chaque test avec son rapport de vraisemblance',
      'Distinguer radiculopathie, sténose, douleur discogénique, facettaire, instabilité et ceinture pelvienne',
      'Choisir une technique manuelle sur indication et non par habitude, et en connaître le niveau de preuve',
      'Construire un plan de traitement adapté au profil du patient et rédiger une réorientation utile'
    ),
    'Anatomie et biomécanique du rachis lombaire. Bases de l’examen neurologique du membre inférieur.',
    12.0,
    'draft',
    0
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    intro_html = EXCLUDED.intro_html,
    objectives = EXCLUDED.objectives,
    prerequisites = EXCLUDED.prerequisites,
    estimated_hours = EXCLUDED.estimated_hours
  RETURNING id INTO v_module;

  -- ==========================================================================
  -- CHAPITRE 1
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'epidemiologie',
    'La lombalgie en chiffres, et ce que ces chiffres changent',
    'Pourquoi l’histoire naturelle doit précéder le diagnostic',
    'Comprendre', 'fondamentaux',
    'Ce que l’épidémiologie impose au raisonnement : une prévalence énorme, une évolution spontanément favorable dans la majorité des cas, et une minorité de patients qui concentre l’incapacité. Ces trois faits déterminent la place du diagnostic structurel et celle du pronostic.',
    jsonb_build_array(
      'Situer la lombalgie dans la charge mondiale de morbidité',
      'Décrire l’histoire naturelle d’un épisode et le taux réel de récidive',
      'Expliquer pourquoi le pronostic pèse plus lourd que le diagnostic tissulaire dans la plupart des cas'
    ),
    jsonb_build_array(
      'La lombalgie est la première cause mondiale d’années vécues avec incapacité.',
      'Environ 90 % des lombalgies n’ont pas de cause structurelle identifiable avec certitude, ce qui n’en fait pas des douleurs sans cause.',
      'La majorité des épisodes s’améliore nettement en six semaines, mais la douleur résiduelle et la récidive sont la règle, pas l’exception.',
      'Prédire l’évolution change plus la prise en charge que nommer un tissu.'
    ),
    25, 0
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le premier problème de santé du monde',
   '<p>La lombalgie occupe la première place mondiale des causes d’années vécues avec incapacité, devant la dépression et les céphalées. Près de 80 % des adultes en font l’expérience au moins une fois. En consultation de thérapie manuelle, elle représente le motif dominant, ce qui a une conséquence directe : la probabilité pré-test de « lombalgie commune » est écrasante avant même que le patient se soit déshabillé.</p><p>Cette prévalence a une contrepartie que l’on oublie. Une pathologie grave reste rare, mais comme le volume de patients est immense, chaque praticien en croise. Le raisonnement ne consiste donc pas à chercher la maladie rare dans chaque dossier, mais à disposer d’un filtre suffisamment fiable pour ne pas la laisser passer quand elle se présente.</p>',
   'none', 0),
  (v_chapter, 'Ce que devient un épisode',
   '<p>L’évolution spontanée est franchement favorable sur les premières semaines : l’essentiel de la réduction de douleur et d’incapacité se produit dans le premier mois, puis la courbe s’aplatit. Au delà de trois mois, l’amélioration devient lente. Les données de cohortes montrent qu’environ un tiers des patients gardent une douleur résiduelle à un an, et que la moitié environ connaît une récidive dans l’année.</p><p>Deux erreurs symétriques en découlent. Attribuer l’amélioration du premier mois à sa technique, alors que l’histoire naturelle y suffisait souvent. Et à l’inverse, banaliser une douleur qui dure au delà de six à huit semaines en disant qu’elle passera, alors que c’est précisément le moment où la trajectoire se joue.</p>',
   'none', 1),
  (v_chapter, 'Trois faits qui commandent le reste du parcours',
   '<p>Premier fait : la corrélation entre les images et la douleur est faible. Les études sur sujets asymptomatiques retrouvent des dégénérescences discales chez une majorité de quarantenaires, et des protrusions chez environ un tiers. Nommer la dégénérescence comme cause devant un patient est donc rarement justifié, et jamais anodin.</p><p>Deuxième fait : les facteurs qui prédisent l’incapacité à un an sont majoritairement psychosociaux, pas anatomiques. Peur du mouvement, catastrophisme, insatisfaction au travail, faible attente de guérison pèsent plus que la taille d’une hernie.</p><p>Troisième fait : les traitements efficaces ont tous des effets modestes, comparables entre eux, et supérieurs au rien mais pas au reste. Cela rend le choix de la technique moins décisif que le choix du patient à qui on la propose.</p>',
   'cle', 2),
  (v_chapter, 'La conséquence pratique',
   '<p>Le diagnostic reste indispensable pour trier, c’est à dire pour écarter les 5 à 10 % de lombalgies qui ne relèvent pas de la thérapie manuelle. Au delà de ce tri, l’effort de précision tissulaire donne un rendement décroissant : identifier « le » tissu coupable d’une lombalgie commune n’est ni fiable ni, le plus souvent, utile à la décision.</p><p>Ce que l’on gagne à la place : estimer le risque de chronicisation, repérer les croyances qui vont freiner la récupération, et mettre en face un traitement dont l’effet est documenté. C’est ce que fait la suite du parcours.</p>',
   'pratique', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Hartvigsen J, Hancock MJ, Kongsted A et al. What low back pain is and why we need to pay attention. Lancet Low Back Pain Series. Lancet.', 2018, 'revue_systematique', 'La référence de cadrage : épidémiologie, histoire naturelle, et démonstration de l’écart entre pratique courante et données probantes.', 0),
  (v_chapter, 'Foster NE, Anema JR, Cherkin D et al. Prevention and treatment of low back pain: evidence, challenges, and promising directions. Lancet.', 2018, 'revue_systematique', 'Deuxième volet de la série : les traitements qui marchent, ceux qui ne marchent pas, et ceux qui sont encore largement utilisés à tort.', 1),
  (v_chapter, 'Brinjikji W, Luetmer PH, Comstock B et al. Systematic literature review of imaging features of spinal degeneration in asymptomatic populations. AJNR Am J Neuroradiol.', 2015, 'revue_systematique', 'Les chiffres à connaître par cœur pour répondre à un patient qui arrive avec son compte rendu d’IRM.', 2),
  (v_chapter, 'Itz CJ, Geurts JW, van Kleef M, Nelemans P. Clinical course of non-specific low back pain: a systematic review of prospective cohort studies. Eur J Pain.', 2013, 'revue_systematique', 'Histoire naturelle : amélioration rapide le premier mois, plateau ensuite, douleur résiduelle fréquente à un an.', 3);

  -- ==========================================================================
  -- CHAPITRE 2
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'classification',
    'Trois catégories, pas cinquante',
    'Le modèle de tri diagnostique qui structure toute la consultation',
    'Comprendre', 'raisonnement',
    'Les recommandations internationales convergent sur un tri en trois catégories : pathologie spécifique, douleur radiculaire, lombalgie non spécifique. Ce chapitre détaille ce que chaque catégorie recouvre, ce qu’elle implique et pourquoi la troisième n’est pas un aveu d’ignorance.',
    jsonb_build_array(
      'Classer un patient dans l’une des trois catégories dès la fin de l’interrogatoire',
      'Expliquer ce que « non spécifique » signifie et ce qu’il ne signifie pas',
      'Reconnaître les limites du modèle et savoir quand le sous-classement devient utile'
    ),
    jsonb_build_array(
      'Pathologie spécifique : moins de 5 % des cas, mais c’est la catégorie qui fait la sécurité de la consultation.',
      'Douleur radiculaire : 5 à 10 % des cas, reconnaissable sur la topographie et confirmée par la convergence des tests.',
      'Lombalgie non spécifique : 85 à 90 %, un constat d’impossibilité d’attribuer la douleur à un tissu précis de façon fiable, pas une absence de cause.',
      'Le tri se fait à l’interrogatoire, l’examen ne fait que le confirmer ou le remettre en question.'
    ),
    30, 1
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Catégorie 1 : la pathologie spécifique',
   '<p>Fracture, tumeur ou métastase, infection (spondylodiscite, abcès épidural), spondyloarthrite axiale, syndrome de la queue de cheval, et les douleurs d’origine viscérale ou vasculaire projetées sur le rachis. Ensemble, ces situations représentent moins de 5 % des lombalgies vues en soins primaires, et une part encore plus faible en cabinet de thérapie manuelle.</p><p>Leur point commun n’est pas la rareté mais la conséquence d’un retard : c’est la seule catégorie où manquer le diagnostic expose à un dommage irréversible. Tout le travail de triage du parcours porte sur elle.</p>',
   'none', 0),
  (v_chapter, 'Catégorie 2 : la douleur radiculaire',
   '<p>Elle recouvre la radiculalgie par conflit disco-radiculaire, la radiculopathie avec déficit, et la claudication neurogène de la sténose. Le point d’entrée est la topographie : une douleur qui descend sous le genou, de trajet systématisé, souvent associée à des paresthésies, et reproduite par les tests neurodynamiques.</p><p>Le piège classique est la douleur somatique référée, qui vient des structures lombaires elles mêmes et se projette dans la fesse et la cuisse sans dépasser le genou, sans systématisation ni déficit. La confondre avec une sciatique conduit à un traitement et à un discours inadaptés.</p>',
   'none', 1),
  (v_chapter, 'Catégorie 3 : la lombalgie non spécifique',
   '<p>C’est le reste, soit 85 à 90 % des patients. L’étiquette dit exactement ceci : avec les moyens cliniques et d’imagerie disponibles, on ne peut pas attribuer la douleur à un tissu identifié de façon fiable et reproductible. Elle ne dit pas que la douleur est imaginaire, ni qu’elle n’a pas de cause, ni qu’il n’y a rien à faire.</p><p>La confusion est fréquente, y compris chez les praticiens, et se transmet au patient sous la forme « on ne trouve rien ». Une formulation utilisable en consultation : « votre dos est douloureux, sensibilisé, et cela vient du rachis lui même ; ce que l’examen ne permet pas de dire, c’est lequel des tissus est en cause, et pour votre traitement cela ne change presque rien ».</p>',
   'piege', 2),
  (v_chapter, 'Les limites du modèle',
   '<p>Le modèle en trois catégories est un outil de sécurité, pas une théorie de la douleur. Il ne guide pas le choix de la technique, il ne dit rien du pronostic, et il agrège dans sa troisième catégorie des tableaux cliniques très différents : le patient qui se centralise en extension et celui qui ne tolère que la flexion n’ont pas le même problème.</p><p>C’est pourquoi le parcours superpose ensuite deux étages : le sous-classement clinique par tableau (discogénique, facettaire, instabilité, ceinture pelvienne), utile pour choisir une première intention, et la stratification pronostique, utile pour calibrer l’intensité de la prise en charge.</p>',
   'none', 3),
  (v_chapter, 'Le tri se joue à l’interrogatoire',
   '<p>Un interrogatoire conduit correctement classe le patient avant l’examen physique. La suite de l’examen sert à tester l’hypothèse, pas à la découvrir. C’est un changement d’habitude important pour beaucoup de praticiens : les tests ne sont pas une batterie à dérouler, ce sont des questions posées à une hypothèse déjà formulée.</p>',
   'cle', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s: assessment and management. NICE guideline NG59.', 2020, 'recommandation', 'Recommandation de référence : tri en catégories, place de l’imagerie, traitements recommandés et déconseillés.', 0),
  (v_chapter, 'Organisation mondiale de la santé. WHO guideline for non-surgical management of chronic primary low back pain in adults in primary and community care settings.', 2023, 'recommandation', 'Cadre international le plus récent, avec une revue des interventions non chirurgicales et de leur niveau de preuve.', 1),
  (v_chapter, 'Bardin LD, King P, Maher CG. Diagnostic triage for low back pain: a practical approach for primary care. Med J Aust.', 2017, 'consensus', 'La mise en pratique la plus lisible du tri en trois catégories, pensée pour la consultation.', 2),
  (v_chapter, 'Maher C, Underwood M, Buchbinder R. Non-specific low back pain. Lancet.', 2017, 'revue_systematique', 'Ce que recouvre exactement le terme « non spécifique » et pourquoi il reste défendable.', 3);

  -- ==========================================================================
  -- CHAPITRE 3
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'valeur-des-tests',
    'Décider avec des probabilités',
    'Sensibilité, spécificité, rapports de vraisemblance et clusters',
    'Comprendre', 'raisonnement',
    'Un test ne donne jamais un diagnostic, il déplace une probabilité. Ce chapitre fournit l’outillage pour lire les chiffres affichés sur chaque fiche de test de la plateforme et pour comprendre pourquoi les clusters battent les tests isolés.',
    jsonb_build_array(
      'Interpréter une sensibilité et une spécificité en termes de décision clinique',
      'Utiliser un rapport de vraisemblance pour déplacer une probabilité pré-test',
      'Expliquer pourquoi un cluster de tests est supérieur à la somme de ses tests'
    ),
    jsonb_build_array(
      'Un test sensible qui revient négatif écarte. Un test spécifique qui revient positif retient.',
      'Un rapport de vraisemblance positif supérieur à 10, ou négatif inférieur à 0,1, change vraiment une décision. Entre 0,5 et 2, le test n’a presque rien apporté.',
      'La probabilité pré-test dépend du motif de consultation et de la population : le même test ne vaut pas la même chose en cabinet libéral et aux urgences.',
      'Les clusters existent parce que la plupart des tests lombaires isolés ont un rapport de vraisemblance trop proche de 1 pour décider seuls.'
    ),
    35, 2
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Sensibilité et spécificité : deux questions différentes',
   '<p>La sensibilité répond à : parmi les malades, combien le test détecte ? Un test très sensible qui revient négatif rend la maladie improbable, c’est un test d’exclusion. La spécificité répond à : parmi les non malades, combien le test épargne ? Un test très spécifique qui revient positif rend la maladie probable, c’est un test de confirmation.</p><p>L’exemple lombaire canonique est la paire Lasègue et Lasègue croisé. Le Lasègue est sensible et peu spécifique : négatif, il écarte sérieusement le conflit disco-radiculaire ; positif, il n’apporte pas grand chose. Le Lasègue croisé est l’inverse : rarement positif, mais quand il l’est, il pèse lourd. Les deux font le même geste et ne servent pas à la même chose.</p>',
   'none', 0),
  (v_chapter, 'Le rapport de vraisemblance, seul chiffre vraiment utilisable',
   '<p>Le rapport de vraisemblance combine les deux en une valeur qui s’applique directement à votre patient. Le principe : probabilité avant le test, multiplication par le rapport, probabilité après le test. Repères usuels : au dessus de 10, le test positif emporte la décision ; entre 5 et 10, il pèse ; entre 2 et 5, il oriente ; en dessous de 2, il n’a presque rien changé. Symétriquement pour le rapport négatif avec les seuils 0,1, 0,2 et 0,5.</p><p>Chaque fiche de test de la plateforme affiche ces valeurs quand elles sont établies. Quand la case est vide, ce n’est pas un oubli : cela signifie que la littérature ne fournit pas de chiffre stable, et que le test doit être utilisé comme signe d’orientation.</p>',
   'cle', 1),
  (v_chapter, 'La probabilité pré-test décide de tout',
   '<p>Un test appliqué à une population où la maladie est rare produit surtout des faux positifs, quelle que soit sa spécificité. C’est la raison mathématique pour laquelle rechercher systématiquement tous les drapeaux rouges chez tous les patients produit plus de fausses alertes que de diagnostics.</p><p>En pratique, la probabilité pré-test se construit avec trois éléments : le motif de consultation, l’âge et le terrain, et le mode d’installation. Elle est déjà largement déterminée quand l’examen commence.</p>',
   'none', 2),
  (v_chapter, 'Pourquoi les clusters',
   '<p>Pris isolément, la plupart des tests lombaires ont un rapport de vraisemblance entre 1,5 et 3, insuffisant pour décider. Regrouper plusieurs tests indépendants et exiger un seuil (trois positifs sur cinq, par exemple) augmente la spécificité sans effondrer la sensibilité. C’est le principe des clusters de Laslett pour la sacro-iliaque, de Cook pour la sténose, ou des règles de Flynn et de Hicks pour la réponse au traitement.</p><p>Deux précautions. Les tests d’un cluster doivent apporter une information non redondante : trois tests de provocation qui compriment la même structure dans le même axe ne valent qu’un seul test. Et une règle développée dans une population donnée ne se transporte pas automatiquement ailleurs : la validation externe est la partie qui manque le plus souvent.</p>',
   'preuve', 3),
  (v_chapter, 'Les clusters lombaires disponibles sur la plateforme',
   '<p>Les fiches ci dessous détaillent chaque item, son seuil et sa source. Elles servent de référence pour les chapitres de diagnostic qui suivent.</p>',
   'pratique', 4);

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, x.note, x.ord
  FROM (VALUES
    ('Cluster de Laslett', 'Exemple de cluster diagnostique : trois tests de provocation positifs sur cinq, avec un gain de spécificité net par rapport à chaque test isolé.', 0),
    ('Cluster de Cook', 'Exemple de cluster construit sur des items d’interrogatoire autant que d’examen, pour la sténose lombaire.', 1),
    ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'Exemple de règle de réponse au traitement, à ne pas confondre avec une règle diagnostique.', 2),
    ('Règle d''instabilité clinique de Hicks (programme de stabilisation)', 'Second exemple de règle de réponse au traitement, orientée contrôle moteur.', 3)
  ) AS x(cluster_name, note, ord)
  JOIN public.orthopedic_test_clusters cl ON cl.name = x.cluster_name
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de Lasègue (SLR)', 'Le test sensible de la paire : sa négativité vaut plus que sa positivité.', 0),
    ('Test de Lasègue croisé', 'Le test spécifique de la paire : rarement positif, décisif quand il l’est.', 1)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON t.name = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Jaeschke R, Guyatt GH, Sackett DL. Users’ guides to the medical literature. III. How to use an article about a diagnostic test. JAMA.', 1994, 'ouvrage', 'Le texte fondateur sur l’usage clinique des rapports de vraisemblance, toujours le plus clair.', 0),
  (v_chapter, 'Cook CE, Hegedus EJ. Orthopedic Physical Examination Tests: An Evidence-Based Approach. Pearson.', 2013, 'ouvrage', 'Recense les valeurs diagnostiques test par test, avec la qualité méthodologique de chaque étude.', 1),
  (v_chapter, 'Laslett M, Aprill CN, McDonald B, Young SB. Diagnosis of sacroiliac joint pain: validity of individual provocation tests and composites of tests. Man Ther.', 2005, 'etude', 'La démonstration du gain apporté par un cluster par rapport aux tests isolés.', 2),
  (v_chapter, 'Hancock MJ, Maher CG, Latimer J et al. Systematic review of tests to identify the disc, SIJ or facet joint as the source of low back pain. Eur Spine J.', 2007, 'revue_systematique', 'Revue décisive : aucun test isolé ne permet d’identifier le tissu source de façon fiable.', 3);

  -- ==========================================================================
  -- CHAPITRE 4
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'drapeaux-rouges',
    'Drapeaux rouges : ce qu’ils valent vraiment',
    'Repérer la pathologie grave sans déclencher une fausse alerte par consultation',
    'Trier', 'triage',
    'Les listes de drapeaux rouges sont longues et la plupart de leurs items, pris isolément, ont une valeur diagnostique proche de zéro. Ce chapitre remet chaque signal à sa place et propose une conduite par faisceau plutôt que par case cochée.',
    jsonb_build_array(
      'Citer les quatre familles de pathologies spécifiques à ne pas manquer et leurs signaux propres',
      'Expliquer pourquoi un drapeau rouge isolé ne justifie presque jamais une alerte',
      'Construire une conduite à tenir graduée : surveiller, adresser, adresser en urgence'
    ),
    jsonb_build_array(
      'Pris isolément, la plupart des drapeaux rouges ont une spécificité si basse qu’ils génèrent surtout des faux positifs.',
      'Trois exceptions à forte valeur : antécédent de cancer, corticothérapie prolongée, traumatisme significatif chez un sujet âgé ou ostéoporotique.',
      'C’est la combinaison de signaux et surtout l’évolution atypique qui alertent, pas la case cochée.',
      'Une douleur nocturne qui réveille, isolée, n’est pas un drapeau rouge : elle est banale dans la lombalgie commune.'
    ),
    45, 3
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le problème des listes',
   '<p>Les recommandations recensent jusqu’à une trentaine de drapeaux rouges. Confrontés à un diagnostic de référence, la plupart se révèlent très peu spécifiques : appliqués à une population de soins primaires où la pathologie grave représente moins de 1 % des cas, ils déclenchent bien plus de fausses alertes que de vrais diagnostics. La revue de Downie et celle de Henschke sont formelles sur ce point.</p><p>Conséquence pratique : cocher une case ne doit pas déclencher une conduite. Ce qui déclenche, c’est un faisceau, ou un item à forte valeur, ou une évolution qui ne ressemble pas à ce qu’on attendait.</p>',
   'preuve', 0),
  (v_chapter, 'Fracture vertébrale',
   '<p>Les items utiles sont : l’âge élevé, surtout après 70 ans, la corticothérapie prolongée, le traumatisme même mineur chez un sujet fragile, et l’ostéoporose connue. Leur combinaison fait grimper la probabilité rapidement, alors qu’aucun ne suffit isolément.</p><p>Deux signes cliniques ont une valeur intéressante dans ce contexte : la percussion à poing fermé sur les épineuses et le signe du décubitus, dont les fiches détaillent les valeurs publiées. Ils ne remplacent pas l’imagerie mais aident à décider s’il faut la demander.</p>',
   'none', 1),
  (v_chapter, 'Tumeur et métastase',
   '<p>Le seul item à forte valeur est l’antécédent personnel de cancer, en particulier sein, prostate, poumon, rein, thyroïde. Il suffit à lui seul à justifier un avis. Les autres signaux classiques (âge supérieur à 50 ans, amaigrissement inexpliqué, absence d’amélioration après un mois, douleur non mécanique) n’ont de valeur qu’en association.</p><p>La chronologie compte autant que la liste : une lombalgie nouvelle, qui s’aggrave progressivement, sans facteur déclenchant et sans position antalgique, chez un patient de plus de 50 ans, est un motif d’avis médical même si aucune case n’est cochée.</p>',
   'none', 2),
  (v_chapter, 'Infection rachidienne',
   '<p>Spondylodiscite et abcès épidural sont rares et graves, et leur retard diagnostique se compte en semaines dans la littérature. Les signaux : fièvre, mais elle manque dans une part importante des cas, immunodépression, diabète, toxicomanie intraveineuse, geste rachidien ou infiltration récente, infection urinaire ou cutanée récente, et surtout une douleur rachidienne intense, permanente, non calmée par le décubitus.</p><p>L’abcès épidural ajoute un déficit neurologique d’installation rapide. C’est une urgence chirurgicale.</p>',
   'drapeau_rouge', 3),
  (v_chapter, 'Ce qui n’est pas un drapeau rouge',
   '<p>La douleur nocturne isolée : plus de la moitié des lombalgiques communs sont réveillés par leur douleur en changeant de position. Ce qui alerte, c’est la douleur qui empêche de se rendormir et qui n’est soulagée par aucune position.</p><p>La raideur matinale de quelques minutes : elle est banale. Au delà de trente à quarante cinq minutes, elle oriente vers l’inflammatoire, ce que traite un chapitre dédié.</p><p>L’âge supérieur à 50 ans pris seul : c’est le cas de la majorité des patients d’un cabinet.</p>',
   'piege', 4),
  (v_chapter, 'Conduite graduée',
   '<p>Trois niveaux, à décider explicitement en fin de consultation. <strong>Urgence</strong> : queue de cheval, déficit moteur rapidement progressif, suspicion d’infection rachidienne avec fièvre, suspicion de rupture d’anévrisme. Le patient ne repart pas sans une prise en charge organisée le jour même. <strong>Avis médical rapide</strong>, sous quelques jours : antécédent de cancer, suspicion de fracture, suspicion de spondyloarthrite, déficit moteur stable. Le traitement manuel peut commencer prudemment en parallèle selon le cas. <strong>Surveillance</strong> : tableau commun mais atypique par un point. On traite, on fixe un délai de réévaluation court, et on explique au patient ce qui doit le faire revenir plus tôt.</p>',
   'reorientation', 5);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Fracture tassement Lombaire', 'drapeau_rouge', 'Le tableau le plus fréquent des quatre, et le plus accessible à la clinique.', 0),
    ('Processus métastatique cancereux', 'drapeau_rouge', 'L’antécédent de cancer est le seul item à forte valeur isolée.', 1),
    ('Spondylodiscite infectieuse', 'drapeau_rouge', 'Fièvre inconstante : son absence ne rassure pas.', 2),
    ('Abcès épidural spinal', 'drapeau_rouge', 'Urgence chirurgicale dès l’apparition d’un déficit.', 3),
    ('Sacro-iliite infectieuse', 'drapeau_rouge', 'À évoquer devant une fessalgie fébrile chez un sujet à risque.', 4)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role = EXCLUDED.role, note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Closed Fist Percussion Test', 'Utile dans la suspicion de fracture vertébrale, à interpréter avec le terrain.', 0),
    ('Supine Sign', 'Second signe de la suspicion de fracture : incapacité à rester en décubitus dorsal.', 1)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON t.name = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  INSERT INTO public.region_chapter_clusters (chapter_id, cluster_id, note, order_index)
  SELECT v_chapter, cl.id, 'Combinaison des signes de suspicion de fracture vertébrale.', 0
  FROM public.orthopedic_test_clusters cl WHERE cl.name = 'Cluster Fracture Vertébrale'
  ON CONFLICT (chapter_id, cluster_id) DO UPDATE SET note = EXCLUDED.note;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Downie A, Williams CM, Henschke N et al. Red flags to screen for malignancy and fracture in patients with low back pain: systematic review. BMJ.', 2013, 'revue_systematique', 'La revue qui a changé la donne : la plupart des drapeaux rouges isolés ont une valeur informative très faible.', 0),
  (v_chapter, 'Henschke N, Maher CG, Ostelo RW et al. Red flags to screen for malignancy in patients with low-back pain. Cochrane Database Syst Rev.', 2013, 'revue_systematique', 'Confirme que seul l’antécédent de cancer modifie réellement la probabilité de malignité.', 1),
  (v_chapter, 'Verhagen AP, Downie A, Popal N et al. Red flags presented in current low back pain guidelines: a review. Eur Spine J.', 2016, 'revue_systematique', 'Compare les listes de drapeaux rouges des recommandations : elles divergent largement et sont rarement fondées.', 2),
  (v_chapter, 'Finucane LM, Downie A, Mercer C et al. International framework for red flags for potential serious spinal pathologies. J Orthop Sports Phys Ther.', 2020, 'consensus', 'Le cadre de référence pour les thérapeutes manuels : raisonner par faisceau et par évolution, avec une conduite graduée.', 3);

  -- ==========================================================================
  -- CHAPITRE 5
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'queue-de-cheval',
    'Le syndrome de la queue de cheval',
    'La seule urgence que l’on ne peut pas se permettre de manquer',
    'Trier', 'triage',
    'Rare, dramatique, et régulièrement diagnostiqué trop tard parce que ses premiers signes sont discrets et que le patient ne les rapporte pas spontanément. Ce chapitre décrit le questionnement à mener et la conduite à tenir immédiate.',
    jsonb_build_array(
      'Poser les questions de dépistage de la queue de cheval sans les oublier ni les dramatiser',
      'Reconnaître les formes incomplètes, qui sont celles où l’on gagne encore quelque chose',
      'Organiser une réorientation en urgence et savoir quoi dire au patient'
    ),
    jsonb_build_array(
      'Les trois questions à poser : troubles urinaires récents, anesthésie en selle, déficit moteur bilatéral ou troubles génito-sexuels nouveaux.',
      'La rétention urinaire est un signe tardif : attendre ce signe, c’est attendre le stade où la récupération devient incertaine.',
      'Le délai de décompression conditionne la récupération sphinctérienne : l’avis est immédiat, pas le lendemain.',
      'Tout patient lombalgique avec radiculalgie doit repartir en sachant quels signes imposent d’aller aux urgences.'
    ),
    30, 4
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Ce qui se passe',
   '<p>Une compression des racines de la queue de cheval, le plus souvent par une hernie discale volumineuse et médiane, plus rarement par une tumeur, un hématome ou une infection. Le tableau associe, à des degrés variables, des troubles sphinctériens, une anesthésie du périnée, un déficit moteur souvent bilatéral et asymétrique, et une abolition des réflexes.</p><p>L’incidence est faible, de l’ordre de un à trois cas pour cent mille par an, mais ces patients passent par des cabinets de thérapie manuelle avant d’arriver aux urgences.</p>',
   'none', 0),
  (v_chapter, 'Les questions à poser, et comment',
   '<p>Trois domaines, à explorer chez tout patient présentant une radiculalgie ou une lombalgie aiguë sévère. <strong>Urinaire</strong> : difficulté à démarrer la miction, sensation de vessie qui ne se vide pas, perte de la sensation du passage de l’urine, fuites nouvelles. <strong>Périnéal</strong> : engourdissement ou diminution de sensibilité au niveau du périnée, des organes génitaux, de la face interne des cuisses, y compris « une sensation bizarre en s’essuyant ». <strong>Moteur et génito-sexuel</strong> : faiblesse des deux jambes, troubles de l’érection ou de la sensibilité génitale d’apparition récente.</p><p>La formulation compte. « Avez-vous des troubles sphinctériens ? » obtient des réponses négatives à tort. « Depuis que vous avez mal, avez-vous remarqué un changement quand vous urinez, même léger ? » en obtient de justes.</p>',
   'pratique', 1),
  (v_chapter, 'Les formes incomplètes sont celles qui comptent',
   '<p>La distinction classique oppose la forme avec rétention à la forme incomplète, encore sans rétention. Le pronostic des deux n’a rien à voir : la récupération sphinctérienne est nettement meilleure quand la décompression intervient avant l’installation de la rétention. Attendre le globe vésical pour s’alarmer, c’est donc attendre le moment où l’on a déjà perdu l’essentiel de ce qu’on pouvait sauver.</p><p>Le signe le plus précoce et le plus souvent négligé est la perte de la sensation du passage de l’urine, avant toute difficulté mécanique.</p>',
   'cle', 2),
  (v_chapter, 'Conduite immédiate',
   '<p>Suspicion retenue : le patient est adressé aux urgences le jour même, avec un courrier mentionnant explicitement « suspicion de syndrome de la queue de cheval » et la date d’apparition de chaque signe. Ne pas se contenter de conseiller de consulter : organiser, appeler si nécessaire, et s’assurer que le patient a compris pourquoi il n’attend pas.</p><p>Aucune manipulation, aucune technique, aucun essai de traitement en attendant. La seule action utile est le transfert.</p>',
   'reorientation', 3),
  (v_chapter, 'Le filet de sécurité',
   '<p>Pour tout patient reparti avec une radiculalgie, la consigne doit être donnée oralement et par écrit : si apparaît une difficulté à uriner, une perte de sensibilité du périnée ou une faiblesse des deux jambes, aller aux urgences sans attendre le prochain rendez-vous. Cette phrase prend dix secondes et déplace le risque de manière décisive : elle transforme un patient qui attendrait sa séance de la semaine suivante en patient qui se présente le jour même.</p>',
   'drapeau_rouge', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Todd NV, Dickson RA. Standards of care in cauda equina syndrome. Br J Neurosurg.', 2016, 'consensus', 'Le rappel que le délai de décompression conditionne la récupération, et la distinction pronostique des formes incomplètes.', 0),
  (v_chapter, 'Greenhalgh S, Finucane L, Mercer C, Selfe J. Assessment and management of cauda equina syndrome. Musculoskelet Sci Pract.', 2018, 'consensus', 'Écrit pour les thérapeutes manuels : comment poser les questions et quoi remettre au patient.', 1),
  (v_chapter, 'Fairbank J, Mallen C. Cauda equina syndrome: implications for primary care. Br J Gen Pract.', 2014, 'etude', 'Pourquoi le diagnostic est manqué en première ligne et ce qui le rattrape.', 2);

  -- ==========================================================================
  -- CHAPITRE 6
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'douleurs-viscerales-vasculaires',
    'Quand la douleur lombaire ne vient pas du dos',
    'Douleurs référées viscérales et vasculaires',
    'Trier', 'triage',
    'Le rein, le pancréas, l’aorte, l’appareil gynécologique et la prostate peuvent projeter une douleur dans la région lombaire. Ces tableaux ont un point commun décisif : la douleur ne se comporte pas comme une douleur mécanique.',
    jsonb_build_array(
      'Identifier le caractère non mécanique d’une douleur lombaire',
      'Reconnaître les tableaux viscéraux et vasculaires les plus fréquents projetant en lombaire',
      'Savoir quelle urgence relève de quelle filière'
    ),
    jsonb_build_array(
      'Le signal principal n’est pas la topographie mais le comportement : une douleur qu’aucune position ne modifie n’est pas mécanique.',
      'L’anévrisme de l’aorte abdominale est le piège le plus grave : homme de plus de 65 ans, tabagique, douleur lombaire ou abdominale profonde, masse battante.',
      'Une colique néphrétique ou une pyélonéphrite se reconnaissent à l’intensité, à l’agitation, aux signes urinaires et à la fièvre.',
      'Chez la femme, une douleur lombo-pelvienne rythmée par le cycle doit faire évoquer une cause gynécologique.'
    ),
    40, 5
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le critère qui trie : le comportement de la douleur',
   '<p>Une douleur d’origine musculosquelettique est modifiable. Elle change avec la position, le mouvement, le repos, l’effort. On peut la reproduire et la soulager, au moins partiellement, pendant la consultation. Une douleur viscérale projetée ne se comporte pas ainsi : elle est peu ou pas modifiée par les changements de position, elle évolue par vagues indépendantes de l’activité, et l’examen physique du rachis reste pauvre ou dissocié de la plainte.</p><p>Retenir un seul réflexe : si rien de ce que vous faites en consultation ne modifie la douleur, même transitoirement, cherchez ailleurs.</p>',
   'cle', 0),
  (v_chapter, 'Aorte abdominale',
   '<p>Le tableau à ne pas manquer. Terrain : homme de plus de 65 ans, tabagique ou ancien tabagique, hypertendu, athéromateux, parfois antécédent familial. La douleur est lombaire ou abdominale profonde, permanente, et l’examen peut retrouver une masse abdominale battante et expansive.</p><p>La fissuration ou la rupture réalise une douleur brutale, intense, avec malaise et choc : c’est une urgence vitale immédiate. Un anévrisme non rompu découvert chez un patient venu pour son dos justifie un avis médical rapide et l’abstention de toute manœuvre abdominale ou de traction.</p>',
   'drapeau_rouge', 1),
  (v_chapter, 'Appareil urinaire',
   '<p>La colique néphrétique donne une douleur lombaire unilatérale d’installation brutale, intense, à type de broiement, irradiant vers l’aine et les organes génitaux, avec agitation caractéristique : le patient ne trouve aucune position antalgique et ne tient pas en place, à l’inverse du lombalgique mécanique qui se fige.</p><p>La pyélonéphrite ajoute la fièvre, les frissons, les signes urinaires et une douleur provoquée à l’ébranlement de la fosse lombaire. C’est une urgence infectieuse, d’autant plus chez la femme enceinte, le diabétique et le sujet âgé.</p>',
   'none', 2),
  (v_chapter, 'Digestif et gynécologique',
   '<p>La pancréatite donne une douleur épigastrique transfixiante irradiant dans le dos, calmée par l’antéflexion, sur un terrain alcoolique ou lithiasique. L’ulcère et les affections digestives hautes projettent volontiers en thoraco-lombaire, avec un rythme alimentaire.</p><p>Chez la femme, une douleur lombo-pelvienne cyclique, aggravée en période menstruelle, avec dyspareunie profonde, oriente vers une endométriose, dont le retard diagnostique moyen se compte encore en années. Un kyste ovarien, un fibrome ou une infection pelvienne donnent aussi des douleurs lombo-sacrées. Chez l’homme, une prostatite peut se manifester par des douleurs lombo-pelviennes avec signes urinaires.</p>',
   'none', 3),
  (v_chapter, 'Vasculaire des membres inférieurs',
   '<p>La claudication artérielle donne une douleur de fesse, de cuisse ou de mollet à la marche, apparaissant après une distance reproductible, cédant en quelques minutes à l’arrêt debout, sans besoin de s’asseoir ni de se pencher. C’est le principal diagnostic différentiel de la claudication neurogène de la sténose lombaire, détaillé dans le chapitre correspondant. L’examen des pouls périphériques fait partie de l’examen de tout patient lombalgique de plus de 60 ans avec douleur d’effort.</p>',
   'none', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Anévrisme de l’aorte abdominale', 'drapeau_rouge', 'Le diagnostic à ne pas manquer chez l’homme âgé tabagique.', 0),
    ('Colique néphrétique', 'drapeau_rouge', 'Agitation et absence de position antalgique : l’inverse du tableau mécanique.', 1),
    ('Pyélonéphrite', 'drapeau_rouge', 'Fièvre et signes urinaires, urgence infectieuse.', 2),
    ('Pancréatite', 'drapeau_rouge', 'Douleur transfixiante calmée par l’antéflexion.', 3),
    ('Pathologie ulcéreuse ou autre digestive haute', 'drapeau_rouge', 'Rythme alimentaire, projection thoraco-lombaire.', 4),
    ('Endométriose Kystes ovariens / fibromes / PID', 'drapeau_rouge', 'Douleur rythmée par le cycle, dyspareunie profonde.', 5),
    ('Pathologie prostatique / prostatite', 'drapeau_rouge', 'Douleurs lombo-pelviennes avec signes urinaires chez l’homme.', 6),
    ('Claudication vasculaire des MI', 'differentiel', 'Le différentiel majeur de la claudication neurogène.', 7),
    ('Douleurs Somatiques Référées Lombaires', 'differentiel', 'À ne pas confondre avec une projection viscérale : ici la douleur reste modifiable par le mouvement.', 8)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role = EXCLUDED.role, note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Goodman CC, Snyder TK. Differential Diagnosis for Physical Therapists: Screening for Referral. Elsevier.', 2018, 'ouvrage', 'La référence du dépistage viscéral pour les thérapeutes : tableaux par organe et signaux d’alerte.', 0),
  (v_chapter, 'Wanhainen A, Van Herzeele I, Bastos Goncalves F et al. European Society for Vascular Surgery clinical practice guidelines on the management of abdominal aorto-iliac artery aneurysms. Eur J Vasc Endovasc Surg.', 2024, 'recommandation', 'Terrain à risque et conduite devant une suspicion d’anévrisme.', 1),
  (v_chapter, 'Zondervan KT, Becker CM, Missmer SA. Endometriosis. N Engl J Med.', 2020, 'revue_systematique', 'Présentation clinique et raisons du retard diagnostique, utile pour savoir quand évoquer.', 2);

  -- ==========================================================================
  -- CHAPITRE 7
  -- ==========================================================================
  INSERT INTO public.region_chapters (
    module_id, slug, title, subtitle, part, kind, summary, objectives, key_points,
    estimated_minutes, order_index
  ) VALUES (
    v_module, 'lombalgie-inflammatoire',
    'Reconnaître une lombalgie inflammatoire',
    'Spondyloarthrite axiale : le diagnostic que les thérapeutes manuels peuvent avancer de plusieurs années',
    'Trier', 'triage',
    'Le délai diagnostique de la spondyloarthrite axiale reste de plusieurs années. Ces patients consultent des thérapeutes manuels pendant tout ce temps. Reconnaître le rythme inflammatoire et adresser au bon moment est l’un des apports les plus concrets de ce parcours.',
    jsonb_build_array(
      'Distinguer un rythme inflammatoire d’un rythme mécanique à l’interrogatoire',
      'Citer les critères de lombalgie inflammatoire et les signes extra-rachidiens associés',
      'Rédiger une réorientation rhumatologique argumentée'
    ),
    jsonb_build_array(
      'Cinq critères ASAS : début avant 40 ans, installation progressive, amélioration par l’exercice, absence d’amélioration par le repos, douleur nocturne avec amélioration au lever. Quatre sur cinq définissent la lombalgie inflammatoire.',
      'La raideur matinale inflammatoire dépasse trente minutes, souvent une heure.',
      'Chercher systématiquement les signes associés : psoriasis, uvéite, maladie inflammatoire de l’intestin, talalgie, dactylite, antécédents familiaux.',
      'La réponse spectaculaire aux anti-inflammatoires non stéroïdiens est un argument supplémentaire fort.'
    ),
    35, 6
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part,
    kind = EXCLUDED.kind, summary = EXCLUDED.summary, objectives = EXCLUDED.objectives,
    key_points = EXCLUDED.key_points, estimated_minutes = EXCLUDED.estimated_minutes,
    order_index = EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Mécanique contre inflammatoire',
   '<p>La douleur mécanique augmente avec l’activité et cède au repos, la raideur matinale est brève, le réveil nocturne survient aux changements de position. La douleur inflammatoire fait l’inverse : elle est maximale en seconde partie de nuit et au réveil, elle s’améliore quand le patient bouge, elle revient à l’immobilité, et la raideur matinale dure. Un patient qui se lève à quatre heures du matin pour marcher dans son salon parce que cela le soulage décrit un rythme inflammatoire, pas une lombalgie commune.</p>',
   'cle', 0),
  (v_chapter, 'Les critères ASAS de lombalgie inflammatoire',
   '<p>Cinq items chez un patient dont la lombalgie dure depuis plus de trois mois : âge de début inférieur à 40 ans, installation progressive, amélioration par l’exercice, absence d’amélioration par le repos, douleur nocturne avec amélioration au lever. Quatre items sur cinq définissent la lombalgie inflammatoire, avec une sensibilité d’environ 77 % et une spécificité d’environ 91 % dans la population de développement.</p><p>Ces critères ne font pas le diagnostic de spondyloarthrite : ils sélectionnent les patients chez qui il faut le chercher. La confirmation appartient au rhumatologue, avec l’imagerie sacro-iliaque, le HLA-B27 et les marqueurs inflammatoires.</p>',
   'preuve', 1),
  (v_chapter, 'Ce qu’il faut chercher en plus',
   '<p>Les manifestations associées font souvent basculer la suspicion : psoriasis personnel ou familial, uvéite antérieure, maladie de Crohn ou rectocolite, enthésopathies, en particulier talalgie et tendinopathie achilléenne, dactylite en saucisse d’un doigt ou d’un orteil, arthrite périphérique, antécédents familiaux de spondyloarthrite. L’apparition d’une lombalgie chez un patient jeune, avec réveils nocturnes et talalgie, doit déclencher la question.</p><p>La réponse aux anti-inflammatoires non stéroïdiens est un argument fort : dans la spondyloarthrite, le soulagement est souvent net et rapide, et sa disparition à l’arrêt tout aussi nette.</p>',
   'none', 2),
  (v_chapter, 'Fessalgie à bascule',
   '<p>La sacro-iliite inflammatoire donne une douleur fessière profonde, volontiers à bascule d’un côté puis de l’autre, nocturne. Elle est régulièrement prise pour un dysfonctionnement sacro-iliaque mécanique, d’autant que les tests de provocation peuvent être positifs. Ce qui tranche n’est pas le test mais le rythme et le terrain.</p>',
   'piege', 3),
  (v_chapter, 'Ce qu’on écrit au médecin',
   '<p>Une réorientation efficace nomme les critères retrouvés plutôt que l’impression. Par exemple : « Patient de 29 ans, lombalgie et fessalgie à bascule depuis 14 mois, installation progressive, raideur matinale de 60 minutes, réveils en seconde partie de nuit avec amélioration au lever, soulagement net par l’activité, talalgie droite depuis 6 mois, oncle paternel spondylarthritique. Quatre critères ASAS sur cinq. Je vous l’adresse pour avis rhumatologique. » Ce courrier là obtient un rendez-vous ; « suspicion d’inflammation, merci de voir » ne l’obtient pas.</p>',
   'reorientation', 4);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Sacro-iliite inflammatoire (SpA)', 'principal', 'Le tableau central du chapitre.', 0),
    ('Sacro-iliite infectieuse', 'differentiel', 'Fièvre et douleur intense d’installation rapide : autre urgence.', 1),
    ('Spondylodiscite infectieuse', 'differentiel', 'Autre cause de douleur rachidienne non mécanique.', 2)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role = EXCLUDED.role, note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  INSERT INTO public.region_chapter_tests (chapter_id, test_id, note, order_index)
  SELECT v_chapter, t.id, x.note, x.ord
  FROM (VALUES
    ('Test de Schober modifié', 'Utile au suivi de la mobilité, pas au diagnostic.', 0),
    ('Test de distraction', 'Les tests de provocation sacro-iliaque peuvent être positifs dans la sacro-iliite : ils ne distinguent pas mécanique et inflammatoire.', 1)
  ) AS x(test_name, note, ord)
  JOIN public.orthopedic_tests t ON t.name = x.test_name
  ON CONFLICT (chapter_id, test_id) DO UPDATE SET note = EXCLUDED.note, order_index = EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, order_index) VALUES
  (v_chapter, 'Sieper J, van der Heijde D, Landewé R et al. New criteria for inflammatory back pain in patients with chronic back pain: a real patient exercise by experts from the Assessment of SpondyloArthritis international Society. Ann Rheum Dis.', 2009, 'consensus', 'Les cinq critères ASAS et leurs performances.', 0),
  (v_chapter, 'Rudwaleit M, van der Heijde D, Landewé R et al. The development of Assessment of SpondyloArthritis international Society classification criteria for axial spondyloarthritis. Ann Rheum Dis.', 2009, 'consensus', 'Les critères de classification et la place des manifestations extra-rachidiennes.', 1),
  (v_chapter, 'Ramiro S, Nikiphorou E, Sepriano A et al. ASAS-EULAR recommendations for the management of axial spondyloarthritis: 2022 update. Ann Rheum Dis.', 2023, 'recommandation', 'Prise en charge actuelle, dont la place centrale de l’exercice.', 2);

END $do$;
