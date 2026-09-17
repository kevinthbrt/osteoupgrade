-- Les cinq questionnaires que le parcours lombaire cite sans les fournir.
--
-- Avertissement de licence, à ne pas perdre de vue : le STarT Back demande un
-- accord à Keele pour un usage commercial, et l'Oswestry passe par le Mapi
-- Research Trust. `licence_statut` porte cet état, l'administration l'affiche.
--
-- Avertissement de traduction, tout aussi important : sauf pour le DN4, dont le
-- français est la langue d'origine, les formulations ci-dessous sont fidèles
-- mais ne sont pas les traductions officiellement validées. `traduction_officielle`
-- reste donc à faux, la page le signale, et les libellés sont modifiables depuis
-- l'administration pour être remplacés par la version officielle le jour où la
-- licence l'apporte. Un questionnaire validé ne l'est que dans sa formulation
-- validée : c'est le même principe qu'une sensibilité qu'on n'invente pas.

DO $do$
DECLARE
  v_q UUID;
  v_probleme TEXT;
  v_accord  JSONB := $e$[{"label":"D'accord","valeur":1},{"label":"Pas d'accord","valeur":0}]$e$::jsonb;
  v_ouinon  JSONB := $e$[{"label":"Oui","valeur":1},{"label":"Non","valeur":0}]$e$::jsonb;
  v_likert7 JSONB := $e$[{"label":"0, pas du tout d'accord","valeur":0},{"label":"1","valeur":1},{"label":"2","valeur":2},{"label":"3, incertain","valeur":3},{"label":"4","valeur":4},{"label":"5","valeur":5},{"label":"6, tout à fait d'accord","valeur":6}]$e$::jsonb;
BEGIN

-- ===========================================================================
-- 1. STarT Back
-- ===========================================================================
INSERT INTO public.questionnaires
  (slug, code, name, purpose, region, duration_minutes, instructions, methode, interpretation,
   source_citation, source_url, licence, licence_statut, licence_url, traduction_officielle, order_index)
VALUES (
  'start-back', 'STarT Back', 'Keele STarT Back Screening Tool',
  $t$Stratifier le risque de chronicité dès la première consultation, et en déduire l'intensité de la prise en charge.$t$,
  'lombaire', 2,
  $t$À faire remplir par le patient. En pensant aux deux dernières semaines, cochez votre réponse à chaque affirmation.$t$,
  'start_back',
  $i$[
    {"cle":"faible","libelle":"Risque faible","min":0,"max":3,"ton":"ok",
     "conduite":"Rassurer, expliquer l'histoire naturelle, conseiller le maintien de l'activité. Une à deux séances suffisent souvent. Multiplier les séances ici, c'est entretenir un recours au soin dont ce patient n'a pas besoin."},
    {"cle":"moyen","libelle":"Risque moyen","min":4,"max":9,"ton":"attention",
     "conduite":"Prise en charge structurée associant thérapie manuelle et exercice, avec un objectif fonctionnel écrit et une réévaluation prévue."},
    {"cle":"eleve","libelle":"Risque élevé","min":4,"max":9,"ton":"alerte",
     "conduite":"Suivi plus soutenu, exercice progressif et exposition graduée, travail explicite sur les croyances et sur les obstacles au retour à l'activité. Depuis la mise à jour du NICE de juillet 2026, orienter d'office vers un programme psychologique formalisé n'est plus recommandé : ce qui reste solide est d'adapter l'explication, le dosage et le rythme."}
  ]$i$::jsonb,
  $t$Hill JC et al. A primary care back pain screening tool. Arthritis Rheum, 2008. Essai de stratification : Hill JC et al. Lancet, 2011.$t$,
  'https://www.keele.ac.uk/startmsk/',
  'Keele University',
  'demande_a_faire',
  'https://keelelicencing.org/startmsk-home/',
  false, 1
)
ON CONFLICT (slug) DO UPDATE SET
  code=EXCLUDED.code, name=EXCLUDED.name, purpose=EXCLUDED.purpose, instructions=EXCLUDED.instructions,
  methode=EXCLUDED.methode, interpretation=EXCLUDED.interpretation, source_citation=EXCLUDED.source_citation,
  source_url=EXCLUDED.source_url, licence=EXCLUDED.licence, licence_statut=EXCLUDED.licence_statut,
  licence_url=EXCLUDED.licence_url, order_index=EXCLUDED.order_index
RETURNING id INTO v_q;

DELETE FROM public.questionnaire_items WHERE questionnaire_id = v_q;
INSERT INTO public.questionnaire_items (questionnaire_id, order_index, label, aide, echelle, sous_echelle) VALUES
(v_q, 1, $t$Ma douleur de dos s'est étendue dans la ou les jambes au moins une fois au cours des deux dernières semaines.$t$, NULL, v_accord, 'physique'),
(v_q, 2, $t$J'ai eu mal à l'épaule ou à la nuque au moins une fois au cours des deux dernières semaines.$t$, NULL, v_accord, 'physique'),
(v_q, 3, $t$Je n'ai marché que sur de courtes distances à cause de ma douleur de dos.$t$, NULL, v_accord, 'physique'),
(v_q, 4, $t$Au cours des deux dernières semaines, je me suis habillé plus lentement que d'habitude à cause de ma douleur de dos.$t$, NULL, v_accord, 'physique'),
(v_q, 5, $t$Il n'est pas vraiment prudent, pour une personne dans mon état, d'avoir une activité physique.$t$, NULL, v_accord, 'psychosocial'),
(v_q, 6, $t$Des pensées inquiétantes m'ont souvent traversé l'esprit.$t$, NULL, v_accord, 'psychosocial'),
(v_q, 7, $t$J'ai le sentiment que ma douleur de dos est terrible et qu'elle ne s'améliorera jamais.$t$, NULL, v_accord, 'psychosocial'),
(v_q, 8, $t$De manière générale, je n'ai pas apprécié toutes les choses que j'appréciais autrefois.$t$, NULL, v_accord, 'psychosocial'),
(v_q, 9, $t$Globalement, à quel point votre douleur de dos vous a-t-elle gêné au cours des deux dernières semaines ?$t$,
 $t$Seules les réponses « beaucoup » et « extrêmement » comptent un point.$t$,
 $e$[{"label":"Pas du tout","valeur":0},{"label":"Un peu","valeur":0},{"label":"Modérément","valeur":0},{"label":"Beaucoup","valeur":1},{"label":"Extrêmement","valeur":1}]$e$::jsonb, 'psychosocial');

-- ===========================================================================
-- 2. DN4
-- ===========================================================================
INSERT INTO public.questionnaires
  (slug, code, name, purpose, region, duration_minutes, instructions, methode, interpretation,
   source_citation, source_url, licence, licence_statut, traduction_officielle, order_index)
VALUES (
  'dn4', 'DN4', 'Douleur Neuropathique en 4 questions',
  $t$Repérer une composante neuropathique, c'est-à-dire décider si la douleur relève d'une lésion du système nerveux somatosensoriel plutôt que d'un tissu.$t$,
  'lombaire', 3,
  $t$Les deux premières questions se posent au patient, les deux dernières se remplissent après l'examen. Un point par « oui ».$t$,
  'somme',
  $i$[
    {"cle":"peu_probable","libelle":"Douleur neuropathique peu probable","min":0,"max":3,"ton":"ok",
     "conduite":"Le tableau reste à expliquer par un mécanisme nociceptif ou nociplastique. Un DN4 négatif n'écarte pas une radiculalgie : il pèse contre, il ne tranche pas seul."},
    {"cle":"probable","libelle":"Douleur neuropathique probable","min":4,"max":10,"ton":"attention",
     "conduite":"Composante neuropathique retenue. Neuromobilisation en amplitude infra-douloureuse, gestion de la charge, éducation sur l'histoire naturelle. Surveillance motrice à chaque séance et avis médical si un déficit apparaît ou progresse."}
  ]$i$::jsonb,
  $t$Bouhassira D et al. Comparison of pain syndromes associated with nervous or somatic lesions and development of a new neuropathic pain diagnostic questionnaire (DN4). Pain, 2005. Seuil retenu : 4 sur 10.$t$,
  'https://pubmed.ncbi.nlm.nih.gov/15733628/',
  $t$Publié en français par ses auteurs. Vérifier les conditions de reproduction auprès de l'INSERM avant diffusion commerciale.$t$,
  'a_verifier', true, 2
)
ON CONFLICT (slug) DO UPDATE SET
  code=EXCLUDED.code, name=EXCLUDED.name, purpose=EXCLUDED.purpose, instructions=EXCLUDED.instructions,
  methode=EXCLUDED.methode, interpretation=EXCLUDED.interpretation, source_citation=EXCLUDED.source_citation,
  source_url=EXCLUDED.source_url, licence=EXCLUDED.licence, licence_statut=EXCLUDED.licence_statut,
  traduction_officielle=EXCLUDED.traduction_officielle, order_index=EXCLUDED.order_index
RETURNING id INTO v_q;

DELETE FROM public.questionnaire_items WHERE questionnaire_id = v_q;
INSERT INTO public.questionnaire_items (questionnaire_id, order_index, label, aide, echelle, sous_echelle) VALUES
(v_q, 1,  $t$Brûlure$t$,                    $t$Question 1 : la douleur présente-t-elle une ou plusieurs de ces caractéristiques ?$t$, v_ouinon, 'interrogatoire'),
(v_q, 2,  $t$Sensation de froid douloureux$t$, NULL, v_ouinon, 'interrogatoire'),
(v_q, 3,  $t$Décharges électriques$t$,      NULL, v_ouinon, 'interrogatoire'),
(v_q, 4,  $t$Fourmillements$t$,             $t$Question 2 : la douleur est-elle associée, dans la même région, à un ou plusieurs de ces symptômes ?$t$, v_ouinon, 'interrogatoire'),
(v_q, 5,  $t$Picotements$t$,                NULL, v_ouinon, 'interrogatoire'),
(v_q, 6,  $t$Engourdissements$t$,           NULL, v_ouinon, 'interrogatoire'),
(v_q, 7,  $t$Démangeaisons$t$,              NULL, v_ouinon, 'interrogatoire'),
(v_q, 8,  $t$Hypoesthésie au tact$t$,       $t$Question 3 : la douleur est-elle localisée dans un territoire où l'examen met en évidence ?$t$, v_ouinon, 'examen'),
(v_q, 9,  $t$Hypoesthésie à la piqûre$t$,   NULL, v_ouinon, 'examen'),
(v_q, 10, $t$Le frottement$t$,              $t$Question 4 : la douleur est-elle provoquée ou augmentée par ?$t$, v_ouinon, 'examen');

-- ===========================================================================
-- 3. FABQ
-- ===========================================================================
INSERT INTO public.questionnaires
  (slug, code, name, purpose, region, duration_minutes, instructions, methode, interpretation,
   source_citation, source_url, licence, licence_statut, traduction_officielle, order_index)
VALUES (
  'fabq', 'FABQ', 'Fear-Avoidance Beliefs Questionnaire',
  $t$Mesurer les croyances de peur et d'évitement. La sous-échelle travail prédit le retour à l'activité professionnelle, et c'est elle qu'exige la règle de Flynn.$t$,
  'lombaire', 5,
  $t$Cochez de 0 à 6 selon votre accord avec chaque affirmation. Cinq items ne sont pas comptés dans les scores : ils font partie du questionnaire original et servent de contexte.$t$,
  'sous_echelles',
  $i$[
    {"cle":"faible","libelle":"Croyances d'évitement faibles","min":0,"max":18,"ton":"ok","sous_echelle":"travail",
     "conduite":"Sous 19, c'est l'item favorable de la règle de Flynn. Le patient ne s'interdit pas son travail, il n'y a rien à défaire sur ce plan."},
    {"cle":"modere","libelle":"Croyances d'évitement modérées","min":19,"max":33,"ton":"attention","sous_echelle":"travail",
     "conduite":"Reprendre explicitement ce que le patient croit de son travail et de son dos, avant de charger le programme. Objectif fonctionnel écrit, en lien avec son poste."},
    {"cle":"eleve","libelle":"Croyances d'évitement élevées","min":34,"max":42,"ton":"alerte","sous_echelle":"travail",
     "conduite":"Prédicteur fort de non-retour au travail. Exposition graduée aux gestes redoutés, travail explicite sur les croyances, contact avec le médecin du travail quand l'aménagement du poste est en jeu."}
  ]$i$::jsonb,
  $t$Waddell G et al. A Fear-Avoidance Beliefs Questionnaire (FABQ) and the role of fear-avoidance beliefs in chronic low back pain and disability. Pain, 1993. Version française : Chaory K et al. Spine, 2004.$t$,
  'https://pubmed.ncbi.nlm.nih.gov/8455963/',
  $t$Conditions de reproduction à vérifier avant diffusion commerciale.$t$,
  'a_verifier', false, 3
)
ON CONFLICT (slug) DO UPDATE SET
  code=EXCLUDED.code, name=EXCLUDED.name, purpose=EXCLUDED.purpose, instructions=EXCLUDED.instructions,
  methode=EXCLUDED.methode, interpretation=EXCLUDED.interpretation, source_citation=EXCLUDED.source_citation,
  source_url=EXCLUDED.source_url, licence=EXCLUDED.licence, licence_statut=EXCLUDED.licence_statut,
  order_index=EXCLUDED.order_index
RETURNING id INTO v_q;

DELETE FROM public.questionnaire_items WHERE questionnaire_id = v_q;
INSERT INTO public.questionnaire_items (questionnaire_id, order_index, label, aide, echelle, sous_echelle) VALUES
(v_q, 1,  $t$Ma douleur a été provoquée par une activité physique.$t$, $t$Item non compté dans les scores.$t$, v_likert7, NULL),
(v_q, 2,  $t$L'activité physique aggrave ma douleur.$t$, NULL, v_likert7, 'activite_physique'),
(v_q, 3,  $t$L'activité physique pourrait abîmer mon dos.$t$, NULL, v_likert7, 'activite_physique'),
(v_q, 4,  $t$Je ne devrais pas pratiquer d'activité physique qui pourrait aggraver ma douleur.$t$, NULL, v_likert7, 'activite_physique'),
(v_q, 5,  $t$Je ne peux pas pratiquer d'activité physique qui pourrait aggraver ma douleur.$t$, NULL, v_likert7, 'activite_physique'),
(v_q, 6,  $t$Ma douleur a été provoquée par mon travail ou par un accident survenu au travail.$t$, NULL, v_likert7, 'travail'),
(v_q, 7,  $t$Mon travail a aggravé ma douleur.$t$, NULL, v_likert7, 'travail'),
(v_q, 8,  $t$J'ai une demande d'indemnisation pour ma douleur.$t$, $t$Item non compté dans les scores.$t$, v_likert7, NULL),
(v_q, 9,  $t$Mon travail est trop lourd pour moi.$t$, NULL, v_likert7, 'travail'),
(v_q, 10, $t$Mon travail aggrave ou aggraverait ma douleur.$t$, NULL, v_likert7, 'travail'),
(v_q, 11, $t$Mon travail pourrait abîmer mon dos.$t$, NULL, v_likert7, 'travail'),
(v_q, 12, $t$Je ne devrais pas faire mon travail habituel avec ma douleur actuelle.$t$, NULL, v_likert7, 'travail'),
(v_q, 13, $t$Je ne peux pas faire mon travail habituel avec ma douleur actuelle.$t$, $t$Item non compté dans les scores.$t$, v_likert7, NULL),
(v_q, 14, $t$Je ne peux pas faire mon travail habituel tant que ma douleur n'est pas traitée.$t$, $t$Item non compté dans les scores.$t$, v_likert7, NULL),
(v_q, 15, $t$Je ne pense pas que je reprendrai mon travail habituel dans les trois mois.$t$, NULL, v_likert7, 'travail'),
(v_q, 16, $t$Je ne pense pas que je pourrai un jour reprendre ce travail.$t$, $t$Item non compté dans les scores.$t$, v_likert7, NULL);

-- ===========================================================================
-- 4. EIFEL
-- ===========================================================================
INSERT INTO public.questionnaires
  (slug, code, name, purpose, region, duration_minutes, instructions, methode, interpretation,
   source_citation, source_url, licence, licence_statut, traduction_officielle, order_index)
VALUES (
  'eifel', 'EIFEL', 'Échelle d''Incapacité Fonctionnelle pour l''Évaluation des Lombalgies',
  $t$Mesurer l'incapacité fonctionnelle liée à la lombalgie, et surtout suivre son évolution d'une consultation à l'autre.$t$,
  'lombaire', 5,
  $t$Adaptation française du Roland-Morris. Cochez « oui » pour chaque phrase qui décrit votre situation aujourd'hui.$t$,
  'somme',
  $i$[
    {"cle":"minime","libelle":"Incapacité minime","min":0,"max":3,"ton":"ok",
     "conduite":"La gêne fonctionnelle est faible. Le suivi porte sur le maintien de l'activité, pas sur la réduction d'une incapacité qui n'existe pas."},
    {"cle":"moderee","libelle":"Incapacité modérée","min":4,"max":11,"ton":"attention",
     "conduite":"Zone habituelle de la lombalgie prise en charge en cabinet. Fixer deux ou trois objectifs fonctionnels tirés des items cochés, et refaire passer l'échelle à trois semaines."},
    {"cle":"importante","libelle":"Incapacité importante","min":12,"max":24,"ton":"alerte",
     "conduite":"Retentissement majeur. Vérifier qu'aucun drapeau rouge n'a été manqué, reprendre le tri de sécurité, et envisager une prise en charge pluridisciplinaire si rien ne bouge."}
  ]$i$::jsonb,
  $t$Roland M, Morris R. A study of the natural history of back pain. Spine, 1983. Version française : Coste J et al. Rev Rhum, 1993. Une variation de deux à trois points est considérée comme cliniquement significative.$t$,
  'https://pubmed.ncbi.nlm.nih.gov/6222486/',
  $t$Échelle largement diffusée. Conditions de reproduction à vérifier avant diffusion commerciale.$t$,
  'a_verifier', false, 4
)
ON CONFLICT (slug) DO UPDATE SET
  code=EXCLUDED.code, name=EXCLUDED.name, purpose=EXCLUDED.purpose, instructions=EXCLUDED.instructions,
  methode=EXCLUDED.methode, interpretation=EXCLUDED.interpretation, source_citation=EXCLUDED.source_citation,
  source_url=EXCLUDED.source_url, licence=EXCLUDED.licence, licence_statut=EXCLUDED.licence_statut,
  order_index=EXCLUDED.order_index
RETURNING id INTO v_q;

DELETE FROM public.questionnaire_items WHERE questionnaire_id = v_q;
INSERT INTO public.questionnaire_items (questionnaire_id, order_index, label, aide, echelle, sous_echelle) VALUES
(v_q, 1,  $t$Je reste pratiquement tout le temps à la maison à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 2,  $t$Je change souvent de position pour soulager mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 3,  $t$Je marche plus lentement que d'habitude à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 4,  $t$À cause de mon dos, je n'effectue aucune des tâches que j'ai l'habitude de faire à la maison.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 5,  $t$À cause de mon dos, je m'aide de la rampe pour monter les escaliers.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 6,  $t$À cause de mon dos, je dois m'allonger plus souvent pour me reposer.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 7,  $t$À cause de mon dos, je suis obligé de prendre un appui pour sortir d'un fauteuil.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 8,  $t$À cause de mon dos, je demande aux autres de me rendre service.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 9,  $t$Je m'habille plus lentement que d'habitude à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 10, $t$Je ne reste debout que pendant de courtes périodes à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 11, $t$À cause de mon dos, j'essaie de ne pas me baisser ni de m'agenouiller.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 12, $t$J'ai du mal à me lever d'une chaise à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 13, $t$J'ai mal au dos pratiquement tout le temps.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 14, $t$J'ai du mal à me retourner dans mon lit à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 15, $t$Je n'ai pas beaucoup d'appétit à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 16, $t$J'ai du mal à mettre mes chaussettes ou mes bas à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 17, $t$Je ne peux marcher que sur de courtes distances à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 18, $t$Je dors moins bien à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 19, $t$À cause de mon dos, je m'habille avec de l'aide.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 20, $t$Je reste assis la plupart de la journée à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 21, $t$J'évite les gros travaux à la maison à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 22, $t$À cause de mon dos, je suis plus irritable et de plus mauvaise humeur que d'habitude.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 23, $t$À cause de mon dos, je monte les escaliers plus lentement que d'habitude.$t$, NULL, v_ouinon, 'incapacite'),
(v_q, 24, $t$Je reste pratiquement tout le temps au lit à cause de mon dos.$t$, NULL, v_ouinon, 'incapacite');

-- ===========================================================================
-- 5. Oswestry
-- ===========================================================================
INSERT INTO public.questionnaires
  (slug, code, name, purpose, region, duration_minutes, instructions, methode, interpretation,
   source_citation, source_url, licence, licence_statut, licence_url, traduction_officielle, order_index)
VALUES (
  'oswestry', 'ODI', 'Oswestry Disability Index',
  $t$Mesurer le retentissement de la lombalgie sur les gestes de la vie quotidienne, en pourcentage d'incapacité.$t$,
  'lombaire', 5,
  $t$Dans chaque section, une seule réponse, celle qui décrit le mieux votre situation aujourd'hui. Une section qui ne vous concerne pas se laisse vide : elle est alors retirée du calcul, elle ne compte pas pour zéro.$t$,
  'odi',
  $i$[
    {"cle":"minime","libelle":"Incapacité minime","min":0,"max":20,"ton":"ok",
     "conduite":"Conseils d'activité et d'ergonomie, pas de traitement lourd. La marge de progression mesurable par cet outil est faible : suivre plutôt un objectif fonctionnel concret."},
    {"cle":"moderee","libelle":"Incapacité modérée","min":21,"max":40,"ton":"attention",
     "conduite":"Douleur et gêne au quotidien, activité professionnelle souvent maintenue avec difficulté. Prise en charge conservatrice structurée, réévaluation à quatre semaines."},
    {"cle":"severe","libelle":"Incapacité sévère","min":41,"max":60,"ton":"alerte",
     "conduite":"Le retentissement touche tous les gestes quotidiens. Reprendre le tri de sécurité, préciser le mécanisme dominant, et discuter une prise en charge pluridisciplinaire."},
    {"cle":"invalidante","libelle":"Incapacité invalidante","min":61,"max":80,"ton":"alerte",
     "conduite":"La lombalgie envahit la vie du patient. Avis médical, évaluation pluridisciplinaire, et prudence sur les traitements passifs répétés qui entretiennent le recours au soin."},
    {"cle":"majeure","libelle":"Incapacité majeure","min":81,"max":100,"ton":"alerte",
     "conduite":"Fairbank note que ces scores relèvent soit d'un patient alité, soit d'une amplification des symptômes. Dans les deux cas, la réponse n'est pas une technique manuelle de plus : c'est un avis et une évaluation globale."}
  ]$i$::jsonb,
  $t$Fairbank JC, Pynsent PB. The Oswestry Disability Index. Spine, 2000. Version 2.1a distribuée par le Mapi Research Trust.$t$,
  'https://eprovide.mapi-trust.org/instruments/oswestry-disability-index',
  'Mapi Research Trust',
  'demande_a_faire',
  'https://eprovide.mapi-trust.org/instruments/oswestry-disability-index',
  false, 5
)
ON CONFLICT (slug) DO UPDATE SET
  code=EXCLUDED.code, name=EXCLUDED.name, purpose=EXCLUDED.purpose, instructions=EXCLUDED.instructions,
  methode=EXCLUDED.methode, interpretation=EXCLUDED.interpretation, source_citation=EXCLUDED.source_citation,
  source_url=EXCLUDED.source_url, licence=EXCLUDED.licence, licence_statut=EXCLUDED.licence_statut,
  licence_url=EXCLUDED.licence_url, order_index=EXCLUDED.order_index
RETURNING id INTO v_q;

DELETE FROM public.questionnaire_items WHERE questionnaire_id = v_q;
INSERT INTO public.questionnaire_items (questionnaire_id, order_index, label, aide, echelle, sous_echelle) VALUES
(v_q, 1, $t$Intensité de la douleur$t$, NULL, $e$[
 {"label":"Je n'ai pas mal en ce moment.","valeur":0},
 {"label":"La douleur est très légère en ce moment.","valeur":1},
 {"label":"La douleur est modérée en ce moment.","valeur":2},
 {"label":"La douleur est assez forte en ce moment.","valeur":3},
 {"label":"La douleur est très forte en ce moment.","valeur":4},
 {"label":"La douleur est la pire que l'on puisse imaginer en ce moment.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 2, $t$Soins personnels, se laver et s'habiller$t$, NULL, $e$[
 {"label":"Je peux prendre soin de moi normalement, sans que cela augmente la douleur.","valeur":0},
 {"label":"Je peux prendre soin de moi normalement, mais cela augmente la douleur.","valeur":1},
 {"label":"Prendre soin de moi est douloureux, je dois le faire lentement et avec précaution.","valeur":2},
 {"label":"J'ai besoin d'aide, mais j'arrive à faire la plupart de ma toilette seul.","valeur":3},
 {"label":"J'ai besoin d'aide tous les jours pour la plupart des gestes de la toilette.","valeur":4},
 {"label":"Je ne m'habille pas, je me lave difficilement et je reste au lit.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 3, $t$Soulever des charges$t$, NULL, $e$[
 {"label":"Je peux soulever des charges lourdes sans augmenter la douleur.","valeur":0},
 {"label":"Je peux soulever des charges lourdes, mais cela augmente la douleur.","valeur":1},
 {"label":"La douleur m'empêche de soulever des charges lourdes du sol, mais j'y arrive si elles sont bien placées, par exemple sur une table.","valeur":2},
 {"label":"La douleur m'empêche de soulever des charges lourdes, mais je peux soulever des charges légères à moyennes si elles sont bien placées.","valeur":3},
 {"label":"Je ne peux soulever que des charges très légères.","valeur":4},
 {"label":"Je ne peux rien soulever ni porter.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 4, $t$Marcher$t$, NULL, $e$[
 {"label":"La douleur ne m'empêche pas de marcher, quelle que soit la distance.","valeur":0},
 {"label":"La douleur m'empêche de marcher plus de 1,5 km.","valeur":1},
 {"label":"La douleur m'empêche de marcher plus de 750 m.","valeur":2},
 {"label":"La douleur m'empêche de marcher plus de 100 m.","valeur":3},
 {"label":"Je ne peux marcher qu'avec une canne ou des béquilles.","valeur":4},
 {"label":"Je reste au lit la plupart du temps et je dois me traîner jusqu'aux toilettes.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 5, $t$Rester assis$t$, NULL, $e$[
 {"label":"Je peux rester assis sur n'importe quel siège aussi longtemps que je veux.","valeur":0},
 {"label":"Je peux rester assis aussi longtemps que je veux sur mon siège préféré.","valeur":1},
 {"label":"La douleur m'empêche de rester assis plus d'une heure.","valeur":2},
 {"label":"La douleur m'empêche de rester assis plus d'une demi-heure.","valeur":3},
 {"label":"La douleur m'empêche de rester assis plus de dix minutes.","valeur":4},
 {"label":"La douleur m'empêche complètement de m'asseoir.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 6, $t$Rester debout$t$, NULL, $e$[
 {"label":"Je peux rester debout aussi longtemps que je veux sans que cela augmente la douleur.","valeur":0},
 {"label":"Je peux rester debout aussi longtemps que je veux, mais cela augmente la douleur.","valeur":1},
 {"label":"La douleur m'empêche de rester debout plus d'une heure.","valeur":2},
 {"label":"La douleur m'empêche de rester debout plus d'une demi-heure.","valeur":3},
 {"label":"La douleur m'empêche de rester debout plus de dix minutes.","valeur":4},
 {"label":"La douleur m'empêche complètement de rester debout.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 7, $t$Dormir$t$, NULL, $e$[
 {"label":"Mon sommeil n'est jamais perturbé par la douleur.","valeur":0},
 {"label":"Mon sommeil est parfois perturbé par la douleur.","valeur":1},
 {"label":"À cause de la douleur, je dors moins de six heures.","valeur":2},
 {"label":"À cause de la douleur, je dors moins de quatre heures.","valeur":3},
 {"label":"À cause de la douleur, je dors moins de deux heures.","valeur":4},
 {"label":"La douleur m'empêche complètement de dormir.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 8, $t$Vie sexuelle$t$, $t$Section à laisser vide si elle ne s'applique pas.$t$, $e$[
 {"label":"Ma vie sexuelle est normale et n'augmente pas la douleur.","valeur":0},
 {"label":"Ma vie sexuelle est normale, mais elle augmente la douleur.","valeur":1},
 {"label":"Ma vie sexuelle est presque normale, mais très douloureuse.","valeur":2},
 {"label":"Ma vie sexuelle est fortement limitée par la douleur.","valeur":3},
 {"label":"Ma vie sexuelle est presque inexistante à cause de la douleur.","valeur":4},
 {"label":"La douleur m'interdit toute vie sexuelle.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 9, $t$Vie sociale$t$, NULL, $e$[
 {"label":"Ma vie sociale est normale et n'augmente pas la douleur.","valeur":0},
 {"label":"Ma vie sociale est normale, mais elle augmente la douleur.","valeur":1},
 {"label":"La douleur n'a pas d'effet notable sur ma vie sociale, sauf pour les activités physiques comme le sport.","valeur":2},
 {"label":"La douleur a réduit ma vie sociale et je sors moins souvent.","valeur":3},
 {"label":"La douleur limite ma vie sociale à ce que je fais chez moi.","valeur":4},
 {"label":"Je n'ai plus de vie sociale à cause de la douleur.","valeur":5}]$e$::jsonb, 'incapacite'),
(v_q, 10, $t$Déplacements$t$, NULL, $e$[
 {"label":"Je peux me déplacer partout sans que cela augmente la douleur.","valeur":0},
 {"label":"Je peux me déplacer partout, mais cela augmente la douleur.","valeur":1},
 {"label":"La douleur est forte, mais je supporte des trajets de plus de deux heures.","valeur":2},
 {"label":"La douleur me limite à des trajets de moins d'une heure.","valeur":3},
 {"label":"La douleur me limite aux trajets courts et indispensables, de moins de trente minutes.","valeur":4},
 {"label":"La douleur m'empêche de me déplacer, sauf pour aller chez le médecin ou à l'hôpital.","valeur":5}]$e$::jsonb, 'incapacite');

  -- Vérification, dans la transaction : un questionnaire auquel il manque un
  -- item donne un score faux, et un score faux fait décider de travers. Mieux
  -- vaut que la migration échoue.
  SELECT string_agg(format('%s : %s items attendus, %s trouvés', attendu.slug, attendu.n, coalesce(reel.n, 0)), ' ; ')
    INTO v_probleme
    FROM (VALUES ('start-back', 9), ('dn4', 10), ('fabq', 16), ('eifel', 24), ('oswestry', 10)) AS attendu(slug, n)
    LEFT JOIN (
      SELECT q.slug, count(i.id) AS n
        FROM public.questionnaires q
        JOIN public.questionnaire_items i ON i.questionnaire_id = q.id
       GROUP BY q.slug
    ) reel ON reel.slug = attendu.slug
   WHERE coalesce(reel.n, 0) <> attendu.n;

  IF v_probleme IS NOT NULL THEN
    RAISE EXCEPTION 'Nombre d''items incorrect. %', v_probleme;
  END IF;

END $do$;
