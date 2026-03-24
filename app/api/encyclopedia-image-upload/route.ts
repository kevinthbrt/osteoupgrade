import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const entryId = formData.get('entryId') as string | null

  if (!file) {
    return NextResponse.json(
      { error: 'Missing file' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const objectName = `encyclopedia/${entryId || 'new'}-${Date.now()}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public',
  })

  return NextResponse.json({ url: blob.url })
}
