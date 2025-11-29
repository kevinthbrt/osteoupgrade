// lib/scoring-algorithm.ts
// Algorithme de scoring avec critères d'inclusion/exclusion

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

/**
 * Applique les critères d'inclusion/exclusion et retourne un modificateur de score
 * @param pathology - Pathologie avec ses critères
 * @param triageAnswers - Réponses aux 3 questions de triage
 * @param patientData - Données patient (âge, sexe, lifestyle)
 * @returns Modificateur de score (0 = éliminé, 0.1-1.5 = pénalité/bonus)
 */
export const applyInclusionExclusion = (
  pathology: any,
  triageAnswers: TriageAnswers,
  patientData: PatientData
): number => {
  const criteria = pathology.triage_criteria?.additional_criteria
  
  // Si pas de critères, score normal
  if (!criteria || Object.keys(criteria).length === 0) {
    return 1.0
  }
  
  let scoreModifier = 1.0
  
  // ============================================
  // 1. VÉRIFIER EXCLUSIONS (Priorité absolue)
  // ============================================
  if (criteria.exclusion) {
    // Exclusion temporelle
    if (criteria.exclusion.temporal_evolution?.includes(triageAnswers.temporalEvolution)) {
      console.log(`❌ Exclusion: ${pathology.name} - Temporalité ${triageAnswers.temporalEvolution} exclue`)
      return 0 // Éliminé complètement
    }
    
    // Exclusion type douleur
    if (criteria.exclusion.pain_type?.includes(triageAnswers.painType)) {
      console.log(`❌ Exclusion: ${pathology.name} - Type douleur ${triageAnswers.painType} exclu`)
      return 0 // Éliminé complètement
    }
    
    // Exclusion localisation
    if (criteria.exclusion.pain_location?.includes(triageAnswers.painLocation)) {
      console.log(`❌ Exclusion: ${pathology.name} - Localisation ${triageAnswers.painLocation} exclue`)
      return 0 // Éliminé complètement
    }
  }
  
  // ============================================
  // 2. VÉRIFIER INCLUSIONS
  // ============================================
  if (criteria.inclusion) {
    let inclusionMatches = 0
    let inclusionTotal = 0
    
    // --- Âge ---
    if (criteria.inclusion.age && criteria.inclusion.age.length > 0) {
      inclusionTotal++
      if (criteria.inclusion.age.includes(patientData.age)) {
        inclusionMatches++
        console.log(`✅ Inclusion: ${pathology.name} - Âge ${patientData.age} correspond`)
      } else {
        scoreModifier *= 0.5 // Pénalité 50% si âge hors inclusion
        console.log(`⚠️ Pénalité: ${pathology.name} - Âge ${patientData.age} hors inclusion`)
      }
    }
    
    // --- Sexe ---
    if (criteria.inclusion.sex && criteria.inclusion.sex.length > 0) {
      inclusionTotal++
      if (criteria.inclusion.sex.includes(patientData.sex)) {
        inclusionMatches++
        
        // BONUS si sexe préféré
        if (criteria.sex_preference === patientData.sex) {
          scoreModifier *= 1.2 // Bonus 20%
          console.log(`⭐ Bonus: ${pathology.name} - Sexe préféré ${patientData.sex}`)
        }
        
        console.log(`✅ Inclusion: ${pathology.name} - Sexe ${patientData.sex} correspond`)
      } else {
        scoreModifier *= 0.5 // Pénalité 50% si sexe hors inclusion
        console.log(`⚠️ Pénalité: ${pathology.name} - Sexe ${patientData.sex} hors inclusion`)
      }
    }
    
    // --- Mode de vie ---
    if (criteria.inclusion.lifestyle && criteria.inclusion.lifestyle.length > 0) {
      inclusionTotal++
      if (criteria.inclusion.lifestyle.includes(patientData.lifestyle)) {
        inclusionMatches++
        console.log(`✅ Inclusion: ${pathology.name} - Lifestyle ${patientData.lifestyle} correspond`)
      } else {
        scoreModifier *= 0.7 // Pénalité 30% si lifestyle hors inclusion
        console.log(`⚠️ Pénalité: ${pathology.name} - Lifestyle ${patientData.lifestyle} hors inclusion`)
      }
    }
    
    // Ratio d'inclusion global
    if (inclusionTotal > 0) {
      const inclusionRatio = inclusionMatches / inclusionTotal
      
      if (inclusionRatio < 0.5) {
        scoreModifier *= 0.3 // Pénalité forte si < 50% des inclusions
        console.log(`⚠️⚠️ Pénalité forte: ${pathology.name} - Seulement ${Math.round(inclusionRatio * 100)}% des inclusions`)
      } else if (inclusionRatio < 1.0) {
        scoreModifier *= 0.7 // Pénalité modérée si inclusion partielle
        console.log(`⚠️ Pénalité modérée: ${pathology.name} - ${Math.round(inclusionRatio * 100)}% des inclusions`)
      }
    }
  }
  
  // ============================================
  // 3. CRITÈRES SPÉCIAUX (requires_one_of)
  // ============================================
  if (criteria.requires_one_of) {
    const meetsRequirement = criteria.requires_one_of.some((req: any) => {
      return Object.entries(req).every(([key, value]) => {
        if (key === 'temporal_evolution') return triageAnswers.temporalEvolution === value
        if (key === 'age') return patientData.age === value
        if (key === 'sex') return patientData.sex === value
        if (key === 'lifestyle') return patientData.lifestyle === value
        return true
      })
    })
    
    if (!meetsRequirement) {
      const penalty = criteria.penalty_if_missing || 0.1
      scoreModifier *= penalty // Très forte pénalité par défaut
      console.log(`⚠️⚠️⚠️ Critère spécial non respecté: ${pathology.name} - Pénalité ×${penalty}`)
    } else {
      console.log(`✅ Critère spécial respecté: ${pathology.name}`)
    }
  }
  
  // Plafonner le modificateur à 1.5 max (bonus sexe préféré peut dépasser 1.0)
  scoreModifier = Math.min(scoreModifier, 1.5)
  
  return scoreModifier
}

/**
 * Filtre et score les pathologies en tenant compte des critères d'inclusion/exclusion
 */
export const filterPathologiesWithInclusionExclusion = (
  pathologies: any[],
  triageAnswers: TriageAnswers,
  patientData: PatientData
) => {
  const matches = pathologies.map(pathology => {
    const criteria = pathology.triage_criteria
    if (!criteria) return null
    
    // Calculer score de base (critères de triage)
    let matchScore = 0
    const matchedCriteria: string[] = []
    
    // Évolution temporelle
    if (criteria.temporal_evolution?.includes(triageAnswers.temporalEvolution)) {
      matchScore += 33
      matchedCriteria.push('Évolution temporelle')
    }
    
    // Type de douleur
    if (criteria.pain_type?.includes(triageAnswers.painType)) {
      matchScore += 33
      matchedCriteria.push('Type de douleur')
    }
    
    // Localisation
    if (criteria.pain_location?.includes(triageAnswers.painLocation)) {
      matchScore += 34
      matchedCriteria.push('Localisation')
    }
    
    // Si aucun critère ne matche, score = 0
    if (matchedCriteria.length === 0) return null
    
    // Appliquer le modificateur inclusion/exclusion
    const inclusionModifier = applyInclusionExclusion(pathology, triageAnswers, patientData)
    
    // Si éliminé par exclusion
    if (inclusionModifier === 0) return null
    
    // Appliquer le modificateur
    matchScore *= inclusionModifier
    
    // Appliquer le poids de triage (fréquence)
    matchScore = (matchScore * criteria.triage_weight) / 100
    
    return {
      pathology,
      matchScore: Math.round(matchScore),
      matchedCriteria,
      inclusionModifier, // Pour debug/affichage
      tests: pathology.tests || [],
      clusters: pathology.clusters || []
    }
  })
  .filter(match => match !== null && match.matchScore > 0) // Éliminer scores = 0
  .sort((a, b) => b!.matchScore - a!.matchScore)
  
  return matches.filter(m => m !== null) as any[]
}

/**
 * Composant badge pour afficher le statut inclusion/exclusion
 */
export const getInclusionBadgeProps = (
  pathology: any,
  patientData: PatientData,
  modifier: number
): { show: boolean; type: 'excluded' | 'bonus' | 'penalty'; label: string } | null => {
  const criteria = pathology.triage_criteria?.additional_criteria
  
  if (!criteria) return null
  
  // Si éliminé
  if (modifier === 0) {
    return {
      show: true,
      type: 'excluded',
      label: '❌ EXCLU'
    }
  }
  
  // Si bonus sexe préféré
  if (criteria.sex_preference === patientData.sex && modifier > 1.0) {
    return {
      show: true,
      type: 'bonus',
      label: '⭐ PROFIL +'
    }
  }
  
  // Si pénalisé
  if (modifier < 1.0) {
    return {
      show: true,
      type: 'penalty',
      label: '⚠️ HORS PROFIL'
    }
  }
  
  return null
}
