import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyAdmin, validateImageUpload, safeImageExt } from '@/lib/api-guards'

/**
 * Envoi d'une image de page funnel vers Vercel Blob.
 *
 * Même schéma que les autres envois du projet (`course-image-upload`) : réservé
 * aux admins, type et taille vérifiés par `validateImageUpload`, et extension
 * reprise d'une liste blanche plutôt que du nom de fichier — le SVG en est
 * volontairement exclu, une image servie sur une URL publique pouvant y
 * embarquer du script.
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
  const objectName = `funnels/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(objectName, file, { access: 'public' })

  return NextResponse.json({ url: blob.url })
}
