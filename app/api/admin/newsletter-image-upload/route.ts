import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyAdmin, validateImageUpload, safeImageExt } from '@/lib/api-guards'

/**
 * Envoi d'une illustration de newsletter vers Vercel Blob.
 *
 * Une image de newsletter ne peut pas être une pièce jointe `cid:` : les
 * campagnes Resend n'en acceptent pas, et une image en base64 fait grossir le
 * message au point de le faire tronquer par Gmail. Elle est donc déposée sur
 * une URL publique, comme les images de funnel.
 */
export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const formData = (await request.formData()) as unknown as FormData
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  const validationError = validateImageUpload(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const ext = safeImageExt(file)
  const objectName = `newsletters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(objectName, file, { access: 'public' })

  return NextResponse.json({ url: blob.url, name: file.name })
}
