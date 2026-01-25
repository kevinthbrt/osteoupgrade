import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profileError) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
        profile: adminProfile,
      })
    }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    session: session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }
      : null,
  })
}
