import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
// Clinical reasoning over the anamnesis can take a while on Sonnet; keep the
// function alive past the default Vercel ceiling. Hobby caps at 60s.
export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un assistant clinique pour ostéopathes francophones.
À partir de l'anamnèse SEULE (interrogatoire, sans examen physique) et d'une liste de tests
orthopédiques disponibles, tu dois produire un raisonnement clinique probabiliste.

RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact :
{
  "hypotheses": [
    { "id": 1, "label": "intitulé court de l'hypothèse", "prior": 45, "rationale": "éléments de l'anamnèse en faveur, 1 phrase" },
    { "id": 2, "label": "...", "prior": 30, "rationale": "..." },
    { "id": 3, "label": "...", "prior": 20, "rationale": "..." }
  ],
  "tests": [
    { "i": 12, "targetId": 1, "deltaPositive": 20, "deltaNegative": -15,
      "rationale": "ce que le test confirme/infirme, 1 phrase" }
  ],
  "questions": [
    { "id": "q1", "text": "question courte à poser au patient",
      "answers": [
        { "label": "Oui", "targetId": 1, "delta": 15 },
        { "label": "Non", "targetId": 1, "delta": -10 }
      ] }
  ]
}

Règles pour "hypotheses" :
- EXACTEMENT 3 hypothèses, classées de la plus à la moins probable (id 1, 2, 3)
- Ce sont des HYPOTHÈSES cliniques, jamais un diagnostic médical
- "prior" = probabilité estimée en % d'après l'interrogatoire seul (estimation indicative)

Règles pour "tests" :
- 3 à 6 tests maximum, choisis UNIQUEMENT dans la liste fournie ; réfère chaque test par son
  numéro "i" exact (le champ "i" de la liste). Ne renvoie NI le nom NI d'UUID, seulement "i".
- "targetId" = l'id de l'hypothèse que le test discrimine le mieux
- "deltaPositive" / "deltaNegative" = effet indicatif du test sur la probabilité de l'hypothèse ciblée,
  exprimé en points de pourcentage ARRONDIS à un multiple de 5, bornés entre -25 et +25
  (positif = en faveur, négatif = en défaveur). deltaPositive > 0, deltaNegative < 0.
- Privilégie les tests qui font vraiment basculer une hypothèse plutôt que des tests peu discriminants
- Ne jamais référencer un "i" absent de la liste fournie

Règles pour "questions" :
- 0 à 3 questions MAXIMUM — uniquement les informations vraiment manquantes qui feraient le plus
  basculer le raisonnement (drapeau rouge à éliminer, élément discriminant entre les hypothèses)
- Pas de questions de confort : si l'anamnèse suffit, renvoie []
- Chaque question : "id" court unique (q1, q2…), "text" court et direct, et 2 à 3 "answers" possibles
- Chaque réponse porte un effet indicatif : "targetId" = hypothèse concernée, "delta" = points de %
  (arrondi à un multiple de 5, borné entre -25 et +25 ; positif = en faveur, négatif = en défaveur)
- Les réponses doivent réellement faire bouger le classement, sinon ne pose pas la question

Si un contexte patient est fourni (âge, sexe, profession, activité sportive, ATCD), prends-le en
compte dans les probabilités et le dépistage (ex: gestes sportifs répétés, ATCD néoplasique, âge, grossesse).

Ne jamais inventer de test absent de la liste. Réponds en français.`

interface Hypothesis {
  id: number
  label: string
  prior: number
  rationale: string
}

interface HypothesisTest {
  test_id: string
  name: string
  region: string
  targetId: number
  deltaPositive: number
  deltaNegative: number
  rationale: string
}

interface PatientContext {
  age?: number | null
  sex?: string | null
  profession?: string | null
  sport_activity?: string | null
  surgical_history?: string | null
  trauma_history?: string | null
  medical_history?: string | null
  family_history?: string | null
}

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
  return lines
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json() as { anamnesis: string; reason?: string; patientContext?: PatientContext }
    const { anamnesis, reason, patientContext } = body

    if (!anamnesis?.trim()) {
      return NextResponse.json({ error: 'Anamnèse vide' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[hypotheses] missing env:', { url: !!supabaseUrl, key: !!supabaseAnonKey })
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Same orthopedic catalogue as suggest-tests: region lives on the clusters.
    const [testsResult, clustersResult, clusterItemsResult] = await Promise.all([
      supabase.from('orthopedic_tests').select('id, name, category, indications').order('name'),
      supabase.from('orthopedic_test_clusters').select('id, name, region').order('name'),
      supabase.from('orthopedic_test_cluster_items').select('cluster_id, test_id'),
    ])

    if (testsResult.error) {
      const e = testsResult.error
      console.error(`[hypotheses] ERR code=${e.code} msg=${e.message}`)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    const tests = testsResult.data ?? []
    const clusters = clustersResult.data ?? []
    const clusterItems = clusterItemsResult.data ?? []

    const clusterById: Record<string, { region: string }> = {}
    for (const c of clusters) clusterById[c.id] = { region: c.region ?? '' }
    const testToRegion: Record<string, string> = {}
    for (const item of clusterItems) {
      const cluster = clusterById[item.cluster_id]
      if (cluster && !testToRegion[item.test_id]) testToRegion[item.test_id] = cluster.region
    }

    // Catalogue de référence (index 1-based) : sert à la fois à construire la liste
    // envoyée au modèle ET à reconstituer côté serveur les tests qu'il choisit.
    const testsCompact = tests.map(t => ({
      id: t.id as string,
      name: t.name as string,
      region: testToRegion[t.id] ?? '',
      ...(t.indications ? { indications: (t.indications as string).substring(0, 100) } : {}),
    }))

    // Liste compacte pour le modèle : numéro "i" court au lieu de l'UUID (36 car.),
    // ce qui allège fortement l'entrée et la sortie. Le serveur retraduit ensuite.
    const catalogForModel = testsCompact.map((t, idx) => ({
      i: idx + 1,
      name: t.name,
      region: t.region,
      ...('indications' in t && t.indications ? { ind: t.indications } : {}),
    }))

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[hypotheses] missing ANTHROPIC_API_KEY')
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const ctxLines = patientContext ? buildContextLines(patientContext) : []
    const ctxBlock = ctxLines.length ? `Contexte patient :\n${ctxLines.join('\n')}\n\n` : ''
    // Anamnèse + contexte (variable) seulement : le catalogue passe dans le préfixe caché.
    const userContent = `${ctxBlock}Anamnèse :\n${reason ? `Motif : ${reason}\n\n` : ''}${anamnesis}`

    // Le catalogue est identique d'un patient à l'autre : on le place dans le préfixe
    // système mis en cache (prompt caching). Le point de césure sur ce dernier bloc
    // couvre aussi le SYSTEM_PROMPT qui le précède. TTL 1h : le cache survit entre deux
    // patients espacés (1 par créneau), donc dès la 2e hypothèse de l'heure le catalogue
    // est relu à 0,1× au lieu d'être réécrit. (5 min expirerait entre les patients.)
    const catalogText = `Liste des tests orthopédiques disponibles (${catalogForModel.length}), chacun avec son numéro "i" :\n${JSON.stringify(catalogForModel)}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // extended-cache-ttl active le TTL 1h sur cache_control.
        'anthropic-beta': 'prompt-caching-2024-07-31,extended-cache-ttl-2025-04-11',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        // Output now carries hypotheses + tests + interactive questions, so give
        // it headroom — a truncated JSON would fail to parse and 500.
        max_tokens: 2500,
        system: [
          { type: 'text', text: SYSTEM_PROMPT },
          { type: 'text', text: catalogText, cache_control: { type: 'ephemeral', ttl: '1h' } },
        ],
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[hypotheses] Anthropic', res.status, err.substring(0, 200))
      return NextResponse.json({ error: `Erreur IA (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content = (data.content?.[0]?.text ?? '').trim()
    if (data.stop_reason === 'max_tokens') {
      console.warn('[hypotheses] response hit max_tokens — JSON may be truncated')
    }

    // Pas de prefill possible (rejeté en 400 sur Claude 4.6) : on extrait l'objet
    // JSON même si le modèle ajoute du texte autour (1er "{" → dernier "}").
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const jsonStr = start >= 0 && end > start ? content.slice(start, end + 1) : content

    // Le modèle ne renvoie qu'un numéro "i" par test (allège entrée + sortie) ; on
    // reconstitue ici le test complet (UUID, nom, région) attendu par le client.
    interface RawTest { i?: number; test_id?: string; targetId: number; deltaPositive: number; deltaNegative: number; rationale: string }
    let parsed: { hypotheses?: Hypothesis[]; tests?: RawTest[]; questions?: unknown[] }
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('[hypotheses] JSON parse fail:', content.substring(0, 300))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    const resolvedTests: HypothesisTest[] = []
    for (const t of parsed.tests ?? []) {
      const src = t.i != null ? testsCompact[t.i - 1] : undefined
      if (!src) continue // index hors liste ou absent → on ignore le test
      resolvedTests.push({
        test_id: src.id,
        name: src.name,
        region: src.region,
        targetId: t.targetId,
        deltaPositive: t.deltaPositive,
        deltaNegative: t.deltaNegative,
        rationale: t.rationale,
      })
    }

    return NextResponse.json({ ...parsed, tests: resolvedTests })
  } catch (err) {
    console.error('[hypotheses] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
