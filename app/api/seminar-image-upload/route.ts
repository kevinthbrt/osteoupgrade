import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const objectName = `seminars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public'
  })

  return NextResponse.json({ url: blob.url })
}
