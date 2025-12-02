import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const viewId = formData.get('viewId') as string | null

  if (!file || !viewId) {
    return NextResponse.json({ error: 'Missing file or viewId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const objectName = `topographic-views/${viewId}-${Date.now()}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public'
  })

  return NextResponse.json({ url: blob.url })
}
