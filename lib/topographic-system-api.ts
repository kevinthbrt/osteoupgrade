/**
 * Fonctions utilitaires pour le système de zones topographiques + arbres décisionnels
 */

import { supabase } from './supabase'
import type {
  TopographicZone,
  CreateTopographicZoneInput,
  UpdateTopographicZoneInput,
  DecisionTree,
  CreateDecisionTreeInput,
  UpdateDecisionTreeInput,
  DecisionNode,
  CreateQuestionNodeInput,
  CreateDiagnosisNodeInput,
  CreateTestsNodeInput,
  UpdateDecisionNodeInput,
  DecisionAnswer,
  CreateDecisionAnswerInput,
  UpdateDecisionAnswerInput,
  ConsultationSessionV2,
  CreateConsultationInput,
  UpdateConsultationInput,
  AnatomicalRegion,
  TreeValidationResult
} from './types-topographic-system'

// ============================================================================
// ZONES TOPOGRAPHIQUES
// ============================================================================

export async function getTopographicZonesByRegion(region: AnatomicalRegion) {
  const { data, error } = await supabase
    .from('topographic_zones')
    .select('*')
    .eq('region', region)
    .eq('is_active', true)
    .order('display_order')

  if (error) throw error
  return data as TopographicZone[]
}

export async function getAllTopographicZones() {
  const { data, error } = await supabase
    .from('topographic_zones')
    .select('*')
    .eq('is_active', true)
    .order('region', { ascending: true })
    .order('display_order')

  if (error) throw error
  return data as TopographicZone[]
}

export async function getTopographicZone(id: string) {
  const { data, error } = await supabase
    .from('topographic_zones')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TopographicZone
}

export async function createTopographicZone(input: CreateTopographicZoneInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('topographic_zones')
    .insert({
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as TopographicZone
}

export async function updateTopographicZone(id: string, input: UpdateTopographicZoneInput) {
  const { data, error } = await supabase
    .from('topographic_zones')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TopographicZone
}

export async function deleteTopographicZone(id: string) {
  const { error } = await supabase
    .from('topographic_zones')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// ARBRES DÉCISIONNELS
// ============================================================================

export async function getDecisionTreesByZone(zoneId: string) {
  const { data, error } = await supabase
    .from('decision_trees')
    .select('*, topographic_zone:topographic_zones(*)')
    .eq('topographic_zone_id', zoneId)
    .eq('is_active', true)

  if (error) throw error
  return data as DecisionTree[]
}

export async function getDecisionTree(id: string) {
  const { data, error } = await supabase
    .from('decision_trees')
    .select('*, topographic_zone:topographic_zones(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DecisionTree
}

export async function createDecisionTree(input: CreateDecisionTreeInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('decision_trees')
    .insert({
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as DecisionTree
}

export async function updateDecisionTree(id: string, input: UpdateDecisionTreeInput) {
  const { data, error } = await supabase
    .from('decision_trees')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DecisionTree
}

export async function deleteDecisionTree(id: string) {
  const { error } = await supabase
    .from('decision_trees')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// NŒUDS DE DÉCISION
// ============================================================================

export async function getTreeNodes(treeId: string) {
  const { data, error } = await supabase
    .from('decision_nodes')
    .select('*')
    .eq('tree_id', treeId)
    .order('display_order')

  if (error) throw error
  return data as DecisionNode[]
}

export async function getTreeRootNode(treeId: string) {
  const { data, error } = await supabase
    .from('decision_nodes')
    .select('*')
    .eq('tree_id', treeId)
    .is('parent_node_id', null)
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function getDecisionNode(id: string) {
  const { data, error } = await supabase
    .from('decision_nodes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function getNodeWithRelations(id: string) {
  const { data: node, error: nodeError } = await supabase
    .from('decision_nodes')
    .select('*')
    .eq('id', id)
    .single()

  if (nodeError) throw nodeError

  // Charger les réponses si c'est une question
  let answers: DecisionAnswer[] = []
  if (node.node_type === 'question') {
    const { data: answersData, error: answersError } = await supabase
      .from('decision_answers')
      .select('*')
      .eq('node_id', id)
      .order('display_order')

    if (answersError) throw answersError
    answers = answersData as DecisionAnswer[]
  }

  // Charger les pathologies si c'est un diagnostic
  let pathologies = []
  if (node.node_type === 'diagnosis' && node.pathology_ids) {
    const { data: pathologiesData, error: pathologiesError } = await supabase
      .from('pathologies')
      .select('*')
      .in('id', node.pathology_ids)

    if (pathologiesError) throw pathologiesError
    pathologies = pathologiesData
  }

  // Charger les tests si c'est un nœud de tests
  let tests = []
  let clusters = []
  if (node.node_type === 'tests') {
    if (node.test_ids && node.test_ids.length > 0) {
      const { data: testsData, error: testsError } = await supabase
        .from('orthopedic_tests')
        .select('*')
        .in('id', node.test_ids)

      if (testsError) throw testsError
      tests = testsData
    }

    if (node.cluster_ids && node.cluster_ids.length > 0) {
      const { data: clustersData, error: clustersError } = await supabase
        .from('orthopedic_test_clusters')
        .select('*')
        .in('id', node.cluster_ids)

      if (clustersError) throw clustersError
      clusters = clustersData

      // Charger les tests de chaque cluster
      for (const cluster of clusters) {
        const { data: clusterItems } = await supabase
          .from('orthopedic_test_cluster_items')
          .select('*, test:orthopedic_tests(*)')
          .eq('cluster_id', cluster.id)
          .order('order_index')

        cluster.tests = clusterItems?.map(item => item.test) || []
      }
    }
  }

  return {
    ...node,
    answers,
    pathologies,
    tests,
    clusters
  } as DecisionNode
}

export async function createQuestionNode(input: CreateQuestionNodeInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('decision_nodes')
    .insert({
      node_type: 'question',
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function createDiagnosisNode(input: CreateDiagnosisNodeInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('decision_nodes')
    .insert({
      node_type: 'diagnosis',
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function createTestsNode(input: CreateTestsNodeInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('decision_nodes')
    .insert({
      node_type: 'tests',
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function updateDecisionNode(id: string, input: UpdateDecisionNodeInput) {
  const { data, error } = await supabase
    .from('decision_nodes')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DecisionNode
}

export async function deleteDecisionNode(id: string) {
  // Supprimer d'abord les réponses associées
  await supabase
    .from('decision_answers')
    .delete()
    .eq('node_id', id)

  // Puis supprimer le nœud
  const { error } = await supabase
    .from('decision_nodes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// RÉPONSES
// ============================================================================

export async function getNodeAnswers(nodeId: string) {
  const { data, error } = await supabase
    .from('decision_answers')
    .select('*')
    .eq('node_id', nodeId)
    .order('display_order')

  if (error) throw error
  return data as DecisionAnswer[]
}

export async function createDecisionAnswer(input: CreateDecisionAnswerInput) {
  const { data, error } = await supabase
    .from('decision_answers')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as DecisionAnswer
}

export async function updateDecisionAnswer(id: string, input: UpdateDecisionAnswerInput) {
  const { data, error } = await supabase
    .from('decision_answers')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DecisionAnswer
}

export async function deleteDecisionAnswer(id: string) {
  const { error } = await supabase
    .from('decision_answers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// CONSULTATIONS V2
// ============================================================================

export async function createConsultation(input: CreateConsultationInput) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('consultation_sessions_v2')
    .insert({
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as ConsultationSessionV2
}

export async function updateConsultation(id: string, input: UpdateConsultationInput) {
  const { data, error } = await supabase
    .from('consultation_sessions_v2')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ConsultationSessionV2
}

export async function getConsultation(id: string) {
  const { data, error } = await supabase
    .from('consultation_sessions_v2')
    .select(`
      *,
      topographic_zone:topographic_zones(*),
      decision_tree:decision_trees(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ConsultationSessionV2
}

export async function getUserConsultations() {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('consultation_sessions_v2')
    .select(`
      *,
      topographic_zone:topographic_zones(*)
    `)
    .eq('created_by', user?.id)
    .order('consultation_date', { ascending: false })

  if (error) throw error
  return data as ConsultationSessionV2[]
}

// ============================================================================
// VALIDATIONS
// ============================================================================

export async function validateDecisionTree(treeId: string): Promise<TreeValidationResult> {
  const nodes = await getTreeNodes(treeId)
  
  const errors: string[] = []
  const warnings: string[] = []
  const orphanNodes: string[] = []
  const deadEnds: string[] = []
  const unreachableNodes: string[] = []

  // Vérifier qu'il y a au moins un nœud racine
  const rootNodes = nodes.filter(n => !n.parent_node_id)
  if (rootNodes.length === 0) {
    errors.push('Aucun nœud racine trouvé')
  } else if (rootNodes.length > 1) {
    errors.push('Plusieurs nœuds racines trouvés')
  }

  // Vérifier qu'il y a au moins un nœud de diagnostic
  const diagnosisNodes = nodes.filter(n => n.node_type === 'diagnosis')
  const missingDiagnosisNodes = diagnosisNodes.length === 0

  if (missingDiagnosisNodes) {
    warnings.push('Aucun nœud de diagnostic trouvé')
  }

  // Vérifier les nœuds questions
  for (const node of nodes.filter(n => n.node_type === 'question')) {
    const answers = await getNodeAnswers(node.id)
    
    if (answers.length === 0) {
      deadEnds.push(node.id)
      errors.push(`Question "${node.question_text}" sans réponses`)
    }

    // Vérifier que toutes les réponses ont un nœud suivant
    for (const answer of answers) {
      if (!answer.next_node_id) {
        warnings.push(`Réponse "${answer.answer_text}" sans nœud suivant`)
      }
    }
  }

  // Vérifier les nœuds accessibles depuis la racine
  if (rootNodes.length === 1) {
    const reachableNodeIds = new Set<string>()
    
    const markReachable = async (nodeId: string): Promise<void> => {
      if (reachableNodeIds.has(nodeId)) return
      reachableNodeIds.add(nodeId)
      
      const answers = await getNodeAnswers(nodeId)
      for (const answer of answers) {
        if (answer.next_node_id) {
          await markReachable(answer.next_node_id)
        }
      }
    }
    
    await markReachable(rootNodes[0].id)
    
    unreachableNodes.push(
      ...nodes
        .filter(n => !reachableNodeIds.has(n.id))
        .map(n => n.id)
    )
    
    if (unreachableNodes.length > 0) {
      warnings.push(`${unreachableNodes.length} nœud(s) non accessibles`)
    }
  }

  // Vérifier les nœuds orphelins (ni parent ni enfants)
  for (const node of nodes) {
    const hasParent = !!node.parent_node_id
    const answers = await getNodeAnswers(node.id)
    const hasChildren = answers.length > 0
    
    if (!hasParent && node.id !== rootNodes[0]?.id && !hasChildren) {
      orphanNodes.push(node.id)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    orphanNodes,
    deadEnds,
    unreachableNodes,
    missingDiagnosisNodes
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

export async function searchPathologies(query: string) {
  const { data, error } = await supabase
    .from('pathologies')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name')
    .limit(20)

  if (error) throw error
  return data
}

export async function searchTests(query: string) {
  const { data, error } = await supabase
    .from('orthopedic_tests')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name')
    .limit(20)

  if (error) throw error
  return data
}

export async function searchClusters(query: string) {
  const { data, error } = await supabase
    .from('orthopedic_test_clusters')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name')
    .limit(20)

  if (error) throw error
  return data
}