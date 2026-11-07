// Prototype « vidéo augmentée » : une technique HVLA décrite en étapes,
// chacune associée à un instant de la vidéo et à une pose de la scène 3D.
//
// Conventions de la pose (degrés de rotation au segment L5-S1, volontairement
// exagérés pour être visibles : en réalité un segment lombaire ne tourne que
// de quelques degrés) :
// - trunkRotation : rotation droite du bloc sus-jacent (L3 à L5), épaule du dessus vers l’arrière ;
// - pelvisRotation : rotation gauche du bassin et du sacrum, bassin du dessus vers l’avant ;
// - flexion : flexion lombaire du bloc sus-jacent par rapport au sacrum ;
// - thrust : l’étape déclenche l’impulsion (rotation brève et rapide du bassin).

export type Pose = {
  trunkRotation: number
  pelvisRotation: number
  flexion: number
}

export type TechniqueStep = {
  id: string
  title: string
  /** Instant de début dans la vidéo, en secondes. */
  start: number
  pose: Pose
  thrust?: boolean
  /** Ce qui se passe dans l’articulation. */
  inside: string
  /** Repères pour le praticien. */
  cues: string[]
  arrows: { trunk?: boolean; pelvis?: boolean }
}

export type Technique = {
  slug: string
  title: string
  subtitle: string
  vimeoId: string
  /** Amplitude ajoutée par l’impulsion, en degrés (exagérée). */
  thrustAmplitude: number
  /** Côté du dessus, celui qui bâille. */
  upperSide: 'droit' | 'gauche'
  steps: TechniqueStep[]
}

export const lumbarRollL5S1: Technique = {
  slug: 'l5-s1-lumbar-roll',
  title: 'L5-S1 Lumbar Roll',
  subtitle: 'HVLA en décubitus latéral, bâillement de la facette du dessus',
  vimeoId: '1186356325',
  thrustAmplitude: 5,
  upperSide: 'droit',
  // Les instants sont une première estimation : à caler sur la vidéo
  // avec le panneau de calage.
  steps: [
    {
      id: 'installation',
      title: 'Installation',
      start: 0,
      pose: { trunkRotation: 0, pelvisRotation: 0, flexion: 0 },
      inside:
        'Position neutre. Les facettes L5-S1 sont en contact, orientées à mi-chemin entre le plan frontal et le plan sagittal.',
      cues: [
        'Patient en décubitus latéral, côté à traiter vers le haut',
        'Rachis aligné, sans inclinaison latérale parasite',
        'Jambe du dessous tendue, jambe du dessus prête à être fléchie',
      ],
      arrows: {},
    },
    {
      id: 'verrouillage-haut',
      title: 'Verrouillage du haut',
      start: 12,
      pose: { trunkRotation: 6, pelvisRotation: 0, flexion: 3 },
      inside:
        "La rotation du tronc descend étage par étage jusqu’à L5. L3, L4 et L5 tournent comme un bloc : les étages sus-jacents sont verrouillés.",
      cues: [
        'Épaule du dessus emmenée vers l’arrière',
        'Contrôler du bout des doigts l’arrivée du mouvement à L5',
        'S’arrêter dès que L5 suit, sans entraîner S1',
      ],
      arrows: { trunk: true },
    },
    {
      id: 'verrouillage-bas',
      title: 'Verrouillage du bas',
      start: 30,
      pose: { trunkRotation: 6, pelvisRotation: 4, flexion: 5 },
      inside:
        'La flexion de hanche et la rotation du bassin remontent jusqu’à S1. Les deux rotations opposées se rejoignent au segment L5-S1, qui devient le seul étage libre.',
      cues: [
        'Hanche du dessus fléchie, pied dans le creux poplité',
        'Bassin roulé vers l’avant, vers le praticien',
        'Sentir la mise en tension arriver sous le doigt palpant',
      ],
      arrows: { pelvis: true },
    },
    {
      id: 'mise-en-tension',
      title: 'Mise en tension',
      start: 50,
      pose: { trunkRotation: 7, pelvisRotation: 6, flexion: 5 },
      inside:
        'Le jeu articulaire est réduit : la facette du dessus est déjà entrouverte, celle du dessous en appui. On est à la barrière, sans la forcer.',
      cues: [
        'Avant-bras caudal sur l’ilium ou le grand trochanter',
        'Avant-bras crânial sur le thorax, en contre-appui',
        'Ajuster par petites touches jusqu’à une barrière nette',
      ],
      arrows: { trunk: true, pelvis: true },
    },
    {
      id: 'impulsion',
      title: 'Impulsion',
      start: 70,
      pose: { trunkRotation: 7, pelvisRotation: 6, flexion: 5 },
      thrust: true,
      inside:
        'Rotation brève et rapide du bassin : la facette L5-S1 du dessus bâille brusquement, la facette du dessous se comprime. C’est ce bâillement qui produit la cavitation.',
      cues: [
        'Impulsion par le bassin, dans l’axe de la rotation, pas vers la table',
        'Haute vélocité, très faible amplitude',
        'Le tronc reste fixe : pas de recul de l’avant-bras crânial',
      ],
      arrows: { pelvis: true },
    },
    {
      id: 'relachement',
      title: 'Relâchement',
      start: 85,
      pose: { trunkRotation: 0, pelvisRotation: 0, flexion: 0 },
      inside: 'Retour en position neutre. Les facettes reprennent leur contact.',
      cues: ['Relâcher progressivement', 'Réévaluer la mobilité de L5-S1'],
      arrows: {},
    },
  ],
}
