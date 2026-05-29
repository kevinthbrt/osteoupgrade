import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'bin'
    const blob = await put(`support/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`, file, { access: 'public' })

    return NextResponse.json({ url: blob.url, name: file.name, size: file.size })
  } catch (err) {
    console.error('Support upload error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
