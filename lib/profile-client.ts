import { supabase } from '@/lib/supabase'

type ProfilePayload = {
  user: { id: string; email: string | null }
  profile: { id: string; email: string | null; full_name: string | null; role: string } | null
  session: { access_token: string; refresh_token: string; expires_at?: number } | null
}

export const fetchProfilePayload = async (): Promise<ProfilePayload | null> => {
  const response = await fetch('/api/profile', { cache: 'no-store' })
  if (response.ok) {
    const payload = await response.json()

    if (payload?.session?.access_token && payload?.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      })
    }

    return payload
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return null
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userData.user.id)
    .maybeSingle()

  return {
    user: { id: userData.user.id, email: userData.user.email ?? null },
    profile,
    session: sessionData.session
      ? {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at,
        }
      : null,
  }
}
