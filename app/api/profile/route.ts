import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  })
}
