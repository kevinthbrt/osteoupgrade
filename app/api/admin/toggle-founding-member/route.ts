import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_founding_member, email, full_name')
    .eq('id', userId)
    .single()

  const wasFoundingMember = targetProfile?.is_founding_member === true

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_founding_member })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 🌟 DÉCLENCHER L'AUTOMATISATION "Bienvenue Membre Fondateur" (uniquement au passage false -> true)
  if (is_founding_member && !wasFoundingMember && targetProfile?.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify({
          event: 'Statut Fondateur activé',
          contact_email: targetProfile.email,
          metadata: {
            full_name: targetProfile.full_name || targetProfile.email
          }
        })
      })
    } catch (err) {
      console.error('Error triggering founding member welcome automation')
    }
  }

  return NextResponse.json({ success: true })
}
