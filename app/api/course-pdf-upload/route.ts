import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const MAX_SIZE = 20 * 1024 * 1024 // 20 Mo

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
        error: 'Accès refusé. Seuls les administrateurs peuvent uploader des documents.'
      }, { status: 403 })
    }

    const formData = await request.formData() as unknown as FormData
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifier que c'est bien un PDF (extension ou type MIME)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const isPdf = ext === 'pdf' || file.type === 'application/pdf'

    if (!isPdf) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé. Seuls les fichiers PDF sont acceptés.'
      }, { status: 400 })
    }

    // Vérifier la taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: 'Le fichier est trop volumineux (maximum 20 Mo).'
      }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured')
      return NextResponse.json({
        error: 'Configuration serveur manquante. Contactez l\'administrateur.'
      }, { status: 500 })
    }

    const objectName = `course-pdfs/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`

    const blob = await put(objectName, file, {
      access: 'public',
      contentType: 'application/pdf'
    })

    return NextResponse.json({ url: blob.url, name: file.name })
  } catch (error: any) {
    console.error('Error uploading PDF to Vercel Blob:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'upload du PDF. Réessayez ou contactez le support.'
    }, { status: 500 })
  }
}
