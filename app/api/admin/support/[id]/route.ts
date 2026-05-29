import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

async function verifyAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { status } = await req.json()
  const valid = ['pending', 'in_progress', 'resolved']
  if (!valid.includes(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })

  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticket })
}
