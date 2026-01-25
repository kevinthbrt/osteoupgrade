import { supabase } from '@/lib/supabase'

type ProfilePayload = {
  user: { id: string; email: string | null }
  profile: { id: string; email: string | null; full_name: string | null; role: string } | null
  session: { access_token: string; refresh_token: string; expires_at?: number } | null
}

export const fetchProfilePayload = async (): Promise<ProfilePayload | null> => {
  const response = await fetch('/api/profile', { cache: 'no-store' })
  if (!response.ok) {
    return null
  }

  const payload = await response.json()

  if (payload?.session?.access_token && payload?.session?.refresh_token) {
    await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    })
  }

  return payload
}
