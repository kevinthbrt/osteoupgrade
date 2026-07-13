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
        completed_at: string | null;
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
      course_certificates: TableDef<{
        id: string;
        user_id: string;
        formation_id: string;
        certificate_number: string;
        issued_at: string;
      }>;
      flashcard_certificates: TableDef<{
        id: string;
        user_id: string;
        deck_id: string;
        certificate_number: string;
        issued_at: string;
      }>;
      elearning_quizzes: TableDef<{
        id: string;
        subpart_id: string;
        title: string;
        description: string | null;
        passing_score: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      elearning_quiz_questions: TableDef<{
        id: string;
        quiz_id: string;
        question_text: string;
        question_type: string;
        points: number;
        order_index: number;
        explanation: string | null;
        created_at: string;
        updated_at: string;
      }>;
      elearning_quiz_answers: TableDef<{
        id: string;
        question_id: string;
        answer_text: string;
        is_correct: boolean;
        order_index: number;
        created_at: string;
      }>;
      elearning_quiz_attempts: TableDef<{
        id: string;
        quiz_id: string;
        user_id: string;
        score: number;
        total_questions: number | null;
        correct_answers: number | null;
        passed: boolean | null;
        answers_data: unknown | null;
        started_at: string | null;
        completed_at: string | null;
      }>;
      orthopedic_tests: TableDef<{
        id: string;
        name: string;
        description: string | null;
        video_url: string | null;
        sensitivity: number | null;
        specificity: number | null;
        rv_positive: number | null;
        rv_negative: number | null;
        interest: string | null;
        category: string | null;
        indications: string | null;
        sources: string | null;
        is_free_access: boolean | null;
        created_at: string;
        updated_at: string;
      }>;
      orthopedic_test_clusters: TableDef<{
        id: string;
        name: string;
        region: string | null;
        description: string | null;
        indications: string | null;
        interest: string | null;
        sources: string | null;
        sensitivity: number | null;
        specificity: number | null;
        rv_positive: number | null;
        rv_negative: number | null;
        created_at: string;
      }>;
      orthopedic_test_cluster_items: TableDef<{
        id: string;
        cluster_id: string;
        test_id: string;
        order_index: number | null;
        created_at: string;
      }>;
      user_testing_progress: TableDef<{
        id: string;
        user_id: string;
        test_id: string;
        viewed_at: string | null;
        completed: boolean;
      }>;
      user_practice_progress: TableDef<{
        id: string;
        user_id: string;
        practice_video_id: string;
        viewed_at: string | null;
        completed: boolean;
      }>;
      practice_categories: TableDef<{
        id: string;
        name: string;
        slug: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      record_user_login: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      next_course_certificate_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
