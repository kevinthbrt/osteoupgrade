import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { INBOX_BUCKET, MAX_ATTACHMENT_BYTES, safeStorageName } from '@/lib/inbox'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/inbox/attachments  { filename, size }
 *
 * Prépare le dépôt d'une pièce jointe : renvoie un lien d'envoi signé vers le
 * bucket privé. Le navigateur y dépose le fichier directement, sans passer
 * par cette route (limite de taille des requêtes sur Vercel).
 */
export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const filename = typeof body.filename === 'string' ? body.filename.trim() : ''
  const size = Number(body.size) || 0

  if (!filename) return NextResponse.json({ error: 'Nom de fichier requis' }, { status: 400 })
  if (size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: `« ${filename} » dépasse 25 Mo` }, { status: 400 })
  }

  const path = `${randomUUID()}/${safeStorageName(filename)}`
  const { data, error } = await supabaseAdmin.storage.from(INBOX_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Dépôt impossible' }, { status: 500 })

  return NextResponse.json({ path: data.path, token: data.token })
}

/** GET /api/admin/inbox/attachments?path=… : lien de lecture temporaire d'une pièce jointe envoyée. */
export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const path = new URL(request.url).searchParams.get('path') || ''
  if (!/^[0-9a-f-]{36}\/[^/]{1,200}$/.test(path)) return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 })

  const { data, error } = await supabaseAdmin.storage.from(INBOX_BUCKET).createSignedUrl(path, 600)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Pièce jointe introuvable' }, { status: 404 })
  return NextResponse.json({ url: data.signedUrl })
}
