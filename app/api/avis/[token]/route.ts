import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { logCustomerEvent } from '@/lib/customer-events'
import { notifyAdmin } from '@/lib/admin-notify'
import { SURVEY_DEFINITIONS, type SurveyKind } from '@/lib/customer-tracking'

export const dynamic = 'force-dynamic'

/**
 * POST /api/avis/[token]
 *
 * Enregistre la réponse à une enquête. Route publique : le jeton tient lieu
 * d'authentification, et c'est délibéré. Exiger une connexion pour répondre
 * à « pourquoi êtes-vous parti ? » écarterait exactement les personnes que
 * l'on interroge.
 *
 * Le jeton ne donne accès à rien d'autre : il ne permet ni de lire la fiche,
 * ni de relire une réponse déjà envoyée.
 */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  const body = await request.json().catch(() => ({}))
  const { rating, choice, answer } = body

  const { data: survey } = await supabaseAdmin
    .from('customer_surveys')
    .select('id, user_id, email, kind, responded_at, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  if (!survey) return NextResponse.json({ error: 'Lien inconnu' }, { status: 404 })
  if (survey.responded_at) return NextResponse.json({ error: 'Réponse déjà enregistrée' }, { status: 409 })
  if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Lien expiré' }, { status: 410 })
  }

  const def = SURVEY_DEFINITIONS[survey.kind as SurveyKind]

  const note = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null
  const motif = typeof choice === 'string' && def?.choices.includes(choice) ? choice : null
  const texte = typeof answer === 'string' ? answer.trim().slice(0, 4000) : ''

  if (!note && !motif && !texte) {
    return NextResponse.json({ error: 'Réponse vide' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('customer_surveys')
    .update({ rating: note, choice: motif, answer: texte || null, responded_at: new Date().toISOString() })
    .eq('id', survey.id)
    .is('responded_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logCustomerEvent({
    userId: survey.user_id,
    email: survey.email,
    type: 'survey_answered',
    source: 'app',
    reason: motif,
    comment: texte || null,
    metadata: { kind: survey.kind, rating: note, survey_id: survey.id },
  })

  // 🔔 Prévenir l'administrateur, sur la cloche déjà en place. Une réponse qui
  // n'arrive nulle part défait l'intérêt d'avoir posé la question : personne
  // ne consulte un onglet « Réponses » au hasard, et un client qui vient
  // d'expliquer son départ est précisément celui qu'on peut encore rappeler.
  //
  // Le corps porte la réponse elle-même, pas seulement son existence : c'est
  // la différence entre lire un motif dans la notification et devoir ouvrir
  // l'application pour savoir s'il valait la peine d'être lu.
  const resume = [
    motif,
    note ? `note ${note}/5` : null,
    texte ? `« ${texte.length > 160 ? `${texte.slice(0, 160)}...` : texte} »` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  await notifyAdmin(
    'other',
    `Réponse reçue : ${def?.label || 'enquête'}`,
    `${survey.email}${resume ? ` : ${resume}` : ' a répondu.'}`
  )

  return NextResponse.json({ success: true })
}
