import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// Long anamneses (max_tokens 3000 on Sonnet) can take well over the default
// Vercel function ceiling. Without this the function is killed mid-call and the
// caller sees a generic 500 even though the AbortSignals below never fired.
// Hobby caps at 60s; raise once on Pro.
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
Tu reçois la transcription brute d'une anamnèse et tu dois la structurer en cartes.

RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact :
{
  "reason": "motif principal en 1 ligne courte",
  "sections": [
    { "id": "history", "label": "Histoire", "icon": "⚡", "color": "slate", "items": ["..."] },
    { "id": "pain", "label": "Douleur", "icon": "📍", "color": "sky", "items": ["..."] },
    { "id": "modulating", "label": "Modulants", "icon": "↕️", "color": "teal", "items": ["..."] },
    { "id": "history_past", "label": "Antécédents", "icon": "📋", "color": "indigo", "items": ["..."] },
    { "id": "treatment", "label": "Traitements", "icon": "💊", "color": "stone", "items": ["..."] },
    { "id": "functional", "label": "Impact fonctionnel", "icon": "🚶", "color": "slate", "items": ["..."] },
    { "id": "red_flags", "label": "Drapeaux rouges", "icon": "🚩", "color": "green", "items": ["..."], "allClear": true }
  ]
}

Inclus TOUJOURS les 7 sections dans cet ordre, même si certaines sont vides (elles
servent de checklist au praticien). Garde les "id", "label", "icon" et "color"
exactement comme ci-dessus. Chaque "items" est un tableau d'items courts en style
télégraphique (≤ ~12 mots, un item = une information précise).

Contenu attendu par section :
- "history" (Histoire de la maladie) : circonstances d'apparition, chronologie/ancienneté, évolution
- "pain" (Caractéristiques de la douleur) : "Localisation : …", "Type : …", "Intensité : EVA /10 (si chiffrée, sinon —)", "Irradiations : …"
- "modulating" (Facteurs modulants) : aggravants préfixés ⬆️, soulageants préfixés ⬇️
- "history_past" (Antécédents mentionnés)
- "treatment" (Traitements essayés)
- "functional" (Impact fonctionnel)
- "red_flags" (Drapeaux rouges) — voir DÉPISTAGE ACTIF ci-dessous

DÉPISTAGE ACTIF des drapeaux rouges — pour la section "red_flags" UNIQUEMENT, tu dois
raisonner cliniquement et signaler tout élément de la dictée correspondant à un signal
d'alerte, même implicite. Passe en revue systématiquement :
- Douleur nocturne non mécanique / non soulagée par le repos / réveils douloureux
- Amaigrissement inexpliqué, fièvre, sueurs nocturnes, AEG
- ATCD ou suspicion de cancer (douleur récente chez patient avec ATCD néoplasique)
- Déficit neurologique : faiblesse motrice, anesthésie, paresthésies progressives
- Troubles sphinctériens (vésico-anaux), anesthésie en selle → urgence cauda equina
- Traumatisme à haute énergie / suspicion de fracture, ostéoporose, corticothérapie
- Douleur thoracique, dyspnée, palpitations, signes cardiovasculaires
- Céphalée brutale « en coup de tonnerre », troubles visuels, vertiges, dysarthrie
- Signes infectieux, immunodépression, toxicomanie IV
- Âge < 20 ou > 55 ans avec douleur rachidienne d'apparition récente
"allClear": true UNIQUEMENT si le dépistage ne remonte rien (items vide ou []) ; dès
qu'un signe est présent ou douteux, "allClear": false et liste chaque drapeau dans
"items" avec le signe en cause.

Distinction importante pour la valeur de checklist :
- "—" = sujet NON abordé dans la dictée (le praticien voit ce qu'il a oublié de demander)
- Si le sujet a été abordé mais est négatif, l'écrire explicitement (ex: "Irradiations : absentes", "Aggravants : aucun signalé") — JAMAIS "—"

Règles :
- Un item = une information précise, style télégraphique (≤ ~12 mots, pas de phrases). Abréviations cliniques autorisées (ATCD, EVA, Dlr, G/D, RAS)
- Ne jamais inventer de faits non énoncés ; en cas de doute sur un fait, laisser "—" plutôt que déduire
- EXCEPTION drapeaux rouges : tu DOIS au contraire signaler tout signe d'alerte présent dans la dictée même s'il faut le déduire d'un recoupement (ex: douleur nocturne + amaigrissement). Mieux vaut signaler par excès que manquer un drapeau rouge.
- Ne jamais perdre une information : un élément clinique ne rentrant dans aucune rubrique va dans la rubrique la plus proche, jamais omis
- Si un contexte patient est fourni (âge, sexe, profession, ATCD), prends-le en compte — surtout pour le DÉPISTAGE des drapeaux rouges (ex: ATCD néoplasique, âge extrême, grossesse, immunodépression). N'invente rien à partir de ce contexte ; sers-t'en seulement pour pondérer la vigilance.
- Corriger les termes médicaux mal transcrits (erreurs phonétiques) sans altérer le sens ; marquer "[?]" si un terme reste incertain
- Répondre en français`

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
  age?: number | null
  sex?: string | null
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

/** Lignes de contexte patient lisibles, partagées structuration / hypothèses. */
function buildContextLines(c: PatientContext): string[] {
  const lines: string[] = []
  if (c.age != null) lines.push(`- Âge : ${c.age} ans`)
  if (c.sex) lines.push(`- Sexe : ${c.sex}`)
  if (c.profession) lines.push(`- Profession : ${c.profession}`)
  if (c.sport_activity) lines.push(`- Sport : ${c.sport_activity}`)
  if (c.surgical_history) lines.push(`- ATCD chirurgicaux : ${c.surgical_history}`)
  if (c.trauma_history) lines.push(`- ATCD traumatiques : ${c.trauma_history}`)
  if (c.medical_history) lines.push(`- ATCD médicaux : ${c.medical_history}`)
  if (c.family_history) lines.push(`- ATCD familiaux : ${c.family_history}`)
  if (c.pregnancy_due_date) lines.push(`- Grossesse en cours, terme : ${c.pregnancy_due_date}`)
  return lines
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

    const ctxLines = patientContext ? buildContextLines(patientContext) : []
    const structureUserContent = ctxLines.length
      ? `Contexte patient :\n${ctxLines.join('\n')}\n\nTranscription :\n\n${transcript}`
      : `Transcription :\n\n${transcript}`

    const structureCall = fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        // Output now carries both the markdown anamnesis AND the sections array,
        // so a long consultation can overflow 2000 tokens and truncate the JSON
        // (which then falls back to a card-less response). 3000 gives headroom.
        max_tokens: 3000,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: structureUserContent }],
      }),
      // Kept below maxDuration (60s) so a slow Anthropic response aborts cleanly
      // with our own error rather than the function being hard-killed by Vercel.
      signal: AbortSignal.timeout(45000),
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

    if (data.stop_reason === 'max_tokens') {
      console.warn('[AI proxy] structure response hit max_tokens — JSON may be truncated')
    }

    // Cartes (sections) = source unique. "anamnesis" n'est renvoyé qu'en repli
    // (échec de parsing) pour que le client ait au moins le texte brut.
    // NB: pas de prefill assistant — rejeté (400) par les modèles Claude 4.6.
    let parsed: { reason?: string; sections?: unknown[]; anamnesis?: string }
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
