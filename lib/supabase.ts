import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Utiliser un seul client pour toute l'application
export const supabase = createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'free' | 'premium' | 'admin'
          subscription_status: string | null
          subscription_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'free' | 'premium' | 'admin'
          subscription_status?: string | null
          subscription_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'free' | 'premium' | 'admin'
          subscription_status?: string | null
          subscription_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      decision_trees: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          is_free: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          is_free?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          is_free?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tree_nodes: {
        Row: {
          id: string
          tree_id: string
          parent_id: string | null
          node_type: 'question' | 'test' | 'diagnosis'
          content: string
          test_id: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tree_id: string
          parent_id?: string | null
          node_type: 'question' | 'test' | 'diagnosis'
          content: string
          test_id?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tree_id?: string
          parent_id?: string | null
          node_type?: 'question' | 'test' | 'diagnosis'
          content?: string
          test_id?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      orthopedic_tests: {
        Row: {
          id: string
          name: string
          description: string
          video_url: string | null
          sensitivity: number | null
          specificity: number | null
          rv_positive: number | null
          rv_negative: number | null
          interest: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          video_url?: string | null
          sensitivity?: number | null
          specificity?: number | null
          rv_positive?: number | null
          rv_negative?: number | null
          interest?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          video_url?: string | null
          sensitivity?: number | null
          specificity?: number | null
          rv_positive?: number | null
          rv_negative?: number | null
          interest?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          tree_id: string
          responses: any
          diagnosis: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tree_id: string
          responses?: any
          diagnosis?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tree_id?: string
          responses?: any
          diagnosis?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}