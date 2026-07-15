export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import path from 'path'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resvg } from '@resvg/resvg-js'
import React from 'react'
import CourseCertificate from '@/components/certificates/CourseCertificate'

async function svgToPngDataUri(svgPath: string, size = 640): Promise<string> {
  const svgString = fs.readFileSync(svgPath, 'utf-8')
  const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  return `data:image/png;base64,${png.toString('base64')}`
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formationId = request.nextUrl.searchParams.get('formation_id')
  if (!formationId) return NextResponse.json({ error: 'Missing formation_id' }, { status: 400 })

  const { data: cert } = await supabaseAdmin
    .from('course_certificates')
    .select('certificate_number, issued_at')
    .eq('user_id', user.id).eq('formation_id', formationId).single()

  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: formation } = await supabaseAdmin
    .from('elearning_formations')
    .select('title, subject:course_subjects(name)')
    .eq('id', formationId).single()

  const { data: chapters } = await supabaseAdmin
    .from('elearning_chapters').select('id').eq('formation_id', formationId)
  const chapterIds = (chapters || []).map((c: { id: string }) => c.id)

  const { count: totalSubparts } = chapterIds.length
    ? await supabaseAdmin
        .from('elearning_subparts').select('*', { count: 'exact', head: true })
        .in('chapter_id', chapterIds)
    : { count: 0 }

  const rawSubject = formation?.subject as { name: string } | { name: string }[] | null | undefined
  const subject = Array.isArray(rawSubject) ? rawSubject[0] : rawSubject

  const logoSrc = await svgToPngDataUri(path.join(process.cwd(), 'public', 'logo.svg'), 640)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CourseCertificate, {
    recipientName: (profile as any)?.full_name || user.email || 'Praticien',
    formationTitle: formation?.title || 'Formation',
    subjectLabel: subject?.name,
    totalChapters: chapterIds.length,
    totalSubparts: totalSubparts || 0,
    certificateNumber: cert.certificate_number,
    issuedAt: cert.issued_at,
    logoSrc,
  }) as any

  const pdfBuffer = await renderToBuffer(element)

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="attestation-${cert.certificate_number}.pdf"`,
    },
  })
}
