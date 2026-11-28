-- Parcours lombaire : mises à jour de la littérature et parties « que faire »
-- (docs/AUDIT_PARCOURS_LOMBAIRE.md, sections B, C1 et C2).
--
-- B. Des essais importants manquaient. RESTORE (thérapie fonctionnelle
--    cognitive) donne enfin une option solide pour le patient à risque élevé,
--    au moment où le NICE retire ses recommandations psychologiques. TARGET et
--    STarT MSK n'ont pas reproduit le bénéfice de la stratification. Bailey
--    2020 nuance Peul 2007 pour la sciatique qui dure. MINT tranche la question
--    de la radiofréquence facettaire, que le chapitre disait « débattue ». Le
--    paracétamol était déclaré inefficace sans source.
--
-- C1. Le répertoire apprenait à reconnaître les tableaux, beaucoup moins à
--     les traiter : la radiculopathie n'avait aucune partie traitement. Elle,
--     la douleur facettaire, la sacro-iliaque hors grossesse et trois
--     diagnostics de voisinage reçoivent la leur.
--
-- C2. Nouveau chapitre « Ce que le médecin propose » : médicaments,
--     infiltrations, chirurgie. Le patient arrive avec une ordonnance ou un
--     rendez-vous chirurgical, et le thérapeute doit pouvoir en parler juste.
--
-- Rejouable : sections et références sont supprimées par titre ou par
-- citation puis réinsérées, le chapitre est inséré avec ON CONFLICT, et le
-- décalage des chapitres suivants n'a lieu qu'à la première exécution.

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
  -- B1. Éducation : la thérapie fonctionnelle cognitive.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'education-matching';
  IF v_ch IS NULL THEN RAISE EXCEPTION 'Chapitre education-matching absent'; END IF;

  UPDATE public.region_chapter_sections SET order_index = 5
   WHERE chapter_id = v_ch AND title = 'Cadrer le nombre de séances dès le début';

  DELETE FROM public.region_chapter_sections
   WHERE chapter_id = v_ch AND title = 'La thérapie fonctionnelle cognitive';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'La thérapie fonctionnelle cognitive',
   $h$<p>La thérapie fonctionnelle cognitive, développée par Peter O’Sullivan, met en pratique ce que ce chapitre décrit : relier ce que le patient croit, ce qu’il craint et la façon dont il bouge, et travailler les trois ensemble. Elle est délivrée par des kinésithérapeutes, pas par des psychologues.</p><p><strong>Ce qu’a montré l’essai RESTORE.</strong> 492 patients atteints de lombalgie chronique invalidante, dans vingt cabinets australiens, répartis entre la thérapie fonctionnelle cognitive (avec ou sans capteurs de mouvement) et les soins habituels. À treize semaines, les deux groupes traités réduisent nettement plus l’incapacité que les soins habituels. L’effet se maintient à un an, un suivi publié ensuite le retrouve à trois ans, et le coût pour la société est plus faible.</p><p><strong>Ce que contient la prise en charge.</strong> Quelques séances réparties sur trois mois, puis un rappel. Trois éléments. Donner du sens à la douleur : à partir du récit du patient, construire avec lui une explication qui relie ses croyances, ses peurs et ses comportements. S’exposer en contrôlant : reprendre les mouvements redoutés en relâchant la protection excessive (respiration bloquée, ventre contracté en permanence, mouvement figé), jusqu’à constater qu’ils sont possibles. Changer le mode de vie : activité, sommeil, stress, selon ce qui pèse chez ce patient.</p><p><strong>Pourquoi c’est important ici.</strong> Le NICE a retiré en juillet 2026 ses recommandations sur les thérapies psychologiques et les programmes combinés. Pour le patient à risque élevé, la thérapie fonctionnelle cognitive est aujourd’hui l’approche la mieux étayée, et elle relève du champ du thérapeute. Elle demande une formation propre : ce paragraphe en donne la logique, pas la technique.</p>$h$,
   'preuve', 4);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch AND citation LIKE 'Kent P%';
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'Kent P, Haines T, O’Sullivan P et al. Cognitive functional therapy with or without movement sensor biofeedback versus usual care for chronic, disabling low back pain (RESTORE): a randomised, controlled, three-arm, parallel group, phase 3, clinical trial. Lancet.',
   2023, 'essai_randomise',
   'Chez 492 patients, la thérapie fonctionnelle cognitive réduit nettement plus l’incapacité que les soins habituels, avec un effet durable et un coût plus faible.',
   'https://pubmed.ncbi.nlm.nih.gov/37146623/', 10);

  ---------------------------------------------------------------------------
  -- B2. Drapeaux jaunes : ce que les essais suivants ont montré.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'drapeaux-jaunes';
  UPDATE public.region_chapter_sections
     SET body_html = $h$<p>Neuf items, deux minutes de passation. Le score total et un sous-score psychosocial classent le patient en risque faible, moyen ou élevé. L’essai randomisé de Hill, publié dans le Lancet, avait montré qu’orienter le traitement selon ce classement améliorait les résultats fonctionnels et réduisait les coûts et les arrêts de travail. La HAS recommande ce repérage précoce, et le NICE recommande toujours d’envisager une stratification du risque au premier contact.</p><p><strong>Ce que les essais suivants ont montré.</strong> Ce bénéfice n’a pas été reproduit ailleurs. L’essai TARGET, mené dans 77 centres de soins primaires américains, n’a pas réduit le passage à la chronicité en orientant les patients à risque élevé vers une kinésithérapie informée par la psychologie. L’essai STarT MSK, qui étendait la stratification à l’ensemble des douleurs musculosquelettiques en médecine générale anglaise, n’a pas fait mieux que les soins habituels sur la douleur. Le score reste un bon outil de pronostic : il dit qui risque d’évoluer mal. Ce qui n’est pas établi, c’est qu’un parcours organisé autour de ce score suffise à changer cette évolution. Ce qui fait la différence, c’est ce qu’on propose ensuite au patient à risque élevé, et c’est là que la thérapie fonctionnelle cognitive, présentée dans le chapitre sur l’éducation, a les meilleurs résultats.</p><p><strong>Ce qui a changé en juillet 2026.</strong> Le NICE a amendé la recommandation 1.1.3 : la stratification n’oriente plus vers un programme combiné physique et psychologique, mais vers « des programmes d’exercice, avec ou sans thérapie manuelle ». La stratification reste donc recommandée, c’est la destination du patient à risque élevé qui a été revue.</p><p>Application actuelle : risque faible, rassurer, conseiller, une ou deux séances suffisent souvent. Risque moyen, thérapie manuelle et exercice structurés. Risque élevé, suivi plus soutenu, exercice progressif, travail explicite sur les croyances et les obstacles, et discussion pluridisciplinaire si rien ne bouge. Ce qui n’est plus soutenu par le NICE, c’est de présenter un programme psychologique formalisé comme la suite attendue d’un score élevé.</p><p><strong>Le faire passer.</strong> Les neuf items sont plus bas dans ce chapitre, avec leur cotation. Le sous-score psychosocial y est calculé à part, parce que c’est lui qui sépare un risque moyen d’un risque élevé dès que le total atteint quatre.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Le STarT Back Tool';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'B2 : section « Le STarT Back Tool » introuvable'; END IF;

  DELETE FROM public.region_chapter_references
   WHERE chapter_id = v_ch AND (citation LIKE 'Delitto A, Patterson%' OR citation LIKE 'Hill JC et al. Risk-based%');
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'Delitto A, Patterson CG, Stevans JM et al. Stratified care to prevent chronic low back pain in high-risk patients: the TARGET trial. A multi-site pragmatic cluster randomized trial. EClinicalMedicine.',
   2021, 'essai_randomise',
   'Dans 77 centres américains, la stratification avec orientation des patients à risque élevé vers une kinésithérapie informée par la psychologie n’a pas réduit le passage à la chronicité.',
   'https://pmc.ncbi.nlm.nih.gov/articles/PMC8040279/', 10),
  (v_ch,
   'Hill JC et al. Risk-based stratified primary care for common musculoskeletal pain presentations (STarT MSK): a cluster-randomised, controlled trial. Lancet Rheumatol.',
   2022, 'essai_randomise',
   'Étendue à toutes les douleurs musculosquelettiques en médecine générale, la stratification n’a pas fait mieux que les soins habituels sur la douleur.',
   NULL, 11);

  ---------------------------------------------------------------------------
  -- B3 et C1. Radiculopathie : ce qu'on fait, et ce que disent les essais
  -- sur la chirurgie et les infiltrations.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'radiculopathie';

  UPDATE public.region_chapter_sections
     SET order_index = 5,
         body_html = $h$<p>Avis urgent : syndrome de la queue de cheval, déficit moteur sévère ou rapidement progressif. Avis rapide : déficit moteur significatif stable, douleur non contrôlée malgré un traitement médical bien conduit. Discussion chirurgicale : radiculalgie invalidante persistant au delà de six à huit semaines de traitement conservateur bien mené, avec concordance clinique et radiologique.</p><p><strong>Ce que disent les essais sur la chirurgie.</strong> Chez des patients opérés après six à douze semaines de sciatique, la chirurgie accélère nettement le soulagement des premières semaines, mais l’écart s’amenuise et les résultats à un an sont comparables (Peul, 2007). Chez des patients dont la sciatique persiste depuis quatre à douze mois, la microdiscectomie a fait mieux que la poursuite du traitement conservateur sur la douleur à six mois (Bailey, 2020), dans un essai mené dans un seul centre et où un tiers des patients non opérés l’ont finalement été. L’indication reste un arbitrage entre vitesse de soulagement et risque opératoire, qui penche davantage vers la chirurgie quand la sciatique dure et reste invalidante malgré un traitement bien conduit.</p><p><strong>Les infiltrations épidurales.</strong> Elles réduisent un peu la douleur de jambe et l’incapacité à court terme, de l’ordre de cinq points sur cent, sans effet démontré au delà (revue Cochrane d’Oliveira, 2020). C’est une option pour passer un cap douloureux, pas un traitement de fond. Le chapitre « Ce que le médecin propose » reprend ces options en détail.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Réorientation et chirurgie';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'B3 : section « Réorientation et chirurgie » introuvable'; END IF;

  DELETE FROM public.region_chapter_sections
   WHERE chapter_id = v_ch AND title = 'Ce qu’on fait, ce qu’on évite';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Ce qu’on fait, ce qu’on évite',
   $h$<p><strong>Ce qu’on fait.</strong> Expliquer d’abord : l’histoire naturelle est favorable, la hernie régresse souvent d’elle-même, et bouger n’aggrave pas la lésion. Chercher une préférence directionnelle par les mouvements répétés : une partie des sciatiques discales centralisent, le plus souvent en extension, et la direction qui centralise devient l’exercice du soir même. Travailler la mécanosensibilité neurale par des sliders en amplitude non douloureuse, puis par des tensioners quand l’irritabilité baisse. Gérer la charge : fractionner la position assise, garder la marche, maintenir le travail quand c’est possible. La thérapie manuelle lombaire a sa place pour moduler la douleur ; dans une radiculalgie aiguë très irritable, la mobilisation à basse vélocité est préférée.</p><p><strong>Ce qu’on évite.</strong> Le repos au lit, les tractions, les mouvements qui périphérisent la douleur, et les tensioners en phase irritable. Une douleur qui descend plus bas pendant ou après la séance signale qu’on est allé trop loin : on revient au palier précédent.</p><p><strong>Ce qu’on surveille.</strong> La force et les réflexes à chaque séance, notés précisément pour pouvoir comparer. La consigne de queue de cheval, donnée oralement et par écrit. Une date de réévaluation, fixée d’avance, autour de six semaines.</p><p><strong>Quand ça ne marche pas.</strong> Pas d’amélioration nette à six à huit semaines, une douleur qui reste invalidante, ou un déficit qui s’aggrave : c’est le moment de l’avis médical décrit ci-dessous, sans attendre plus longtemps une évolution qui ne vient pas.</p>$h$,
   'pratique', 4);

  DELETE FROM public.region_chapter_references
   WHERE chapter_id = v_ch AND (citation LIKE 'Bailey CS%' OR citation LIKE 'Oliveira CB%');
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'Bailey CS, Rasoulinejad P, Taylor D et al. Surgery versus conservative care for persistent sciatica lasting 4 to 12 months. N Engl J Med.',
   2020, 'essai_randomise',
   'Dans la sciatique qui dure depuis quatre à douze mois, la microdiscectomie fait mieux que le traitement conservateur sur la douleur à six mois.',
   'https://doi.org/10.1056/NEJMoa1912658', 10),
  (v_ch,
   'Oliveira CB, Maher CG, Ferreira ML et al. Epidural corticosteroid injections for lumbosacral radicular pain. Cochrane Database Syst Rev.',
   2020, 'revue_systematique',
   'Effet faible et à court terme sur la douleur de jambe et l’incapacité, de l’ordre de cinq points sur cent.',
   'https://doi.org/10.1002/14651858.CD013577', 11);

  ---------------------------------------------------------------------------
  -- B4 et C1. Facettaire : ce qu'on fait, et la radiofréquence.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'facettaire';

  UPDATE public.region_chapter_sections SET order_index = 4
   WHERE chapter_id = v_ch AND title = 'Le différentiel à ne pas manquer';

  UPDATE public.region_chapter_sections
     SET order_index = 5,
         body_html = $h$<p>Un tableau en extension, unilatéral, résistant à plusieurs semaines de traitement manuel et d’exercice bien conduits, chez un patient dont le retentissement fonctionnel reste important, peut justifier un avis. Le médecin pourra discuter un bloc diagnostique de branche médiane, éventuellement suivi d’une dénervation par radiofréquence.</p><p>Ce qu’il faut en savoir avant d’en parler au patient : dans les essais MINT, la dénervation des articulaires ajoutée à un programme d’exercice n’a apporté aucune amélioration cliniquement pertinente par rapport à l’exercice seul (Juch, 2017). D’autres équipes défendent le geste chez des patients sélectionnés plus strictement, par un double bloc. C’est un avis à demander, pas une promesse à faire, et l’exercice reste la base, avec ou sans geste.</p>$h$
   WHERE chapter_id = v_ch AND title = 'Quand adresser';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'B4 : section « Quand adresser » introuvable'; END IF;

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch AND title = 'Ce qu’on fait';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Ce qu’on fait',
   $h$<p>Le traitement ne dépend pas de la preuve que l’articulaire est en cause : il suit le comportement de la douleur.</p><p><strong>Moduler.</strong> Mobilisation ou manipulation du segment douloureux, en flexion ou en ouverture du côté douloureux, avec réévaluation immédiate du signe comparable.</p><p><strong>Bouger dans le sens qui soulage.</strong> Flexion répétée en décubitus, genoux-poitrine, bascule du bassin, si ces mouvements réduisent la douleur.</p><p><strong>Regagner l’extension.</strong> C’est le mouvement qui fait mal, c’est aussi celui qu’il faut retrouver : par paliers, une fois la douleur calmée, plutôt que de l’interdire durablement, ce qui ne fait que déplacer le problème.</p><p><strong>Renforcer.</strong> Hanches et tronc, avec une progression de charge, et les hanches en particulier quand leur rotation est limitée.</p><p>Ce qu’on évite : annoncer une « arthrose des facettes » responsable, présente chez presque tout le monde après 60 ans, et construire la prise en charge sur des séances passives répétées.</p>$h$,
   'pratique', 3);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch AND citation LIKE 'Juch JNS%';
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'Juch JNS, Maas ET, Ostelo RWJG et al. Effect of radiofrequency denervation on pain intensity among patients with chronic low back pain: the MINT randomized clinical trials. JAMA.',
   2017, 'essai_randomise',
   'Ajoutée à l’exercice, la dénervation des articulaires n’apporte pas d’amélioration cliniquement pertinente.',
   'https://doi.org/10.1001/jama.2017.7918', 10);

  ---------------------------------------------------------------------------
  -- C1. Ceinture pelvienne : la sacro-iliaque hors grossesse.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'ceinture-pelvienne';

  UPDATE public.region_chapter_sections SET order_index = 5
   WHERE chapter_id = v_ch AND title = 'Ne pas manquer l’inflammatoire';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch AND title = 'Hors grossesse : ce qu’on fait';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Hors grossesse : ce qu’on fait',
   $h$<p>Quand la séquence de Laslett rend l’origine sacro-iliaque probable en dehors de la grossesse, le traitement associe trois éléments.</p><p><strong>Calmer.</strong> Techniques manuelles de la région sacro-iliaque ou lombo-pelvienne, choisies sur la réponse immédiate du signe comparable (le test de provocation le plus net, le passage assis-debout), et non sur une position à corriger.</p><p><strong>Recharger.</strong> Exercices de transfert de charge et renforcement des fessiers et du tronc, en progressant de l’appui sur deux pieds à l’appui sur un seul, puis aux escaliers, puis à la course si c’est l’objectif.</p><p><strong>Adapter.</strong> Réduire temporairement les positions asymétriques prolongées et les activités qui déclenchent, puis les réintroduire. Une ceinture pelvienne peut soulager les phases de charge, en appoint, si l’ASLR s’améliore sous compression.</p><p>Le niveau de preuve propre à la sacro-iliaque est faible. Ces choix suivent donc les principes généraux de la lombalgie : l’actif d’abord, le passif en appoint.</p>$h$,
   'pratique', 4);

  ---------------------------------------------------------------------------
  -- C1. Diagnostics de voisinage : ce qu'on fait.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'voisinage';

  UPDATE public.region_chapter_sections SET order_index = 5
   WHERE chapter_id = v_ch AND title = 'Le psoas : ce qui est établi, et ce qui ne l’est pas';
  UPDATE public.region_chapter_sections SET order_index = 6
   WHERE chapter_id = v_ch AND title = 'L’anomalie de transition lombo-sacrée';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch AND title = 'Ce qu’on fait pour ces trois tableaux';
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Ce qu’on fait pour ces trois tableaux',
   $h$<p><strong>Méralgie paresthésique.</strong> Supprimer la compression : ceinture, vêtement serré, ceinture de travail, appui prolongé sur l’arcade inguinale. Expliquer que le trouble est bénin et qu’il évolue le plus souvent favorablement en quelques mois. Demander un avis médical si la zone engourdie s’étend, si une faiblesse apparaît (ce n’est alors plus une méralgie) ou si la gêne persiste malgré la suppression de la compression.</p><p><strong>Nerfs clunéaux.</strong> Repérer et limiter ce qui comprime le point : ceinture, sac porté sur la hanche, appui latéral prolongé. Travail des tissus mous autour du point, avec remesure de sa sensibilité. En cas d’échec, l’infiltration anesthésique du point, faite par un médecin, sert à la fois de test et de traitement.</p><p><strong>Tendinopathie proximale des ischio-jambiers.</strong> C’est un traitement de tendon, pas de nerf ni de rachis. Réduire d’abord ce qui comprime le tendon : position assise prolongée sur une surface dure, étirements en flexion de hanche. Puis une charge progressive : contractions isométriques, renforcement en amplitude croissante, travail de vitesse et reprise de la course. Les étirements des ischio-jambiers, souvent prescrits, aggravent en général la douleur et sont à éviter en phase douloureuse.</p>$h$,
   'pratique', 4);

  ---------------------------------------------------------------------------
  -- B5. Le paracétamol : la source de l'affirmation.
  ---------------------------------------------------------------------------
  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'principes-traitement';
  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch AND citation LIKE 'Williams CM%';
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch,
   'Williams CM, Maher CG, Latimer J et al. Efficacy of paracetamol for acute low-back pain: a double-blind, randomised controlled trial (PACE). Lancet.',
   2014, 'essai_randomise',
   'Chez 1 652 patients en lombalgie aiguë, le paracétamol ne raccourcit pas la récupération par rapport au placebo.',
   NULL, 10);

  ---------------------------------------------------------------------------
  -- C2. Nouveau chapitre : ce que le médecin propose.
  ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.region_chapters WHERE module_id = v_module AND slug = 'traitements-medicaux') THEN
    UPDATE public.region_chapters SET order_index = order_index + 1
     WHERE module_id = v_module AND order_index >= 30;
  END IF;

  INSERT INTO public.region_chapters
    (module_id, slug, title, subtitle, part, kind, summary, objectives, key_points, estimated_minutes, order_index)
  VALUES
    (v_module, 'traitements-medicaux', 'Ce que le médecin propose',
     'Médicaments, infiltrations, chirurgie : ce qu’on peut en attendre',
     'Orienter', 'reorientation',
     'Le patient arrive avec une ordonnance, une infiltration programmée ou un rendez-vous chez le chirurgien, et il vous demande ce que vous en pensez. Ce chapitre donne ce que disent les essais, pour en parler juste sans contredire le prescripteur, et ce que chaque option change à votre prise en charge.',
     jsonb_build_array(
       'Connaître l’effet attendu des principaux médicaments de la lombalgie et de la sciatique.',
       'Situer les infiltrations et la chirurgie : pour qui, avec quel bénéfice, à quel moment.',
       'Adapter sa prise en charge avant et après une infiltration ou une intervention.',
       'Répondre aux questions du patient sans sortir de son champ de compétence.'
     ),
     jsonb_build_array(
       'Le paracétamol ne fait pas mieux que le placebo dans la lombalgie aiguë, ni les opioïdes, qui exposent en plus à des effets indésirables et à un risque de mésusage.',
       'La prégabaline ne fait pas mieux que le placebo dans la sciatique, avec deux fois plus d’effets indésirables.',
       'Infiltration épidurale : effet faible et bref. C’est une fenêtre à exploiter par l’exercice, pas un traitement de fond.',
       'On ne modifie jamais un traitement prescrit : on informe, et on renvoie les questions au prescripteur.'
     ),
     40, 30)
  ON CONFLICT (module_id, slug) DO UPDATE SET
     title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, part = EXCLUDED.part, kind = EXCLUDED.kind,
     summary = EXCLUDED.summary, objectives = EXCLUDED.objectives, key_points = EXCLUDED.key_points,
     estimated_minutes = EXCLUDED.estimated_minutes, updated_at = now();

  SELECT id INTO v_ch FROM public.region_chapters WHERE module_id = v_module AND slug = 'traitements-medicaux';

  DELETE FROM public.region_chapter_sections WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_sections (chapter_id, title, body_html, callout, order_index) VALUES
  (v_ch, 'Pourquoi le thérapeute doit le savoir',
   $h$<p>Votre patient a un traitement prescrit, ou va en avoir un. Il vous demandera ce que vous en pensez, parce que vous le voyez plus souvent et plus longtemps que son médecin. Deux réponses sont mauvaises : contredire le prescripteur, ce qui place le patient entre deux discours, et tout cautionner par principe, ce qui revient à ne rien dire.</p><p>Ce chapitre donne ce que les essais ont montré pour chaque option, afin d’en parler juste, et ce qu’elle change à votre prise en charge. Une règle encadre tout le reste : <strong>vous ne modifiez jamais un traitement prescrit</strong>. Vous informez, vous signalez ce que vous observez, et vous renvoyez les décisions au prescripteur.</p>$h$,
   'cle', 0),
  (v_ch, 'Les médicaments',
   $h$<p><strong>Paracétamol.</strong> Dans la lombalgie aiguë, il ne fait pas mieux que le placebo : dans l’essai PACE, mené chez 1 652 patients, le délai de récupération était identique avec ou sans paracétamol. C’est pourtant encore souvent la première prescription.</p><p><strong>Anti-inflammatoires non stéroïdiens.</strong> Un effet réel mais faible sur la douleur à court terme, au prix d’effets indésirables digestifs, rénaux et cardiovasculaires. Ils se prescrivent à la dose efficace la plus faible et pour la durée la plus courte.</p><p><strong>Opioïdes.</strong> Dans l’essai OPAL, chez des patients en lombalgie ou cervicalgie aiguë, un opioïde n’a pas fait mieux que le placebo sur la douleur à six semaines. Il a entraîné plus d’effets indésirables et, à un an, un risque de mésusage un peu plus élevé. Les auteurs concluent qu’ils ne devraient pas être recommandés dans cette situation, et l’OMS les déconseille dans la lombalgie chronique.</p><p><strong>Myorelaxants.</strong> Un bénéfice incertain et des effets fréquents : somnolence, vertiges. L’OMS les déconseille dans la lombalgie chronique.</p><p><strong>Prégabaline et gabapentine dans la sciatique.</strong> Dans l’essai PRECISE, la prégabaline n’a pas fait mieux que le placebo sur la douleur de jambe, ni à huit semaines ni à un an, avec près de deux fois plus d’effets indésirables, vertiges en tête. Ces molécules restent pourtant fréquemment prescrites pour une sciatique.</p><p><strong>Antidépresseurs.</strong> Certains, comme la duloxétine, sont parfois prescrits pour leur effet sur la douleur, qui est faible dans la lombalgie chronique, et leur place varie selon les recommandations. Le savoir permet d’en parler sans que le patient comprenne qu’on le croit déprimé.</p>$h$,
   'preuve', 1),
  (v_ch, 'Les infiltrations',
   $h$<p><strong>Épidurales de corticoïdes, dans la radiculalgie.</strong> La revue Cochrane d’Oliveira (2020), qui réunit vingt-cinq essais contre placebo, retrouve un effet faible et bref : environ cinq points sur cent sur la douleur de jambe et sur l’incapacité, à court terme seulement. Une option pour passer un cap très douloureux, pas un traitement de fond.</p><p><strong>Dénervation des articulaires par radiofréquence, dans la lombalgie chronique.</strong> Dans les essais MINT, ajoutée à un programme d’exercice, elle n’a pas apporté d’amélioration cliniquement pertinente par rapport à l’exercice seul. Elle reste proposée par certaines équipes chez des patients sélectionnés par un double bloc diagnostique.</p>$h$,
   'preuve', 2),
  (v_ch, 'La chirurgie',
   $h$<p><strong>Discectomie, pour une sciatique par hernie.</strong> Elle soulage plus vite que le traitement conservateur. Opérée tôt, après six à douze semaines, elle ne fait pas mieux à un an (Peul, 2007). Quand la sciatique dure depuis quatre à douze mois et reste invalidante, elle fait mieux que la poursuite du conservateur à six mois (Bailey, 2020). C’est donc un arbitrage entre vitesse de soulagement et risque opératoire, qui dépend de la durée et du retentissement, et que le patient doit pouvoir faire en connaissant ces chiffres.</p><p><strong>Décompression, pour une sténose.</strong> Elle améliore surtout la claudication et la douleur de jambe, nettement moins la lombalgie. Le patient doit le savoir avant de consulter le chirurgien, pour ne pas attendre de l’intervention ce qu’elle ne vise pas.</p><p><strong>Arthrodèse, pour une lombalgie chronique sans cause spécifique.</strong> Dans l’essai du Medical Research Council britannique, elle n’a pas fait mieux qu’un programme de réadaptation intensive associant exercice et approche cognitive, pour un coût et un risque plus élevés. Elle se discute pour des indications précises (instabilité vraie, glissement évolutif, déformation), pas pour une lombalgie commune qui dure.</p>$h$,
   'preuve', 3),
  (v_ch, 'Ce que cela change pour votre prise en charge',
   $h$<p><strong>Avant une infiltration ou une intervention.</strong> Poursuivre le travail actif. Un patient qui arrive à la chirurgie en meilleure condition physique et mieux informé récupère dans de meilleures conditions, et certains n’en auront finalement plus besoin.</p><p><strong>Après une infiltration.</strong> La période où la douleur baisse est le moment d’intensifier l’exercice et la reprise d’activité, pas de se reposer en attendant que l’effet passe. C’est elle qui donne un sens à un effet par ailleurs bref.</p><p><strong>Après une discectomie.</strong> Suivre le protocole du chirurgien. Les données disponibles ne justifient pas de longues restrictions : une rééducation active débutée dans les semaines qui suivent l’intervention améliore la fonction plus vite que l’absence de rééducation.</p><p><strong>Après une arthrodèse.</strong> Pas de technique à haute vélocité sur les segments fusionnés ; le travail porte sur les segments adjacents, les hanches et la progression fonctionnelle. Le chapitre sur le rachis opéré détaille cette prise en charge.</p><p><strong>Les effets indésirables.</strong> Somnolence, vertiges, constipation, troubles digestifs : vous les voyez souvent avant le médecin. Les signaler au patient et lui conseiller d’en parler à son prescripteur fait partie de votre rôle.</p>$h$,
   'pratique', 4),
  (v_ch, 'En parler avec le patient',
   $h$<p>Une formulation qui fonctionne : « c’est votre médecin qui décide de ce traitement. Ce que je peux vous dire, c’est ce qu’on en attend d’après les études : … Si cela soulève des questions, notez-les pour votre prochain rendez-vous avec lui. »</p><p>Elle donne l’information, elle ne met pas le patient en position de choisir entre deux soignants, et elle renvoie la décision à celui qui la porte. Ce qu’on évite : « ça ne sert à rien, arrêtez-le », mais aussi « ne vous inquiétez pas, ça va vous soulager » quand les essais disent le contraire.</p><p>Le même principe vaut pour le courrier : si un traitement vous semble mal toléré ou sans effet, vous le décrivez avec des faits (« somnolence marquée depuis l’introduction de la prégabaline, douleur de jambe inchangée à cinq semaines ») et vous laissez la conclusion au prescripteur.</p>$h$,
   'pratique', 5);

  DELETE FROM public.region_chapter_references WHERE chapter_id = v_ch;
  INSERT INTO public.region_chapter_references (chapter_id, citation, year, source_type, takeaway, url, order_index) VALUES
  (v_ch, 'Williams CM, Maher CG, Latimer J et al. Efficacy of paracetamol for acute low-back pain: a double-blind, randomised controlled trial (PACE). Lancet.',
   2014, 'essai_randomise', 'Le paracétamol ne raccourcit pas la récupération de la lombalgie aiguë par rapport au placebo.', NULL, 0),
  (v_ch, 'Jones CMP, Day RO, Koes BW et al. Opioid analgesia for acute low back pain and neck pain (the OPAL trial): a randomised placebo-controlled trial. Lancet.',
   2023, 'essai_randomise', 'Pas de bénéfice d’un opioïde sur le placebo à six semaines, plus d’effets indésirables et un risque de mésusage un peu plus élevé à un an.', 'https://doi.org/10.1016/S0140-6736(23)00404-X', 1),
  (v_ch, 'Mathieson S, Maher CG, McLachlan AJ et al. Trial of pregabalin for acute and chronic sciatica (PRECISE). N Engl J Med.',
   2017, 'essai_randomise', 'La prégabaline ne fait pas mieux que le placebo sur la douleur de jambe, à huit semaines comme à un an.', 'https://pubmed.ncbi.nlm.nih.gov/28328324/', 2),
  (v_ch, 'Oliveira CB, Maher CG, Ferreira ML et al. Epidural corticosteroid injections for lumbosacral radicular pain. Cochrane Database Syst Rev.',
   2020, 'revue_systematique', 'Effet faible et à court terme des infiltrations épidurales dans la radiculalgie.', 'https://doi.org/10.1002/14651858.CD013577', 3),
  (v_ch, 'Juch JNS, Maas ET, Ostelo RWJG et al. Effect of radiofrequency denervation on pain intensity among patients with chronic low back pain: the MINT randomized clinical trials. JAMA.',
   2017, 'essai_randomise', 'Pas d’amélioration cliniquement pertinente de la radiofréquence ajoutée à l’exercice.', 'https://doi.org/10.1001/jama.2017.7918', 4),
  (v_ch, 'Peul WC, van Houwelingen HC, van den Hout WB et al. Surgery versus prolonged conservative treatment for sciatica. N Engl J Med.',
   2007, 'essai_randomise', 'Opérée tôt, la sciatique est soulagée plus vite, avec des résultats comparables à un an.', NULL, 5),
  (v_ch, 'Bailey CS, Rasoulinejad P, Taylor D et al. Surgery versus conservative care for persistent sciatica lasting 4 to 12 months. N Engl J Med.',
   2020, 'essai_randomise', 'Dans la sciatique qui dure, la microdiscectomie fait mieux que le conservateur à six mois.', 'https://doi.org/10.1056/NEJMoa1912658', 6),
  (v_ch, 'Fairbank J, Frost H, Wilson-MacDonald J et al. Randomised controlled trial to compare surgical stabilisation of the lumbar spine with an intensive rehabilitation programme for patients with chronic low back pain: the MRC spine stabilisation trial. BMJ.',
   2005, 'essai_randomise', 'L’arthrodèse ne fait pas mieux qu’une réadaptation intensive dans la lombalgie chronique sans cause spécifique.', NULL, 7),
  (v_ch, 'Organisation mondiale de la santé. WHO guideline for non-surgical management of chronic primary low back pain in adults in primary and community care settings.',
   2023, 'recommandation', 'Opioïdes et myorelaxants déconseillés dans la lombalgie chronique primaire.', NULL, 8);
END
$do$;
