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
      anatomical_zones: TableDefinition<{
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
        is_symmetric: boolean | null
        model_path: string | null
        is_active: boolean | null
        display_order: number | null
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      consultation_sessions_legacy: TableDefinition<{
        id: string
        patient_name: string
        patient_age: string | null
        consultation_date: string
        anatomical_region: string
        triage_answers: any
        evaluated_pathologies: any
        test_results: any
        final_diagnosis: string | null
        notes: string | null
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      consultation_sessions_v2: TableDefinition<{
        id: string
        patient_name: string
        patient_age: string | null
        consultation_date: string
        region: string
        topographic_zone_id: string | null
        decision_tree_id: string | null
        decision_path: any
        identified_pathologies: string[] | null
        test_results: any
        cluster_results: any
        notes: string | null
        final_diagnosis: string | null
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      decision_answers: TableDefinition<{
        id: string
        node_id: string
        answer_text: string
        next_node_id: string | null
        display_order: number | null
        created_at: string
        updated_at: string
      }>
      decision_nodes: TableDefinition<{
        id: string
        tree_id: string
        parent_node_id: string | null
        node_type: string
        question_text: string | null
        pathology_ids: string[] | null
        test_ids: string[] | null
        cluster_ids: string[] | null
        notes: string | null
        display_order: number | null
        created_by: string | null
        created_at: string
        updated_at: string
      }>
      decision_trees: TableDefinition<{
        id: string
        topographic_zone_id: string | null
        name: string
        description: string | null
        is_active: boolean | null
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
      }>
      profiles: TableDefinition<{
        id: string
        email: string
        full_name: string | null
        role: 'free' | 'premium_silver' | 'premium_gold' | 'admin'
        subscription_status: string | null
        subscription_end_date: string | null
        subscription_start_date: string | null
        systemio_contact_id: string | null
        systemio_synced_at: string | null
        created_at: string
        updated_at: string
      }>
      test_categories: TableDefinition<{
        id: string
        name: string
        parent_category: string | null
        icon: string | null
        created_at: string
        updated_at: string
      }>
      topographic_zones: TableDefinition<{
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
        location: string
        theme: string | null
        facilitator: string | null
        capacity: number | null
        created_by: string | null
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
      systemio_courses: TableDefinition<{
        id: string
        systemio_course_id: string
        title: string
        description: string | null
        thumbnail_url: string | null
        course_url: string
        is_active: boolean | null
        display_order: number | null
        created_at: string
        updated_at: string
      }>
      user_course_enrollments: TableDefinition<{
        id: string
        user_id: string
        course_id: string
        enrolled_at: string
        last_accessed_at: string | null
        progress: number | null
        completed: boolean | null
        completed_at: string | null
      }>
      systemio_sync_logs: TableDefinition<{
        id: string
        user_id: string | null
        sync_type: string
        status: string
        error_message: string | null
        metadata: any
        created_at: string
      }>
    }
  }
}