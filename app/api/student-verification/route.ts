import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  STUDENT_BUCKET,
  studentVerificationFor,
  canUseStudentDiscount,
  deleteStudentDocument,
} from '@/lib/student-offer'
import { notifyAdmin } from '@/lib/admin-notify'

export const dynamic = 'force-dynamic'

const TYPES_ACCEPTES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const TAILLE_MAX = 10 * 1024 * 1024

async function utilisateur() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/student-verification : état de la demande étudiant du compte.
export async function GET() {
  const user = await utilisateur()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const v = await studentVerificationFor(user.id)
  return NextResponse.json({
    status: v?.status ?? null,
    documentName: v?.document_name ?? null,
    discountUsed: Boolean(v?.discount_applied_at),
    eligible: canUseStudentDiscount(v),
  })
}

// POST /api/student-verification (multipart, champ `file`) : dépôt du
// justificatif. Débloque le tarif étudiant tout de suite ; la vérification
// se fait ensuite, à la main, dans /admin/etudiants.
export async function POST(request: Request) {
  const user = await utilisateur()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existante = await studentVerificationFor(user.id)
  if (existante?.discount_applied_at) {
    return NextResponse.json(
      { error: 'Le tarif étudiant a déjà été utilisé sur ce compte.' },
      { status: 400 }
    )
  }

  const form = await request.formData().catch(() => null)
  const fichier = form?.get('file')
  if (!(fichier instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
  }
  const extension = TYPES_ACCEPTES[fichier.type]
  if (!extension) {
    return NextResponse.json({ error: 'Formats acceptés : PDF, JPG, PNG, WEBP ou HEIC.' }, { status: 400 })
  }
  if (fichier.size > TAILLE_MAX) {
    return NextResponse.json({ error: 'Fichier trop lourd (10 Mo maximum).' }, { status: 400 })
  }

  // Chemin imprévisible : le nom d'origine n'y figure pas.
  const chemin = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: envoi } = await supabaseAdmin.storage
    .from(STUDENT_BUCKET)
    .upload(chemin, Buffer.from(await fichier.arrayBuffer()), { contentType: fichier.type })
  if (envoi) {
    console.error('[student-verification] upload:', envoi.message)
    return NextResponse.json({ error: "Le fichier n'a pas pu être enregistré. Réessayez." }, { status: 500 })
  }

  // Un nouveau justificatif remplace le précédent, et relance la vérification
  // (y compris après un refus, tant que la remise n'a jamais servi).
  await deleteStudentDocument(existante?.document_path ?? null)
  const { error } = await supabaseAdmin.from('student_verifications').upsert(
    {
      user_id: user.id,
      status: 'pending',
      document_path: chemin,
      document_name: fichier.name.slice(0, 200),
      submitted_at: new Date().toISOString(),
      decided_at: null,
      decided_by: null,
      rejection_reason: null,
    },
    { onConflict: 'user_id' }
  )
  if (error) {
    await deleteStudentDocument(chemin)
    return NextResponse.json({ error: "La demande n'a pas pu être enregistrée." }, { status: 500 })
  }

  try {
    await notifyAdmin(
      'other',
      'Justificatif étudiant à vérifier',
      `${user.email} a déposé un justificatif étudiant. À vérifier dans /admin/etudiants.`
    )
  } catch {
    // La notification ne doit pas faire échouer le dépôt.
  }

  return NextResponse.json({ status: 'pending', eligible: true })
}
