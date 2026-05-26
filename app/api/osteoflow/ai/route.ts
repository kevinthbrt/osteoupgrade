import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
Tu reçois la transcription brute d'une anamnèse et tu dois la structurer.

RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact :
{
  "reason": "motif principal en 1 ligne courte",
  "anamnesis": "anamnèse structurée en markdown"
}

Pour "anamnesis", utilise ce format :

**Histoire de la maladie :** [chronologie, circonstances, évolution]

**Caractéristiques :** [localisation] — [type] — EVA x/10 — [irradiations]

**Facteurs modulants :** aggravants : [...] / soulageants : [...]

**Antécédents mentionnés :** [...]

**Traitements essayés :** [...]

**Impact fonctionnel :** [...]

**Drapeaux rouges :** [aucun identifié — ou liste]

Règles : style médical concis, "—" si non mentionné, ne jamais inventer, corriger les erreurs de transcription, répondre en français.`

const DETECTION_SYSTEM_PROMPT = `Tu es un assistant médical ostéopathique. Analyse le texte d'une dictée clinique et détecte si le patient mentionne des informations à mettre à jour dans son dossier.

Retourne UNIQUEMENT un objet JSON valide (sans texte autour, sans markdown) avec les champs détectés parmi :
- "profession" : la profession ou le métier du patient si mentionné ou changé
- "sport_activity" : l'activité sportive pratiquée si mentionnée
- "primary_physician" : le nom du médecin traitant si mentionné
- "pregnancy_due_date" : la date de terme d'une grossesse au format YYYY-MM-DD
- "surgical_history" : UNIQUEMENT la nouvelle procédure chirurgicale mentionnée (ex: "appendicectomie 2018")
- "trauma_history" : UNIQUEMENT le nouveau traumatisme mentionné (ex: "fracture poignet gauche 2015")
- "medical_history" : une pathologie, maladie, ou traitement médicamenteux en cours mentionné (ex: "diabète type 2", "Lexomil 1mg/j depuis 6 mois")
- "family_history" : UNIQUEMENT le nouvel antécédent familial mentionné (ex: "père — cancer colorectal")

Règles strictes :
- N'inclure un champ QUE s'il est explicitement mentionné dans le texte
- Ne pas inclure un champ dont la valeur est déjà connue (identique au contexte actuel)
- Pour les antécédents (surgical/trauma/medical/family), retourner UNIQUEMENT la nouvelle information mentionnée, pas tout l'historique existant — c'est l'app qui fait l'agrégation
- Si aucun champ n'est détecté, retourner {}
- Ne jamais inventer d'informations non mentionnées
- Pour pregnancy_due_date, approximer au 1er du mois si seul le mois est précisé`

interface PatientContext {
  profession?: string | null
  sport_activity?: string | null
  primary_physician?: string | null
  pregnancy_due_date?: string | null
  surgical_history?: string | null
  trauma_history?: string | null
  medical_history?: string | null
  family_history?: string | null
}

interface PatientFields {
  profession?: string
  sport_activity?: string
  primary_physician?: string
  pregnancy_due_date?: string
  surgical_history?: string
  trauma_history?: string
  medical_history?: string
  family_history?: string
}

function buildDetectionUserMessage(transcript: string, ctx: PatientContext): string {
  const lines: string[] = [
    'Contexte actuel du patient :',
    `- Profession : ${ctx.profession ?? 'inconnue'}`,
    `- Sport : ${ctx.sport_activity ?? 'inconnu'}`,
    `- Médecin traitant : ${ctx.primary_physician ?? 'inconnu'}`,
  ]
  if (ctx.pregnancy_due_date) lines.push(`- Grossesse en cours, terme : ${ctx.pregnancy_due_date}`)
  if (ctx.surgical_history) lines.push(`- Antécédents chirurgicaux connus : ${ctx.surgical_history}`)
  if (ctx.trauma_history) lines.push(`- Antécédents traumatiques connus : ${ctx.trauma_history}`)
  if (ctx.medical_history) lines.push(`- Antécédents médicaux connus : ${ctx.medical_history}`)
  if (ctx.family_history) lines.push(`- Antécédents familiaux connus : ${ctx.family_history}`)
  lines.push('', `Texte de la dictée :\n${transcript}`)
  return lines.join('\n')
}

async function runDetection(
  apiKey: string,
  transcript: string,
  patientContext: PatientContext,
): Promise<PatientFields | null> {
  const userMessage = buildDetectionUserMessage(transcript, patientContext)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: DETECTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`Anthropic detection error ${res.status}`)

  const data = await res.json()
  const text = (data.content?.[0]?.text ?? '').trim()
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const fields: PatientFields = JSON.parse(json)

  if (Object.keys(fields).length === 0) return null
  return fields
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { transcript, patientContext } = body as { transcript: string; patientContext?: PatientContext }

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcription vide' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const structureCall = fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Transcription :\n\n${transcript}` }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    const detectionCall = patientContext
      ? runDetection(apiKey, transcript, patientContext)
      : Promise.resolve(null)

    const [structureRes, detectionResult] = await Promise.allSettled([structureCall, detectionCall])

    if (structureRes.status === 'rejected') {
      console.error('[AI proxy] structure call failed', structureRes.reason)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const res = structureRes.value
    if (!res.ok) {
      const err = await res.text()
      console.error('[AI proxy]', res.status, err)
      return NextResponse.json({ error: `Erreur Anthropic (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = data.content?.[0]?.text ?? ''

    let parsed: { reason: string; anamnesis: string }
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      parsed = { reason: '', anamnesis: content }
    }

    let patient_fields: PatientFields | null = null
    let detection_skipped = false

    if (!patientContext) {
      detection_skipped = true
    } else if (detectionResult.status === 'rejected') {
      console.error('[AI proxy] detection call failed', detectionResult.reason)
      detection_skipped = true
    } else {
      patient_fields = detectionResult.value
    }

    return NextResponse.json({ ...parsed, patient_fields, detection_skipped })
  } catch (err) {
    console.error('[AI proxy]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
