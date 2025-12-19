// ============================================================================
// TYPES POUR L'ENCYCLOPÉDIE OSTÉOPATHIQUE
// ============================================================================

// ============================================================================
// TYPES COMMUNS
// ============================================================================

export type DifficultyLevel = 'débutant' | 'intermédiaire' | 'avancé'
export type ModuleType = 'diagnostic' | 'practice' | 'course' | 'quiz' | 'case'
export type ReferenceType = 'related' | 'prerequisite' | 'follow_up' | 'practice' | 'theory' | 'assessment'

// Catégories de contenu e-learning
export type LearningCategory =
  | 'HVLA'
  | 'mobilisation'
  | 'anatomie'
  | 'diagnostic'
  | 'physiologie'
  | 'biomécanique'
  | 'pathologie'
  | 'techniques-tissulaires'
  | 'crânien'
  | 'viscéral'

// ============================================================================
// QUIZ - TYPES
// ============================================================================

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false'

export interface Quiz {
  id: string
  title: string
  description: string | null
  category: LearningCategory | null
  difficulty: DifficultyLevel | null
  duration_minutes: number | null
  passing_score: number
  xp_reward: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: QuestionType
  explanation: string | null
  points: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface QuizQuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number | null
  total_questions: number
  correct_answers: number
  passed: boolean | null
  xp_earned: number
  started_at: string
  completed_at: string | null
  time_spent_seconds: number | null
}

export interface QuizUserAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_ids: string[]
  is_correct: boolean | null
  points_earned: number
  created_at: string
}

export interface QuizStatistics {
  id: string
  quiz_id: string
  total_attempts: number
  total_completions: number
  average_score: number | null
  average_time_seconds: number | null
  last_updated: string
}

// Types pour les formulaires de création/édition de quiz
export interface CreateQuizInput {
  title: string
  description?: string
  category?: LearningCategory
  difficulty?: DifficultyLevel
  duration_minutes?: number
  passing_score?: number
  xp_reward?: number
  is_active?: boolean
}

export interface UpdateQuizInput extends Partial<CreateQuizInput> {}

export interface CreateQuizQuestionInput {
  quiz_id: string
  question_text: string
  question_type: QuestionType
  explanation?: string
  points?: number
  order_index?: number
}

export interface UpdateQuizQuestionInput extends Partial<CreateQuizQuestionInput> {}

export interface CreateQuizQuestionOptionInput {
  question_id: string
  option_text: string
  is_correct: boolean
  order_index?: number
}

// Type enrichi pour affichage avec les relations
export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestionWithOptions[]
}

export interface QuizQuestionWithOptions extends QuizQuestion {
  options: QuizQuestionOption[]
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: Quiz
  answers: QuizUserAnswer[]
}

// ============================================================================
// CAS PRATIQUES CLINIQUES - TYPES
// ============================================================================

export type ClinicalCaseStepType = 'observation' | 'question' | 'test' | 'decision' | 'information'

export interface ClinicalCase {
  id: string
  title: string
  description: string | null
  patient_context: string
  initial_complaint: string
  difficulty: DifficultyLevel | null
  category: string | null
  estimated_duration_minutes: number | null
  xp_reward: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ClinicalCaseStep {
  id: string
  case_id: string
  step_number: number
  step_type: ClinicalCaseStepType
  content: string
  hint: string | null
  points: number
  requires_answer: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface ClinicalCaseStepOption {
  id: string
  step_id: string
  option_text: string
  is_correct: boolean
  feedback: string | null
  leads_to_step_number: number | null
  order_index: number
  created_at: string
}

export interface ClinicalCaseProgress {
  id: string
  case_id: string
  user_id: string
  current_step_number: number
  completed: boolean
  score: number
  total_points: number
  xp_earned: number
  started_at: string
  completed_at: string | null
  last_activity_at: string
}

export interface ClinicalCaseUserAnswer {
  id: string
  progress_id: string
  step_id: string
  selected_option_ids: string[]
  is_correct: boolean | null
  points_earned: number
  feedback_shown: string | null
  created_at: string
}

export interface ClinicalCaseNote {
  id: string
  case_id: string
  user_id: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClinicalCaseStatistics {
  id: string
  case_id: string
  total_attempts: number
  total_completions: number
  average_score: number | null
  average_duration_minutes: number | null
  last_updated: string
}

// Types pour les formulaires de création/édition
export interface CreateClinicalCaseInput {
  title: string
  description?: string
  patient_context: string
  initial_complaint: string
  difficulty?: DifficultyLevel
  category?: string
  estimated_duration_minutes?: number
  xp_reward?: number
  is_active?: boolean
}

export interface UpdateClinicalCaseInput extends Partial<CreateClinicalCaseInput> {}

export interface CreateClinicalCaseStepInput {
  case_id: string
  step_number: number
  step_type: ClinicalCaseStepType
  content: string
  hint?: string
  points?: number
  requires_answer?: boolean
  image_url?: string
}

export interface UpdateClinicalCaseStepInput extends Partial<CreateClinicalCaseStepInput> {}

export interface CreateClinicalCaseStepOptionInput {
  step_id: string
  option_text: string
  is_correct: boolean
  feedback?: string
  leads_to_step_number?: number
  order_index?: number
}

// Types enrichis pour affichage
export interface ClinicalCaseWithSteps extends ClinicalCase {
  steps: ClinicalCaseStepWithOptions[]
}

export interface ClinicalCaseStepWithOptions extends ClinicalCaseStep {
  options: ClinicalCaseStepOption[]
}

export interface ClinicalCaseProgressWithDetails extends ClinicalCaseProgress {
  clinical_case: ClinicalCase
  answers: ClinicalCaseUserAnswer[]
  current_step?: ClinicalCaseStepWithOptions
}

// ============================================================================
// INTERCONNEXIONS ENTRE MODULES - TYPES
// ============================================================================

export interface ModuleReference {
  id: string
  source_module: ModuleType
  source_id: string
  target_module: ModuleType
  target_id: string
  reference_type: ReferenceType | null
  display_label: string | null
  description: string | null
  order_index: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ModuleReferenceBidirectional extends ModuleReference {
  direction: 'forward' | 'backward'
}

export interface ModuleReferenceSuggestion {
  id: string
  source_module: ModuleType
  source_id: string
  target_module: ModuleType
  target_id: string
  confidence_score: number
  reasoning: string | null
  created_at: string
}

export interface CreateModuleReferenceInput {
  source_module: ModuleType
  source_id: string
  target_module: ModuleType
  target_id: string
  reference_type?: ReferenceType
  display_label?: string
  description?: string
  order_index?: number
}

export interface UpdateModuleReferenceInput extends Partial<CreateModuleReferenceInput> {
  is_active?: boolean
}

// Type enrichi pour affichage avec détails du contenu cible
export interface ModuleReferenceWithTarget extends ModuleReference {
  target_title?: string
  target_description?: string
  target_category?: string
  target_region?: string
}

// ============================================================================
// RECHERCHE GLOBALE - TYPES
// ============================================================================

export interface EncyclopediaSearchResult {
  module: ModuleType
  id: string
  title: string
  description: string | null
  region?: string
  category?: string
  difficulty?: DifficultyLevel
  url: string
  relevance_score?: number
}

export interface EncyclopediaSearchFilters {
  query: string
  modules?: ModuleType[]
  difficulty?: DifficultyLevel
  category?: string
  region?: string
}

export interface EncyclopediaSearchResponse {
  results: EncyclopediaSearchResult[]
  total: number
  by_module: Record<ModuleType, number>
}

// ============================================================================
// STATISTIQUES UTILISATEUR - TYPES
// ============================================================================

export interface UserEncyclopediaStats {
  user_id: string
  total_quizzes_attempted: number
  total_quizzes_passed: number
  total_cases_attempted: number
  total_cases_completed: number
  total_xp_earned: number
  average_quiz_score: number | null
  average_case_score: number | null
  favorite_category: LearningCategory | null
  last_activity_at: string
}

export interface UserProgressSummary {
  quizzes: {
    attempted: number
    passed: number
    in_progress: number
    average_score: number
  }
  cases: {
    attempted: number
    completed: number
    in_progress: number
    average_score: number
  }
  total_xp: number
  recent_activities: RecentActivity[]
}

export interface RecentActivity {
  type: 'quiz' | 'case'
  id: string
  title: string
  completed_at: string
  score: number | null
  passed?: boolean
}

// ============================================================================
// LABELS ET CONSTANTES
// ============================================================================

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  'débutant': 'Débutant',
  'intermédiaire': 'Intermédiaire',
  'avancé': 'Avancé'
}

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  'débutant': 'bg-green-100 text-green-700',
  'intermédiaire': 'bg-yellow-100 text-yellow-700',
  'avancé': 'bg-red-100 text-red-700'
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  'diagnostic': 'Diagnostic',
  'practice': 'Pratique',
  'course': 'Cours',
  'quiz': 'Quiz',
  'case': 'Cas pratique'
}

export const MODULE_ICONS: Record<ModuleType, string> = {
  'diagnostic': '🔍',
  'practice': '🤲',
  'course': '📚',
  'quiz': '📝',
  'case': '🎯'
}

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  'related': 'Contenu lié',
  'prerequisite': 'Prérequis',
  'follow_up': 'Suite recommandée',
  'practice': 'Application pratique',
  'theory': 'Base théorique',
  'assessment': 'Évaluation'
}

export const LEARNING_CATEGORY_LABELS: Record<LearningCategory, string> = {
  'HVLA': 'HVLA',
  'mobilisation': 'Mobilisation',
  'anatomie': 'Anatomie',
  'diagnostic': 'Diagnostic',
  'physiologie': 'Physiologie',
  'biomécanique': 'Biomécanique',
  'pathologie': 'Pathologie',
  'techniques-tissulaires': 'Techniques tissulaires',
  'crânien': 'Crânien',
  'viscéral': 'Viscéral'
}

export const STEP_TYPE_LABELS: Record<ClinicalCaseStepType, string> = {
  'observation': 'Observation',
  'question': 'Question',
  'test': 'Test clinique',
  'decision': 'Décision',
  'information': 'Information'
}

export const STEP_TYPE_ICONS: Record<ClinicalCaseStepType, string> = {
  'observation': '👁️',
  'question': '❓',
  'test': '🩺',
  'decision': '⚖️',
  'information': 'ℹ️'
}

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

export const isValidDifficulty = (value: string): value is DifficultyLevel => {
  return ['débutant', 'intermédiaire', 'avancé'].includes(value)
}

export const isValidModuleType = (value: string): value is ModuleType => {
  return ['diagnostic', 'practice', 'course', 'quiz', 'case'].includes(value)
}

export const isValidReferenceType = (value: string): value is ReferenceType => {
  return ['related', 'prerequisite', 'follow_up', 'practice', 'theory', 'assessment'].includes(value)
}

export const isValidQuestionType = (value: string): value is QuestionType => {
  return ['single_choice', 'multiple_choice', 'true_false'].includes(value)
}

export const isValidStepType = (value: string): value is ClinicalCaseStepType => {
  return ['observation', 'question', 'test', 'decision', 'information'].includes(value)
}

// ============================================================================
// HELPERS DE CALCUL
// ============================================================================

export const calculateQuizScore = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0
  return Math.round((correctAnswers / totalQuestions) * 100)
}

export const calculateCaseScore = (pointsEarned: number, totalPoints: number): number => {
  if (totalPoints === 0) return 0
  return Math.round((pointsEarned / totalPoints) * 100)
}

export const hasPassedQuiz = (score: number, passingScore: number): boolean => {
  return score >= passingScore
}

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const getDifficultyBadgeColor = (difficulty: DifficultyLevel): string => {
  return DIFFICULTY_COLORS[difficulty]
}

// ============================================================================
// TYPES POUR LES COMPOSANTS UI
// ============================================================================

export interface QuizCardProps {
  quiz: Quiz
  statistics?: QuizStatistics
  userLastAttempt?: QuizAttempt
  showActions?: boolean
  onStart?: () => void
  onViewResults?: () => void
}

export interface ClinicalCaseCardProps {
  clinicalCase: ClinicalCase
  statistics?: ClinicalCaseStatistics
  userProgress?: ClinicalCaseProgress
  showActions?: boolean
  onStart?: () => void
  onContinue?: () => void
  onReview?: () => void
}

export interface ModuleReferenceListProps {
  sourceModule: ModuleType
  sourceId: string
  referenceType?: ReferenceType
  showCreateButton?: boolean
}

export interface EncyclopediaSearchProps {
  initialQuery?: string
  filters?: Partial<EncyclopediaSearchFilters>
  onResultClick?: (result: EncyclopediaSearchResult) => void
}
