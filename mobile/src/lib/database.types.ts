/**
 * Représentation minimaliste du schéma Supabase, alignée sur l'app web
 * (cf. lib/supabase.ts du projet Next.js). On ne déclare ici que les tables
 * utilisées par l'app mobile, à compléter au fil des écrans.
 */

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<{
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
      elearning_formations: TableDefinition<{
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
      elearning_chapters: TableDefinition<{
        id: string;
        formation_id: string;
        title: string;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      elearning_subparts: TableDefinition<{
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
      elearning_subpart_progress: TableDefinition<{
        id: string;
        subpart_id: string;
        user_id: string;
        completed: boolean;
        completed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      practice_videos: TableDefinition<{
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
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
