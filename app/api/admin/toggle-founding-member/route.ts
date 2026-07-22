import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, is_founding_member } = await request.json()
  if (!userId || typeof is_founding_member !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data: updatedProfile, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_founding_member })
    .eq('id', userId)
    .select('email, full_name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 🌟 Confirmer par email uniquement à l'attribution du statut (pas au retrait)
  if (is_founding_member && updatedProfile?.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify({
          event: 'Membre fondateur activé',
          contact_email: updatedProfile.email,
          full_name: updatedProfile.full_name,
          metadata: {}
        })
      })
    } catch (err) {
      console.error('Error sending founding member confirmation email')
    }
  }

  return NextResponse.json({ success: true })
}
