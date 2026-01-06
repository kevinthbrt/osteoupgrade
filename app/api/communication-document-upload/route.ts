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
        error: 'Accès refusé. Seuls les administrateurs peuvent uploader des documents.'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifier que c'est un fichier Word ou PDF
    const allowedExtensions = ['doc', 'docx', 'pdf']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé. Seuls les fichiers Word (.doc, .docx) et PDF sont acceptés.'
      }, { status: 400 })
    }

    // Vérifier que la variable d'environnement Vercel Blob est configurée
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured')
      return NextResponse.json({
        error: 'Configuration serveur manquante. Contactez l\'administrateur.'
      }, { status: 500 })
    }

    const objectName = `communication/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Tenter l'upload avec gestion d'erreur
    const blob = await put(objectName, file, {
      access: 'public'
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size
    })
  } catch (error: any) {
    console.error('Error uploading file to Vercel Blob:', error)

    // Déterminer le type d'erreur
    if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
      return NextResponse.json({
        error: 'Erreur d\'authentification Vercel Blob. Vérifiez la configuration BLOB_READ_WRITE_TOKEN.'
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'Erreur lors de l\'upload du fichier. Réessayez ou contactez le support.'
    }, { status: 500 })
  }
}
