import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Utiliser un seul client pour toute l'application
export const supabase = createClientComponentClient()

type TableDefinition<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
}

// Représentation minimaliste du schéma Supabase fourni pour aligner l'UI sur les tables réelles
export type Database = {
  public: {
    Tables: {
      mail_templates: TableDefinition<{
        id: string
        name: string
        subject: string
        description: string | null
        html: string
        text: string | null
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      orthopedic_test_cluster_items: TableDefinition<{
        id: string
        cluster_id: string
        test_id: string
        order_index: number
        created_at: string
      }>
      orthopedic_test_clusters: TableDefinition<{
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
      }>
      orthopedic_tests: TableDefinition<{
        id: string
        name: string
        description: string
        video_url: string | null
        sensitivity: number | null
        specificity: number | null
        rv_positive: number | null
        rv_negative: number | null
        interest: string | null
        created_by: string | null
        created_at: string
        updated_at: string
        category: string | null
        indications: string | null
        sources: string | null
        is_free_access: boolean | null
      }>
      pathologies: TableDefinition<{
        id: string
        name: string
        description: string | null
        severity: string | null
        icd_code: string | null
        display_order: number | null
        is_active: boolean | null
        created_by: string | null
        created_at: string
        updated_at: string
        region: string | null
        is_red_flag: boolean | null
        red_flag_reason: string | null
        is_free_access: boolean | null
      }>
      practice_videos: TableDefinition<{
        id: string
        region: string
        topographic_zone_id: string | null
        title: string
        description: string | null
        vimeo_id: string | null
        vimeo_url: string | null
        thumbnail_url: string | null
        duration_seconds: number | null
        order_index: number | null
        is_active: boolean
        created_by: string | null
        created_at: string
        updated_at: string
        is_free_access: boolean | null
      }>
      rehab_exercises: TableDefinition<{
        id: string
        name: string
        region: string
        type: string
        level: number
        nerve_target: string | null
        description: string
        progression_regression: string | null
        illustration_url: string | null
        is_active: boolean
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      profiles: TableDefinition<{
        id: string
        email: string
        full_name: string | null
        role: 'free' | 'premium_silver' | 'premium_gold' | 'admin'
        subscription_status: string | null
        subscription_end_date: string | null
        subscription_start_date: string | null
        created_at: string
        updated_at: string
      }>
      elearning_topographic_views: TableDefinition<{
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
      }>
      elearning_formations: TableDefinition<{
        id: string
        title: string
        description: string | null
        is_private: boolean | null
        photo_url: string | null
        created_by: string | null
        created_at: string
        updated_at: string
        is_free_access: boolean | null
      }>
      elearning_chapters: TableDefinition<{
        id: string
        formation_id: string
        title: string
        order_index: number
        created_at: string
        updated_at: string
      }>
      elearning_subparts: TableDefinition<{
        id: string
        chapter_id: string
        title: string
        vimeo_url: string | null
        description_html: string | null
        order_index: number
        created_at: string
        updated_at: string
      }>
      elearning_subpart_progress: TableDefinition<{
        id: string
        subpart_id: string
        user_id: string
        completed: boolean
        completed_at: string | null
        created_at: string
        updated_at: string
      }>
      user_sessions: TableDefinition<{
        id: string
        user_id: string | null
        tree_id: string | null
        responses: any
        diagnosis: string | null
        completed: boolean | null
        created_at: string
        updated_at: string
      }>
      // Tables personnalisées pour les séminaires (à créer dans Supabase)
      seminars?: TableDefinition<{
        id: string
        title: string
        date: string
        start_date: string | null
        end_date: string | null
        location: string
        theme: string | null
        facilitator: string | null
        capacity: number | null
        created_by: string | null
        image_url: string | null
        created_at: string
      }>
      seminar_registrations?: TableDefinition<{
        id: string
        user_id: string
        seminar_id: string
        registered_at: string
        created_at: string
        profiles?: {
          full_name: string | null
          email: string | null
        }
      }>
    }
  }
}