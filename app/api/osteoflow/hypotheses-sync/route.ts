import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Sync éphémère ordinateur <-> téléphone pour les hypothèses cliniques.
// Accès par JETON uniquement (le téléphone ne peut pas porter de secret). Seules
// des données NON identifiantes transitent (hypothèses/tests/questions/réponses).

const MIN_TOKEN_LEN = 16
const MAX_BYTES = 64 * 1024

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (token.length < MIN_TOKEN_LEN) {
    return NextResponse.json({ error: 'Jeton invalide' }, { status: 400 })
  }
  const db = supa()
  if (!db) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })

  const { data, error } = await db
    .from('hypotheses_sync')
    .select('payload, state, updated_at')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    console.error('[hypo-sync GET]', error.message)
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
  }
  return NextResponse.json(data ?? { payload: null, state: null, updated_at: null })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as
    | { token?: string; payload?: unknown; state?: unknown }
    | null
  const token = body?.token
  if (!body || typeof token !== 'string' || token.length < MIN_TOKEN_LEN) {
    return NextResponse.json({ error: 'Jeton invalide' }, { status: 400 })
  }
  if (JSON.stringify({ p: body.payload ?? null, s: body.state ?? null }).length > MAX_BYTES) {
    return NextResponse.json({ error: 'Données trop volumineuses' }, { status: 413 })
  }

  const db = supa()
  if (!db) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })

  // Upsert : on ne touche que les colonnes fournies (payload posé par l'ordi,
  // state mis à jour par l'un ou l'autre).
  const row: Record<string, unknown> = { token, updated_at: new Date().toISOString() }
  if (body.payload !== undefined) row.payload = body.payload
  if (body.state !== undefined) row.state = body.state

  const { error } = await db.from('hypotheses_sync').upsert(row, { onConflict: 'token' })
  if (error) {
    console.error('[hypo-sync POST]', error.message)
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
  }

  // Purge opportuniste des sessions de plus de 24 h.
  await db
    .from('hypotheses_sync')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())

  return NextResponse.json({ ok: true })
}
