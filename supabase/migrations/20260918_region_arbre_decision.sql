-- Nouveau format d'activité : l'arbre de décision.
--
-- Les quatre axes du parcours se déroulent dans un ordre fixe. Un arbre est la
-- seule forme qui rend cet ordre visible : on ne peut pas atteindre la branche
-- « quelle technique » sans être passé par le tri de sécurité.

ALTER TABLE public.region_chapter_activities
  DROP CONSTRAINT IF EXISTS region_chapter_activities_kind_check;

ALTER TABLE public.region_chapter_activities
  ADD CONSTRAINT region_chapter_activities_kind_check CHECK (kind IN (
    'qcm', 'vrai_faux', 'cas_etape', 'probabilite', 'tri_drapeaux', 'arbre_decision'
  ));

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
    v_module, 'arbre-decisionnel',
    'L’arbre de décision complet',
    'De la première question de l’anamnèse à la technique ou à la réorientation',
    'Intégrer', 'raisonnement',
    'Tout le parcours ramené à un arbre que l’on déroule sur un patient réel. Chaque branche mène soit à une conduite thérapeutique précise, soit à une réorientation, et aucune ne peut être atteinte sans être passée par le tri de sécurité.',
    jsonb_build_array(
      'Dérouler l’arbre complet sur un patient, de l’anamnèse à la conduite',
      'Retrouver à quel embranchement une décision s’est jouée',
      'Vérifier qu’aucune conduite thérapeutique n’est atteinte sans tri de sécurité'
    ),
    jsonb_build_array(
      'L’ordre des embranchements reproduit celui des quatre axes : sécurité, mécanisme, tableau, profil.',
      'Toute branche se termine par une conduite écrite, jamais par un nom de tissu.',
      'Plusieurs branches mènent à une réorientation : c’est une issue normale de l’arbre, pas un échec.',
      'Si vous ne savez pas répondre à un embranchement, c’est qu’il manque un élément d’examen, pas une technique.'
    ),
    35, 33
  )
  ON CONFLICT (module_id, slug) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, part=EXCLUDED.part, kind=EXCLUDED.kind, summary=EXCLUDED.summary, objectives=EXCLUDED.objectives, key_points=EXCLUDED.key_points, estimated_minutes=EXCLUDED.estimated_minutes, order_index=EXCLUDED.order_index
  RETURNING id INTO v_chapter;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_chapter, 'Comment s’en servir',
   '<p>Déroulez l’arbre avec un patient en tête, réel de préférence. À chaque embranchement, répondez avec ce que votre examen vous a donné, pas avec ce que vous supposez. Vous arriverez soit à une conduite thérapeutique, soit à une réorientation.</p><p>Deux usages en découlent. En apprentissage, l’arbre montre où se joue réellement une décision : presque jamais sur le nom du tissu, presque toujours sur la sécurité, le comportement de la douleur et la réponse au mouvement. En consultation, il sert de filet : si vous ne savez pas répondre à un embranchement, c’est qu’il manque un élément d’examen, et c’est le moment de le chercher plutôt que de commencer à traiter.</p>',
   'pratique', 0),
  (v_chapter, 'Ce que l’arbre n’est pas',
   '<p>Ce n’est pas un algorithme validé, et aucun arbre de ce type ne l’est. C’est la mise à plat d’un raisonnement, construit sur des éléments dont chacun a sa propre base probante.</p><p>Sa valeur est ailleurs : il rend visibles les embranchements qu’on saute sans s’en apercevoir. Le tri de sécurité que l’on passe parce que le patient a l’air jeune et en forme. La question du mécanisme que l’on n’a jamais posée. Le profil de traitement que l’on n’a pas choisi parce qu’on a commencé par la technique qu’on maîtrise le mieux.</p>',
   'preuve', 1);

  DELETE FROM public.region_chapter_activities WHERE chapter_id = v_chapter;
  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index) VALUES
  (v_chapter, 'arbre_decision',
   'Arbre de décision de la lombalgie',
   'Répondez avec ce que votre examen a donné. Vous pouvez revenir en arrière à tout moment.',
   jsonb_build_object(
     'racine', 'securite',
     'noeuds', jsonb_build_object(

       'securite', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 1, sécurité',
         'texte', 'Tri de sécurité : que retrouvez-vous ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Signes de queue de cheval, déficit rapidement progressif, suspicion d’infection rachidienne fébrile ou d’anévrisme', 'vers', 'fin_urgence'),
           jsonb_build_object('label', 'Faisceau de drapeaux rouges, ou antécédent de cancer, ou suspicion de fracture', 'vers', 'fin_avis_rapide'),
           jsonb_build_object('label', 'Rythme inflammatoire, quatre critères ASAS sur cinq', 'vers', 'fin_rhumato'),
           jsonb_build_object('label', 'Rien de tout cela', 'vers', 'modifiable')
         )
       ),

       'modifiable', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 2, mécanisme',
         'texte', 'La douleur est-elle modifiable par la position, le mouvement ou ce que vous faites en consultation ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Oui, au moins transitoirement', 'vers', 'topographie'),
           jsonb_build_object('label', 'Non, aucune position ne la soulage, rien ne la modifie', 'vers', 'fin_non_mecanique')
         )
       ),

       'topographie', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 2, mécanisme',
         'texte', 'Où va la douleur, et depuis combien de temps évolue-t-elle ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Sous le genou, trajet systématisé, paresthésies du même territoire', 'vers', 'radiculaire_deficit'),
           jsonb_build_object('label', 'Deux membres inférieurs à la marche, chez un patient de plus de 60 ans', 'vers', 'claudication'),
           jsonb_build_object('label', 'Régionale et diffuse depuis plus de trois mois, avec fatigue et sommeil perturbé', 'vers', 'nociplastique'),
           jsonb_build_object('label', 'Lombaire, fesse ou cuisse, sans dépasser le genou', 'vers', 'mouvements_repetes')
         )
       ),

       'radiculaire_deficit', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 2, mécanisme',
         'texte', 'Examen neurologique : quel déficit ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Déficit sévère, ou qui s’aggrave d’une consultation à l’autre, ou bilatéral', 'vers', 'fin_urgence'),
           jsonb_build_object('label', 'Déficit modéré et stable, ou pas de déficit, avec test neurodynamique positif', 'vers', 'fin_radiculalgie'),
           jsonb_build_object('label', 'Aucun déficit et tests neurodynamiques négatifs', 'vers', 'mouvements_repetes')
         )
       ),

       'claudication', jsonb_build_object(
         'type', 'question', 'axe', 'Tableau clinique',
         'texte', 'Comment se comporte cette claudication ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Soulagée en se penchant ou en s’asseyant, mieux en montée, vélo possible, pouls présents', 'vers', 'fin_stenose'),
           jsonb_build_object('label', 'Périmètre reproductible, cède à l’arrêt debout en quelques minutes, pouls diminués', 'vers', 'fin_vasculaire')
         )
       ),

       'nociplastique', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 2, mécanisme',
         'texte', 'Retrouvez-vous une hypersensibilité évoquée dans la région douloureuse, allodynie ou post-sensations ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Oui, et il existe des comorbidités de sommeil, de fatigue ou de cognition', 'vers', 'fin_nociplastique'),
           jsonb_build_object('label', 'Non, aucune hypersensibilité à l’examen', 'vers', 'mouvements_repetes')
         )
       ),

       'mouvements_repetes', jsonb_build_object(
         'type', 'question', 'axe', 'Réponse au mouvement',
         'texte', 'Mouvements répétés : que fait la douleur ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Elle centralise en extension', 'vers', 'fin_extension'),
           jsonb_build_object('label', 'Elle centralise en flexion', 'vers', 'fin_flexion'),
           jsonb_build_object('label', 'Elle ne change pas de topographie', 'vers', 'laslett')
         )
       ),

       'laslett', jsonb_build_object(
         'type', 'question', 'axe', 'Tableau clinique',
         'texte', 'Tests de provocation sacro-iliaque, après avoir écarté une origine lombaire : combien de positifs ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Trois sur cinq ou plus, ou distraction et thigh thrust positifs', 'vers', 'fin_ceinture'),
           jsonb_build_object('label', 'Moins de trois', 'vers', 'maigne')
         )
       ),

       'maigne', jsonb_build_object(
         'type', 'question', 'axe', 'Tableau clinique',
         'texte', 'Douleur de crête iliaque ou de fesse haute : palper-rouler et point de crête ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Palper-rouler positif et asymétrique, pression douloureuse des articulaires T12-L1', 'vers', 'fin_maigne'),
           jsonb_build_object('label', 'Point exquis sur la crête, à 7 cm de la ligne médiane, reproduisant la douleur habituelle', 'vers', 'fin_cluneal'),
           jsonb_build_object('label', 'Ni l’un ni l’autre', 'vers', 'hicks')
         )
       ),

       'hicks', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 3, profil',
         'texte', 'Règle d’instabilité de Hicks : âge sous 40 ans, élévation de jambe au-delà de 91 degrés, mouvements aberrants, test d’instabilité en procubitus.',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Trois items sur quatre ou plus', 'vers', 'fin_controle_moteur'),
           jsonb_build_object('label', 'Moins de trois', 'vers', 'profil')
         )
       ),

       'profil', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 3, profil',
         'texte', 'Qu’est-ce qui empêche ce patient de bouger aujourd’hui ?',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'La douleur, épisode récent avec symptômes marqués', 'vers', 'flynn'),
           jsonb_build_object('label', 'La qualité du mouvement, douleur et incapacité modérées', 'vers', 'fin_controle_moteur'),
           jsonb_build_object('label', 'Rien, mais sa capacité reste sous ce que son travail ou son sport exige', 'vers', 'fin_optimisation')
         )
       ),

       'flynn', jsonb_build_object(
         'type', 'question', 'axe', 'Axe 3, profil',
         'texte', 'Règle de Flynn : moins de 16 jours, pas de symptôme sous le genou, FABQ-Travail sous 19, un segment hypomobile, une hanche à plus de 35 degrés de rotation interne.',
         'options', jsonb_build_array(
           jsonb_build_object('label', 'Quatre items sur cinq ou plus, et aucune contre-indication', 'vers', 'fin_manipulation'),
           jsonb_build_object('label', 'Moins de quatre, ou une contre-indication à la haute vélocité', 'vers', 'fin_mobilisation')
         )
       ),

       'fin_urgence', jsonb_build_object(
         'type', 'conclusion', 'ton', 'urgence',
         'titre', 'Urgence, le jour même',
         'conduite', 'Orientation organisée vers les urgences, pas seulement conseillée. Courrier nommant la suspicion et la date d’apparition de chaque signe. Aucune technique, aucun traitement d’épreuve en attendant.',
         'pourquoi', 'Dans le syndrome de la queue de cheval, la récupération sphinctérienne dépend du délai de décompression, et la forme incomplète est celle où l’on gagne encore quelque chose.'
       ),

       'fin_avis_rapide', jsonb_build_object(
         'type', 'conclusion', 'ton', 'orienter',
         'titre', 'Avis médical sous quelques jours',
         'conduite', 'Courrier nommant les constats et posant une question précise. Le traitement manuel peut se poursuivre prudemment selon le tableau, et le dire dans le courrier évite les consignes contradictoires.',
         'pourquoi', 'L’antécédent de cancer est le seul drapeau rouge dont la valeur isolée est établie. Pour le reste, c’est le faisceau qui décide.'
       ),

       'fin_rhumato', jsonb_build_object(
         'type', 'conclusion', 'ton', 'orienter',
         'titre', 'Avis rhumatologique',
         'conduite', 'Courrier nommant les critères ASAS retrouvés et les manifestations associées, psoriasis, uvéite, talalgie, antécédents familiaux. Le travail actif se poursuit en parallèle : l’exercice est recommandé dans la spondyloarthrite.',
         'pourquoi', 'Le délai diagnostique de la spondyloarthrite axiale se compte encore en années, et ces patients passent ce temps chez des thérapeutes manuels.'
       ),

       'fin_non_mecanique', jsonb_build_object(
         'type', 'conclusion', 'ton', 'orienter',
         'titre', 'Quitter le champ mécanique',
         'conduite', 'Avis médical. Chercher une cause viscérale, vasculaire, infectieuse ou tumorale selon le terrain et les signes associés.',
         'pourquoi', 'Une douleur qu’aucune position ne modifie et que l’examen ne reproduit pas ne se comporte pas comme une douleur musculosquelettique. C’est le signal le plus fiable de tout le tri.'
       ),

       'fin_radiculalgie', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Radiculalgie, mécanisme neuropathique',
         'conduite', 'Neuromobilisation en sliders, deux à trois séries de dix, deux fois par jour, en amplitude infra-douloureuse. Gestion de la charge et de la position assise. Mobilisations, basse vélocité en phase irritable. Éducation sur l’histoire naturelle et la régression spontanée. Consigne écrite de queue de cheval. Réévaluation motrice à chaque séance, point fixé à six semaines.',
         'pourquoi', 'La majorité des radiculalgies discales s’améliorent nettement en six à douze semaines, et la chirurgie accélère le soulagement sans changer le résultat à un an.'
       ),

       'fin_stenose', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Sténose lombaire, claudication neurogène',
         'conduite', 'Programme en flexion, marche par intervalles sous le seuil des symptômes, renforcement, mobilisation en ouverture, travail de l’équilibre. Examen des hanches à ne pas omettre. Point à huit semaines, avis chirurgical discuté si le périmètre ne progresse pas.',
         'pourquoi', 'Le soulagement par la flexion est le fil conducteur du tableau. Les deux claudications coexistent souvent : trouver l’une n’autorise pas à écarter l’autre.'
       ),

       'fin_vasculaire', jsonb_build_object(
         'type', 'conclusion', 'ton', 'orienter',
         'titre', 'Claudication vasculaire probable',
         'conduite', 'Avis médical pour exploration artérielle. Ne pas traiter comme une sténose lombaire.',
         'pourquoi', 'Périmètre reproductible, récupération rapide à l’arrêt simple, pouls diminués : trois éléments qui orientent vers l’artérite et non vers le canal.'
       ),

       'fin_nociplastique', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Mécanisme nociplastique dominant',
         'conduite', 'Reprise graduée pilotée par la fonction et non par la douleur, avec des objectifs écrits. Travail du sommeil et de la régulation de la charge. Éducation. Thérapie manuelle en appoint bref et non répété. Séances espacées.',
         'pourquoi', 'Les critères 2021 sont réunis, hypersensibilité évoquée comprise. Enchaîner les séances passives entretient l’idée d’un tissu à réparer et le recours au soin.'
       ),

       'fin_extension', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Préférence directionnelle en extension',
         'conduite', 'Press-up en procubitus, dix répétitions toutes les deux heures. Extension debout avant et après les tâches en flexion. Aménagement de la position assise. Reprise progressive de la flexion une fois la centralisation stable.',
         'pourquoi', 'La centralisation est le signe dont la valeur pronostique est la mieux établie de tout l’examen lombaire, et il donne le traitement du soir même.'
       ),

       'fin_flexion', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Préférence directionnelle en flexion',
         'conduite', 'Flexion répétée en décubitus, genoux-poitrine, aménagement de la marche. Chercher une composante sténosante chez le sujet âgé.',
         'pourquoi', 'Une minorité de patients centralise en flexion. Le test tranche, l’a priori se trompe régulièrement.'
       ),

       'fin_ceinture', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Ceinture pelvienne et sacro-iliaque',
         'conduite', 'Ajouter l’ASLR, et sa version sous compression pelvienne. Ceinture pelvienne pendant les périodes de charge, exercices de transfert de charge et de contrôle lombo-pelvien, thérapie manuelle des segments adjacents.',
         'pourquoi', 'C’est le seul ensemble lombo-pelvien validé contre bloc anesthésique. Les tests de position et de mobilité, eux, ne servent pas à décider.'
       ),

       'fin_maigne', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Syndrome de la charnière thoraco-lombaire',
         'conduite', 'Traiter T12-L1, pas le rachis lombaire bas. Travail des tissus mous de la zone de cellulalgie. Expliquer au patient pourquoi la douleur est ressentie ailleurs que là où elle se produit.',
         'pourquoi', 'C’est exactement pour cela que ces patients sont étiquetés résistants : on traite l’étage où ils montrent leur douleur.'
       ),

       'fin_cluneal', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Névralgie des nerfs clunéaux',
         'conduite', 'Travail local de la zone de passage sur la crête, adaptation des appuis et des ceintures, exercices de charge progressive. Avis si échec, une infiltration ciblée pouvant se discuter.',
         'pourquoi', 'Le signe distinctif est la précision du point : la pression reproduit la douleur habituelle, irradiation comprise, et pas une simple sensibilité locale.'
       ),

       'fin_controle_moteur', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Profil contrôle du mouvement',
         'conduite', 'Progression en cinq étapes : contrôle segmentaire, positions statiques en neutre, dissociation tronc-membres, résistance à la rotation, mouvement fonctionnel chargé. Deux à trois exercices à la fois, cinq séances par semaine, progression toutes les deux à trois semaines.',
         'pourquoi', 'Les exercices de stabilisation ne battent pas un autre exercice actif : c’est la sélection du patient, par la règle de Hicks ou par ce qui l’empêche de bouger, qui fait la différence.'
       ),

       'fin_optimisation', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Profil optimisation fonctionnelle',
         'conduite', 'Renforcement progressif, endurance, conditionnement général, tâches spécifiques au travail ou au sport, progression de charge planifiée. Critère de sortie : la capacité dépasse la demande, avec une marge.',
         'pourquoi', 'C’est l’étape la plus souvent escamotée. On arrête quand la douleur a cédé, c’est-à-dire au moment précis où commence le travail qui réduit les récidives.'
       ),

       'fin_manipulation', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Manipulation lombaire en première intention',
         'conduite', 'Une à deux impulsions, avec réévaluation immédiate du signe comparable choisi avant. Dans un programme qui comprend de l’exercice, c’est la condition posée par la recommandation. Exercice directionnel à domicile, poursuite de l’activité, deux séances prévues et point à trois semaines.',
         'pourquoi', 'La règle de Flynn est une règle de réponse au traitement, pas un diagnostic. Elle hiérarchise une première intention, elle ne promet pas un résultat.'
       ),

       'fin_mobilisation', jsonb_build_object(
         'type', 'conclusion', 'ton', 'traiter',
         'titre', 'Mobilisation plutôt que haute vélocité',
         'conduite', 'Pressions postéro-antérieures dosées selon l’irritabilité, trois à quatre séries, réévaluation entre chaque. Ou mobilisation avec mouvement, sous condition d’indolorité immédiate. Puis exercice, toujours dans la même séance.',
         'pourquoi', 'Aucune supériorité nette de la haute vélocité sur la basse n’est établie dans la lombalgie. Le choix se fait sur l’irritabilité, le terrain et l’appréhension.'
       )
     )
   ),
   'Regardez le chemin que vous avez suivi : la décision s’est presque toujours jouée sur la sécurité, sur le comportement de la douleur et sur la réponse au mouvement. Presque jamais sur le nom d’un tissu.',
   0);

END $do$;
