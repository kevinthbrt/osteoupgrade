import { supabase } from './supabase'

// Types for the topographie module (elearning_topographic_views table)

export type AnatomicalRegion =
  | 'cervical' | 'atm' | 'crane'
  | 'thoracique' | 'lombaire' | 'sacro-iliaque' | 'cotes'
  | 'epaule' | 'coude' | 'poignet'
  | 'hanche' | 'genou' | 'cheville' | 'pied'
  | 'neurologique' | 'vasculaire' | 'systemique'

export type TopographieView = {
  id: string
  region: string
  name: string
  description: string | null
  image_url: string | null
  display_order: number | null
  is_active: boolean | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_free_access: boolean | null
}

export type CreateTopographieViewInput = {
  region: AnatomicalRegion
  name: string
  description?: string
  image_url?: string
  display_order?: number
}

export type UpdateTopographieViewInput = Partial<CreateTopographieViewInput> & {
  is_active?: boolean
}

export async function getTopographieViewsByRegion(region: AnatomicalRegion) {
  const { data, error } = await supabase
    .from('elearning_topographic_views')
    .select('*')
    .eq('region', region)
    .eq('is_active', true)
    .order('display_order')

  if (error) throw error
  return data as TopographieView[]
}

export async function getAllTopographieViews() {
  const { data, error } = await supabase
    .from('elearning_topographic_views')
    .select('*')
    .eq('is_active', true)
    .order('region', { ascending: true })
    .order('display_order')

  if (error) throw error
  return data as TopographieView[]
}

export async function createTopographieView(input: CreateTopographieViewInput) {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('elearning_topographic_views')
    .insert({
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data as TopographieView
}

export async function updateTopographieView(id: string, input: UpdateTopographieViewInput) {
  const { data, error } = await supabase
    .from('elearning_topographic_views')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TopographieView
}

export async function deleteTopographieView(id: string) {
  const { error } = await supabase
    .from('elearning_topographic_views')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}
