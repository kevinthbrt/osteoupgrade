import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { formation_id } = await request.json()
  if (!formation_id) return NextResponse.json({ error: 'Missing formation_id' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('course_certificates')
    .select('certificate_number, issued_at')
    .eq('user_id', user.id)
    .eq('formation_id', formation_id)
    .single()

  if (existing) return NextResponse.json({ certificate_number: existing.certificate_number, already_existed: true })

  const { data: formation } = await supabaseAdmin
    .from('elearning_formations').select('id').eq('id', formation_id).single()
  if (!formation) return NextResponse.json({ error: 'Formation not found' }, { status: 404 })

  const { data: chapters } = await supabaseAdmin
    .from('elearning_chapters').select('id').eq('formation_id', formation_id)
  const chapterIds = (chapters || []).map((c: { id: string }) => c.id)

  const { data: subparts } = chapterIds.length
    ? await supabaseAdmin.from('elearning_subparts').select('id').in('chapter_id', chapterIds)
    : { data: [] as { id: string }[] }
  const subpartIds = (subparts || []).map((s: { id: string }) => s.id)

  if (subpartIds.length === 0) {
    return NextResponse.json({ error: 'Formation vide' }, { status: 400 })
  }

  const { count: completed } = await supabaseAdmin
    .from('elearning_subpart_progress').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).in('subpart_id', subpartIds)

  if ((completed ?? 0) < subpartIds.length) {
    return NextResponse.json({ error: 'Not fully completed', completed, total: subpartIds.length }, { status: 400 })
  }

  const { data: certNumber } = await supabaseAdmin.rpc('next_course_certificate_number')

  await supabaseAdmin.from('course_certificates').insert({
    user_id: user.id, formation_id, certificate_number: certNumber as string,
  })

  return NextResponse.json({ certificate_number: certNumber, already_existed: false })
}
