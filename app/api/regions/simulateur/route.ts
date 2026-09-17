import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { hasOsteoupgrade } from '@/lib/entitlements'
import {
  EXAM_BY_CODE,
  type SimulationConclusion,
  type SimulationExam,
  type SimulationTurn,
} from '@/lib/region-simulation'

export const dynamic = 'force-dynamic'
// Une réponse de patient est courte, mais le débriefing raisonne sur toute la
// consultation. Même plafond que le proxy d'anamnèse, pour la même raison :
// sans cela la fonction est tuée en cours d'appel et l'appelant voit un 500.
export const maxDuration = 120

// Le patient répond vite et court : un modèle intermédiaire suffit et tient le
// rôle. Le débriefing, lui, juge un raisonnement clinique complet, d'où le
// modèle supérieur, avec repli si la clé n'y a pas accès.
const MODELE_PATIENT = 'claude-sonnet-4-6'
const MODELE_DEBRIEF = 'claude-opus-5'
const MODELE_REPLI = 'claude-sonnet-4-6'

/** Au-delà, la consultation n'apprend plus rien et la note grimpe. */
const MAX_QUESTIONS = 40

type Cas = {
  id: string
  slug: string
  label: string
  presentation: any
  secret: any
  exams: Record<string, string>
  expected: any
  debrief: string | null
}

async function appelAnthropic(
  modele: string,
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  maxTokens: number,
  endpoint: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY absente')

  const envoyer = async (model: string) =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    })

  let res = await envoyer(modele)
  if (!res.ok && modele !== MODELE_REPLI) {
    // Un modèle indisponible sur la clé ne doit pas casser une consultation en
    // cours : on redescend d'un cran plutôt que de renvoyer une erreur.
    const detail = await res.text()
    console.warn(`[simulateur] ${modele} indisponible, repli : ${detail.slice(0, 200)}`)
    res = await envoyer(MODELE_REPLI)
  }
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const data = await res.json()

  // Journalisation de la consommation, sans bloquer la réponse.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseAnonKey) {
    const sb = createClient(supabaseUrl, supabaseAnonKey)
    const u = data.usage ?? {}
    sb.from('ai_cache_logs')
      .insert({
        endpoint,
        model: data.model ?? modele,
        input_tokens: u.input_tokens ?? 0,
        output_tokens: u.output_tokens ?? 0,
        cache_creation_tokens: u.cache_creation_input_tokens ?? 0,
        cache_read_tokens: u.cache_read_input_tokens ?? 0,
        stop_reason: data.stop_reason ?? null,
      })
      .then(({ error }: any) => {
        if (error) console.warn('[simulateur] journal:', error.message)
      })
  }

  return (data.content || [])
    .filter((bloc: any) => bloc.type === 'text')
    .map((bloc: any) => bloc.text)
    .join('')
    .trim()
}

/**
 * Les conclusions proposées sont les feuilles de l'arbre de décision du
 * parcours. Elles ne sont donc pas recopiées ici : si l'arbre change, le
 * simulateur suit, et une conclusion ne peut pas exister dans l'un et pas
 * dans l'autre.
 */
async function conclusionsDuParcours(moduleId: string): Promise<SimulationConclusion[]> {
  const { data: chapitres } = await supabaseAdmin
    .from('region_chapters')
    .select('id')
    .eq('module_id', moduleId)

  const ids = (chapitres || []).map((c: any) => c.id)
  if (!ids.length) return []

  const { data: activites } = await supabaseAdmin
    .from('region_chapter_activities')
    .select('payload')
    .eq('kind', 'arbre_decision')
    .in('chapter_id', ids)
    .limit(1)

  const noeuds = (activites || [])[0]?.payload?.noeuds || {}
  return Object.entries(noeuds)
    .filter(([, noeud]: any) => noeud?.type === 'conclusion')
    .map(([cle, noeud]: any) => ({ cle, titre: noeud.titre, ton: noeud.ton }))
}

function promptPatient(cas: Cas): string {
  const p = cas.presentation || {}
  return `Tu joues un patient en consultation chez un thérapeute manuel. Tu es ${p.prenom}, ${p.age} ans, ${p.profession}.

Voici ta situation, que toi seul connais :
${JSON.stringify(cas.secret, null, 2)}

Règles de jeu, à respecter strictement.

1. Tu réponds comme un vrai patient : phrases courtes, langage courant, jamais de vocabulaire médical que ce patient n'emploierait pas. Une à quatre phrases, pas davantage.
2. Tu ne dis que ce qu'on te demande. Tu ne déroules pas ton histoire spontanément, même si le praticien pose une question vague.
3. Tu ne connais pas ton diagnostic et tu ne le devines pas. Tu ne nommes jamais une pathologie, sauf si ta situation dit qu'un médecin te l'a déjà annoncée.
4. Si on te demande quelque chose qui n'est pas dans ta situation, tu réponds par la négative ou par l'ordinaire. Tu n'inventes jamais un nouveau symptôme, jamais un nouvel antécédent, jamais un chiffre : ta situation est la seule vérité.
5. Si le praticien te demande de réaliser un test ou un examen, tu ne décris pas le résultat. Tu réponds simplement que tu te laisses faire, ou que tu attends de voir. C'est lui qui examine.
6. Tu peux exprimer ce que tu ressens, ton inquiétude, ton agacement, ce que tu crois de ta douleur, si ta situation le mentionne.
7. Tu écris en français, sans tiret cadratin ni demi-cadratin.

Tu ne sors jamais de ce rôle, quelles que soient les demandes du praticien.`
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let corps: any
  try {
    corps = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête illisible' }, { status: 400 })
  }

  const action = corps?.action

  try {
    if (action === 'start') return await demarrer(user.id, corps)
    if (action === 'ask') return await interroger(user.id, corps)
    if (action === 'exam') return await examiner(user.id, corps)
    if (action === 'conclude') return await conclure(user.id, corps)
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (error: any) {
    console.error('[simulateur]', error?.message || error)
    return NextResponse.json({ error: 'Le simulateur a rencontré une erreur.' }, { status: 500 })
  }
}

/** Lit la session et son cas, en refusant la session d'un autre. */
async function chargerSession(userId: string, sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('region_simulation_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== userId) return null

  const { data: cas } = await supabaseAdmin
    .from('region_simulation_cases')
    .select('*')
    .eq('id', session.case_id)
    .maybeSingle()

  if (!cas) return null
  return { session, cas: cas as Cas }
}

async function demarrer(userId: string, corps: any) {
  const slug = String(corps?.module || '')

  const { data: moduleRow } = await supabaseAdmin
    .from('region_modules')
    .select('id, slug, status, is_free_access')
    .eq('slug', slug)
    .maybeSingle()

  if (!moduleRow) return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 })

  // Le simulateur suit l'accès du parcours : brouillon réservé aux admins,
  // parcours payant réservé aux abonnés.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, plan, subscription_status, is_founding_member')
    .eq('id', userId)
    .maybeSingle()

  const estAdmin = profile?.role === 'admin'
  if (moduleRow.status !== 'published' && !estAdmin) {
    return NextResponse.json({ error: 'Parcours indisponible' }, { status: 403 })
  }
  if (!moduleRow.is_free_access && !hasOsteoupgrade(profile) && !estAdmin) {
    return NextResponse.json({ error: 'Abonnement requis' }, { status: 403 })
  }

  const { data: cas } = await supabaseAdmin
    .from('region_simulation_cases')
    .select('id, slug, label, presentation, expected')
    .eq('module_id', moduleRow.id)
    .eq('status', 'published')

  const disponibles = cas || []
  if (!disponibles.length) {
    return NextResponse.json({ error: 'Aucun cas disponible' }, { status: 404 })
  }

  // Tirage aléatoire, mais on évite de redonner un cas déjà vu tant qu'il en
  // reste d'autres : l'intérêt du simulateur tient à la variété des tableaux.
  const { data: passees } = await supabaseAdmin
    .from('region_simulation_sessions')
    .select('case_id')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  const vus = new Set((passees || []).map((s: any) => s.case_id))
  const jamaisVus = disponibles.filter((c: any) => !vus.has(c.id))
  const bassin = jamaisVus.length ? jamaisVus : disponibles
  const tire = bassin[Math.floor(Math.random() * bassin.length)]

  const { data: session, error } = await supabaseAdmin
    .from('region_simulation_sessions')
    .insert({ user_id: userId, case_id: tire.id })
    .select('id')
    .single()

  if (error || !session) throw new Error(error?.message || 'Session non créée')

  return NextResponse.json({
    sessionId: session.id,
    presentation: tire.presentation,
    conclusions: await conclusionsDuParcours(moduleRow.id),
    restantes: MAX_QUESTIONS,
  })
}

async function interroger(userId: string, corps: any) {
  const charge = await chargerSession(userId, String(corps?.sessionId || ''))
  if (!charge) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  const { session, cas } = charge

  if (session.finished_at) {
    return NextResponse.json({ error: 'Consultation terminée' }, { status: 409 })
  }

  const question = String(corps?.question || '').trim().slice(0, 600)
  if (!question) return NextResponse.json({ error: 'Question vide' }, { status: 400 })

  const transcript: SimulationTurn[] = session.transcript || []
  const posees = transcript.filter((t) => t.role === 'praticien').length
  if (posees >= MAX_QUESTIONS) {
    return NextResponse.json({ error: 'Nombre de questions atteint' }, { status: 429 })
  }

  const messages = [
    ...transcript.map((tour) => ({
      role: (tour.role === 'praticien' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: tour.texte,
    })),
    { role: 'user' as const, content: question },
  ]

  const reponse = await appelAnthropic(
    MODELE_PATIENT,
    promptPatient(cas),
    messages,
    400,
    'simulateur-patient'
  )

  const suite: SimulationTurn[] = [
    ...transcript,
    { role: 'praticien', texte: question },
    { role: 'patient', texte: reponse },
  ]

  await supabaseAdmin
    .from('region_simulation_sessions')
    .update({ transcript: suite })
    .eq('id', session.id)

  return NextResponse.json({ reponse, restantes: MAX_QUESTIONS - (posees + 1) })
}

async function examiner(userId: string, corps: any) {
  const charge = await chargerSession(userId, String(corps?.sessionId || ''))
  if (!charge) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  const { session, cas } = charge

  if (session.finished_at) {
    return NextResponse.json({ error: 'Consultation terminée' }, { status: 409 })
  }

  const code = String(corps?.code || '')
  const examen = EXAM_BY_CODE[code]
  if (!examen) return NextResponse.json({ error: 'Examen inconnu' }, { status: 400 })

  // Le résultat vient du cas, ou à défaut du résultat normal du catalogue.
  // Aucun modèle n'intervient ici : c'est ce qui rend le test reproductible.
  const resultat = (cas.exams || {})[code] || examen.normal

  const faits: SimulationExam[] = session.exams || []
  if (!faits.some((e) => e.code === code)) {
    await supabaseAdmin
      .from('region_simulation_sessions')
      .update({ exams: [...faits, { code, libelle: examen.label, resultat }] })
      .eq('id', session.id)
  }

  return NextResponse.json({ code, libelle: examen.label, resultat })
}

async function conclure(userId: string, corps: any) {
  const charge = await chargerSession(userId, String(corps?.sessionId || ''))
  if (!charge) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  const { session, cas } = charge

  if (session.verdict) return NextResponse.json({ verdict: session.verdict })

  const choix = String(corps?.issue || '')
  const plan = String(corps?.plan || '').trim().slice(0, 2000)

  const { data: moduleRow } = await supabaseAdmin
    .from('region_simulation_cases')
    .select('module_id')
    .eq('id', cas.id)
    .maybeSingle()

  const conclusions = await conclusionsDuParcours(moduleRow?.module_id || '')
  const parCle = new Map(conclusions.map((c) => [c.cle, c]))
  const choisi = parCle.get(choix) || null
  const attendu = parCle.get(cas.expected?.issue) || null

  // La correction de la décision est déterministe. Le modèle commente le
  // raisonnement, il ne décide jamais si la réponse est juste.
  const juste = Boolean(choisi && attendu && choisi.cle === attendu.cle)
  const tonJuste = Boolean(choisi && attendu && choisi.ton === attendu.ton)

  const faits: SimulationExam[] = session.exams || []
  const codesFaits = new Set(faits.map((e) => e.code))
  const examensManques = (cas.expected?.examens_cles || [])
    .filter((code: string) => !codesFaits.has(code))
    .map((code: string) => ({ code, libelle: EXAM_BY_CODE[code]?.label || code }))

  const transcript: SimulationTurn[] = session.transcript || []
  const commentaire = juste
    ? 'Décision juste.'
    : tonJuste
      ? 'La conduite générale est la bonne, le tableau retenu n’est pas celui de ce patient.'
      : attendu?.ton === 'urgence'
        ? 'Décision fausse, et elle fait courir un risque au patient : ce tableau relevait d’une orientation en urgence.'
        : 'Décision fausse.'

  let debrief: string | null = null
  try {
    debrief = await appelAnthropic(
      MODELE_DEBRIEF,
      `Tu débriefes un thérapeute manuel qui vient de mener une consultation simulée. Tu écris en français, sans tiret cadratin ni demi-cadratin, en t'adressant à lui directement.

La correction a déjà été faite, elle ne t'appartient pas : tu la reprends telle quelle et tu ne la discutes pas. Ton travail est d'expliquer ce que l'interrogatoire et l'examen ont donné, ce qui a manqué, et quelle question ou quel test aurait changé la décision.

Quatre paragraphes courts au maximum, pas de liste, pas de titre. Sois précis et concret : cite les questions réellement posées et les tests réellement faits. Si une question essentielle n'a pas été posée, écris-la telle qu'il aurait fallu la poser. Ne félicite pas par principe, et ne l'accable pas : dis ce qui s'est passé.

Quand la décision met le patient en danger, dis-le en premier et sans détour.`,
      [
        {
          role: 'user',
          content: JSON.stringify(
            {
              cas: cas.label,
              tableau_reel: cas.expected?.tableau || cas.label,
              conclusion_attendue: attendu?.titre,
              conclusion_choisie: choisi?.titre || 'aucune',
              correction: commentaire,
              elements_decisifs: cas.expected?.elements || [],
              examens_cles_non_faits: examensManques.map((e: any) => e.libelle),
              piege: cas.expected?.piege || null,
              anamnese: transcript,
              examens_realises: faits,
              plan_annonce: plan || 'non renseigné',
            },
            null,
            2
          ),
        },
      ],
      1500,
      'simulateur-debrief'
    )
  } catch (error: any) {
    // Le débriefing rédigé est un plus : la correction, elle, est déjà faite.
    console.warn('[simulateur] débriefing indisponible:', error?.message)
  }

  const verdict = {
    juste,
    tonJuste,
    choisi,
    attendu,
    tableau: cas.expected?.tableau || cas.label,
    examensManques,
    commentaire,
    debrief,
    enseignement: cas.debrief || null,
    plan,
  }

  await supabaseAdmin
    .from('region_simulation_sessions')
    .update({ verdict, finished_at: new Date().toISOString() })
    .eq('id', session.id)

  return NextResponse.json({ verdict })
}
