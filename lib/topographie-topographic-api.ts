import { supabase } from './supabase'
import type {
  AnatomicalRegion,
  CreateTopographieViewInput,
  TopographieView,
  UpdateTopographieViewInput
} from './types-topographic-system'

/**
 * API dédiée aux vues topographiques du module Topographie (distinctes de consultation-v3)
 */

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
