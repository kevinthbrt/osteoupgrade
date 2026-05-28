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

interface Patient {
  first_name: string
  last_name: string
  gender: string
  date_of_birth?: string
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

function getAge(dateOfBirth?: string): string {
  if (!dateOfBirth) return ''
  const birth = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  return `${age} ans`
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
  referral: `Tu rédiges un courrier d'adressage médical en français, style professionnel et concis.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "Corps complet du courrier (salutation, contenu, formule de politesse, signature)"}

Structure du corps :
1. "Cher Confrère," (ou "Chers Confrères," si destinataire inconnu)
2. Présentation du patient (titre, nom, âge si disponible)
3. Motif de l'adressage et résumé clinique pertinent
4. Demande explicite (avis, prise en charge, imagerie...)
5. "En vous remerciant de l'attention portée à ce courrier, je vous adresse, Cher Confrère, mes cordiales salutations."
6. Signature : nom du praticien + "Ostéopathe D.O."

150-250 mots. Ne jamais inventer d'informations absentes. Adapter si champs manquants.`,

  compte_rendu: `Tu rédiges un compte-rendu de consultation ostéopathique structuré en français.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "Corps complet du CR avec sections"}

Structure :
OBJET : Compte-rendu de consultation ostéopathique

**Patient :** [prénom nom, âge si disponible, date de consultation]

**Motif :** [motif principal]

**Anamnèse :**
[résumé structuré]

**Examen clinique :**
[éléments clés]

**Traitement effectué :**
[zones et techniques si mentionnées, sinon "Traitement ostéopathique adapté"]

**Conseils donnés :**
[conseils post-séance]

**Suivi préconisé :**
[recommandations]

200-350 mots. Factuel, ne pas inventer.`,

  certificat_suivi: `Tu rédiges une attestation de suivi ostéopathique formelle en français.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "Corps de l'attestation"}

Structure :
ATTESTATION DE SUIVI OSTÉOPATHIQUE

Je soussigné(e), [prénom nom], Ostéopathe D.O., certifie avoir pris en charge en consultation ostéopathique :

[titre. Prénom NOM], né(e) le [date si disponible] / [âge si disponible],

[formulation du suivi : date(s) de consultation si disponible]

La présente attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.

Date + lieu + signature.

Ton formel et neutre.`,

  recommandation_repos: `Tu rédiges une recommandation de repos sportif en français.

Retourne UNIQUEMENT un objet JSON valide :
{"body": "Corps de la recommandation"}

Structure :
RECOMMANDATION DE REPOS SPORTIF

Je soussigné(e), [prénom nom], Ostéopathe D.O., recommande à :

[titre. Prénom NOM][, âge si disponible],

[motif médical concis basé sur l'anamnèse ou l'examen]

Une limitation / un arrêt temporaire de l'activité physique pour une durée de [adapter selon contexte ou "à réévaluer selon l'évolution"].

[Conseils pratiques si pertinents.]

Ton médical, bienveillant, non alarmiste.`,
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

    const patientTitle = patient.gender === 'M' ? 'M.' : 'Mme'
    const patientAge = getAge(patient.date_of_birth)
    const consultationDate = formatDate(consultation?.date)

    const lines: string[] = [
      `Praticien : ${practitioner.first_name} ${practitioner.last_name}, Ostéopathe D.O.${
        practitioner.rpps ? ` — RPPS ${practitioner.rpps}` : ''
      }`,
      `Patient : ${patientTitle} ${patient.first_name} ${patient.last_name.toUpperCase()}${
        patientAge ? ` (${patientAge})` : ''
      }`,
    ]
    if (consultationDate) lines.push(`Date de consultation : ${consultationDate}`)
    if (consultation?.reason) lines.push(`Motif : ${consultation.reason}`)
    if (consultation?.anamnesis) lines.push(`\nAnamnèse :\n${consultation.anamnesis}`)
    if (consultation?.examination) lines.push(`\nExamen clinique :\n${consultation.examination}`)
    if (consultation?.advice) lines.push(`\nConseils donnés :\n${consultation.advice}`)
    if (recipient_name || recipient_title) {
      lines.push(`\nDestinataire : ${[recipient_title, recipient_name].filter(Boolean).join(' ')}`)
    }
    if (custom_instructions) lines.push(`\nInstructions : ${custom_instructions}`)

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
