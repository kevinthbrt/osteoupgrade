import { supabase } from './supabase'

export type ClinicalCase = {
  id: string
  title: string
  description: string
  region: string
  difficulty: 'débutant' | 'intermédiaire' | 'avancé'
  duration_minutes: number
  patient_profile: string
  objectives: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CaseStepType = 'info' | 'choice' | 'clinical_exam' | 'decision'

export type CaseStep = {
  id: string
  case_id: string
  step_order: number
  step_type: CaseStepType
  title: string
  content: string
  image_url?: string
  video_url?: string
  timer_seconds?: number
  points_available: number
  created_at: string
  updated_at: string
}

export type CaseStepChoice = {
  id: string
  step_id: string
  choice_order: number
  choice_text: string
  is_correct: boolean
  points_awarded: number
  feedback?: string
  feedback_type?: 'correct' | 'partial' | 'incorrect' | 'info'
  next_step_override?: string
}

export type CaseProgress = {
  id: string
  user_id: string
  case_id: string
  current_step_order: number
  completed: boolean
  score: number
  max_score: number
  started_at: string
  completed_at?: string
  time_spent_seconds: number
  created_at: string
  updated_at: string
}

export type CaseUserAnswer = {
  id: string
  progress_id: string
  step_id: string
  choice_id?: string
  points_earned: number
  answered_at: string
}

/**
 * Get a clinical case by ID
 */
export async function getCaseById(caseId: string): Promise<ClinicalCase | null> {
  const { data, error } = await supabase
    .from('clinical_cases')
    .select('*')
    .eq('id', caseId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching case:', error)
    return null
  }

  return data
}

/**
 * Get all steps for a case
 */
export async function getCaseSteps(caseId: string): Promise<CaseStep[]> {
  const { data, error } = await supabase
    .from('case_steps')
    .select('*')
    .eq('case_id', caseId)
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Error fetching case steps:', error)
    return []
  }

  return data || []
}

/**
 * Get a specific step by ID
 */
export async function getStepById(stepId: string): Promise<CaseStep | null> {
  const { data, error } = await supabase
    .from('case_steps')
    .select('*')
    .eq('id', stepId)
    .single()

  if (error) {
    console.error('Error fetching step:', error)
    return null
  }

  return data
}

/**
 * Get choices for a step
 */
export async function getStepChoices(stepId: string): Promise<CaseStepChoice[]> {
  const { data, error } = await supabase
    .from('case_step_choices')
    .select('*')
    .eq('step_id', stepId)
    .order('choice_order', { ascending: true })

  if (error) {
    console.error('Error fetching step choices:', error)
    return []
  }

  return data || []
}

/**
 * Get or create user progress for a case
 */
export async function getOrCreateProgress(userId: string, caseId: string): Promise<CaseProgress | null> {
  // Try to get existing progress
  const { data: existing, error: fetchError } = await supabase
    .from('case_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('case_id', caseId)
    .single()

  if (existing) {
    return existing
  }

  // Calculate max score
  const steps = await getCaseSteps(caseId)
  const maxScore = steps.reduce((sum, step) => sum + step.points_available, 0)

  // Create new progress
  const { data: newProgress, error: createError } = await supabase
    .from('case_progress')
    .insert({
      user_id: userId,
      case_id: caseId,
      current_step_order: 0,
      score: 0,
      max_score: maxScore,
      completed: false
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating progress:', createError)
    return null
  }

  return newProgress
}

/**
 * Update progress step
 */
export async function updateProgress(
  progressId: string,
  updates: Partial<CaseProgress>
): Promise<boolean> {
  const { error } = await supabase
    .from('case_progress')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', progressId)

  if (error) {
    console.error('Error updating progress:', error)
    return false
  }

  return true
}

/**
 * Save user answer
 */
export async function saveUserAnswer(
  progressId: string,
  stepId: string,
  choiceId: string,
  pointsEarned: number
): Promise<boolean> {
  // Check if answer already exists
  const { data: existing } = await supabase
    .from('case_user_answers')
    .select('id')
    .eq('progress_id', progressId)
    .eq('step_id', stepId)
    .single()

  if (existing) {
    // Update existing answer
    const { error } = await supabase
      .from('case_user_answers')
      .update({
        choice_id: choiceId,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString()
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating answer:', error)
      return false
    }
  } else {
    // Insert new answer
    const { error } = await supabase
      .from('case_user_answers')
      .insert({
        progress_id: progressId,
        step_id: stepId,
        choice_id: choiceId,
        points_earned: pointsEarned
      })

    if (error) {
      console.error('Error saving answer:', error)
      return false
    }
  }

  return true
}

/**
 * Get user answers for a progress
 */
export async function getUserAnswers(progressId: string): Promise<CaseUserAnswer[]> {
  const { data, error } = await supabase
    .from('case_user_answers')
    .select('*')
    .eq('progress_id', progressId)

  if (error) {
    console.error('Error fetching user answers:', error)
    return []
  }

  return data || []
}

/**
 * Complete a case
 */
export async function completeCase(
  progressId: string,
  finalScore: number,
  timeSpent: number
): Promise<boolean> {
  const { error } = await supabase
    .from('case_progress')
    .update({
      completed: true,
      score: finalScore,
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpent,
      updated_at: new Date().toISOString()
    })
    .eq('id', progressId)

  if (error) {
    console.error('Error completing case:', error)
    return false
  }

  return true
}

/**
 * Create a new case step
 */
export async function createCaseStep(stepData: Omit<CaseStep, 'id' | 'created_at' | 'updated_at'>): Promise<CaseStep | null> {
  const { data, error } = await supabase
    .from('case_steps')
    .insert(stepData)
    .select()
    .single()

  if (error) {
    console.error('Error creating step:', error)
    return null
  }

  return data
}

/**
 * Create a step choice
 */
export async function createStepChoice(choiceData: Omit<CaseStepChoice, 'id'>): Promise<CaseStepChoice | null> {
  const { data, error } = await supabase
    .from('case_step_choices')
    .insert(choiceData)
    .select()
    .single()

  if (error) {
    console.error('Error creating choice:', error)
    return null
  }

  return data
}

/**
 * Delete a step
 */
export async function deleteCaseStep(stepId: string): Promise<boolean> {
  const { error } = await supabase
    .from('case_steps')
    .delete()
    .eq('id', stepId)

  if (error) {
    console.error('Error deleting step:', error)
    return false
  }

  return true
}

/**
 * Delete a choice
 */
export async function deleteStepChoice(choiceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('case_step_choices')
    .delete()
    .eq('id', choiceId)

  if (error) {
    console.error('Error deleting choice:', error)
    return false
  }

  return true
}
