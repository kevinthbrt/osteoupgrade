import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyAdmin, validateImageUpload, safeImageExt } from '@/lib/api-guards'

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const formData = await request.formData() as unknown as FormData
  const file = formData.get('file') as File | null
  const entryId = formData.get('entryId') as string | null

  if (!file) {
    return NextResponse.json(
      { error: 'Missing file' },
      { status: 400 }
    )
  }

  const validationError = validateImageUpload(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const ext = safeImageExt(file)
  const objectName = `encyclopedia/${entryId || 'new'}-${Date.now()}.${ext}`

  const blob = await put(objectName, file, {
    access: 'public',
  })

  return NextResponse.json({ url: blob.url })
}
