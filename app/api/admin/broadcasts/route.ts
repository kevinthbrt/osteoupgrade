import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('admin_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ broadcasts: data })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { title, body: msgBody, image_url, video_url, target } = body

  if (!title?.trim() || !msgBody?.trim()) {
    return NextResponse.json({ error: 'title et body requis' }, { status: 400 })
  }
  if (!['osteoflow', 'osteoupgrade', 'both'].includes(target)) {
    return NextResponse.json({ error: 'target invalide' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('admin_broadcasts')
    .insert({
      title: title.trim(),
      body: msgBody.trim(),
      image_url: image_url || null,
      video_url: video_url || null,
      target,
      created_by: user?.email ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ broadcast: data })
}
