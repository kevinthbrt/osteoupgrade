-- Compléments de tests et de clusters pour le parcours « Région lombaire ».
--
-- La base portait déjà l'essentiel du lombaire (Laslett, Cook, myotomes L2-S1,
-- Lasègue et Lasègue croisé, Slump, Leri, centralisation, PIT, extension
-- passive, percussion poing fermé). Manquaient les items de la règle de
-- prédiction clinique de Flynn, ceux de la règle d'instabilité de Hicks, et
-- quelques tests cités par les recommandations.
--
-- Choix assumé : sensibilité et spécificité ne sont renseignées que lorsque la
-- littérature donne un chiffre stable sur une population définie. Un test dont
-- la valeur isolée n'est pas établie garde des colonnes vides et l'explication
-- passe dans `interest`. Un chiffre inventé serait pire que pas de chiffre :
-- il serait utilisé pour décider.
--
-- Les insertions sont idempotentes (aucune contrainte d'unicité sur `name`,
-- donc filtrage explicite par NOT EXISTS).

-- ============================================================================
-- 1. TESTS
-- ============================================================================

INSERT INTO public.orthopedic_tests (name, category, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
SELECT * FROM (VALUES
  (
    'Active Straight Leg Raise (ASLR)',
    'Sacro-iliaque',
    'Patient en décubitus dorsal, jambes tendues, pieds écartés de 20 cm. Consigne : « levez la jambe tendue de 20 cm sans plier le genou ». Le patient cote lui-même la difficulté de 0 (aucune) à 5 (impossible), de chaque côté. Le score total va de 0 à 10. Le test est répété avec une compression pelvienne manuelle : une difficulté nettement réduite par la compression signe un défaut de transfert de charge à travers la ceinture pelvienne.',
    'Douleur de ceinture pelvienne, en particulier pendant la grossesse et en post-partum. Suspicion de défaut de transfert de charge lombo-pelvien.',
    'C''est le seul test de la ceinture pelvienne dont la valeur diagnostique tient vraiment. Il mesure une incapacité fonctionnelle, pas une douleur provoquée, ce qui le rend moins sensible à l''appréhension du patient. La réduction du score sous compression pelvienne oriente directement le traitement : ceinture pelvienne, travail de transfert de charge.',
    'Mens JM et al. Validity of the active straight leg raise test for measuring disease severity in patients with posterior pelvic pain after pregnancy. Spine. 2002.',
    87.00, 94.00, 14.50, 0.14
  ),
  (
    'Mouvements aberrants lombaires',
    'Lombaire',
    'Observation de la flexion et du retour en extension debout. Sont comptés comme aberrants : un arc douloureux en flexion, un arc douloureux au retour, le « signe de l''escalade » (le patient prend appui sur ses cuisses pour se redresser), une déviation latérale du tronc pendant le mouvement, et une inversion du rythme lombo-pelvien. La présence d''un seul de ces signes rend le test positif.',
    'Suspicion d''instabilité lombaire clinique. Aide à l''orientation vers un travail de contrôle moteur.',
    'La valeur diagnostique isolée est faible : ce signe n''identifie pas une instabilité radiologique. Son intérêt est d''appartenir à la règle de prédiction clinique de Hicks, qui repère les patients susceptibles de répondre à un programme de stabilisation. À utiliser comme item d''une règle, jamais comme preuve.',
    'Hicks GE et al. Preliminary development of a clinical prediction rule for determining which patients with low back pain will respond to a stabilization exercise program. Arch Phys Med Rehabil. 2005.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Test de Schober modifié',
    'Lombaire',
    'Patient debout. Repérer la ligne joignant les épines iliaques postéro-supérieures, marquer un point 5 cm en dessous et un point 10 cm au-dessus. Mesurer l''écart entre les deux marques (15 cm au départ), puis demander une flexion antérieure maximale. L''allongement normal est d''au moins 5 cm, soit 20 cm au total.',
    'Quantification de la mobilité lombaire en flexion. Suivi d''une spondyloarthrite axiale. Objectivation d''un enraidissement.',
    'Ce n''est pas un test diagnostique : une mobilité réduite ne dit pas pourquoi. Sa valeur est dans le suivi, en particulier dans la spondyloarthrite axiale où l''évolution de la mobilité fait partie des indices composites. Chez le lombalgique commun, une mobilité conservée n''exclut rien et une mobilité réduite n''incrimine rien.',
    'Sieper J et al. The Assessment of SpondyloArthritis international Society (ASAS) handbook. Ann Rheum Dis. 2009. Moll JM, Wright V. Normal range of spinal mobility. Ann Rheum Dis. 1971.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Test d''hyperextension unipodale (Stork test)',
    'Lombaire',
    'Patient debout en appui sur une seule jambe, mains sur les hanches, réalisant une extension lombaire. Le test est classiquement décrit comme positif lorsqu''il reproduit la douleur lombaire en appui du côté de la lyse suspectée.',
    'Historiquement proposé dans la suspicion de spondylolyse chez l''adolescent sportif.',
    'Test à connaître pour savoir qu''il ne faut pas s''y fier. Confronté à l''IRM, il n''est ni sensible ni spécifique de la spondylolyse : il ne permet ni de retenir ni d''écarter le diagnostic. Devant une lombalgie d''extension persistante chez un adolescent sportif, c''est l''imagerie qui tranche, et le test négatif ne doit jamais rassurer.',
    'Masci L et al. Use of the one-legged hyperextension test and magnetic resonance imaging in the diagnosis of active spondylolysis. Br J Sports Med. 2006.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Test du tapis roulant en deux temps',
    'Lombaire',
    'Le patient marche sur tapis roulant à plat, puis, après repos, en pente montante (environ 15 %), à vitesse confortable et pour une durée identique. Deux éléments sont notés : la distance parcourue avant apparition des symptômes dans chaque condition, et le temps nécessaire à la disparition des symptômes après l''arrêt.',
    'Distinction entre claudication neurogène (sténose lombaire) et claudication vasculaire, lorsque l''interrogatoire reste ambigu.',
    'La marche en pente met le rachis lombaire en légère flexion, ce qui ouvre le canal : un patient sténosé tolère mieux la montée que le plat, alors que le patient artéritique tolère moins bien la montée, qui augmente la demande musculaire. Le second élément est au moins aussi discriminant : après l''arrêt, la douleur vasculaire cède en quelques minutes, la douleur neurogène met plus longtemps à s''effacer.',
    'Fritz JM et al. A nonsurgical treatment approach for patients with lumbar spinal stenosis. Phys Ther. 1997. Deen HG et al. Test-retest reproducibility of the exercise treadmill examination in lumbar spinal stenosis. Mayo Clin Proc. 2000.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Palper-rouler de la charnière thoraco-lombaire',
    'Lombaire',
    'Pincement et roulement du pli cutané à la face postéro-latérale du tronc puis sur la crête iliaque, de part et d''autre, à la recherche d''une cellulalgie : pli épaissi, douloureux, difficile à rouler, asymétrique. Complété par la palpation du point de crête iliaque, à 7 cm environ de la ligne médiane, et par la palpation des articulaires postérieures T12-L1.',
    'Douleur de la crête iliaque ou de la fesse haute, sans irradiation radiculaire, avec examen lombaire bas pauvre. Recherche du syndrome de la charnière thoraco-lombaire.',
    'Signe d''appel du syndrome décrit par Maigne : la douleur est ressentie en bas alors que la souffrance est à la charnière thoraco-lombaire, par l''intermédiaire des branches postérieures des nerfs rachidiens T12-L1. Son intérêt est de rediriger l''examen vers un étage que l''on n''aurait pas examiné. La reproductibilité inter-examinateurs du palper-rouler est modeste : c''est un signe d''orientation, confirmé par la reproduction de la douleur à la pression des articulaires T12-L1.',
    'Maigne R. Le syndrome de la charnière dorso-lombaire. Sem Hop Paris. 1981. Maigne JY, Doursounian L. Entrapment neuropathy of the medial superior cluneal nerve. Spine. 1997.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Hypomobilité segmentaire lombaire (pression postéro-antérieure)',
    'Lombaire',
    'Patient en procubitus, rachis lombaire relâché. Pression postéro-antérieure centrale sur chaque épineuse lombaire, puis unilatérale sur les articulaires postérieures, en notant la résistance perçue et la douleur provoquée, étage par étage.',
    'Recherche d''un segment hypomobile, notamment comme item de la règle de prédiction clinique de Flynn pour la manipulation lombaire.',
    'La fiabilité inter-examinateurs du jugement « hypomobile » est faible à modérée, et la corrélation avec une mobilité mesurée est mauvaise. Le test garde sa place comme item d''une règle de décision et comme repère de la douleur segmentaire provoquée, pas comme constat objectif de blocage.',
    'Hicks GE et al. Interrater reliability of clinical examination measures for identification of lumbar segmental instability. Arch Phys Med Rehabil. 2003. Flynn T et al. A clinical prediction rule for classifying patients with low back pain who demonstrate short-term improvement with spinal manipulation. Spine. 2002.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Durée des symptômes inférieure à 16 jours',
    'Lombaire',
    'Item d''interrogatoire : l''épisode douloureux actuel évolue depuis moins de seize jours.',
    'Item de la règle de prédiction clinique de Flynn pour la manipulation lombaire.',
    'C''est le critère le plus discriminant de la règle : la réponse favorable à la manipulation lombaire est concentrée sur les épisodes récents. Pris isolément, un item d''interrogatoire ne décide de rien ; il ne vaut que dans le décompte de la règle.',
    'Flynn T et al. Spine. 2002. Childs JD et al. A clinical prediction rule to identify patients with low back pain most likely to benefit from spinal manipulation. Ann Intern Med. 2004.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Absence de symptômes distaux au genou',
    'Lombaire',
    'Item d''interrogatoire : aucun symptôme, douleur ou paresthésie, ne descend en dessous du genou.',
    'Item de la règle de prédiction clinique de Flynn pour la manipulation lombaire.',
    'Le symptôme sous le genou oriente vers une souffrance radiculaire, dont l''évolution sous manipulation est moins favorable. L''item ne dit rien du diagnostic à lui seul.',
    'Flynn T et al. Spine. 2002. Childs JD et al. Ann Intern Med. 2004.',
    NULL, NULL, NULL, NULL
  ),
  (
    'FABQ-Travail inférieur à 19',
    'Lombaire',
    'Item de questionnaire : score inférieur à 19 à la sous-échelle « travail » du Fear-Avoidance Beliefs Questionnaire, qui mesure les croyances de peur et d''évitement liées à l''activité professionnelle.',
    'Item de la règle de prédiction clinique de Flynn. Repérage des croyances d''évitement, drapeau jaune majeur.',
    'Double usage : item de la règle, et mesure utile en soi. Un score élevé prédit une évolution défavorable et un retour au travail retardé, quelle que soit la technique employée. Le repérer change la prise en charge plus sûrement que n''importe quel test de provocation.',
    'Waddell G et al. A Fear-Avoidance Beliefs Questionnaire (FABQ). Pain. 1993. Flynn T et al. Spine. 2002.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Élévation de jambe tendue supérieure à 91 degrés',
    'Lombaire',
    'Mesure goniométrique de l''amplitude d''élévation passive de jambe tendue, en dehors de toute reproduction de douleur radiculaire. Le seuil retenu est de 91 degrés au moins d''un côté.',
    'Item de la règle de prédiction clinique de Hicks pour le programme de stabilisation lombaire.',
    'Ici l''élévation de jambe tendue n''est pas utilisée comme test neurodynamique mais comme marqueur d''hyperlaxité. C''est une source de confusion fréquente : le même geste sert deux questions différentes selon ce que l''on note, la douleur reproduite ou l''amplitude atteinte.',
    'Hicks GE et al. Arch Phys Med Rehabil. 2005.',
    NULL, NULL, NULL, NULL
  ),
  (
    'Signe de la sonnette',
    'Lombaire',
    'Pression paravertébrale ferme en regard de l''espace intervertébral suspect, à la recherche d''une douleur irradiant sur le trajet radiculaire du membre inférieur.',
    'Suspicion de conflit disco-radiculaire, repérage de l''étage.',
    'Signe classique de l''examen francophone, dont la valeur diagnostique n''a jamais été établie de façon convaincante : ni sa reproductibilité ni son rapport de vraisemblance ne sont documentés sur des effectifs suffisants. Il peut appuyer une hypothèse déjà construite sur l''interrogatoire et les tests neurodynamiques, il ne doit pas la fonder.',
    'Aucune étude de valeur diagnostique de qualité suffisante. À interpréter comme un signe d''orientation.',
    NULL, NULL, NULL, NULL
  )
) AS t(name, category, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
WHERE NOT EXISTS (
  SELECT 1 FROM public.orthopedic_tests existing WHERE existing.name = t.name
);

-- Coquille sur un test existant : « Tight » pour « Thigh ». Le nom est un
-- libellé d'affichage, aucune requête ne s'y appuie.
UPDATE public.orthopedic_tests
SET name = 'Thigh thrust test'
WHERE name = 'Tight thrust test';

-- ============================================================================
-- 2. CLUSTERS
-- ============================================================================

INSERT INTO public.orthopedic_test_clusters (name, region, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
SELECT * FROM (VALUES
  (
    'Règle de prédiction clinique de Flynn (manipulation lombaire)',
    'Lombaire',
    'Cinq items : durée de l''épisode inférieure à 16 jours, aucun symptôme sous le genou, score FABQ-Travail inférieur à 19, au moins un segment lombaire jugé hypomobile en pression postéro-antérieure, au moins une hanche à plus de 35 degrés de rotation interne. Quatre items présents sur cinq définissent le sous-groupe susceptible de répondre rapidement à la manipulation lombaire.',
    'Lombalgie commune sans drapeau rouge, chez un patient pour lequel on hésite à manipuler.',
    'Ce n''est pas une règle diagnostique mais une règle de réponse au traitement : elle ne dit pas ce qu''a le patient, elle estime la probabilité qu''il aille mieux vite après manipulation. Avec quatre items sur cinq, le rapport de vraisemblance positif publié atteint 24,4, ce qui fait passer la probabilité de succès d''environ 45 % à plus de 90 %. Deux réserves honnêtes : la validation externe n''a pas toujours retrouvé cet effet, en particulier hors soins primaires et chez des patients plus chroniques, et le bras comparateur des études de validation change les conclusions. La règle reste utile pour hiérarchiser une première intention, pas pour promettre un résultat.',
    'Flynn T et al. Spine. 2002. Childs JD et al. Ann Intern Med. 2004. Hancock MJ et al. Independent evaluation of a clinical prediction rule for spinal manipulative therapy. Eur Spine J. 2008.',
    NULL::numeric, NULL::numeric, 24.40, NULL::numeric
  ),
  (
    'Règle d''instabilité clinique de Hicks (programme de stabilisation)',
    'Lombaire',
    'Quatre items : âge inférieur à 40 ans, élévation de jambe tendue supérieure à 91 degrés au moins d''un côté, présence de mouvements aberrants à la flexion-extension debout, test d''instabilité en procubitus positif. Trois items sur quatre orientent vers un programme de contrôle moteur.',
    'Lombalgie récidivante ou chronique, sensation de dérobement ou de blocage, douleur en fin d''amplitude.',
    'Même logique que la règle de Flynn : il s''agit d''identifier qui répond à quoi, pas de prouver une instabilité. Avec trois items sur quatre, le rapport de vraisemblance positif rapporté est d''environ 4. À l''inverse, l''absence de ces items chez un patient jeune et douloureux depuis longtemps doit faire reconsidérer l''orientation vers la stabilisation, souvent proposée par habitude plutôt que sur examen.',
    'Hicks GE et al. Arch Phys Med Rehabil. 2005. Rabin A et al. A clinical prediction rule to identify patients with low back pain likely to benefit from a stabilization exercise program. J Orthop Sports Phys Ther. 2014.',
    NULL, NULL, 4.00, NULL
  ),
  (
    'Faisceau d''arguments de radiculopathie lombaire',
    'Lombaire',
    'Association d''une douleur de topographie radiculaire dominante au membre inférieur, d''un test neurodynamique positif reproduisant la douleur habituelle (Lasègue, Slump, ou Leri pour les racines hautes), et d''au moins un signe de déficit systématisé : myotome, réflexe ou territoire sensitif correspondant à la même racine.',
    'Douleur descendant sous le genou, paresthésies de topographie systématisée, suspicion de conflit disco-radiculaire.',
    'Aucun test isolé ne suffit. Le Lasègue est sensible et peu spécifique : il sert à écarter, pas à retenir. Le Lasègue croisé est l''inverse, peu sensible et très spécifique : il sert à retenir. La convergence des trois plans, topographie, neurodynamique et déficit, est ce qui rend le diagnostic solide, et c''est aussi ce qui définit le niveau atteint. Un seul élément positif au milieu de deux éléments négatifs doit faire chercher une autre explication, y compris une douleur référée somatique qui imite la radiculalgie sans jamais dépasser le genou.',
    'van der Windt DA et al. Physical examination for lumbar radiculopathy due to disc herniation in patients with low-back pain. Cochrane Database Syst Rev. 2010. Cook C et al. Subjective and objective descriptors of clinical lumbar spine instability. J Man Manip Ther. 2012.',
    NULL, NULL, NULL, NULL
  )
) AS c(name, region, description, indications, interest, sources, sensitivity, specificity, rv_positive, rv_negative)
WHERE NOT EXISTS (
  SELECT 1 FROM public.orthopedic_test_clusters existing WHERE existing.name = c.name
);

-- ============================================================================
-- 3. COMPOSITION DES CLUSTERS
-- ============================================================================

INSERT INTO public.orthopedic_test_cluster_items (cluster_id, test_id, order_index)
SELECT c.id, t.id, v.order_index
FROM (VALUES
  ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'Durée des symptômes inférieure à 16 jours', 0),
  ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'Absence de symptômes distaux au genou', 1),
  ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'FABQ-Travail inférieur à 19', 2),
  ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'Hypomobilité segmentaire lombaire (pression postéro-antérieure)', 3),
  ('Règle de prédiction clinique de Flynn (manipulation lombaire)', 'Rotation Interne Passive de Hanche', 4),
  ('Règle d''instabilité clinique de Hicks (programme de stabilisation)', 'Âge', 0),
  ('Règle d''instabilité clinique de Hicks (programme de stabilisation)', 'Élévation de jambe tendue supérieure à 91 degrés', 1),
  ('Règle d''instabilité clinique de Hicks (programme de stabilisation)', 'Mouvements aberrants lombaires', 2),
  ('Règle d''instabilité clinique de Hicks (programme de stabilisation)', 'Test d''Instabilité en Procubitus (PIT)', 3),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Test de Lasègue (SLR)', 0),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Test de Lasègue croisé', 1),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Slump test', 2),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Test de Leri', 3),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Myotome - L5 - Extension de l''hallux', 4),
  ('Faisceau d''arguments de radiculopathie lombaire', 'Myotome - SI - Flexion plantaire', 5)
) AS v(cluster_name, test_name, order_index)
JOIN public.orthopedic_test_clusters c ON c.name = v.cluster_name
JOIN public.orthopedic_tests t ON t.name = v.test_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.orthopedic_test_cluster_items i
  WHERE i.cluster_id = c.id AND i.test_id = t.id
);
