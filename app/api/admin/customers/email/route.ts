import { NextResponse } from 'next/server'
import { randomBytes, randomUUID } from 'crypto'
import { currentAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { logCustomerEvent } from '@/lib/customer-events'
import { planLabel, planOf } from '@/lib/entitlements'
import {
  EMAIL_CATEGORIES,
  SURVEY_DEFINITIONS,
  SURVEY_KINDS,
  buildSurveyEmail,
  emailShell,
  escapeHtml,
  fusionner,
  paragraphes,
  type EmailCategory,
  type SurveyKind,
} from '@/lib/customer-tracking'

// Un envoi groupé passe par un appel Resend par destinataire (chacun a son
// lien d'enquête et son pied de désinscription). Cent destinataires à ~4
// req/s tiennent largement dans cette limite.
export const maxDuration = 280
export const dynamic = 'force-dynamic'

/** Jeton d'enquête : imprévisible, c'est le seul secret qui protège la page. */
function creerToken(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * POST /api/admin/customers/email
 *
 * Envoie un email depuis la fiche client, à un compte ou à une sélection.
 * Deux modes :
 *   * `message` : un email rédigé à la main (relance, offre, prise en main) ;
 *   * `enquete` : une question unique, avec un lien de réponse personnel qui
 *     n'exige aucune connexion.
 *
 * Chaque envoi laisse une ligne dans `customer_emails` (suivi de l'ouverture
 * et des clics par le webhook Resend) et un événement dans la chronologie.
 * C'est ce qui permet de savoir, trois semaines plus tard, qui a déjà été
 * relancé et qui n'a jamais ouvert.
 */
export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const {
    userIds,
    mode = 'message',
    subject,
    message,
    category = 'relance',
    surveyKind,
    question,
    ctaLabel,
    ctaUrl,
  } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire sélectionné.' }, { status: 400 })
  }
  if (userIds.length > 200) {
    return NextResponse.json({ error: 'Sélection trop large (200 destinataires au plus).' }, { status: 400 })
  }
  if (mode !== 'message' && mode !== 'enquete') {
    return NextResponse.json({ error: 'Mode inconnu.' }, { status: 400 })
  }
  if (mode === 'message' && (!subject?.trim() || !message?.trim())) {
    return NextResponse.json({ error: 'Sujet et message sont requis.' }, { status: 400 })
  }
  if (mode === 'enquete' && !SURVEY_KINDS.includes(surveyKind as SurveyKind)) {
    return NextResponse.json({ error: "Type d'enquête inconnu." }, { status: 400 })
  }

  const categorie: EmailCategory = EMAIL_CATEGORIES.includes(category as EmailCategory)
    ? (category as EmailCategory)
    : 'autre'

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, plan, role')
    .in('id', userIds)

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })
  if (!profiles?.length) return NextResponse.json({ error: 'Destinataires introuvables.' }, { status: 404 })

  // Un identifiant commun à tout l'envoi : sans lui, impossible de mesurer le
  // taux d'ouverture d'une relance groupée, seulement celui de chaque email.
  const campaignId = randomUUID()

  const resultats: { email: string; ok: boolean; error?: string }[] = []

  for (const profile of profiles) {
    const prenom = profile.full_name?.trim().split(/\s+/)[0] || null
    const offre = planLabel(planOf(profile))

    let sujetFinal = ''
    let htmlFinal = ''
    let surveyId: string | null = null

    try {
      if (mode === 'enquete') {
        const kind = surveyKind as SurveyKind
        const def = SURVEY_DEFINITIONS[kind]
        const token = creerToken()

        const { data: survey, error: surveyError } = await supabaseAdmin
          .from('customer_surveys')
          .insert({
            user_id: profile.id,
            email: profile.email,
            kind,
            token,
            question: (question?.trim() || def.question).slice(0, 500),
            created_by: admin.id,
            metadata: { campaign_id: campaignId },
          })
          .select('id')
          .single()

        if (surveyError) throw new Error(surveyError.message)
        surveyId = survey.id

        const construit = buildSurveyEmail({
          kind,
          token,
          prenom,
          question,
          message: message ? fusionner(message, { prenom, nom: profile.full_name, offre }) : null,
        })
        sujetFinal = subject?.trim() || construit.subject
        htmlFinal = construit.html
      } else {
        const texte = fusionner(message, { prenom, nom: profile.full_name, offre })
        sujetFinal = fusionner(subject, { prenom, nom: profile.full_name, offre }).trim()
        htmlFinal = emailShell({
          emoji: '✉️',
          title: escapeHtml(sujetFinal),
          bodyHtml:
            `<p style="margin: 0 0 16px;">${prenom ? `Bonjour ${escapeHtml(prenom)},` : 'Bonjour,'}</p>` +
            paragraphes(texte),
          cta:
            ctaLabel?.trim() && ctaUrl?.trim()
              ? { label: escapeHtml(ctaLabel.trim()), url: ctaUrl.trim() }
              : undefined,
        })
      }

      const envoi: any = await sendTransactionalEmail({
        to: profile.email,
        subject: sujetFinal,
        html: htmlFinal,
        tags: ['suivi-client', categorie],
      })

      await supabaseAdmin.from('customer_emails').insert({
        user_id: profile.id,
        email: profile.email,
        subject: sujetFinal,
        html: htmlFinal,
        category: mode === 'enquete' ? 'enquete' : categorie,
        campaign_id: campaignId,
        provider_message_id: envoi?.id || null,
        status: 'sent',
        survey_id: surveyId,
        sent_by: admin.id,
      })

      await logCustomerEvent({
        userId: profile.id,
        email: profile.email,
        type: mode === 'enquete' ? 'survey_sent' : 'admin_email',
        source: 'admin',
        metadata: { sujet: sujetFinal, categorie, campaign_id: campaignId },
      })

      resultats.push({ email: profile.email, ok: true })
    } catch (err: any) {
      // L'enquête a été créée AVANT l'appel à Resend, pour que le lien puisse
      // figurer dans l'email. Si l'envoi échoue, la laisser en base ferait
      // compter une enquête envoyée à quelqu'un qui n'a jamais reçu le lien :
      // il apparaîtrait dans « Enquête sans réponse », et son silence
      // gonflerait un taux de non-réponse qui ne mesurerait que notre panne.
      if (surveyId) {
        await supabaseAdmin
          .from('customer_surveys')
          .delete()
          .eq('id', surveyId)
          .is('responded_at', null)
        surveyId = null
      }

      // L'échec est enregistré comme les autres envois : un email refusé par
      // Resend doit rester visible sur la fiche, sinon on croit avoir relancé
      // quelqu'un qui n'a jamais rien reçu.
      await supabaseAdmin.from('customer_emails').insert({
        user_id: profile.id,
        email: profile.email,
        subject: sujetFinal || subject || '(sans sujet)',
        html: htmlFinal || '',
        category: mode === 'enquete' ? 'enquete' : categorie,
        campaign_id: campaignId,
        status: 'failed',
        error: String(err?.message || err).slice(0, 500),
        survey_id: surveyId,
        sent_by: admin.id,
      })

      resultats.push({ email: profile.email, ok: false, error: err?.message || 'Erreur inconnue' })
    }

    if (profiles.length > 1) await new Promise((r) => setTimeout(r, 120))
  }

  const envoyes = resultats.filter((r) => r.ok).length

  return NextResponse.json({
    success: envoyes > 0,
    campaignId,
    envoyes,
    total: resultats.length,
    echecs: resultats.filter((r) => !r.ok),
  })
}
