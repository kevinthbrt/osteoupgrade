// Template pour ajouter de nouvelles régions anatomiques
// Copiez ce template et remplissez les informations

export const NEW_REGION_TEMPLATE = {
  // ===== CONFIGURATION DE BASE =====
  
  // Clé unique de la région (en camelCase)
  regionKey: 'nouveauRegion',
  
  // Nom affiché à l'utilisateur
  name: 'Nouvelle Région',
  
  // Couleur de la région (format hexadécimal)
  color: '#3b82f6', // Bleu par défaut
  
  // Position dans l'espace 3D [x, y, z]
  // y représente la hauteur (de 0 à 10)
  // x représente gauche-droite (négatif = gauche, positif = droite)
  // z représente avant-arrière
  position: [0, 5, 0],
  
  // La région est-elle symétrique (gauche/droite) ?
  isSymmetric: false, // true pour épaules, genoux, hanches, etc.
  
  // ===== STRUCTURES ANATOMIQUES =====
  
  structures: [
    {
      id: 'structure-1',           // ID unique
      name: 'Nom de la structure', // Nom affiché
      position: [0, 0, 0]          // Position relative (optionnel)
    },
    {
      id: 'structure-2',
      name: 'Autre structure',
      position: [0.3, 0, 0]
    },
    // Ajoutez autant de structures que nécessaire
  ],
  
  // ===== PATHOLOGIES PAR STRUCTURE =====
  
  pathologies: {
    'structure-1': [
      'Pathologie commune 1',
      'Pathologie commune 2',
      'Pathologie commune 3',
    ],
    'structure-2': [
      'Autre pathologie 1',
      'Autre pathologie 2',
    ],
    // Une entrée par structure
  }
}

// ============================================
// EXEMPLES CONCRETS DE RÉGIONS
// ============================================

// Exemple 1 : Région du coude
export const ELBOW_REGION = {
  regionKey: 'elbow',
  name: 'Coude',
  color: '#ec4899', // Rose
  position: [2, 4.5, 0],
  isSymmetric: true,
  
  structures: [
    {
      id: 'e-epicondyle-lat',
      name: 'Épicondyle Latéral',
      position: [0.2, 0, 0]
    },
    {
      id: 'e-epicondyle-med',
      name: 'Épicondyle Médial',
      position: [-0.2, 0, 0]
    },
    {
      id: 'e-olecrane',
      name: 'Olécrâne',
      position: [0, 0, 0.2]
    },
    {
      id: 'e-ligaments',
      name: 'Ligaments Collatéraux',
      position: [0, -0.2, 0]
    },
    {
      id: 'e-tendons',
      name: 'Tendons Fléchisseurs/Extenseurs',
      position: [0, 0.2, 0]
    },
  ],
  
  pathologies: {
    'e-epicondyle-lat': [
      'Épicondylite latérale (Tennis elbow)',
      'Tendinopathie des extenseurs',
      'Entésopathie latérale',
    ],
    'e-epicondyle-med': [
      'Épicondylite médiale (Golfer elbow)',
      'Tendinopathie des fléchisseurs',
      'Entésopathie médiale',
    ],
    'e-olecrane': [
      'Bursite olécrânienne',
      'Fracture de l\'olécrâne',
      'Ostéophytes postérieurs',
    ],
    'e-ligaments': [
      'Entorse LCL',
      'Entorse LCM',
      'Instabilité en valgus/varus',
    ],
    'e-tendons': [
      'Rupture tendineuse',
      'Tendinopathie bicipitale distale',
      'Syndrome du tunnel cubital',
    ],
  }
}

// Exemple 2 : Région de la cheville
export const ANKLE_REGION = {
  regionKey: 'ankle',
  name: 'Cheville / Pied',
  color: '#14b8a6', // Turquoise
  position: [1, -0.5, 0],
  isSymmetric: true,
  
  structures: [
    {
      id: 'a-syndesmose',
      name: 'Syndesmose',
      position: [0, 0.3, 0]
    },
    {
      id: 'a-lcl',
      name: 'Ligament Collatéral Latéral',
      position: [0.2, 0, 0]
    },
    {
      id: 'a-deltoid',
      name: 'Ligament Deltoïdien',
      position: [-0.2, 0, 0]
    },
    {
      id: 'a-achilles',
      name: 'Tendon d\'Achille',
      position: [0, 0, -0.3]
    },
    {
      id: 'a-plantar',
      name: 'Aponévrose Plantaire',
      position: [0, -0.3, 0.2]
    },
    {
      id: 'a-metatarsals',
      name: 'Métatarses',
      position: [0, -0.2, 0.4]
    },
  ],
  
  pathologies: {
    'a-syndesmose': [
      'Entorse syndesmose',
      'Diastasis tibio-fibulaire',
      'Instabilité syndesmotique',
    ],
    'a-lcl': [
      'Entorse latérale grade I-III',
      'Rupture LTFA',
      'Instabilité chronique latérale',
    ],
    'a-deltoid': [
      'Entorse deltoïdienne',
      'Rupture ligamentaire médiale',
    ],
    'a-achilles': [
      'Tendinopathie achilléenne',
      'Rupture partielle/complète',
      'Bursite rétrocalcanéenne',
      'Maladie de Haglund',
    ],
    'a-plantar': [
      'Fasciite plantaire',
      'Épine calcanéenne',
      'Rupture aponévrose',
    ],
    'a-metatarsals': [
      'Métatarsalgie',
      'Fracture de fatigue',
      'Névrome de Morton',
      'Hallux valgus',
    ],
  }
}

// Exemple 3 : Région de la hanche
export const HIP_REGION = {
  regionKey: 'hip',
  name: 'Hanche',
  color: '#a855f7', // Violet
  position: [1.2, 3, 0],
  isSymmetric: true,
  
  structures: [
    {
      id: 'h-acetabulum',
      name: 'Acetabulum / Labrum',
      position: [0, 0, 0]
    },
    {
      id: 'h-femoral-head',
      name: 'Tête Fémorale',
      position: [0.2, -0.2, 0]
    },
    {
      id: 'h-greater-trochanter',
      name: 'Grand Trochanter',
      position: [0.3, 0, 0]
    },
    {
      id: 'h-iliopsoas',
      name: 'Psoas-Iliaque',
      position: [0, 0.3, 0.2]
    },
    {
      id: 'h-glutes',
      name: 'Muscles Fessiers',
      position: [0, 0, -0.3]
    },
    {
      id: 'h-adductors',
      name: 'Adducteurs',
      position: [-0.3, -0.2, 0]
    },
  ],
  
  pathologies: {
    'h-acetabulum': [
      'Lésion du labrum',
      'Conflit fémoro-acétabulaire (FAI)',
      'Dysplasie acétabulaire',
    ],
    'h-femoral-head': [
      'Coxarthrose',
      'Nécrose avasculaire',
      'Fracture col fémoral',
    ],
    'h-greater-trochanter': [
      'Bursite trochantérienne',
      'Tendinopathie fessiers',
      'Syndrome de la bandelette IT',
    ],
    'h-iliopsoas': [
      'Tendinopathie du psoas',
      'Bursite ilio-pectinée',
      'Syndrome du psoas',
    ],
    'h-glutes': [
      'Tendinopathie glutéale',
      'Syndrome du piriforme',
      'Insuffisance glutéale',
    ],
    'h-adductors': [
      'Pubalgie',
      'Tendinopathie adducteurs',
      'Ostéite pubienne',
    ],
  }
}

// Exemple 4 : Région thoracique
export const THORACIC_REGION = {
  regionKey: 'thoracic',
  name: 'Région Thoracique',
  color: '#06b6d4', // Cyan
  position: [0, 5, 0],
  isSymmetric: false,
  
  structures: [
    {
      id: 't-vertebrae',
      name: 'Vertèbres Thoraciques',
      position: [0, 0, 0]
    },
    {
      id: 't-discs',
      name: 'Disques Intervertébraux',
      position: [0, -0.2, 0]
    },
    {
      id: 't-ribs',
      name: 'Articulations Costo-vertébrales',
      position: [0.3, 0, 0]
    },
    {
      id: 't-facets',
      name: 'Facettes Articulaires',
      position: [0.2, 0.2, 0]
    },
    {
      id: 't-muscles',
      name: 'Muscles Paravertébraux',
      position: [0.4, 0, 0]
    },
  ],
  
  pathologies: {
    't-vertebrae': [
      'Fracture vertébrale',
      'Spondylose thoracique',
      'Hypercyphose',
      'Maladie de Scheuermann',
    ],
    't-discs': [
      'Hernie discale thoracique',
      'Discopathie dégénérative',
    ],
    't-ribs': [
      'Dysfonction costo-vertébrale',
      'Subluxation costale',
      'Fracture costale',
    ],
    't-facets': [
      'Syndrome facettaire',
      'Arthrose facettaire',
    ],
    't-muscles': [
      'Dorsalgie mécanique',
      'Contracture musculaire',
      'Point trigger paravertébral',
    ],
  }
}

// ============================================
// INSTRUCTIONS D'INTÉGRATION
// ============================================

/*
Pour ajouter une nouvelle région au modèle 3D :

1. Copiez un des exemples ci-dessus ou le template
2. Modifiez les valeurs selon votre région
3. Dans AnatomyViewer3D.tsx, ajoutez votre région à ANATOMICAL_REGIONS :

export const ANATOMICAL_REGIONS = {
  ...ANATOMICAL_REGIONS_EXISTING,
  elbow: ELBOW_REGION,
  ankle: ANKLE_REGION,
  hip: HIP_REGION,
  thoracic: THORACIC_REGION,
}

4. Optionnel : Ajoutez la géométrie correspondante dans HumanBodyModel :

// Dans HumanBodyModel component
<mesh position={[2, 4.5, 0]}>
  <sphereGeometry args={[0.25, 16, 16]} />
  <meshStandardMaterial color="#ec4899" />
</mesh>

5. Testez votre nouvelle région !
*/

// ============================================
// CONSEILS POUR LES POSITIONS 3D
// ============================================

/*
Système de coordonnées :
- Y : Hauteur (0 = pieds, 8 = tête)
- X : Gauche/Droite (négatif = gauche du patient, positif = droite)
- Z : Avant/Arrière (négatif = dos, positif = face)

Échelle approximative pour un corps de taille moyenne :
- Tête : y = 8
- Épaules : y = 6
- Coudes : y = 4.5
- Hanches : y = 3
- Genoux : y = 1
- Chevilles : y = -0.5

Écarts latéraux :
- Épaules : x = ±2.5
- Hanches : x = ±1.2
- Genoux : x = ±0.5
*/

// ============================================
// EXPORT POUR UTILISATION
// ============================================

export const ADDITIONAL_REGIONS = {
  elbow: ELBOW_REGION,
  ankle: ANKLE_REGION,
  hip: HIP_REGION,
  thoracic: THORACIC_REGION,
}
