-- Activités des chapitres de la partie « Classer pour décider » et du chapitre
-- « rachis opéré ».
--
-- Les deux tris utilisent des catégories qui ne sont pas des degrés de
-- gravité : le composant de rendu bascule sur une palette neutre quand aucun
-- niveau ne commence par « Urgence », pour ne pas suggérer une hiérarchie
-- entre trois mécanismes de douleur qui n'en ont pas.

DO $do$
DECLARE
  v_module UUID;
BEGIN
  SELECT id INTO v_module FROM public.region_modules WHERE slug = 'lombaire';
  IF v_module IS NULL THEN
    RAISE EXCEPTION 'Module lombaire absent';
  END IF;

  DELETE FROM public.region_chapter_activities
   WHERE chapter_id IN (
     SELECT id FROM public.region_chapters
      WHERE module_id = v_module
        AND slug IN ('mecanismes-douleur', 'profil-reponse', 'croiser-les-axes', 'rachis-opere')
   );

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'tri_drapeaux',
    'Quel mécanisme domine ?',
    'Six patients. Pour chacun, quel mécanisme de douleur domine aujourd’hui ?',
    jsonb_build_object(
      'niveaux', jsonb_build_array('Nociceptif', 'Neuropathique', 'Nociplastique'),
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Lumbago depuis cinq jours après un port de charge. Douleur en barre, pire assis, mieux en marchant, centralisation en extension.', 'niveau', 'Nociceptif', 'feedback', 'Douleur proportionnée, mécanique, modifiable par ce que vous faites en consultation, et localisée. C’est le mécanisme de la très grande majorité des lombalgies récentes.'),
        jsonb_build_object('label', 'Douleur en brûlure de la face latérale de jambe jusqu’à l’hallux, hypoesthésie du même territoire, Lasègue positif reproduisant la douleur habituelle.', 'niveau', 'Neuropathique', 'feedback', 'Topographie neuroanatomiquement plausible, signes sensitifs confinés au territoire, descripteurs de brûlure : les deux premiers degrés de la gradation IASP sont réunis.'),
        jsonb_build_object('label', 'Lombalgie diffuse depuis trois ans, débordant sur le thorax et les fesses, sommeil fragmenté, fatigue, allodynie à l’effleurement de la région lombaire.', 'niveau', 'Nociplastique', 'feedback', 'Plus de trois mois, distribution régionale, hypersensibilité évoquée constatée à l’examen, et des comorbidités de sommeil et de fatigue. Les critères 2021 sont réunis.'),
        jsonb_build_object('label', 'Fessalgie apparue après une chute sur la fesse il y a trois semaines, reproduite par trois tests de provocation sacro-iliaque sur cinq, soulagée en décubitus.', 'niveau', 'Nociceptif', 'feedback', 'Événement déclenchant, douleur reproductible et modifiable, localisée : nociceptif, même si le tissu en cause reste une hypothèse.'),
        jsonb_build_object('label', 'Lombalgie depuis huit mois, douleur qui varie sans rapport avec l’activité, examen physique pauvre, mais aucune hypersensibilité retrouvée à l’examen.', 'niveau', 'Nociceptif', 'feedback', 'Piège volontaire. L’hypersensibilité évoquée est un critère obligatoire de la douleur nociplastique : sans elle, le terme ne s’applique pas, même devant un tableau déroutant. Ne pas comprendre n’est pas un diagnostic.'),
        jsonb_build_object('label', 'Cruralgie chez un diabétique de 62 ans, douleur de décharge de la face antérieure de cuisse, déficit du quadriceps, réflexe rotulien aboli.', 'niveau', 'Neuropathique', 'feedback', 'Topographie plausible, déficit moteur et réflexe dans le même territoire, terrain de neuropathie. Le mécanisme est neuropathique, et la cause reste à établir.')
      )
    ),
    'La question utile n’est pas « lequel des trois » mais « lequel domine aujourd’hui », et la réponse change au fil des semaines chez le même patient.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'mecanismes-douleur';

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'tri_drapeaux',
    'Dans quelle approche placez-vous ce patient ?',
    'Cinq patients relevant tous de la rééducation. Quelle approche pour chacun, aujourd’hui ?',
    jsonb_build_object(
      'niveaux', jsonb_build_array('Modulation des symptômes', 'Contrôle du mouvement', 'Optimisation fonctionnelle'),
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Épisode récidivant depuis six jours, douleur à 7 sur 10, évite de se pencher, amplitudes actives limitées et douloureuses.', 'niveau', 'Modulation des symptômes', 'feedback', 'Épisode récent, symptômes marqués, mouvement empêché d’abord par la douleur. C’est la phase où la thérapie manuelle a le plus sa place.'),
        jsonb_build_object('label', 'Douleur à 3 sur 10, mouvements aberrants à la flexion, test d’instabilité en procubitus positif, sensation de dérobement.', 'niveau', 'Contrôle du mouvement', 'feedback', 'Douleur et incapacité modérées, gêne dominée par la qualité du mouvement. La règle de Hicks désigne précisément ces patients.'),
        jsonb_build_object('label', 'Douleur à 1 sur 10, plus aucune limitation dans la vie courante, mais maçon qui n’ose pas reprendre le port de sacs de ciment.', 'niveau', 'Optimisation fonctionnelle', 'feedback', 'Douleur et incapacité faibles, écart entre la capacité et la demande. C’est l’étape la plus souvent escamotée, et celle qui réduit les récidives.'),
        jsonb_build_object('label', 'Lombalgie chronique peu douloureuse au quotidien, mais qui a cessé toute activité sportive depuis deux ans par précaution.', 'niveau', 'Optimisation fonctionnelle', 'feedback', 'Le déconditionnement et l’évitement sont devenus le problème, pas la douleur. Progression de charge planifiée et exposition graduée.'),
        jsonb_build_object('label', 'Sciatique aiguë très irritable, douleur à 8 sur 10, aucune position tenable plus de dix minutes.', 'niveau', 'Modulation des symptômes', 'feedback', 'Modulation d’abord, avec un dosage prudent imposé par la composante neuropathique. On ne travaille pas le contrôle moteur d’un patient qui ne tient pas en place.')
      )
    ),
    'Un patient change d’approche au cours de sa prise en charge, et ce changement est le critère de progression : la douleur cesse d’être l’obstacle principal, puis la qualité du mouvement, puis l’endurance.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'profil-reponse';

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'cas_etape',
    'Dérouler la grille sur un patient',
    'Quatre axes, dans l’ordre. Chaque réponse est corrigée avant la suivante.',
    jsonb_build_object('steps', jsonb_build_array(
      jsonb_build_object(
        'situation', 'Femme de 52 ans, aide-soignante. Lombalgie depuis trois ans, aujourd’hui diffuse de la charnière thoraco-lombaire aux deux fesses. Sommeil fragmenté, fatigue permanente, difficultés de concentration. Pas d’amaigrissement, pas de fièvre, pas de trouble sphinctérien, pas d’antécédent notable. L’effleurement de la peau lombaire est douloureux des deux côtés.',
        'question', 'Axe 1 : est-ce que cela relève de vous ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Oui, le tri de sécurité est négatif', 'correct', true, 'feedback', 'Oui. Pas de drapeau rouge, pas de signe de queue de cheval, pas de rythme inflammatoire. Le reste de la grille peut se dérouler.'),
          jsonb_build_object('label', 'Non, la fatigue et les troubles du sommeil imposent un avis médical préalable', 'correct', false, 'feedback', 'Non. Ces éléments ne sont pas des drapeaux rouges ici : ce sont des comorbidités qui font partie du tableau, et l’axe suivant va s’en servir.'),
          jsonb_build_object('label', 'Non, trois ans d’évolution sortent du champ de la thérapie manuelle', 'correct', false, 'feedback', 'Non. L’ancienneté n’exclut personne, elle change le mécanisme dominant et donc le contenu de la prise en charge.')
        )
      ),
      jsonb_build_object(
        'situation', 'Tri négatif confirmé. La douleur ne suit aucun trajet nerveux, l’examen neurologique est normal, et rien de ce que vous faites en consultation ne la modifie durablement. L’allodynie lombaire est nette.',
        'question', 'Axe 2 : quel mécanisme domine ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Nociceptif, avec une composante myofasciale', 'correct', false, 'feedback', 'Non. Une douleur nociceptive est proportionnée et modifiable : ce n’est pas le cas ici.'),
          jsonb_build_object('label', 'Nociplastique dominant', 'correct', true, 'feedback', 'Oui. Plus de trois mois, distribution régionale, pas d’explication nociceptive ou neuropathique suffisante, hypersensibilité évoquée constatée, et trois comorbidités. Les critères sont réunis.'),
          jsonb_build_object('label', 'Neuropathique, à cause des troubles de la concentration', 'correct', false, 'feedback', 'Non. Les troubles cognitifs sont une comorbidité des critères nociplastiques. Le mécanisme neuropathique demande une topographie nerveuse plausible et des signes sensitifs dans ce territoire.')
        )
      ),
      jsonb_build_object(
        'situation', 'Mécanisme nociplastique dominant. Elle travaille toujours, avec difficulté. Elle marche vingt minutes, monte ses étages, mais a cessé la natation et évite de porter au travail. Douleur cotée 4 sur 10 la plupart des jours.',
        'question', 'Axe 3 : quel profil de réponse au traitement ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Modulation des symptômes, il faut d’abord faire baisser la douleur', 'correct', false, 'feedback', 'Non, et c’est le piège le plus coûteux ici. Attendre que la douleur baisse pour commencer revient à attendre indéfiniment, et à multiplier les séances passives qui entretiennent le recours au soin.'),
          jsonb_build_object('label', 'Contrôle du mouvement puis optimisation fonctionnelle, pilotés par la fonction', 'correct', true, 'feedback', 'Oui. Incapacité modérée, douleur qui ne sera pas le critère de progression. On avance sur ce qu’elle peut faire, pas sur ce qu’elle ressent.'),
          jsonb_build_object('label', 'Aucun : ce tableau relève d’une structure de la douleur chronique', 'correct', false, 'feedback', 'Trop tôt. Le recours spécialisé se discute devant une détresse marquée, des opioïdes au long cours ou une absence de progrès fonctionnel après plusieurs mois. Rien de tel ici pour l’instant.')
        )
      ),
      jsonb_build_object(
        'situation', 'Profil posé. Au STarT Back, elle obtient un score élevé, avec un sous-score psychosocial marqué : elle pense que son dos est usé et qu’elle finira par ne plus pouvoir travailler.',
        'question', 'Axe 4 : qu’est-ce que ce risque élevé change concrètement ?',
        'options', jsonb_build_array(
          jsonb_build_object('label', 'Il impose de l’adresser pour un programme combiné physique et psychologique', 'correct', false, 'feedback', 'Non. Le NICE a retiré cette recommandation le 29 juillet 2026, en partie sur des travaux rétractés. L’OMS maintient l’option en recommandation conditionnelle, mais ce n’est plus une conduite attendue.'),
          jsonb_build_object('label', 'Il augmente l’intensité du suivi et le temps consacré aux croyances et aux obstacles', 'correct', true, 'feedback', 'Oui. Suivi plus soutenu, exposition graduée, travail explicite sur la croyance d’usure et sur l’avenir professionnel, objectifs fonctionnels écrits. C’est ce que le NICE conserve après sa mise à jour.'),
          jsonb_build_object('label', 'Il ne change rien au contenu, seulement au pronostic annoncé', 'correct', false, 'feedback', 'Non. La stratification sert précisément à modifier l’intensité et le contenu de la prise en charge, c’est ce qu’a montré l’essai STarT Back.')
        )
      )
    )),
    'Conclusion en quatre lignes : relève de la thérapie manuelle, tri négatif. Mécanisme nociplastique dominant. Profil contrôle du mouvement puis optimisation fonctionnelle. Risque élevé. Remarquez ce que la grille n’a jamais eu besoin de nommer : le tissu.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'croiser-les-axes';

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index)
  SELECT
    c.id, 'qcm',
    'Un patient arthrodésé vous consulte',
    'Homme de 58 ans, arthrodèse L4-S1 il y a six ans. Douleur lombaire haute et fessière depuis deux ans, sans déficit, sans fièvre. Que faites-vous ?',
    jsonb_build_object('multiple', true, 'options', jsonb_build_array(
      jsonb_build_object('label', 'Examiner les segments adjacents et les hanches', 'correct', true, 'feedback', 'Oui. L’arthrodèse reporte la contrainte au-dessus et sur les hanches, et c’est la part la plus accessible au traitement manuel.'),
      jsonb_build_object('label', 'Rechercher une composante neuropathique par les descripteurs et le DN4', 'correct', true, 'feedback', 'Oui. Elle est fréquente chez ces patients et largement sous-évaluée, et elle change le dosage.'),
      jsonb_build_object('label', 'Manipuler en haute vélocité le segment arthrodésé pour lui redonner de la mobilité', 'correct', false, 'feedback', 'Non. On évite la haute vélocité sur un segment arthrodésé ou instrumenté, et un segment fusionné n’a pas de mobilité à restaurer.'),
      jsonb_build_object('label', 'Appliquer les critères de douleur nociplastique', 'correct', true, 'feedback', 'Oui. Après deux ans d’évolution, chercher hypersensibilité évoquée et comorbidités : le résultat change complètement la conduite.'),
      jsonb_build_object('label', 'Lui annoncer que l’objectif est de supprimer sa douleur', 'correct', false, 'feedback', 'Non. L’objectif réaliste est un gain de fonction. Un patient à qui on annonce cet objectif et qui l’atteint va mieux qu’un patient à qui on a promis mieux.')
    )),
    'Le terme à employer est « syndrome douloureux rachidien persistant de type 2 ». L’ancien nom désignait un échec et un coupable, et le patient l’entendait ainsi.',
    0
  FROM public.region_chapters c
  WHERE c.module_id = v_module AND c.slug = 'rachis-opere';

END $do$;
