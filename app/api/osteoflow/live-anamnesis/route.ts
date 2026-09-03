import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// Appelée toutes les dix à quinze secondes pendant une consultation : la latence
// prime sur la profondeur, et la fonction doit rendre la main vite.
export const maxDuration = 45

/**
 * Extraction incrémentale d'une anamnèse dictée, pour le mode consultation de
 * MyOsteoFlow.
 *
 * Reçoit un PASSAGE (ce qui vient d'être dit) et les LIGNES déjà posées, avec
 * leur identifiant. Renvoie des opérations sur ces lignes, pas une nouvelle
 * synthèse : c'est ce qui permet à « c'est à gauche, ah non pardon à droite » de
 * corriger la ligne existante au lieu d'en empiler une seconde qui la
 * contredirait.
 *
 * Le texte des lignes est libre : imposer un vocabulaire abîmerait la
 * formulation, et ce n'est pas nécessaire pour afficher. La liste fermée porte
 * seulement sur l'AXE de chaque ligne, parce qu'elle sert ensuite à dire ce qui
 * manque, et qu'on ne détecte pas une absence sans référence.
 */
const MODEL = process.env.LIVE_ANAMNESIS_MODEL ?? 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `Tu es un extracteur clinique pour ostéopathes francophones, branché sur une dictée en cours.

Tu reçois un PASSAGE qui vient d'être prononcé, et l'ÉTAT des lignes déjà relevées.
Tu renvoies les opérations à appliquer sur ces lignes.

RÉPONDS UNIQUEMENT EN JSON valide :
{ "ops": [ { "op": "add", "id": "n1", "axis": "localisation", "text": "Lombaire basse", "confidence": "high", "verbatim": "j'ai mal en bas du dos" } ] }

Trois opérations :
- "add"    : un fait nouveau. Fournis "id" (court, unique dans ta réponse), "axis", "text".
- "update" : un fait DÉJÀ relevé que ce passage précise ou contredit. Reprends son
             "id" exact tel qu'il figure dans l'ÉTAT, et donne le nouveau "text".
- "remove" : un fait que le patient retire ("non finalement ça ne descend pas").
             Reprends son "id" exact.

RÈGLE CENTRALE : le patient se reprend, se corrige, précise. Un fait qui affine ou
contredit une ligne existante est un "update" de CETTE ligne, JAMAIS un "add".
Deux lignes qui se contredisent sont pires que pas de ligne du tout.
Exemple : ligne existante l3 = "Gauche" sur l'axe lateralite, le patient dit « ah
non pardon, c'est le côté droit » → { "op": "update", "id": "l3", "text": "Droite" }.

RÈGLE DE SILENCE : un passage qui n'apporte aucun fait nouveau renvoie { "ops": [] }.
Ne réécris jamais une ligne inchangée. Ne répète jamais un fait déjà relevé.

AXES autorisés, à copier caractère pour caractère (tout autre axe est ignoré) :
- motif : le motif de consultation, en une formule courte
- localisation : où se situe la plainte
- lateralite : droite, gauche, bilaterale, ou mediane quand la plainte est centrale
- anciennete : depuis quand
- apparition : brutale ou progressive, circonstance déclenchante
- type : la qualité de la douleur (mécanique, brûlure, décharge, raideur)
- intensite : l'intensité, chiffrée si le patient la chiffre
- horaire : nocturne, matinal, rythme mécanique ou inflammatoire, effet du repos
- irradiation : trajet, jusqu'où, ou son absence explicite
- aggravant : ce qui aggrave
- soulageant : ce qui soulage
- evolution : amélioration, stagnation, aggravation depuis le début
- traitement : ce qui a déjà été essayé, avec son effet
- antecedent : antécédent médical, chirurgical, traumatique ou familial mentionné
- retentissement : conséquences au travail, dans le sport, sur le sommeil
- red_flag : signal d'alerte, voir ci-dessous

RÈGLE DE COUVERTURE IMPLICITE : une phrase renseigne souvent un axe sans le
nommer. Chaque fois qu'elle répond à un axe, produis la ligne correspondante,
même si elle en alimente déjà un autre. Une seule phrase peut donc donner
plusieurs lignes.
- « j'ai mal en plein milieu des lombaires » donne DEUX lignes : localisation
  « Lombaire basse » ET lateralite « Médiane, non latéralisée ». Une douleur
  centrale, axiale, sur la colonne ou « des deux côtés pareil » est une réponse
  de latéralité, pas une absence de réponse.
- « ça ne descend pas dans la jambe » renseigne l'axe irradiation.
- « c'est venu d'un coup en soulevant un carton » donne apparition ET anciennete
  si un repère de temps est donné.
- « je ne peux plus courir » renseigne retentissement.
Ne laisse jamais un axe non renseigné alors que le passage y répond : le
praticien s'appuie sur ce qui reste non couvert pour savoir quoi demander, et un
axe réclamé à tort lui fait reposer une question déjà posée.

ÉCRITURE des lignes :
- une ligne = UN fait précis, style télégraphique, 12 mots maximum, sans verbe
  conjugué inutile, sans « le patient rapporte que ». Abréviations cliniques
  autorisées (ATCD, EVA, Dlr, G/D, RAS).
- pas de préfixe d'axe dans le texte : écris "Lombaire basse", pas
  "Localisation : lombaire basse". L'axe est déjà dans le champ "axis".
- une négation explicite est un fait : « ça ne descend pas sous le genou » donne
  une ligne d'axe irradiation valant "Pas d'irradiation sous le genou". Un sujet
  dont le passage ne parle pas ne donne AUCUNE ligne.
- corrige les termes médicaux mal transcrits sans altérer le sens.

CONFIANCE :
- "confidence": "low" quand la transcription du terme reste douteuse, et alors
  "verbatim" cite les mots du patient, sans les reformuler. C'est ce qui permet
  au praticien de trancher sans redemander.
- "confidence": "high" sinon. Dans le doute sur le FAIT lui-même, n'extrais pas :
  une ligne fausse oriente le raisonnement dans une mauvaise direction.

DRAPEAUX ROUGES, seule exception à la règle de non-déduction. Tu signales tout
élément du passage correspondant à un signal d'alerte, même implicite, même s'il
faut le déduire d'un recoupement (douleur nocturne plus amaigrissement) :
douleur nocturne non soulagée par le repos ; amaigrissement, fièvre, sueurs
nocturnes ; antécédent ou suspicion de cancer ; déficit neurologique, faiblesse,
anesthésie ; troubles sphinctériens, anesthésie en selle ; traumatisme à haute
énergie, ostéoporose, corticothérapie ; douleur thoracique, dyspnée ; céphalée
brutale, troubles visuels, dysarthrie ; signes infectieux, immunodépression ;
âge extrême avec douleur rachidienne récente.
Mieux vaut signaler par excès que manquer un drapeau rouge. Un drapeau rouge
donne une ligne d'axe red_flag EN PLUS de la ligne descriptive s'il y a lieu.

Tu ne poses pas de diagnostic, tu ne proposes pas d'hypothèse, tu ne suggères
aucune question. Tu relèves ce qui est dit. Aucun texte avant ou après le JSON.`

interface IncomingLine {
  id?: unknown
  axis?: unknown
  text?: unknown
}

const MAX_LINES = 60
const MAX_PASSAGE = 6000

/** Rend l'état courant sous une forme compacte : il est réenvoyé à chaque passage. */
function renderState(lines: IncomingLine[]): string {
  const rendered = lines
    .slice(0, MAX_LINES)
    .filter((l) => typeof l.id === 'string' && typeof l.axis === 'string' && typeof l.text === 'string')
    .map((l) => `${l.id} | ${l.axis} | ${String(l.text).slice(0, 300)}`)

  return rendered.length > 0 ? rendered.join('\n') : '(aucune ligne pour l\'instant)'
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = (await req.json()) as { passage?: unknown; lines?: unknown; context?: unknown }
    const passage = typeof body.passage === 'string' ? body.passage.trim().slice(0, MAX_PASSAGE) : ''
    const lines = Array.isArray(body.lines) ? (body.lines as IncomingLine[]) : []

    // Un passage vide n'a rien à relever : on évite un appel et sa facturation.
    if (!passage) return NextResponse.json({ ops: [] })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    const context = typeof body.context === 'string' ? body.context.slice(0, 1000) : ''
    const userContent = [
      context ? `Contexte patient :\n${context}\n` : '',
      `ÉTAT des lignes déjà relevées (id | axe | texte) :\n${renderState(lines)}`,
      '',
      `PASSAGE qui vient d'être prononcé :\n${passage}`,
    ].filter(Boolean).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        // Le prompt est identique à chaque passage d'une consultation : le mettre
        // en cache évite de le repayer toutes les dix secondes.
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      }),
      // Sous maxDuration : un passage qui traîne doit rendre la main plutôt que
      // de retarder le suivant, la dictée continue pendant ce temps.
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[live-anamnesis]', res.status, err)
      return NextResponse.json({ error: `Erreur Anthropic (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const content: string = data.content?.[0]?.text ?? ''

    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const jsonStr = start >= 0 && end > start ? content.slice(start, end + 1) : content

    try {
      const parsed = JSON.parse(jsonStr) as { ops?: unknown }
      return NextResponse.json({ ops: Array.isArray(parsed.ops) ? parsed.ops : [] })
    } catch {
      // Une réponse illisible ne doit pas interrompre la dictée : on perd ce
      // passage, le suivant repartira du même état.
      console.warn('[live-anamnesis] réponse non parsable')
      return NextResponse.json({ ops: [] })
    }
  } catch (err) {
    console.error('[live-anamnesis]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
