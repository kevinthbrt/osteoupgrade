import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// Une phrase à partir de cartes déjà structurées : appel court, sans raisonnement.
export const maxDuration = 60

/**
 * Synthèse d'une anamnèse DÉJÀ structurée en cartes.
 *
 * Sert la reprise des consultations antérieures : leurs cartes sont en base mais
 * ont été produites avant que la structuration ne renvoie une phrase de
 * synthèse. Résumer des faits déjà relevés n'est pas une tâche de raisonnement,
 * un modèle léger suffit et la latence compte davantage que la profondeur.
 */
const MODEL = process.env.SUMMARY_MODEL ?? 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.

Tu reçois les cartes d'anamnèse d'une consultation, déjà structurées et validées
par le praticien. Tu produis UNE phrase de synthèse, destinée à être relue à voix
haute au patient pour qu'il confirme ou corrige lui-même.

RÉPONDS UNIQUEMENT EN JSON valide : { "summary": "..." }

La phrase doit :
- tenir en 25 mots maximum, prononçable d'un trait ;
- enchaîner, dans cet ordre et seulement si l'information est présente : le motif,
  son ancienneté, la circonstance d'apparition, la localisation et le côté,
  l'intensité chiffrée, l'irradiation, puis le statut des drapeaux rouges ;
- rester au style télégraphique, sans verbe conjugué inutile, sans « le patient
  rapporte que », sans reformulation empathique ;
- ne contenir AUCUN fait absent des cartes. Tu résumes, tu ne complètes pas, tu
  ne déduis rien. Un fait qui n'y est pas ne figure pas dans la phrase.
Quand un drapeau rouge est listé, la phrase le nomme.

Exemple de forme attendue : « Lombalgie aiguë mécanique depuis 4 jours, post-port
de charge, lombaire basse gauche, EVA 7/10, irradiation fessière, sans drapeau
rouge. »

Aucun texte avant ou après le JSON. Réponds en français.`

/** Garde-fous de taille : ces cartes viennent d'une base locale, pas d'un formulaire. */
const MAX_SECTIONS = 20
const MAX_ITEMS_PER_SECTION = 40
const MAX_ITEM_LENGTH = 500

interface IncomingSection {
  label?: unknown
  items?: unknown
}

/** Rend les cartes en texte, en ne gardant que ce qui est réellement renseigné. */
function renderSections(sections: IncomingSection[], reason?: string): string {
  const blocks: string[] = []
  if (reason) blocks.push(`Motif : ${String(reason).slice(0, MAX_ITEM_LENGTH)}`)

  for (const section of sections.slice(0, MAX_SECTIONS)) {
    const label = typeof section.label === 'string' ? section.label.slice(0, 120) : 'Rubrique'
    const items = (Array.isArray(section.items) ? section.items : [])
      .slice(0, MAX_ITEMS_PER_SECTION)
      .map((item) => (item == null ? '' : String(item).trim()))
      // « — » est le marqueur « sujet non abordé » : le transmettre ferait
      // croire à un fait alors qu'il signale une absence.
      .filter((item) => item !== '' && item !== '—')
      .map((item) => `- ${item.slice(0, MAX_ITEM_LENGTH)}`)

    if (items.length === 0) continue
    blocks.push(`${label}\n${items.join('\n')}`)
  }

  return blocks.join('\n\n')
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = (await req.json()) as { reason?: string; sections?: unknown }
    const sections = Array.isArray(body.sections) ? (body.sections as IncomingSection[]) : []
    const rendered = renderSections(sections, typeof body.reason === 'string' ? body.reason : undefined)

    if (!rendered.trim()) {
      return NextResponse.json({ error: 'Aucune carte à synthétiser' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Cartes d'anamnèse :\n\n${rendered}` }],
      }),
      // Sous maxDuration (60s), pour renvoyer notre propre erreur plutôt que de
      // laisser Vercel tuer la fonction.
      signal: AbortSignal.timeout(40000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[summarize-anamnesis]', res.status, err)
      return NextResponse.json({ error: `Erreur Anthropic (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content: string = data.content?.[0]?.text ?? ''

    // Le modèle peut encadrer le JSON de texte : on extrait l'objet.
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const jsonStr = start >= 0 && end > start ? content.slice(start, end + 1) : content

    let summary = ''
    try {
      const parsed = JSON.parse(jsonStr) as { summary?: unknown }
      if (typeof parsed.summary === 'string') summary = parsed.summary.trim()
    } catch {
      // Repli : une réponse non-JSON reste utilisable si elle tient en une phrase.
      summary = content.trim().replace(/^["']|["']$/g, '')
    }

    if (!summary) {
      return NextResponse.json({ error: 'Synthèse vide' }, { status: 502 })
    }

    return NextResponse.json({ summary: summary.slice(0, 400) })
  } catch (err) {
    console.error('[summarize-anamnesis]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
