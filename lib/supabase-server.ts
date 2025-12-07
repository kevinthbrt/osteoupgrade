import { createClient } from '@supabase/supabase-js'

// Client Supabase côté serveur avec permissions admin
// Utilisé uniquement dans les API routes et webhooks
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
