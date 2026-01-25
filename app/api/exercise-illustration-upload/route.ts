import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({
        error: 'Accès refusé. Seuls les administrateurs peuvent uploader des illustrations.'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const exerciseId = formData.get('exerciseId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier (images uniquement)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé. Seules les images sont acceptées.'
      }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const objectName = `exercises/${exerciseId || 'new'}-${Date.now()}.${ext}`

    const blob = await put(objectName, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error('Error uploading exercise illustration:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
