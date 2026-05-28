import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Practitioner {
  first_name: string
  last_name: string
  profession?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  email?: string
  rpps?: string
}

// Patient pseudonymisé : aucun PII envoyé à l'API Anthropic
interface Patient {
  gender: string    // 'M' | 'F'
  age_range?: string // ex. "40-49 ans"
}

interface ConsultationContext {
  date?: string
  reason: string
  anamnesis?: string
  examination?: string
  advice?: string
}

interface GenerateLetterRequest {
  template_id: string
  practitioner: Practitioner
  patient: Patient
  consultation?: ConsultationContext
  recipient_name?: string
  recipient_title?: string
  custom_instructions?: string
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return '' }
}

function buildHeader(
  practitioner: Practitioner,
  recipientTitle?: string,
  recipientName?: string,
): string {
  const lines: string[] = []
  lines.push(`${practitioner.first_name} ${practitioner.last_name.toUpperCase()}`)
  lines.push('Ostéopathe D.O.')
  if (practitioner.address) lines.push(practitioner.address)
  if (practitioner.postal_code || practitioner.city) {
    lines.push([practitioner.postal_code, practitioner.city].filter(Boolean).join(' '))
  }
  if (practitioner.phone) lines.push(`Tél. : ${practitioner.phone}`)
  if (practitioner.rpps) lines.push(`RPPS : ${practitioner.rpps}`)
  lines.push('')
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  lines.push(`${practitioner.city ?? ''}, le ${today}`.trim().replace(/^, /, ''))
  lines.push('')
  if (recipientTitle || recipientName) {
    lines.push([recipientTitle, recipientName].filter(Boolean).join(' '))
    lines.push('')
  }
  return lines.join('\n')
}

const PROMPTS: Record<string, string> = {
  referral: `Tu rédiges un courrier d'adressage ostéopathique en français. Ton neutre, professionnel et factuel. Pas de formules cérémonieuses.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "corps complet du courrier"}

Structure :
Objet : Adressage ostéopathique

[Identification du patient via [NOM_PATIENT], genre et tranche d'âge si disponibles]
[Résumé clinique synthétique : motif, éléments d'anamnèse et d'examen pertinents]
[Demande explicite : avis, prise en charge, examen complémentaire, autre]
[Clôture : "Je reste disponible pour tout complément d'information."]
[Signature : prénom NOM, Ostéopathe D.O.]

IMPORTANT : utilise exactement le placeholder [NOM_PATIENT] pour désigner le patient.
150-250 mots. Ne jamais inventer d'informations absentes du contexte fourni.`,

  attestation_consultation: `Tu rédiges une attestation de consultation ostéopathique en français. Document strictement factuel, sans aucun contenu médical, diagnostic ou mention clinique.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "corps de l'attestation"}

Structure exacte :
ATTESTATION DE CONSULTATION OSTÉOPATHIQUE

Je soussigné(e), [prénom NOM du praticien], Ostéopathe D.O., atteste avoir reçu en consultation :

[NOM_PATIENT],

le [date de consultation extraite du contexte][ à [heure si disponible, sinon omettre]].

La présente attestation est établie à la demande de l'intéressé(e) pour servir et valoir ce que de droit.

[Ville], le [date du jour]
[Signature praticien]

IMPORTANT : utilise le placeholder [NOM_PATIENT] pour le patient. Aucune mention médicale. Ton formel et neutre.`,
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json() as GenerateLetterRequest
    const {
      template_id, practitioner, patient, consultation,
      recipient_name, recipient_title, custom_instructions,
    } = body

    const systemPrompt = PROMPTS[template_id]
    if (!systemPrompt) {
      return NextResponse.json({ error: 'Template inconnu' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const patientGender = patient.gender === 'M' ? 'homme' : 'femme'
    const consultationDate = formatDate(consultation?.date)

    const lines: string[] = [
      `Praticien : ${practitioner.first_name} ${practitioner.last_name}, Ostéopathe D.O.${
        practitioner.rpps ? ` — RPPS ${practitioner.rpps}` : ''
      }`,
      `Patient : ${patientGender}${patient.age_range ? `, ${patient.age_range}` : ''}`,
    ]
    if (consultationDate) lines.push(`Date de consultation : ${consultationDate}`)
    if (consultation?.reason) lines.push(`Motif : ${consultation.reason}`)
    if (consultation?.anamnesis) lines.push(`\nAnamnèse :\n${consultation.anamnesis}`)
    if (consultation?.examination) lines.push(`\nExamen clinique :\n${consultation.examination}`)
    if (consultation?.advice) lines.push(`\nConseils donnés :\n${consultation.advice}`)
    if (recipient_name || recipient_title) {
      lines.push(`\nDestinataire : ${[recipient_title, recipient_name].filter(Boolean).join(' ')}`)
    }
    if (custom_instructions) lines.push(`\nInstructions complémentaires : ${custom_instructions}`)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: lines.join('\n') }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[generate-letter]', res.status, err)
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = (data.content?.[0]?.text ?? '').trim()

    let parsed: { body: string }
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      parsed = { body: content }
    }

    const header = buildHeader(practitioner, recipient_title, recipient_name)

    return NextResponse.json({ header, body: parsed.body })
  } catch (err) {
    console.error('[generate-letter]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
