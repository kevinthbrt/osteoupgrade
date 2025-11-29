// ============================================================
// ALGORITHME DE SCORING - VERSION SANS POIDS DE TRIAGE
// Test : Critères inclusion/exclusion uniquement
// ============================================================

export interface PatientData {
  age: '0-18' | '18-30' | '30-50' | '50-65' | '65+' | '';
  sex: 'homme' | 'femme' | '';
  lifestyle: 'sedentaire' | 'actif' | 'athlete' | '';
}

export interface TriageAnswers {
  temporalEvolution?: string;
  painType?: string;
  painLocation?: string;
}

interface PathologyCriteria {
  temporal_evolution?: string[];
  pain_type?: string[];
  pain_location?: string[];
  additional_criteria?: {
    inclusion?: {
      age?: string[];
      sex?: string[];
      sex_preference?: string;
      lifestyle?: string[];
    };
    exclusion?: {
      age?: string[];
      sex?: string[];
      pain_type?: string[];
      temporal_evolution?: string[];
      pain_location?: string[];
    };
    sex_preference?: string;
    requires_one_of?: Array<Record<string, string>>;
    penalty_if_missing?: number;
    age_note?: string;
    temporal_note?: string;
    lifestyle_note?: string;
    special_note?: string;
  };
}

interface Pathology {
  id: string;
  name: string;
  triage_criteria?: PathologyCriteria;
}

/**
 * Applique les critères d'inclusion/exclusion et retourne le modificateur
 * @returns 0 si exclu, sinon un modificateur entre 0.3 et 1.5
 */
export function applyInclusionExclusion(
  pathology: Pathology,
  answers: TriageAnswers,
  patientData: PatientData
): number {
  const criteria = pathology.triage_criteria?.additional_criteria;
  if (!criteria) return 1.0;

  const inclusion = criteria.inclusion || {};
  const exclusion = criteria.exclusion || {};

  // ======================================
  // 1. VÉRIFIER LES EXCLUSIONS (priorité absolue)
  // ======================================
  
  // Exclusion âge
  if (exclusion.age && patientData.age && exclusion.age.includes(patientData.age)) {
    return 0; // EXCLU
  }

  // Exclusion sexe
  if (exclusion.sex && patientData.sex && exclusion.sex.includes(patientData.sex)) {
    return 0; // EXCLU
  }

  // Exclusion type de douleur
  if (exclusion.pain_type && answers.painType && exclusion.pain_type.includes(answers.painType)) {
    return 0; // EXCLU
  }

  // Exclusion évolution temporelle
  if (exclusion.temporal_evolution && answers.temporalEvolution && 
      exclusion.temporal_evolution.includes(answers.temporalEvolution)) {
    return 0; // EXCLU
  }

  // Exclusion localisation
  if (exclusion.pain_location && answers.painLocation && 
      exclusion.pain_location.includes(answers.painLocation)) {
    return 0; // EXCLU
  }

  // ======================================
  // 2. VÉRIFIER LES INCLUSIONS
  // ======================================
  
  let modifier = 1.0;
  let inclusionCount = 0;
  let matchedCount = 0;

  // Inclusion âge
  if (inclusion.age && inclusion.age.length > 0) {
    inclusionCount++;
    if (patientData.age && inclusion.age.includes(patientData.age)) {
      matchedCount++;
    } else if (patientData.age) {
      // Hors profil d'âge
      modifier *= 0.5;
    }
  }

  // Inclusion sexe
  if (inclusion.sex && inclusion.sex.length > 0) {
    inclusionCount++;
    if (patientData.sex && inclusion.sex.includes(patientData.sex)) {
      matchedCount++;
      
      // BONUS si sexe préféré
      if (criteria.sex_preference && patientData.sex === criteria.sex_preference) {
        modifier *= 1.2; // +20% bonus
      }
    } else if (patientData.sex) {
      // Hors profil de sexe
      modifier *= 0.5;
    }
  }

  // Inclusion lifestyle
  if (inclusion.lifestyle && inclusion.lifestyle.length > 0) {
    inclusionCount++;
    if (patientData.lifestyle && inclusion.lifestyle.includes(patientData.lifestyle)) {
      matchedCount++;
    } else if (patientData.lifestyle) {
      // Hors profil de lifestyle
      modifier *= 0.7;
    }
  }

  // Si plusieurs critères d'inclusion ne matchent pas, pénalité supplémentaire
  if (inclusionCount > 0) {
    const inclusionRatio = matchedCount / inclusionCount;
    if (inclusionRatio < 0.5) {
      modifier *= 0.3; // Pénalité forte si moins de 50% des critères matchent
    } else if (inclusionRatio < 1.0) {
      modifier *= 0.7; // Pénalité moyenne
    }
  }

  // ======================================
  // 3. CRITÈRES SPÉCIAUX (requires_one_of)
  // ======================================
  
  if (criteria.requires_one_of && criteria.requires_one_of.length > 0) {
    let hasRequiredCriteria = false;

    for (const requirement of criteria.requires_one_of) {
      let allMatch = true;

      // Vérifier chaque condition du requirement
      for (const [key, value] of Object.entries(requirement)) {
        if (key === 'temporal_evolution' && answers.temporalEvolution !== value) {
          allMatch = false;
        } else if (key === 'pain_type' && answers.painType !== value) {
          allMatch = false;
        } else if (key === 'pain_location' && answers.painLocation !== value) {
          allMatch = false;
        } else if (key === 'age' && patientData.age !== value) {
          allMatch = false;
        } else if (key === 'sex' && patientData.sex !== value) {
          allMatch = false;
        }
      }

      if (allMatch) {
        hasRequiredCriteria = true;
        break;
      }
    }

    // Si aucun critère requis n'est respecté, appliquer la pénalité
    if (!hasRequiredCriteria) {
      const penalty = criteria.penalty_if_missing || 0.1;
      modifier *= penalty;
    }
  }

  // ======================================
  // 4. PLAFOND DU MODIFICATEUR
  // ======================================
  
  // Ne jamais dépasser 1.5 (même avec bonus sexe préféré)
  if (modifier > 1.5) {
    modifier = 1.5;
  }

  return modifier;
}

/**
 * Filtre et score les pathologies selon le triage ET les critères inclusion/exclusion
 * SANS utiliser le poids de triage
 */
export function filterPathologiesWithInclusionExclusion(
  pathologies: Pathology[],
  answers: TriageAnswers,
  patientData: PatientData
): Array<Pathology & { matching_score: number }> {
  
  const scoredPathologies = pathologies.map(pathology => {
    const criteria = pathology.triage_criteria;
    if (!criteria) {
      return { ...pathology, matching_score: 0 };
    }

    // ======================================
    // ÉTAPE 1 : SCORE DE BASE (critères triage)
    // ======================================
    
    let baseScore = 0;
    let criteriaCount = 0;

    // Évolution temporelle
    if (criteria.temporal_evolution && criteria.temporal_evolution.length > 0) {
      criteriaCount++;
      if (answers.temporalEvolution && criteria.temporal_evolution.includes(answers.temporalEvolution)) {
        baseScore++;
      }
    }

    // Type de douleur
    if (criteria.pain_type && criteria.pain_type.length > 0) {
      criteriaCount++;
      if (answers.painType && criteria.pain_type.includes(answers.painType)) {
        baseScore++;
      }
    }

    // Localisation
    if (criteria.pain_location && criteria.pain_location.length > 0) {
      criteriaCount++;
      if (answers.painLocation && criteria.pain_location.includes(answers.painLocation)) {
        baseScore++;
      }
    }

    // Normaliser le score de base sur 100
    const normalizedBaseScore = criteriaCount > 0 ? (baseScore / criteriaCount) * 100 : 0;

    // ======================================
    // ÉTAPE 2 : MODIFICATEUR INCLUSION/EXCLUSION
    // ======================================
    
    const inclusionModifier = applyInclusionExclusion(pathology, answers, patientData);

    // ======================================
    // ÉTAPE 3 : SCORE FINAL (SANS poids de triage)
    // ======================================
    
    const finalScore = normalizedBaseScore * inclusionModifier;

    return {
      ...pathology,
      matching_score: Math.round(finalScore)
    };
  });

  // Filtrer les pathologies avec score = 0 (exclues ou aucun match)
  const filtered = scoredPathologies.filter(p => p.matching_score > 0);

  // Trier par score décroissant
  return filtered.sort((a, b) => b.matching_score - a.matching_score);
}

/**
 * Retourne les props pour afficher le badge d'inclusion/exclusion
 */
export function getInclusionBadgeProps(
  pathology: Pathology,
  answers: TriageAnswers,
  patientData: PatientData
): { show: boolean; type: 'excluded' | 'bonus' | 'penalty'; label: string } {
  
  const modifier = applyInclusionExclusion(pathology, answers, patientData);

  if (modifier === 0) {
    return {
      show: true,
      type: 'excluded',
      label: '❌ EXCLU'
    };
  }

  const criteria = pathology.triage_criteria?.additional_criteria;
  const hasPreferredSex = criteria?.sex_preference && 
                          patientData.sex === criteria.sex_preference;

  if (modifier > 1.0 && hasPreferredSex) {
    return {
      show: true,
      type: 'bonus',
      label: '⭐ PROFIL +'
    };
  }

  if (modifier < 1.0) {
    return {
      show: true,
      type: 'penalty',
      label: '⚠️ HORS PROFIL'
    };
  }

  return {
    show: false,
    type: 'penalty',
    label: ''
  };
}