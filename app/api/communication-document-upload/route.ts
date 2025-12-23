import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
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

  const objectName = `communication/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public'
  })

  return NextResponse.json({
    url: blob.url,
    fileName: file.name,
    fileSize: file.size
  })
}
