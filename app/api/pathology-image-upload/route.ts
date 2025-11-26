import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const pathologyId = formData.get('pathologyId') as string | null

  if (!file || !pathologyId) {
    return NextResponse.json(
      { error: 'Missing file or pathologyId' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const objectName = `pathologies/${pathologyId}-${Date.now()}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public', // URL publique directe
  })

  // On renvoie juste l’URL au client
  return NextResponse.json({ url: blob.url })
}
