/**
 * Types TypeScript pour le système de zones topographiques + arbres décisionnels
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type AnatomicalRegion =
  | 'cervical'
  | 'thoracique'
  | 'lombaire'
  | 'epaule'
  | 'coude'
  | 'poignet'
  | 'main'
  | 'hanche'
  | 'genou'
  | 'cheville'
  | 'pied'

export type NodeType = 'question' | 'diagnosis' | 'tests'
export type TestResult = 'positive' | 'negative' | 'uncertain'

// ============================================================================
// ZONES TOPOGRAPHIQUES
// ============================================================================

export interface TopographicZone {
  id: string
  region: AnatomicalRegion
  name: string
  description?: string
  image_url?: string
  display_order: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateTopographicZoneInput {
  region: AnatomicalRegion
  name: string
  description?: string
  image_url?: string
  display_order?: number
}

export interface UpdateTopographicZoneInput {
  name?: string
  description?: string
  image_url?: string
  display_order?: number
  is_active?: boolean
}

// ============================================================================
// ARBRES DÉCISIONNELS
// ============================================================================

export interface DecisionTree {
  id: string
  topographic_zone_id: string
  name: string
  description?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations (chargées si nécessaire)
  topographic_zone?: TopographicZone
  nodes?: DecisionNode[]
}

export interface CreateDecisionTreeInput {
  topographic_zone_id: string
  name: string
  description?: string
}

export interface UpdateDecisionTreeInput {
  name?: string
  description?: string
  is_active?: boolean
}

// ============================================================================
// NŒUDS DE DÉCISION
// ============================================================================

export interface DecisionNode {
  id: string
  tree_id: string
  parent_node_id?: string
  node_type: NodeType
  
  // Pour les questions
  question_text?: string
  
  // Pour les diagnostics
  pathology_ids?: string[]
  
  // Pour les tests
  test_ids?: string[]
  cluster_ids?: string[]
  
  notes?: string
  display_order: number
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations (chargées si nécessaire)
  tree?: DecisionTree
  parent_node?: DecisionNode
  answers?: DecisionAnswer[]
  pathologies?: Pathology[]
  tests?: OrthopedicTest[]
  clusters?: OrthopedicTestCluster[]
}

export interface CreateQuestionNodeInput {
  tree_id: string
  parent_node_id?: string
  question_text: string
  notes?: string
  display_order?: number
}

export interface CreateDiagnosisNodeInput {
  tree_id: string
  parent_node_id?: string
  pathology_ids: string[]
  notes?: string
  display_order?: number
}

export interface CreateTestsNodeInput {
  tree_id: string
  parent_node_id?: string
  test_ids?: string[]
  cluster_ids?: string[]
  notes?: string
  display_order?: number
}

export interface UpdateDecisionNodeInput {
  question_text?: string
  pathology_ids?: string[]
  test_ids?: string[]
  cluster_ids?: string[]
  notes?: string
  display_order?: number
}

// ============================================================================
// RÉPONSES
// ============================================================================

export interface DecisionAnswer {
  id: string
  node_id: string
  answer_text: string
  next_node_id?: string
  display_order: number
  created_at: string
  updated_at: string
  
  // Relations (chargées si nécessaire)
  node?: DecisionNode
  next_node?: DecisionNode
}

export interface CreateDecisionAnswerInput {
  node_id: string
  answer_text: string
  next_node_id?: string
  display_order?: number
}

export interface UpdateDecisionAnswerInput {
  answer_text?: string
  next_node_id?: string
  display_order?: number
}

// ============================================================================
// CONSULTATIONS V2
// ============================================================================

export interface DecisionPathStep {
  node_id: string
  question?: string
  answer_id: string
  answer_text: string
}

export interface TestResultData {
  test_id: string
  test_name: string
  result: TestResult
  notes?: string
}

export interface ClusterTestResult {
  test_id: string
  test_name: string
  result: TestResult
}

export interface ClusterResultData {
  cluster_id: string
  cluster_name: string
  tests: ClusterTestResult[]
}

export interface ConsultationSessionV2 {
  id: string
  
  // Informations patient
  patient_name: string
  patient_age?: string
  consultation_date: string
  
  // Parcours
  region: AnatomicalRegion
  topographic_zone_id?: string
  decision_tree_id?: string
  
  // Chemin dans l'arbre
  decision_path: DecisionPathStep[]
  
  // Résultats
  identified_pathologies?: string[]
  test_results: TestResultData[]
  cluster_results: ClusterResultData[]
  
  // Conclusion
  notes?: string
  final_diagnosis?: string
  
  // Métadonnées
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations (chargées si nécessaire)
  topographic_zone?: TopographicZone
  decision_tree?: DecisionTree
  pathologies?: Pathology[]
}

export interface CreateConsultationInput {
  patient_name: string
  patient_age?: string
  consultation_date: string
  region: AnatomicalRegion
  topographic_zone_id?: string
  decision_tree_id?: string
  notes?: string
}

export interface UpdateConsultationInput {
  decision_path?: DecisionPathStep[]
  identified_pathologies?: string[]
  test_results?: TestResultData[]
  cluster_results?: ClusterResultData[]
  notes?: string
  final_diagnosis?: string
}

// ============================================================================
// TYPES DE DONNÉES EXISTANTS (référencés par le nouveau système)
// ============================================================================

export interface Pathology {
  id: string
  name: string
  description?: string
  severity?: 'low' | 'medium' | 'high'
  icd_code?: string
  region?: AnatomicalRegion
  is_active: boolean
  topographic_image_url?: string
  recommendations?: string
  is_red_flag: boolean
  red_flag_reason?: string
}

export interface OrthopedicTest {
  id: string
  name: string
  description: string
  video_url?: string
  sensitivity?: number
  specificity?: number
  rv_positive?: number
  rv_negative?: number
  interest?: string
  category?: string
  indications?: string
  sources?: string
}

export interface OrthopedicTestCluster {
  id: string
  name: string
  region: string
  description?: string
  indications?: string
  interest?: string
  sources?: string
  sensitivity?: number
  specificity?: number
  rv_positive?: number
  rv_negative?: number
  tests?: OrthopedicTest[] // Les tests du cluster
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export interface TreeNavigationState {
  currentNode: DecisionNode
  history: DecisionPathStep[]
  canGoBack: boolean
}

export interface ConsultationState {
  step: 'region' | 'zone' | 'questions' | 'tests' | 'summary'
  region?: AnatomicalRegion
  selectedZone?: TopographicZone
  selectedTree?: DecisionTree
  navigationState?: TreeNavigationState
  identifiedPathologies: Pathology[]
  recommendedTests: OrthopedicTest[]
  recommendedClusters: OrthopedicTestCluster[]
  testResults: TestResultData[]
  clusterResults: ClusterResultData[]
}

export interface AdminTreeEditorState {
  tree: DecisionTree
  nodes: Map<string, DecisionNode>
  answers: Map<string, DecisionAnswer[]>
  selectedNodeId?: string
  isDirty: boolean
}

// ============================================================================
// TYPES POUR LES COMPOSANTS
// ============================================================================

export interface ZoneCardProps {
  zone: TopographicZone
  onClick: () => void
  selected?: boolean
}

export interface QuestionCardProps {
  node: DecisionNode
  answers: DecisionAnswer[]
  onAnswerSelect: (answer: DecisionAnswer) => void
}

export interface DiagnosisCardProps {
  pathologies: Pathology[]
  onSelectPathology?: (pathology: Pathology) => void
}

export interface TestCardProps {
  test: OrthopedicTest
  result?: TestResult
  onResultChange: (result: TestResult) => void
}

export interface ClusterCardProps {
  cluster: OrthopedicTestCluster
  results?: ClusterTestResult[]
  onResultChange: (testId: string, result: TestResult) => void
}

// ============================================================================
// TYPES POUR L'EXPORT PDF
// ============================================================================

export interface ConsultationPDFData {
  patientName: string
  patientAge?: string
  consultationDate: string
  region: AnatomicalRegion
  zoneName?: string
  decisionPath: DecisionPathStep[]
  identifiedPathologies: Pathology[]
  testResults: TestResultData[]
  clusterResults: ClusterResultData[]
  notes?: string
  finalDiagnosis?: string
}

// ============================================================================
// TYPES POUR LES VALIDATIONS
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TreeValidationResult extends ValidationResult {
  orphanNodes: string[] // Nœuds sans parent ni enfants
  deadEnds: string[] // Nœuds questions sans réponses
  unreachableNodes: string[] // Nœuds non accessibles depuis la racine
  missingDiagnosisNodes: boolean // L'arbre n'a aucun nœud de diagnostic
}
