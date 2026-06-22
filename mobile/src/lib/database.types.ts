/**
 * Schéma Supabase pour l'app mobile.
 * Format exact attendu par @supabase/supabase-js v2 pour l'inférence de types.
 */

type TableDef<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<{
        id: string;
        email: string;
        full_name: string | null;
        role: 'free' | 'premium' | 'admin';
        subscription_status: string | null;
        subscription_end_date: string | null;
        subscription_start_date: string | null;
        created_at: string;
        updated_at: string;
      }>;
      elearning_formations: TableDef<{
        id: string;
        title: string;
        description: string | null;
        is_private: boolean | null;
        photo_url: string | null;
        created_by: string | null;
        created_at: string;
        updated_at: string;
        is_free_access: boolean | null;
      }>;
      elearning_chapters: TableDef<{
        id: string;
        formation_id: string;
        title: string;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      elearning_subparts: TableDef<{
        id: string;
        chapter_id: string;
        title: string;
        vimeo_url: string | null;
        description_html: string | null;
        pdf_url: string | null;
        pdf_name: string | null;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      elearning_subpart_progress: TableDef<{
        id: string;
        subpart_id: string;
        user_id: string;
        completed: boolean;
        completed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      flashcard_decks: TableDef<{
        id: string;
        title: string;
        description: string | null;
        theme: string | null;
        total_cards: number;
        created_at: string;
      }>;
      flashcards: TableDef<{
        id: string;
        deck_id: string;
        question: string;
        answer: string;
        explanation: string | null;
        module_name: string | null;
        position: number;
        created_at: string;
      }>;
      flashcard_progress: TableDef<{
        id: string;
        user_id: string;
        card_id: string;
        deck_id: string;
        repetition: number;
        ease_factor: number;
        interval_days: number;
        next_review_at: string | null;
        last_rating: number | null;
        reviewed_at: string | null;
        created_at: string;
      }>;
      user_gamification_stats: TableDef<{
        user_id: string;
        level: number;
        total_xp: number;
        current_streak: number;
        best_streak: number;
        last_login_date: string | null;
        total_logins: number;
        total_elearning_completed: number;
        total_practice_viewed: number;
        total_testing_viewed: number;
        week_logins: number;
        week_elearning: number;
        week_practice: number;
        week_testing: number;
        week_reset_date: string | null;
        elearning_progress: number;
        practice_progress: number;
        testing_progress: number;
        created_at: string;
        updated_at: string;
      }>;
      literature_reviews: TableDef<{
        id: string;
        title: string;
        summary: string | null;
        created_at: string;
      }>;
      practice_videos: TableDef<{
        id: string;
        region: string;
        title: string;
        description: string | null;
        vimeo_id: string | null;
        vimeo_url: string | null;
        thumbnail_url: string | null;
        duration_seconds: number | null;
        order_index: number | null;
        is_active: boolean;
        is_free_access: boolean | null;
        created_at: string;
        updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
