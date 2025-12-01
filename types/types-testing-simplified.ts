// ============================================================================
// TYPES SIMPLIFIÉS - TESTING 3D + PATHOLOGIES
// ============================================================================

// Régions anatomiques disponibles
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

// Sévérité des pathologies
export type PathologySeverity = 'low' | 'medium' | 'high'

// Résultat d'un test orthopédique
export type TestResult = 'positive' | 'negative' | 'uncertain'

// ============================================================================
// PATHOLOGIE SIMPLIFIÉE
// ============================================================================
export interface Pathology {
  id: string
  name: string
  description: string | null
  region: AnatomicalRegion
  severity: PathologySeverity | null
  icd_code: string | null
  is_red_flag: boolean
  red_flag_reason: string | null
  is_active: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreatePathologyInput {
  name: string
  description?: string
  region: AnatomicalRegion
  severity?: PathologySeverity
  icd_code?: string
  is_red_flag?: boolean
  red_flag_reason?: string
  is_active?: boolean
  display_order?: number
}

export interface UpdatePathologyInput {
  name?: string
  description?: string
  region?: AnatomicalRegion
  severity?: PathologySeverity
  icd_code?: string
  is_red_flag?: boolean
  red_flag_reason?: string
  is_active?: boolean
  display_order?: number
}

// ============================================================================
// ZONE ANATOMIQUE (pour Testing 3D)
// ============================================================================
export interface AnatomicalZone {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_symmetric: boolean
  model_path: string | null
  is_active: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// TEST ORTHOPÉDIQUE
// ============================================================================
export interface OrthopedicTest {
  id: string
  name: string
  description: string
  category: string // Correspond au nom de la zone (ex: "Épaule")
  indications: string | null
  video_url: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  interest: string | null
  sources: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// CLUSTER DE TESTS
// ============================================================================
export interface OrthopedicTestCluster {
  id: string
  name: string
  region: string
  description: string | null
  indications: string | null
  interest: string | null
  sources: string | null
  sensitivity: number | null
  specificity: number | null
  rv_positive: number | null
  rv_negative: number | null
  created_by: string | null
  created_at: string
  tests?: OrthopedicTest[] // Tests inclus dans le cluster
}

// ============================================================================
// SESSION DE TESTING 3D
// ============================================================================
export interface TestingSessionResult {
  testId: string
  testName: string
  category: string
  result: TestResult | null
  notes: string
  sensitivity?: number
  specificity?: number
}

export interface TestingSession {
  id?: string
  patientName: string
  patientAge: string
  sessionDate: string
  results: TestingSessionResult[]
  notes: string
}

// ============================================================================
// DONNÉES POUR VISUALISATEUR 3D (Testing)
// ============================================================================
export interface TestingViewer3DData {
  zones: AnatomicalZone[]
  testsByZone: Record<string, OrthopedicTest[]>
  clustersByZone: Record<string, OrthopedicTestCluster[]>
}

// ============================================================================
// FILTRES ET RECHERCHE
// ============================================================================
export interface TestSearchFilters {
  query?: string
  category?: string
  indication?: string
  pathology?: string
}

export interface PathologySearchFilters {
  query?: string
  region?: AnatomicalRegion
  severity?: PathologySeverity
  isRedFlag?: boolean
}

// ============================================================================
// MAPPING CATÉGORIES → RÉGIONS
// ============================================================================
export const CATEGORY_TO_REGION_MAP: Record<string, AnatomicalRegion> = {
  'Cervical': 'cervical',
  'Thoracique': 'thoracique',
  'Lombaire': 'lombaire',
  'Épaule': 'epaule',
  'Coude': 'coude',
  'Poignet': 'poignet',
  'Main': 'main',
  'Hanche': 'hanche',
  'Genou': 'genou',
  'Cheville': 'cheville',
  'Pied': 'pied'
}

// ============================================================================
// LABELS FRANÇAIS
// ============================================================================
export const REGION_LABELS: Record<AnatomicalRegion, string> = {
  cervical: 'Cervical',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet',
  main: 'Main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied'
}

export const SEVERITY_LABELS: Record<PathologySeverity, string> = {
  low: 'Légère',
  medium: 'Modérée',
  high: 'Grave'
}

export const SEVERITY_COLORS: Record<PathologySeverity, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}

export const TEST_RESULT_LABELS: Record<TestResult, string> = {
  positive: 'Positif',
  negative: 'Négatif',
  uncertain: 'Incertain'
}

export const TEST_RESULT_COLORS: Record<TestResult, string> = {
  positive: 'bg-green-600 text-white',
  negative: 'bg-red-600 text-white',
  uncertain: 'bg-yellow-600 text-white'
}
