-- Module « Région lombaire » : changement d'axe.
--
-- Défaut corrigé ici. La partie diagnostique était organisée par tissu
-- (discogénique, facettaire, instabilité, sacro-iliaque) parce que la table
-- `pathologies` l'est, alors que trois de ces chapitres expliquent qu'on ne
-- peut pas identifier le tissu de façon fiable. Le parcours enseignait donc
-- une chose et s'organisait selon son contraire.
--
-- La colonne vertébrale devient ce qui décide réellement du traitement :
--   1. le mécanisme de douleur dominant (nociceptif, neuropathique, nociplastique) ;
--   2. le profil de réponse au traitement (classification de Delitto révisée) ;
--   3. le pronostic (stratification du risque) ;
--   4. le tableau clinique, qui devient un répertoire consultable et non l'axe.
--
-- Les sept chapitres tissulaires ne sont pas supprimés : leur contenu est bon
-- et il faut savoir reconnaître ces tableaux. Ils changent de statut, et le
-- chapitre « croiser-les-axes » dit explicitement comment s'en servir.

DO $do$
DECLARE
  v_module UUID;
  v_chapter UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  -- ==========================================================================
  -- 1. Intention du module
  -- ==========================================================================
  UPDATE public.region_modules
     SET intro_html = '<p>La lombalgie est le premier motif de consultation en thérapie manuelle et la première cause mondiale d’années vécues avec incapacité. C’est aussi le domaine où l’écart est le plus grand entre ce que la littérature établit et ce qui se pratique encore.</p><p>Ce parcours est construit sur l’ordre des décisions, pas sur une liste d’organes. Quatre questions, dans cet ordre : est-ce que cela relève de moi, quel mécanisme de douleur domine, à quel profil de traitement ce patient répond, et quel est son risque de chronicisation. Le tableau clinique, discogénique ou facettaire ou autre, vient après, comme répertoire à consulter, parce qu’aucun test ne permet de l’affirmer de façon fiable et parce qu’il ne décide pas du traitement.</p><p>Les recommandations citées sont celles de la HAS, du NICE et de l’Organisation mondiale de la santé, vérifiées à leur source et datées : une recommandation qui change, et la raison pour laquelle elle change, font partie de ce qu’il faut savoir.</p>',
         objectives = jsonb_build_array(
           'Trier une lombalgie et savoir laquelle impose un avis médical, en urgence ou non',
           'Identifier le mécanisme de douleur dominant : nociceptif, neuropathique ou nociplastique',
           'Placer un patient dans un profil de réponse au traitement et en déduire la première intention',
           'Interpréter chaque test avec son rapport de vraisemblance, et reconnaître ceux qui n’en ont pas',
           'Reconnaître les tableaux cliniques lombaires sans leur faire dire plus qu’ils ne disent',
           'Construire un plan de traitement conforme aux recommandations en vigueur et rédiger une réorientation utile'
         ),
         estimated_hours = 15.0
   WHERE id = v_module;

  -- ==========================================================================
  -- 2. Nouvelle numérotation
  -- ==========================================================================
  UPDATE public.region_chapters SET part = 'Répertoire des tableaux cliniques' WHERE module_id = v_module AND part = 'Diagnostiquer';

  UPDATE public.region_chapters SET order_index = 14 WHERE module_id = v_module AND slug = 'radiculopathie';
  UPDATE public.region_chapters SET order_index = 15 WHERE module_id = v_module AND slug = 'stenose';
  UPDATE public.region_chapters SET order_index = 16 WHERE module_id = v_module AND slug = 'discogenique';
  UPDATE public.region_chapters SET order_index = 17 WHERE module_id = v_module AND slug = 'facettaire';
  UPDATE public.region_chapters SET order_index = 18 WHERE module_id = v_module AND slug = 'instabilite';
  UPDATE public.region_chapters SET order_index = 19 WHERE module_id = v_module AND slug = 'ceinture-pelvienne';
  UPDATE public.region_chapters SET order_index = 20 WHERE module_id = v_module AND slug = 'voisinage';
  UPDATE public.region_chapters SET order_index = 22 WHERE module_id = v_module AND slug = 'principes-traitement';
  UPDATE public.region_chapters SET order_index = 23 WHERE module_id = v_module AND slug = 'therapie-manuelle';
  UPDATE public.region_chapters SET order_index = 24 WHERE module_id = v_module AND slug = 'exercice-mckenzie';
  UPDATE public.region_chapters SET order_index = 25 WHERE module_id = v_module AND slug = 'adjuvants';
  UPDATE public.region_chapters SET order_index = 26 WHERE module_id = v_module AND slug = 'education-matching';
  UPDATE public.region_chapters SET order_index = 27 WHERE module_id = v_module AND slug = 'tests-a-abandonner';
  UPDATE public.region_chapters SET order_index = 28 WHERE module_id = v_module AND slug = 'fausses-croyances';
  UPDATE public.region_chapters SET order_index = 29 WHERE module_id = v_module AND slug = 'biais-du-praticien';
  UPDATE public.region_chapters SET order_index = 30 WHERE module_id = v_module AND slug = 'imagerie';
  UPDATE public.region_chapters SET order_index = 31 WHERE module_id = v_module AND slug = 'reorientation';
  UPDATE public.region_chapters SET order_index = 32 WHERE module_id = v_module AND slug = 'cas-cliniques';

  -- ==========================================================================
  -- 3. Mécanismes de douleur
  -- ==========================================================================
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'mecanismes-douleur',
    'Quel mécanisme de douleur domine ?',
    'Nociceptif, neuropathique, nociplastique : la question qui précède celle du tissu',
    'Classer pour décider', 'raisonnement',
    'Avant de chercher quel tissu fait mal, il faut savoir de quel type de douleur il s’agit. C’est la seule des deux questions à laquelle on sait répondre de façon reproductible, et c’est celle qui change le traitement.',
    jsonb_build_array(
      'Distinguer les trois mécanismes de douleur sur des critères explicites',
      'Utiliser la gradation IASP de la douleur neuropathique et les critères 2021 de la douleur nociplastique',
      'Adapter la première intention thérapeutique au mécanisme dominant'
    ),
    jsonb_build_array(
      'Le mécanisme se détermine de façon plus fiable que le tissu, et il décide du traitement : la question « quel mécanisme » précède donc la question « quel tissu ».',
      'Nociceptif : douleur proportionnée, mécanique, modifiable par la position et le mouvement, localisée.',
      'Neuropathique : topographie neuroanatomique plausible, signes sensitifs dans ce territoire, descripteurs de brûlure et de décharge. Le DN4 à 4 sur 10 oriente.',
      'Nociplastique : au moins trois mois, distribution régionale et non ponctuelle, hypersensibilité évoquée dans la région douloureuse, et des comorbidités de sommeil, de fatigue ou de cognition.'
    ),
    50, 11
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Pourquoi cette question passe devant',
   '<p>Le chapitre sur la valeur des tests a établi un fait gênant : aucun examen clinique ne permet d’attribuer de façon fiable une lombalgie commune à un disque, à une articulaire postérieure ou à un ligament. Continuer à organiser son raisonnement autour de cette question revient à passer la consultation sur la seule interrogation à laquelle on ne sait pas répondre.</p><p>La question du mécanisme est différente sur deux points décisifs. Elle dispose de critères explicites et publiés, donc reproductibles d’un praticien à l’autre. Et sa réponse change réellement ce que l’on fait : un même « mal de dos » se traite autrement selon qu’il s’agit d’une douleur nociceptive récente, d’une souffrance radiculaire ou d’une douleur devenue nociplastique.</p><p>C’est pour cela que ce chapitre est placé avant le répertoire des tableaux cliniques, et non l’inverse.</p>',
   'cle', 0),
  (v_chapter, 'Douleur nociceptive',
   '<p>Elle résulte de l’activation des nocicepteurs par une atteinte ou une menace tissulaire réelle. C’est le mécanisme de la très grande majorité des lombalgies communes récentes.</p><p><strong>Ce qui la reconnaît.</strong> Une douleur proportionnée à l’événement et à la sollicitation. Une relation claire entre mouvement, position, charge et symptôme : elle s’aggrave d’une façon prévisible et se soulage d’une autre. Une localisation raisonnablement circonscrite, éventuellement avec une projection somatique référée dans la fesse et la cuisse. Un examen qui la reproduit et qui, au moins transitoirement, la modifie.</p><p><strong>Ce que cela implique.</strong> C’est le terrain de la thérapie manuelle, des mouvements répétés dans la direction qui soulage, de la reprise progressive d’activité. Le pronostic est bon, il faut le dire.</p>',
   'none', 1),
  (v_chapter, 'Douleur neuropathique',
   '<p>Elle résulte d’une lésion ou d’une maladie du système nerveux somatosensoriel. En lombaire, c’est la radiculopathie par conflit disco-radiculaire ou par sténose foraminale, et plus rarement une neuropathie périphérique de voisinage.</p><p><strong>Ce qui la reconnaît.</strong> L’IASP propose une gradation en trois degrés, de possible à probable puis certaine. Le premier degré demande une douleur de topographie <strong>neuroanatomiquement plausible</strong>, associée à un antécédent de lésion ou de maladie du système somatosensoriel. Le degré suivant demande en plus des <strong>signes sensitifs</strong> confinés au territoire d’innervation concerné : hypoesthésie, allodynie, hyperalgésie. Le dernier degré demande un examen de confirmation, imagerie ou électrophysiologie, qui sort du champ de la thérapie manuelle.</p><p><strong>Les descripteurs comptent.</strong> Brûlure, décharge électrique, striction, froid douloureux, fourmillements, picotements, engourdissement, démangeaison. Le questionnaire DN4, développé en France, formalise ce repérage : sept items d’interrogatoire et trois d’examen, un score d’au moins 4 sur 10 orientant vers une composante neuropathique. Ce n’est pas un test diagnostique, c’est un outil d’orientation, rapide et utilisable en consultation.</p>',
   'pratique', 2),
  (v_chapter, 'Douleur nociplastique',
   '<p>Troisième descripteur, reconnu par l’IASP en 2017 et doté de critères cliniques publiés en 2021 pour l’appareil locomoteur. Il s’agit d’une douleur qui découle d’une altération du traitement du message nociceptif, en l’absence de lésion tissulaire ou d’atteinte du système somatosensoriel qui suffirait à l’expliquer.</p><p><strong>Les critères, dans l’ordre.</strong> Une douleur qui évolue depuis au moins <strong>trois mois</strong>. Une distribution <strong>régionale plutôt que ponctuelle</strong>, sans correspondance anatomique nette. Une douleur qui <strong>ne s’explique pas entièrement</strong> par un mécanisme nociceptif ou neuropathique, ces mécanismes pouvant coexister sans suffire. Et un élément obligatoire : la présence de signes d’<strong>hypersensibilité évoquée</strong> au moins dans la région douloureuse, allodynie mécanique statique ou dynamique, allodynie au chaud ou au froid, ou post-sensations douloureuses après la mise en évidence de l’allodynie.</p><p>S’y ajoutent des comorbidités qui font passer du possible au probable : sensibilité accrue au bruit, à la lumière ou aux odeurs, troubles du sommeil avec réveils nocturnes fréquents, fatigue, difficultés d’attention ou troubles de la mémoire.</p><p><strong>Ce que cela implique.</strong> Un traitement centré sur la reprise graduée d’activité, l’éducation, le sommeil et la régulation de la charge, et une prudence particulière avec les techniques passives répétées, qui entretiennent l’idée d’un tissu à réparer et le recours au soin.</p>',
   'preuve', 3),
  (v_chapter, 'Les tableaux mixtes, et la règle pratique',
   '<p>Les trois mécanismes coexistent souvent, en particulier dans les douleurs anciennes. Un patient peut avoir une radiculopathie authentique, une composante nociceptive lombaire, et une sensibilisation installée après deux ans d’évolution.</p><p>La question utile n’est donc pas « lequel des trois », mais <strong>lequel domine aujourd’hui</strong>, et la réponse peut changer au fil des semaines. Trois repères simples pour trancher en consultation.</p><p>La douleur est-elle <strong>proportionnée et modifiable</strong> par ce que vous faites ? Si oui, la composante nociceptive domine.</p><p>Existe-t-il une <strong>topographie nerveuse plausible avec des signes sensitifs dans ce territoire</strong> ? Si oui, il y a une composante neuropathique, et elle commande la prudence sur le dosage.</p><p>La douleur est-elle <strong>régionale, ancienne, disproportionnée, avec hypersensibilité et comorbidités</strong> ? Si oui, la composante nociplastique domine, et c’est elle qui doit orienter la prise en charge, quel que soit ce que montre l’imagerie.</p>',
   'cle', 4),
  (v_chapter, 'Le piège de l’étiquette qui arrive trop tôt',
   '<p>Deux erreurs symétriques guettent. Étiqueter « nociplastique » une douleur qu’on n’a pas su expliquer, ce qui transforme un descripteur rigoureux en fourre-tout et fait manquer des tableaux spécifiques. Et l’inverse, ne jamais l’évoquer, traiter pendant des mois un tissu supposé chez un patient dont la douleur ne se comporte plus comme une douleur tissulaire.</p><p>Le garde-fou est dans les critères eux-mêmes : trois mois d’évolution, distribution régionale, et surtout la présence <strong>obligatoire</strong> d’une hypersensibilité évoquée constatée à l’examen. Sans ce dernier élément, le terme ne s’applique pas.</p>',
   'piege', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Kosek E, Clauw D, Nijs J et al. Chronic nociplastic pain affecting the musculoskeletal system: clinical criteria and grading system. Pain.', 2021, 'consensus', 'Les critères utilisés dans ce chapitre, dont l’hypersensibilité évoquée obligatoire.', 'https://pubmed.ncbi.nlm.nih.gov/33974577/', 0),
  (v_chapter, 'Finnerup NB, Haroutounian S, Kamerman P et al. Neuropathic pain: an updated grading system for research and clinical practice. Pain.', 2016, 'consensus', 'La gradation possible, probable, certaine de la douleur neuropathique.', NULL, 1),
  (v_chapter, 'Bouhassira D, Attal N, Alchaar H et al. Comparison of pain syndromes associated with nervous or somatic lesions and development of a new neuropathic pain diagnostic questionnaire (DN4). Pain.', 2005, 'etude', 'Le questionnaire DN4 et son seuil d’orientation à 4 sur 10.', NULL, 2),
  (v_chapter, 'Nijs J, Lahousse A, Kapreli E et al. Nociplastic pain criteria or recognition of central sensitization? Pain phenotyping in the past, present and future. J Clin Med.', 2021, 'revue_systematique', 'Ce que les critères apportent, et les confusions qu’ils évitent.', NULL, 3);

  -- ==========================================================================
  -- 4. Profil de réponse au traitement
  -- ==========================================================================
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'profil-reponse',
    'Quel profil de réponse au traitement ?',
    'Classer par ce qu’on va faire, plutôt que par ce qu’on croit trouver',
    'Classer pour décider', 'raisonnement',
    'La classification de Delitto, révisée en 2016, range les patients selon l’approche de rééducation qui leur convient : moduler les symptômes, reprendre le contrôle du mouvement, ou optimiser la fonction. C’est une classification qui assume de ne rien dire du tissu.',
    jsonb_build_array(
      'Placer un patient dans l’une des trois approches à partir de sa douleur et de son incapacité',
      'Déduire de ce placement la première intention et le dosage',
      'Reconnaître les limites de validation du modèle et ne pas lui faire dire plus qu’il ne dit'
    ),
    jsonb_build_array(
      'Trois approches : modulation des symptômes, contrôle du mouvement, optimisation fonctionnelle.',
      'Le placement se fait sur le niveau de douleur et d’incapacité, et sur l’ancienneté de l’épisode, pas sur une hypothèse tissulaire.',
      'Un patient change d’approche au cours de sa prise en charge : c’est prévu, et c’est le critère de progression.',
      'Le modèle organise la décision. Il n’a pas la validation d’un test diagnostique, et il ne le prétend pas.'
    ),
    50, 12
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le renversement',
   '<p>Une classification diagnostique range les patients selon ce qu’ils ont. Une classification fondée sur le traitement les range selon ce qui va leur être proposé. Le second choix paraît moins ambitieux ; il est en réalité plus honnête, puisqu’il ne fait dépendre la décision d’aucune affirmation que l’examen ne permet pas.</p><p>Le système de Delitto, publié en 1995 et révisé en 2016 par Alrwaily et ses collaborateurs, est le plus abouti de cette famille. La révision a ajouté deux choses utiles : la prise en compte explicite du statut psychologique et des comorbidités à chaque rencontre, et une articulation claire avec le niveau de tri.</p>',
   'none', 0),
  (v_chapter, 'Deux niveaux de tri avant le profil',
   '<p><strong>Premier niveau, le contact initial.</strong> Le patient relève-t-il d’une rééducation ? C’est ici que se décide l’orientation vers un avis médical pour pathologie spécifique ou comorbidité, et l’identification de ceux qui n’ont besoin que de conseils et d’auto-prise en charge. C’est exactement ce que font les parties « Trier » et « Interroger » de ce parcours.</p><p><strong>Second niveau, le thérapeute.</strong> Parmi ceux qui relèvent d’une rééducation, lequel des trois profils correspond à ce patient aujourd’hui ?</p><p>L’ordre compte : on ne place personne dans un profil de traitement avant d’avoir écarté ce qui ne relève pas de nous.</p>',
   'cle', 1),
  (v_chapter, 'Modulation des symptômes',
   '<p><strong>Pour qui.</strong> Un épisode récent, nouveau ou récidivant, avec des symptômes marqués. Le mouvement est empêché d’abord par la douleur. Ces patients évitent certaines positions, leurs amplitudes actives sont limitées et douloureuses.</p><p><strong>Objectif.</strong> Reprendre la main sur ce qui empêche de bouger, pour ouvrir une fenêtre exploitable.</p><p><strong>Contenu.</strong> Exercices dans la direction qui centralise ou qui soulage, thérapie manuelle, adaptation des positions et des charges, conseils d’activité. C’est la phase où la thérapie manuelle a le plus sa place, et la règle de Flynn aide à choisir qui manipuler.</p><p><strong>Critère de sortie.</strong> La douleur n’est plus le principal obstacle au mouvement.</p>',
   'pratique', 2),
  (v_chapter, 'Contrôle du mouvement',
   '<p><strong>Pour qui.</strong> Douleur et incapacité modérées. Ce qui gêne n’est plus tant la douleur que la qualité du mouvement : compliance articulaire et tissulaire, coordination neuromusculaire.</p><p><strong>Objectif.</strong> Améliorer la qualité du mouvement lombo-pelvien et l’intégrer à des gestes utiles.</p><p><strong>Contenu.</strong> Progression de contrôle moteur, travail de la dissociation, reprise des amplitudes, exposition graduée aux mouvements évités. La règle de Hicks aide à repérer ceux qui en tireront le plus.</p><p><strong>Critère de sortie.</strong> Le mouvement est contrôlé sur les gestes de la vie courante, et la limite devient l’endurance.</p>',
   'pratique', 3),
  (v_chapter, 'Optimisation fonctionnelle',
   '<p><strong>Pour qui.</strong> Douleur et incapacité faibles, mais une demande fonctionnelle non encore satisfaite : reprise du travail physique, du sport, du port de charge.</p><p><strong>Objectif.</strong> Combler l’écart entre ce que le patient tolère et ce que sa vie exige.</p><p><strong>Contenu.</strong> Renforcement progressif, endurance, conditionnement général, tâches spécifiques au travail ou au sport, progression de charge planifiée.</p><p><strong>Critère de sortie.</strong> La capacité dépasse la demande, avec une marge.</p><p>C’est l’étape la plus souvent escamotée : on arrête la prise en charge quand la douleur a cédé, c’est à dire au moment précis où commence le travail qui réduit les récidives.</p>',
   'cle', 4),
  (v_chapter, 'Les limites, dites franchement',
   '<p>Ce modèle organise la décision, il ne la valide pas. Les essais comparant une prise en charge classée à une prise en charge non classée donnent des résultats inconstants, et le modèle révisé n’a pas fait l’objet d’une validation prospective de l’ampleur de celle du STarT Back.</p><p>Deux raisons de l’utiliser malgré cela. Il n’affirme rien de faux, contrairement à un classement tissulaire. Et il force à expliciter deux paramètres qu’on choisit de toute façon, le point de départ et le critère de progression, ce qui rend la prise en charge discutable et révisable au lieu d’être implicite.</p>',
   'preuve', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Alrwaily M, Timko M, Schneider M et al. Treatment-Based Classification System for Low Back Pain: Revision and Update. Phys Ther.', 2016, 'consensus', 'Le modèle utilisé dans ce chapitre : deux niveaux de tri, trois approches de rééducation.', 'https://academic.oup.com/ptj/article/96/7/1057/2864925', 0),
  (v_chapter, 'Alrwaily M, Timko M, Schneider M et al. Treatment-based Classification System for Patients With Low Back Pain: The Movement Control Approach. Phys Ther.', 2017, 'consensus', 'Le détail de l’approche « contrôle du mouvement ».', 'https://academic.oup.com/ptj/article/97/12/1147/4097724', 1),
  (v_chapter, 'Delitto A, Erhard RE, Bowling RW. A treatment-based classification approach to low back syndrome: identifying and staging patients for conservative treatment. Phys Ther.', 1995, 'consensus', 'Le système d’origine, pour comprendre ce que la révision a changé.', NULL, 2),
  (v_chapter, 'Hill JC, Whitehurst DG, Lewis M et al. STarT Back randomised controlled trial. Lancet.', 2011, 'essai_randomise', 'L’axe pronostique, complémentaire de l’axe de traitement.', NULL, 3);

  -- ==========================================================================
  -- 5. Croiser les axes
  -- ==========================================================================
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'croiser-les-axes',
    'La grille de décision',
    'Quatre questions dans l’ordre, et la place que garde le tableau clinique',
    'Classer pour décider', 'raisonnement',
    'Ce chapitre assemble le parcours. Quatre axes, posés dans un ordre qui n’est pas négociable, et une explication de ce que devient le répertoire des tableaux cliniques une fois qu’on raisonne ainsi.',
    jsonb_build_array(
      'Poser les quatre questions de décision dans l’ordre, sur n’importe quel patient lombalgique',
      'Formuler une conclusion de consultation qui tient en quatre lignes',
      'Utiliser le répertoire des tableaux cliniques pour ce qu’il vaut, sans en faire l’axe de la décision'
    ),
    jsonb_build_array(
      'Quatre axes, dans cet ordre : est-ce que cela relève de moi, quel mécanisme domine, quel profil de traitement, quel risque de chronicisation.',
      'Le tableau clinique est un cinquième élément, utile et facultatif : il affine, il ne décide pas.',
      'Une conclusion de consultation tient en quatre lignes, une par axe. Si l’une manque, la décision repose sur une intuition.',
      'Les quatre axes se réévaluent : un patient change de mécanisme dominant et de profil au fil des semaines.'
    ),
    45, 13
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Les quatre questions, dans l’ordre',
   '<p><strong>1. Est-ce que cela relève de moi ?</strong> Tri de sécurité : drapeaux rouges, queue de cheval, douleur non mécanique, rythme inflammatoire, déficit progressif. Réponse possible : non, et alors tout le reste est sans objet.</p><p><strong>2. Quel mécanisme de douleur domine ?</strong> Nociceptif, neuropathique, nociplastique. Cette réponse commande le dosage, la prudence et le discours.</p><p><strong>3. Quel profil de réponse ?</strong> Modulation des symptômes, contrôle du mouvement, optimisation fonctionnelle. Cette réponse commande le contenu de la séance et le critère de progression.</p><p><strong>4. Quel risque de chronicisation ?</strong> Stratification par un outil validé. Cette réponse commande l’intensité du suivi et le temps consacré aux croyances et aux obstacles.</p><p>L’ordre n’est pas négociable : chaque question suppose la précédente résolue. On ne place pas un patient dans un profil de traitement avant d’avoir écarté ce qui ne relève pas de nous, et on ne dose pas un traitement sans savoir quel mécanisme on a en face.</p>',
   'cle', 0),
  (v_chapter, 'La grille remplie, sur trois patients',
   '<p><strong>Homme de 34 ans, lumbago depuis quatre jours en portant un carton.</strong> Relève de moi : oui, tri négatif. Mécanisme : nociceptif, douleur proportionnée, modifiable, centralisant en extension. Profil : modulation des symptômes. Risque : faible. Conduite : manipulation avec réévaluation immédiate, extension répétée à domicile, deux séances prévues, point à trois semaines.</p><p><strong>Femme de 41 ans, sciatique S1 depuis dix jours avec déficit modéré stable.</strong> Relève de moi : oui, avec surveillance, dépistage de queue de cheval négatif. Mécanisme : neuropathique probable, topographie plausible et signes sensitifs dans le territoire. Profil : modulation des symptômes, avec dosage prudent. Risque : moyen, inquiétude et antécédent familial de chirurgie. Conduite : neuromobilisation en sliders, éducation sur l’histoire naturelle, consigne écrite de queue de cheval, réévaluation motrice à chaque séance.</p><p><strong>Femme de 52 ans, lombalgie diffuse depuis trois ans, sommeil fragmenté, fatigue, allodynie lombaire à l’effleurement.</strong> Relève de moi : oui, tri négatif. Mécanisme : nociplastique dominant, critères réunis. Profil : entre contrôle du mouvement et optimisation fonctionnelle, l’incapacité étant modérée. Risque : élevé. Conduite : reprise graduée pilotée par la fonction et non par la douleur, travail du sommeil et de la charge, éducation, thérapie manuelle en appoint bref et non répété, séances espacées, objectifs fonctionnels écrits.</p>',
   'pratique', 1),
  (v_chapter, 'Ce que devient le répertoire des tableaux cliniques',
   '<p>Les chapitres qui suivent, radiculopathie, sténose, discogénique, facettaire, instabilité, ceinture pelvienne, diagnostics de voisinage et rachis opéré, ne sont plus la colonne vertébrale du raisonnement. Ils sont un <strong>répertoire</strong>, et ils servent à trois choses.</p><p><strong>Reconnaître un tableau qui se distingue vraiment.</strong> La sténose, la radiculopathie, la ceinture pelvienne et les diagnostics de voisinage ont des présentations reconnaissables et des conduites propres. Ces chapitres là sont diagnostiques au sens plein.</p><p><strong>Savoir ce qu’on ne peut pas affirmer.</strong> Les chapitres discogénique, facettaire et instabilité décrivent des tableaux réels dont la littérature ne permet pas d’établir l’origine tissulaire. Les lire sert autant à connaître leur présentation qu’à savoir jusqu’où on peut aller dans ce qu’on en dit au patient.</p><p><strong>Affiner une première intention.</strong> Une fois les quatre axes posés, reconnaître un tableau peut orienter le choix d’une technique ou d’une direction. Cela vient après la décision, cela ne la remplace pas.</p><p>La règle en une phrase : <strong>si votre plan de traitement change selon le tableau que vous nommez, vérifiez que ce n’est pas le mécanisme ou le profil qui aurait dû le décider.</strong></p>',
   'cle', 2),
  (v_chapter, 'La conclusion de consultation en quatre lignes',
   '<p>À la fin de l’examen, écrire quatre lignes, une par axe. Par exemple : « Relève de la thérapie manuelle, tri négatif, consigne de queue de cheval donnée. Mécanisme nociceptif dominant, centralisation en extension. Profil modulation des symptômes. Risque faible au STarT Back. »</p><p>L’intérêt n’est pas administratif. Si l’une des quatre lignes est difficile à écrire, c’est que la décision qui suit repose sur une intuition et non sur un raisonnement, et c’est précisément là qu’il faut revenir à l’examen plutôt que de commencer à traiter.</p><p>Ces quatre lignes sont aussi ce qui rend la réévaluation possible : à la séance suivante, on regarde laquelle a changé.</p>',
   'pratique', 3),
  (v_chapter, 'Ce que la grille ne fait pas',
   '<p>Elle ne remplace pas l’examen : elle en organise le résultat. Elle ne garantit pas le succès : les traitements disponibles ont tous des effets modestes, et aucune classification ne change cela. Et elle n’est pas validée comme un test diagnostique : c’est un cadre de décision, construit sur des éléments dont chacun a sa propre base probante, pas un algorithme éprouvé en essai randomisé dans son ensemble.</p><p>Ce qu’elle apporte est plus modeste et plus sûr : elle empêche de fonder une prise en charge sur la seule question à laquelle l’examen ne sait pas répondre.</p>',
   'preuve', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Kongsted A, Kent P, Quicke JG et al. Risk-stratified and stepped models of care for back pain and osteoarthritis: are we heading towards a common model? Pain Rep.', 2020, 'revue_systematique', 'La convergence des modèles de classification vers un cadre commun à plusieurs axes.', NULL, 0),
  (v_chapter, 'Alrwaily M, Timko M, Schneider M et al. Treatment-Based Classification System for Low Back Pain: Revision and Update. Phys Ther.', 2016, 'consensus', 'L’axe « profil de réponse » de la grille.', 'https://academic.oup.com/ptj/article/96/7/1057/2864925', 1),
  (v_chapter, 'Kosek E, Clauw D, Nijs J et al. Chronic nociplastic pain affecting the musculoskeletal system: clinical criteria and grading system. Pain.', 2021, 'consensus', 'L’axe « mécanisme » de la grille.', 'https://pubmed.ncbi.nlm.nih.gov/33974577/', 2),
  (v_chapter, 'Haute Autorité de Santé. Prise en charge du patient présentant une lombalgie commune. Fiche mémo.', 2019, 'recommandation', 'L’axe « risque de chronicisation » et la grille française par durée.', 'https://www.has-sante.fr/upload/docs/application/pdf/2019-04/fm_lombalgie_v2_2.pdf', 3);

  -- ==========================================================================
  -- 6. Rachis opéré, chapitre manquant du répertoire
  -- ==========================================================================
  INSERT INTO public.region_chapters (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index) VALUES (
    v_module, 'rachis-opere',
    'Le rachis lombaire opéré',
    'Douleur persistante après chirurgie : vocabulaire, examen, ce qu’on peut faire',
    'Répertoire des tableaux cliniques', 'diagnostic',
    'Ces patients arrivent en cabinet avec une histoire lourde, un vocabulaire décourageant et souvent la conviction d’être un échec. Le chapitre reprend la terminologie actuelle, ce qu’il faut chercher, et ce que la thérapie manuelle peut raisonnablement proposer.',
    jsonb_build_array(
      'Employer la terminologie actuelle et savoir pourquoi elle a changé',
      'Conduire l’examen d’un patient opéré et repérer ce qui impose un avis',
      'Proposer une prise en charge adaptée sans promettre ce qui n’est pas tenable'
    ),
    jsonb_build_array(
      'Le terme « syndrome d’échec de la chirurgie du dos » est abandonné au profit de « syndrome douloureux rachidien persistant », type 2 lorsqu’il fait suite à une chirurgie.',
      'Le changement de mot n’est pas cosmétique : l’ancien terme désigne un échec et un coupable, et le patient l’entend ainsi.',
      'Chercher systématiquement la part neuropathique, très fréquente, et la part nociplastique après plusieurs années.',
      'Une aggravation neurologique nouvelle, une fièvre ou une douleur d’allure inflammatoire chez un opéré récent imposent un avis sans délai.'
    ),
    40, 21
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Le mot a changé, et cela compte',
   '<p>« Failed back surgery syndrome », traduit par syndrome d’échec de la chirurgie du dos, a longtemps désigné la douleur persistant après une chirurgie rachidienne. Une proposition publiée en 2021 dans Pain Medicine, reprise dans la perspective de la CIM-11, lui substitue « syndrome douloureux rachidien persistant » : type 1 en l’absence de chirurgie antérieure, type 2 lorsqu’il en fait suite.</p><p>L’argument des auteurs est que l’ancien terme est inadéquat et trompeur. Il nomme un échec, il désigne implicitement un responsable, et il enferme le patient dans une identité de raté de la chirurgie. Ce n’est pas un détail de vocabulaire : c’est exactement le type de formulation dont le chapitre sur les fausses croyances montre qu’elle reste des années.</p>',
   'cle', 0),
  (v_chapter, 'Ce qu’on cherche à l’examen',
   '<p><strong>L’histoire précise.</strong> Quelle intervention, à quel niveau, quand, pour quelle indication. Quel était le symptôme dominant avant, et lequel domine maintenant. Y a-t-il eu un intervalle libre, et de quelle durée. Un intervalle libre suivi d’une réapparition ne s’interprète pas comme une douleur jamais soulagée.</p><p><strong>Le mécanisme.</strong> La composante neuropathique est fréquente chez ces patients, et souvent sous-évaluée : topographie plausible, signes sensitifs dans le territoire, descripteurs de brûlure et de décharge, DN4. Après plusieurs années d’évolution, chercher aussi les critères de douleur nociplastique, qui changent complètement la conduite.</p><p><strong>Les segments voisins et les hanches.</strong> Une arthrodèse reporte la contrainte sur les segments adjacents et sur les hanches, qui deviennent souvent la source de la plainte actuelle. C’est la partie la plus accessible au traitement manuel.</p><p><strong>Le retentissement.</strong> Ces patients cumulent souvent arrêt prolongé, procédure en cours, traitements opioïdes au long cours et découragement. Ces éléments pèsent davantage sur l’évolution que la qualité du montage chirurgical.</p>',
   'pratique', 1),
  (v_chapter, 'Ce qui impose un avis',
   '<p>Un déficit neurologique nouveau ou qui s’aggrave. Une fièvre, une douleur inflammatoire ou une cicatrice inflammatoire chez un opéré récent, qui font craindre une infection du site opératoire. Des signes de queue de cheval, dont le dépistage reste obligatoire. Une douleur qui ne cède dans aucune position chez un patient porteur de matériel.</p><p>En dehors de ces situations, le patient opéré n’est pas une contre-indication en soi à la thérapie manuelle.</p>',
   'drapeau_rouge', 2),
  (v_chapter, 'Ce qu’on propose',
   '<p>Éviter les techniques à haute vélocité sur le segment arthrodésé ou instrumenté. Travailler les segments adjacents, les hanches et les tissus mous, en mobilisation. Construire une progression fonctionnelle lente, pilotée par la capacité et non par la douleur, avec des objectifs écrits et vérifiables.</p><p>Ce qu’il faut dire, et ne pas promettre : l’objectif réaliste est un gain de fonction et une réduction de l’incapacité, pas la disparition d’une douleur installée depuis des années. Un patient à qui l’on annonce cet objectif là, et qui l’atteint, va mieux qu’un patient à qui l’on a promis mieux.</p><p>Le recours à une structure spécialisée dans la douleur chronique se discute devant une consommation d’opioïdes au long cours, une détresse psychologique marquée ou l’absence de tout progrès fonctionnel après plusieurs mois.</p>',
   'reorientation', 3);

  INSERT INTO public.region_chapter_pathologies (chapter_id, pathology_id, role, note, order_index)
  SELECT v_chapter, p.id, x.role, x.note, x.ord
  FROM (VALUES
    ('Radiculopathie lombaire (toutes causes)', 'principal', 'La composante neuropathique persistante est fréquente et sous-évaluée après chirurgie.', 0),
    ('Sténose lombaire centrale', 'differentiel', 'Sténose du segment adjacent, fréquente après arthrodèse.', 1),
    ('Spondylodiscite infectieuse', 'drapeau_rouge', 'À évoquer devant une douleur inflammatoire chez un opéré récent.', 2),
    ('Spondylolisthésis', 'differentiel', 'Instabilité du segment adjacent.', 3)
  ) AS x(pathology_name, role, note, ord)
  JOIN public.pathologies p ON p.name = x.pathology_name
  ON CONFLICT (chapter_id, pathology_id) DO UPDATE SET role=EXCLUDED.role, note=EXCLUDED.note, order_index=EXCLUDED.order_index;

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_chapter, 'Christelis N, Simpson B, Russo M et al. Persistent Spinal Pain Syndrome: A Proposal for Failed Back Surgery Syndrome and ICD-11. Pain Medicine.', 2021, 'consensus', 'La terminologie actuelle et les raisons de l’abandon de l’ancien terme.', 'https://academic.oup.com/painmedicine/article/22/4/807/6120821', 0),
  (v_chapter, 'Kosek E, Clauw D, Nijs J et al. Chronic nociplastic pain affecting the musculoskeletal system: clinical criteria and grading system. Pain.', 2021, 'consensus', 'Les critères à appliquer chez un patient douloureux depuis des années.', 'https://pubmed.ncbi.nlm.nih.gov/33974577/', 1);

END $do$;
