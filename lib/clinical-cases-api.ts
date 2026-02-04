import { supabase } from './supabase'

// ============================================
// TYPES - Nouvelle architecture style e-learning
// ============================================

export type ClinicalCase = {
  id: string
  title: string
  description: string
  region: string
  difficulty: 'débutant' | 'intermédiaire' | 'avancé'
  duration_minutes: number
  photo_url?: string
  is_active: boolean
  is_free_access: boolean
  display_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

export type ClinicalCaseChapter = {
  id: string
  case_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export type ClinicalCaseModule = {
  id: string
  chapter_id: string
  title: string
  content_type: 'video' | 'image' | 'text' | 'mixed'
  vimeo_url?: string
  image_url?: string
  images?: string[]
  description_html?: string
  order_index: number
  duration_minutes: number
  created_at: string
  updated_at: string
}

export type ClinicalCaseQuiz = {
  id: string
  module_id: string
  title: string
  description?: string
  passing_score: number
  is_active: boolean
  allow_retry: boolean
  max_attempts: number
  created_at: string
  updated_at: string
}

export type ClinicalCaseQuizQuestion = {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'multiple_answer'
  image_url?: string
  points: number
  order_index: number
  explanation?: string
  created_at: string
  updated_at: string
}

export type ClinicalCaseQuizAnswer = {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
  order_index: number
  feedback?: string
  created_at: string
}

export type ClinicalCaseQuizAttempt = {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  passed: boolean
  answers_data: any
  attempt_number: number
  started_at: string
  completed_at?: string
}

export type ClinicalCaseModuleProgress = {
  id: string
  module_id: string
  user_id: string
  completed: boolean
  completed_at?: string
  viewed_at: string
}

export type ClinicalCaseProgress = {
  id: string
  case_id: string
  user_id: string
  completed: boolean
  total_score: number
  completion_percentage: number
  started_at: string
  completed_at?: string
  last_accessed_at: string
}

// ============================================
// CLINICAL CASES - Fonctions principales
// ============================================

/**
 * Get all clinical cases
 */
export async function getAllCases(filters?: {
  region?: string
  difficulty?: string
  is_active?: boolean
}): Promise<ClinicalCase[]> {
  let query = supabase
    .from('clinical_cases_v2')
    .select('*')
    .order('display_order', { ascending: true })

  if (filters?.region && filters.region !== 'all') {
    query = query.eq('region', filters.region.toLowerCase())
  }

  if (filters?.difficulty && filters.difficulty !== 'all') {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching cases:', error)
    return []
  }

  return data || []
}

/**
 * Get a clinical case by ID
 */
export async function getCaseById(caseId: string): Promise<ClinicalCase | null> {
  const { data, error } = await supabase
    .from('clinical_cases_v2')
    .select('*')
    .eq('id', caseId)
    .single()

  if (error) {
    console.error('Error fetching case:', error)
    return null
  }

  return data
}

/**
 * Create a new clinical case
 */
export async function createCase(caseData: Omit<ClinicalCase, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalCase | null> {
  const { data, error } = await supabase
    .from('clinical_cases_v2')
    .insert(caseData)
    .select()
    .single()

  if (error) {
    console.error('Error creating case:', error)
    return null
  }

  return data
}

/**
 * Update a clinical case
 */
export async function updateCase(caseId: string, updates: Partial<ClinicalCase>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_cases_v2')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', caseId)

  if (error) {
    console.error('Error updating case:', error)
    return false
  }

  return true
}

/**
 * Delete a clinical case
 */
export async function deleteCase(caseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_cases_v2')
    .delete()
    .eq('id', caseId)

  if (error) {
    console.error('Error deleting case:', error)
    return false
  }

  return true
}

// ============================================
// CHAPTERS - Gestion des chapitres
// ============================================

/**
 * Get all chapters for a case
 */
export async function getCaseChapters(caseId: string): Promise<ClinicalCaseChapter[]> {
  const { data, error } = await supabase
    .from('clinical_case_chapters')
    .select('*')
    .eq('case_id', caseId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching chapters:', error)
    return []
  }

  return data || []
}

/**
 * Create a chapter
 */
export async function createChapter(chapterData: Omit<ClinicalCaseChapter, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalCaseChapter | null> {
  const { data, error } = await supabase
    .from('clinical_case_chapters')
    .insert(chapterData)
    .select()
    .single()

  if (error) {
    console.error('Error creating chapter:', error)
    return null
  }

  return data
}

/**
 * Update a chapter
 */
export async function updateChapter(chapterId: string, updates: Partial<ClinicalCaseChapter>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_chapters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chapterId)

  if (error) {
    console.error('Error updating chapter:', error)
    return false
  }

  return true
}

/**
 * Delete a chapter
 */
export async function deleteChapter(chapterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_chapters')
    .delete()
    .eq('id', chapterId)

  if (error) {
    console.error('Error deleting chapter:', error)
    return false
  }

  return true
}

// ============================================
// MODULES - Gestion des modules de contenu
// ============================================

/**
 * Get all modules for a chapter
 */
export async function getChapterModules(chapterId: string): Promise<ClinicalCaseModule[]> {
  const { data, error } = await supabase
    .from('clinical_case_modules')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching modules:', error)
    return []
  }

  return data || []
}

/**
 * Get a module by ID
 */
export async function getModuleById(moduleId: string): Promise<ClinicalCaseModule | null> {
  const { data, error } = await supabase
    .from('clinical_case_modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  if (error) {
    console.error('Error fetching module:', error)
    return null
  }

  return data
}

/**
 * Create a module
 */
export async function createModule(moduleData: Omit<ClinicalCaseModule, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalCaseModule | null> {
  const { data, error } = await supabase
    .from('clinical_case_modules')
    .insert(moduleData)
    .select()
    .single()

  if (error) {
    console.error('Error creating module:', error)
    return null
  }

  return data
}

/**
 * Update a module
 */
export async function updateModule(moduleId: string, updates: Partial<ClinicalCaseModule>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_modules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', moduleId)

  if (error) {
    console.error('Error updating module:', error)
    return false
  }

  return true
}

/**
 * Delete a module
 */
export async function deleteModule(moduleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_modules')
    .delete()
    .eq('id', moduleId)

  if (error) {
    console.error('Error deleting module:', error)
    return false
  }

  return true
}

// ============================================
// QUIZZES - Gestion des quiz
// ============================================

/**
 * Get quiz by module ID
 */
export async function getModuleQuiz(moduleId: string): Promise<ClinicalCaseQuiz | null> {
  const { data, error } = await supabase
    .from('clinical_case_quizzes')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching quiz:', error)
    return null
  }

  return data
}

/**
 * Get quiz by ID
 */
export async function getQuizById(quizId: string): Promise<ClinicalCaseQuiz | null> {
  const { data, error } = await supabase
    .from('clinical_case_quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (error) {
    console.error('Error fetching quiz:', error)
    return null
  }

  return data
}

/**
 * Create a quiz
 */
export async function createQuiz(quizData: Omit<ClinicalCaseQuiz, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalCaseQuiz | null> {
  const { data, error } = await supabase
    .from('clinical_case_quizzes')
    .insert(quizData)
    .select()
    .single()

  if (error) {
    console.error('Error creating quiz:', error)
    return null
  }

  return data
}

/**
 * Update a quiz
 */
export async function updateQuiz(quizId: string, updates: Partial<ClinicalCaseQuiz>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quizzes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', quizId)

  if (error) {
    console.error('Error updating quiz:', error)
    return false
  }

  return true
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quizzes')
    .delete()
    .eq('id', quizId)

  if (error) {
    console.error('Error deleting quiz:', error)
    return false
  }

  return true
}

// ============================================
// QUIZ QUESTIONS - Gestion des questions
// ============================================

/**
 * Get all questions for a quiz
 */
export async function getQuizQuestions(quizId: string): Promise<ClinicalCaseQuizQuestion[]> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }

  return data || []
}

/**
 * Create a question
 */
export async function createQuestion(questionData: Omit<ClinicalCaseQuizQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalCaseQuizQuestion | null> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_questions')
    .insert(questionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating question:', error)
    return null
  }

  return data
}

/**
 * Update a question
 */
export async function updateQuestion(questionId: string, updates: Partial<ClinicalCaseQuizQuestion>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quiz_questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', questionId)

  if (error) {
    console.error('Error updating question:', error)
    return false
  }

  return true
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quiz_questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Error deleting question:', error)
    return false
  }

  return true
}

// ============================================
// QUIZ ANSWERS - Gestion des réponses
// ============================================

/**
 * Get all answers for a question
 */
export async function getQuestionAnswers(questionId: string): Promise<ClinicalCaseQuizAnswer[]> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching answers:', error)
    return []
  }

  return data || []
}

/**
 * Create an answer
 */
export async function createAnswer(answerData: Omit<ClinicalCaseQuizAnswer, 'id' | 'created_at'>): Promise<ClinicalCaseQuizAnswer | null> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_answers')
    .insert(answerData)
    .select()
    .single()

  if (error) {
    console.error('Error creating answer:', error)
    return null
  }

  return data
}

/**
 * Update an answer
 */
export async function updateAnswer(answerId: string, updates: Partial<ClinicalCaseQuizAnswer>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quiz_answers')
    .update(updates)
    .eq('id', answerId)

  if (error) {
    console.error('Error updating answer:', error)
    return false
  }

  return true
}

/**
 * Delete an answer
 */
export async function deleteAnswer(answerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quiz_answers')
    .delete()
    .eq('id', answerId)

  if (error) {
    console.error('Error deleting answer:', error)
    return false
  }

  return true
}

// ============================================
// QUIZ ATTEMPTS - Gestion des tentatives
// ============================================

/**
 * Get user attempts for a quiz
 */
export async function getUserQuizAttempts(userId: string, quizId: string): Promise<ClinicalCaseQuizAttempt[]> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching attempts:', error)
    return []
  }

  return data || []
}

/**
 * Create a quiz attempt
 */
export async function createQuizAttempt(attemptData: Omit<ClinicalCaseQuizAttempt, 'id' | 'started_at' | 'completed_at'>): Promise<ClinicalCaseQuizAttempt | null> {
  const { data, error } = await supabase
    .from('clinical_case_quiz_attempts')
    .insert(attemptData)
    .select()
    .single()

  if (error) {
    console.error('Error creating attempt:', error)
    return null
  }

  return data
}

/**
 * Complete a quiz attempt
 */
export async function completeQuizAttempt(attemptId: string, score: number, correctAnswers: number, passed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_quiz_attempts')
    .update({
      score,
      correct_answers: correctAnswers,
      passed,
      completed_at: new Date().toISOString()
    })
    .eq('id', attemptId)

  if (error) {
    console.error('Error completing attempt:', error)
    return false
  }

  return true
}

// ============================================
// PROGRESS - Gestion de la progression
// ============================================

/**
 * Get or create case progress for a user
 */
export async function getOrCreateCaseProgress(userId: string, caseId: string): Promise<ClinicalCaseProgress | null> {
  // Try to get existing progress
  const { data: existing } = await supabase
    .from('clinical_case_progress_v2')
    .select('*')
    .eq('user_id', userId)
    .eq('case_id', caseId)
    .single()

  if (existing) {
    return existing
  }

  // Create new progress
  const { data: newProgress, error } = await supabase
    .from('clinical_case_progress_v2')
    .insert({
      user_id: userId,
      case_id: caseId,
      completed: false,
      total_score: 0,
      completion_percentage: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating progress:', error)
    return null
  }

  return newProgress
}

/**
 * Update case progress
 */
export async function updateCaseProgress(progressId: string, updates: Partial<ClinicalCaseProgress>): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_progress_v2')
    .update({
      ...updates,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', progressId)

  if (error) {
    console.error('Error updating progress:', error)
    return false
  }

  return true
}

/**
 * Get user progress for all cases
 */
export async function getUserCasesProgress(userId: string): Promise<Record<string, ClinicalCaseProgress>> {
  const { data, error } = await supabase
    .from('clinical_case_progress_v2')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user progress:', error)
    return {}
  }

  const progressMap: Record<string, ClinicalCaseProgress> = {}
  data?.forEach((progress) => {
    progressMap[progress.case_id] = progress
  })

  return progressMap
}

/**
 * Mark module as completed
 */
export async function markModuleAsCompleted(userId: string, moduleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clinical_case_module_progress')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      completed: true,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'module_id,user_id'
    })

  if (error) {
    console.error('Error marking module as completed:', error)
    return false
  }

  return true
}

/**
 * Get user module progress for a case
 */
export async function getUserModuleProgress(userId: string, caseId: string): Promise<Record<string, ClinicalCaseModuleProgress>> {
  // Get all chapters for the case
  const chapters = await getCaseChapters(caseId)
  const chapterIds = chapters.map(c => c.id)

  if (chapterIds.length === 0) return {}

  // Get all modules for these chapters
  const { data: modules, error: modulesError } = await supabase
    .from('clinical_case_modules')
    .select('id')
    .in('chapter_id', chapterIds)

  if (modulesError || !modules) {
    console.error('Error fetching modules:', modulesError)
    return {}
  }

  const moduleIds = modules.map(m => m.id)

  if (moduleIds.length === 0) return {}

  // Get user progress for these modules
  const { data: progress, error: progressError } = await supabase
    .from('clinical_case_module_progress')
    .select('*')
    .eq('user_id', userId)
    .in('module_id', moduleIds)

  if (progressError) {
    console.error('Error fetching module progress:', progressError)
    return {}
  }

  const progressMap: Record<string, ClinicalCaseModuleProgress> = {}
  progress?.forEach((p) => {
    progressMap[p.module_id] = p
  })

  return progressMap
}
