/**
 * Simulateur de consultation : catalogue des examens.
 *
 * Deux principes gouvernent ce fichier.
 *
 * D'abord, un examen donne toujours le même résultat. Le modèle joue le patient
 * pendant l'anamnèse, il ne décide jamais du résultat d'un test : celui-ci est
 * lu dans le cas, et à défaut c'est le résultat normal ci-dessous qui est
 * renvoyé. Sans cela, le même test répété donnerait des réponses différentes et
 * la conclusion ne serait plus corrigeable.
 *
 * Ensuite, le résultat normal appartient au catalogue, pas au cas. Un cas ne
 * décrit donc que ce qu'il a d'anormal, ce qui le garde lisible et évite
 * qu'un oubli produise un « sans particularité » invraisemblable.
 */

export type ExamGroup =
  | 'Dépistage'
  | 'Mobilité'
  | 'Neurologique'
  | 'Neurodynamique'
  | 'Bassin et sacro-iliaque'
  | 'Palpation'
  | 'Hanche'
  | 'Général et vasculaire'
  | 'Imagerie'

export type Exam = {
  code: string
  label: string
  group: ExamGroup
  /** Ce que trouve le praticien quand le cas ne dit rien de particulier. */
  normal: string
}

export const EXAMS: Exam[] = [
  // --- Dépistage -----------------------------------------------------------
  {
    code: 'drapeaux_rouges',
    label: 'Questionnaire dirigé de drapeaux rouges',
    group: 'Dépistage',
    normal:
      'Pas de perte de poids, pas de fièvre, pas d’antécédent de cancer, pas de traumatisme, pas de corticothérapie prolongée, pas de douleur nocturne non mécanique.',
  },
  {
    code: 'perine',
    label: 'Dépistage de queue de cheval (mictions, selles, périnée)',
    group: 'Dépistage',
    normal:
      'Mictions et selles inchangées, pas d’anesthésie en selle, sensibilité périnéale décrite comme normale.',
  },
  {
    code: 'rythme_inflammatoire',
    label: 'Critères ASAS de rachialgie inflammatoire',
    group: 'Dépistage',
    normal:
      'Un seul critère retrouvé : la douleur s’améliore avec l’activité. Pas de réveil de seconde partie de nuit, pas de dérouillage prolongé.',
  },
  {
    code: 'start_back',
    label: 'STarT Back',
    group: 'Dépistage',
    normal: 'Score total 3 sur 9, sous-score psychosocial 1 sur 5 : risque faible.',
  },
  {
    code: 'dn4',
    label: 'DN4',
    group: 'Dépistage',
    normal: 'Score 1 sur 10 : douleur neuropathique peu probable.',
  },
  {
    code: 'sensibilisation_centrale',
    label: 'Recherche d’hypersensibilité (allodynie, post-sensations)',
    group: 'Dépistage',
    normal:
      'Pas d’allodynie au frottement, pas de post-sensation après la palpation, sensibilité à la pression comparable des deux côtés.',
  },

  // --- Mobilité ------------------------------------------------------------
  {
    code: 'mobilite_active',
    label: 'Mobilités actives lombaires',
    group: 'Mobilité',
    normal:
      'Amplitudes globalement conservées, douleur reproduite en fin d’amplitude de flexion, sans irradiation.',
  },
  {
    code: 'repetes_extension',
    label: 'Mouvements répétés en extension',
    group: 'Mobilité',
    normal:
      'Dix répétitions : pas de modification de la topographie de la douleur, intensité inchangée après l’épreuve.',
  },
  {
    code: 'repetes_flexion',
    label: 'Mouvements répétés en flexion',
    group: 'Mobilité',
    normal:
      'Dix répétitions : pas de modification de la topographie de la douleur, intensité inchangée après l’épreuve.',
  },
  {
    code: 'mouvements_aberrants',
    label: 'Recherche de mouvements aberrants',
    group: 'Mobilité',
    normal:
      'Retour de flexion régulier, pas d’arc douloureux, pas d’appui des mains sur les cuisses, pas de phénomène d’instabilité.',
  },
  {
    code: 'schober',
    label: 'Schober et ampliation thoracique',
    group: 'Mobilité',
    normal: 'Schober à 5 cm, ampliation thoracique à 5 cm : dans les normes.',
  },

  // --- Neurologique --------------------------------------------------------
  {
    code: 'neuro_force',
    label: 'Testing moteur des myotomes L2 à S1',
    group: 'Neurologique',
    normal: 'Force cotée à 5 sur 5 sur tous les myotomes testés, de façon symétrique.',
  },
  {
    code: 'neuro_reflexes',
    label: 'Réflexes rotulien et achilléen',
    group: 'Neurologique',
    normal: 'Réflexes présents et symétriques.',
  },
  {
    code: 'neuro_sensibilite',
    label: 'Sensibilité des dermatomes',
    group: 'Neurologique',
    normal: 'Sensibilité tactile et piquée conservée et symétrique sur tous les dermatomes.',
  },

  // --- Neurodynamique ------------------------------------------------------
  {
    code: 'slr',
    label: 'Élévation de jambe tendue (SLR)',
    group: 'Neurodynamique',
    normal:
      'Négatif des deux côtés : amplitude au-delà de 70 degrés, seule une tension postérieure de cuisse est ressentie, non concordante.',
  },
  {
    code: 'slump',
    label: 'Slump test',
    group: 'Neurodynamique',
    normal: 'Négatif : pas de reproduction de la douleur habituelle, pas de réponse à la remise en extension cervicale.',
  },
  {
    code: 'femoral',
    label: 'Mise en tension fémorale (procubitus)',
    group: 'Neurodynamique',
    normal: 'Négatif : pas de reproduction de douleur de la face antérieure de cuisse.',
  },
  {
    code: 'pit',
    label: 'Test d’instabilité en procubitus',
    group: 'Bassin et sacro-iliaque',
    normal: 'Négatif : la douleur à la pression ne disparaît pas lors du soulèvement actif des jambes.',
  },

  // --- Bassin et sacro-iliaque --------------------------------------------
  {
    code: 'cluster_laslett',
    label: 'Cluster de Laslett (5 tests de provocation sacro-iliaque)',
    group: 'Bassin et sacro-iliaque',
    normal: 'Aucun des cinq tests ne reproduit la douleur habituelle.',
  },
  {
    code: 'aslr',
    label: 'Active Straight Leg Raise, avec et sans compression pelvienne',
    group: 'Bassin et sacro-iliaque',
    normal: 'Soulèvement symétrique et sans effort perçu, la compression pelvienne ne change rien.',
  },

  // --- Palpation -----------------------------------------------------------
  {
    code: 'palpation_epineuses',
    label: 'Palpation et percussion des épineuses',
    group: 'Palpation',
    normal: 'Sensibilité diffuse des masses paravertébrales basses, pas de point exquis sur une épineuse, percussion indolore.',
  },
  {
    code: 'palper_rouler',
    label: 'Palper-rouler de la charnière thoraco-lombaire et de la crête',
    group: 'Palpation',
    normal: 'Épaisseur et sensibilité du pli comparables des deux côtés.',
  },
  {
    code: 'articulaires_tl',
    label: 'Pression des articulaires postérieures T12 à L1',
    group: 'Palpation',
    normal: 'Pression non douloureuse, symétrique.',
  },
  {
    code: 'point_cluneal',
    label: 'Recherche du point clunéal sur la crête iliaque',
    group: 'Palpation',
    normal: 'Pas de point exquis retrouvé le long de la crête.',
  },
  {
    code: 'pa_segmentaires',
    label: 'Pressions postéro-antérieures segmentaires',
    group: 'Palpation',
    normal: 'Mobilité segmentaire homogène, sensibilité modérée sans étage franchement plus douloureux.',
  },

  // --- Hanche --------------------------------------------------------------
  {
    code: 'hanche_amplitudes',
    label: 'Amplitudes de hanche, dont rotation interne',
    group: 'Hanche',
    normal: 'Rotation interne à 40 degrés des deux côtés, amplitudes complètes et indolores.',
  },
  {
    code: 'faber_fadir',
    label: 'FABER et FADIR',
    group: 'Hanche',
    normal: 'Les deux négatifs et symétriques.',
  },

  // --- Général et vasculaire ----------------------------------------------
  {
    code: 'marche',
    label: 'Épreuve de marche chronométrée',
    group: 'Général et vasculaire',
    normal: 'Dix minutes de marche sans majoration ni apparition de symptôme de membre inférieur.',
  },
  {
    code: 'pouls',
    label: 'Pouls périphériques et palpation abdominale',
    group: 'Général et vasculaire',
    normal: 'Pouls fémoraux, poplités et pédieux présents et symétriques, abdomen souple, pas de masse battante.',
  },
  {
    code: 'constantes',
    label: 'Température, tension, aspect général',
    group: 'Général et vasculaire',
    normal: 'Apyrétique, tension dans les normes, bon état général.',
  },

  // --- Imagerie ------------------------------------------------------------
  {
    code: 'imagerie',
    label: 'Demander une imagerie',
    group: 'Imagerie',
    normal:
      'Aucune imagerie disponible, et aucun élément de ce tableau n’en constitue une indication à ce stade.',
  },
]

export const EXAM_GROUPS: ExamGroup[] = [
  'Dépistage',
  'Mobilité',
  'Neurologique',
  'Neurodynamique',
  'Bassin et sacro-iliaque',
  'Palpation',
  'Hanche',
  'Général et vasculaire',
  'Imagerie',
]

export const EXAM_BY_CODE: Record<string, Exam> = Object.fromEntries(
  EXAMS.map((exam) => [exam.code, exam])
)

/** Une conclusion proposée au praticien, reprise des feuilles de l'arbre. */
export type SimulationConclusion = {
  cle: string
  titre: string
  ton: 'urgence' | 'orienter' | 'traiter'
}

export type SimulationExam = { code: string; libelle: string; resultat: string }

export type SimulationTurn = { role: 'praticien' | 'patient'; texte: string }

export type SimulationVerdict = {
  juste: boolean
  tonJuste: boolean
  choisi: SimulationConclusion | null
  attendu: SimulationConclusion | null
  tableau: string
  examensManques: { code: string; libelle: string }[]
  commentaire: string
  debrief: string | null
}
