import { NextResponse } from 'next/server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'
import { hasFeature } from '@/lib/features'
import {
  ROLE, EBP_KNOWLEDGE, STYLE_RULES, ITEM_SCHEMA,
  loadExercises, exerciseBlock, exercisePayload, callClaude,
} from '@/lib/exercise-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Ajuster un programme existant demande moins de raisonnement que le créer :
// Sonnet suffit et coûte environ moitié moins qu'Opus.
const MODEL = 'claude-sonnet-5-5'
const EFFORT = 'medium'

const ADJUST_RULES = `## TA MISSION : AJUSTER UN PROGRAMME EXISTANT
Le praticien te confie un programme en cours (étapes planifiées, exercices, suivi rapporté par le patient, historique des modifications) et une demande. Tu proposes des modifications ; le praticien les valide ou les refuse.

- « Proposer la suite » : lis le suivi et propose la décision la plus utile maintenant, en une seule proposition cohérente. Progresser si la douleur au réveil reste sous 5 et revient à son niveau habituel avec des séances régulières ; maintenir si elle stagne ; alléger si elle dépasse 5 ou si les séances ne sont pas faites (dans ce cas, simplifier aide souvent plus que changer d'exercices). Selon le cas : ajouter l'étape suivante, ou ajuster l'étape en cours.
- Consigne libre : fais exactement ce qui est demandé, rien de plus.
- Change le minimum. Garde les exercices qui fonctionnent. Garde le nombre d'exercices de l'étape (un de plus ou de moins au maximum, sauf demande explicite) : l'observance baisse quand le programme s'allonge.
- Ne modifie pas une étape déjà passée sauf demande explicite.
- Pour une étape modifiée ou ajoutée, renvoie la liste COMPLÈTE de ses exercices, dans l'ordre de réalisation, avec leur dosage. Un exercice déjà prescrit se reprend avec le même exercise_idx.
- starts_week : semaine de début, 1 pour la première semaine du programme. Une nouvelle étape commence après l'étape en cours et au plus tôt la semaine prochaine.
- Si la demande sort d'un programme d'exercices, ou si elle décrit un signe d'alerte (douleur nocturne inexpliquée, déficit neurologique, fièvre, aggravation franche), ne propose aucune modification : explique dans summary qu'une réévaluation s'impose.

## CONTENU DE LA RÉPONSE
- summary : pour le PRATICIEN, 2 à 4 phrases. Ce que tu lis dans le suivi, ce que tu proposes et pourquoi.
- changes : zéro, une ou plusieurs modifications.
  - action « update_phase » : phase_index = indice de l'étape modifiée (0 pour la première).
  - action « add_phase » : phase_index = null.
  - title : titre court de l'étape. clinical_notes : justification pour le praticien, avec le protocole et ses références. patient_intro et weekly_routine : pour le patient, comme dans une fiche.`

const SYSTEM_PROMPT = `${ROLE}\n\n${EBP_KNOWLEDGE}\n\n${ADJUST_RULES}\n\n${STYLE_RULES}`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['update_phase', 'add_phase'] },
          phase_index: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
          title: { type: 'string' },
          starts_week: { type: 'integer' },
          clinical_notes: { type: 'string' },
          patient_intro: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          weekly_routine: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          items: { type: 'array', items: ITEM_SCHEMA },
        },
        required: ['action', 'phase_index', 'title', 'starts_week', 'clinical_notes', 'patient_intro', 'weekly_routine', 'items'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'changes'],
  additionalProperties: false,
}

interface ProgramInput {
  title: string
  start_date: string
  current_week: number
  current_phase: number
  phases: Array<{
    title: string
    starts_after_days: number
    weekly_routine?: string | null
    items: Array<{ exercise_id: string; name: string; sets?: number | null; reps?: string | null; hold_time?: number | null; rest_time?: number | null; frequency?: string | null; notes?: string | null }>
  }>
  weeks: Array<{ week: number; done: number; morning: number | null; maxPain: number | null }>
  target_per_week?: number
  changes: string[]
}

interface Proposal {
  summary: string
  changes: Array<{
    action: 'update_phase' | 'add_phase'
    phase_index: number | null
    title: string
    starts_week: number
    clinical_notes: string
    patient_intro: string | null
    weekly_routine: string | null
    items: Array<{ exercise_idx: number; sets: number | null; reps: string | null; hold_time: number | null; rest_time: number | null; frequency: string | null; notes: string | null }>
  }>
}

const dose = (it: ProgramInput['phases'][number]['items'][number]) =>
  [it.sets != null && it.reps ? `${it.sets} × ${it.reps}` : it.sets != null ? `${it.sets} séries` : it.reps,
    it.hold_time ? `maintien ${it.hold_time} s` : null, it.rest_time ? `repos ${it.rest_time} s` : null, it.frequency]
    .filter(Boolean).join(', ')

/**
 * Assistant de programme : propose des modifications d'un programme en cours
 * (étape suivante, ajustement), à partir de son suivi. Rien n'est appliqué ici.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!process.env.OSTEOFLOW_PROXY_SECRET || authHeader !== process.env.OSTEOFLOW_PROXY_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  // Fonction en test : le secret identifie l'appli, la session identifie le
  // compte, qui doit avoir accès aux programmes.
  const user = await getOsteoflowSessionUser(req)
  if (!hasFeature(user, 'programmes')) {
    return NextResponse.json({ error: 'L’assistant de programme n’est pas encore disponible sur votre compte.', code: 'FEATURE_DISABLED' }, { status: 403 })
  }

  try {
    const { program, mode, instruction, history } = (await req.json()) as {
      program: ProgramInput
      mode: 'next' | 'instruction'
      instruction?: string
      history?: Array<{ request: string; summary: string }>
    }
    if (!program?.phases?.length) return NextResponse.json({ error: 'Programme vide' }, { status: 400 })
    if (mode === 'instruction' && !instruction?.trim()) return NextResponse.json({ error: 'Consigne vide' }, { status: 400 })

    const library = await loadExercises(3)
    if (!library) return NextResponse.json({ error: 'Erreur base exercices' }, { status: 500 })
    const indexOf = new Map(library.map((e, i) => [e.id, i]))

    const lines: string[] = [
      `## PROGRAMME : ${program.title}`,
      `Début : ${program.start_date}. Semaine en cours : ${program.current_week}. Étape en cours : ${program.current_phase + 1} sur ${program.phases.length}.${program.target_per_week ? ` Séances visées : ${program.target_per_week} par semaine.` : ''}`,
    ]
    program.phases.forEach((ph, k) => {
      lines.push(`\n### Étape ${k + 1} (phase_index ${k}) : ${ph.title}, dès la semaine ${Math.floor(ph.starts_after_days / 7) + 1}${k < program.current_phase ? ' (passée)' : k === program.current_phase ? ' (en cours)' : ' (à venir)'}`)
      if (ph.weekly_routine) lines.push(`Routine : ${ph.weekly_routine}`)
      for (const it of ph.items) {
        const idx = indexOf.get(it.exercise_id)
        lines.push(`- ${idx != null ? `idx ${idx}` : 'hors bibliothèque'} · ${it.name} · ${dose(it)}${it.notes ? ` · conseil : ${it.notes}` : ''}`)
      }
    })
    lines.push('\n## SUIVI RAPPORTÉ PAR LE PATIENT (par semaine)')
    if (program.weeks.length) {
      for (const w of program.weeks) {
        lines.push(`- Semaine ${w.week + 1} : ${w.done} séance(s), douleur au réveil ${w.morning ?? 'non notée'}/10, douleur maximale en séance ${w.maxPain ?? 'non notée'}/10`)
      }
    } else {
      lines.push('Aucun bilan importé : tu ne sais pas si le patient fait ses exercices.')
    }
    if (program.changes.length) lines.push(`\n## DERNIÈRES MODIFICATIONS\n${program.changes.slice(0, 8).map(c => `- ${c}`).join('\n')}`)
    if (history?.length) {
      lines.push(`\n## ÉCHANGES PRÉCÉDENTS (propositions non retenues)\n${history.slice(-2).map(h => `- Demande : ${h.request}\n  Ta proposition : ${h.summary}`).join('\n')}`)
    }
    lines.push(`\n## DEMANDE DU PRATICIEN\n${mode === 'next' ? 'Proposer la suite.' : instruction!.trim()}`)

    const result = await callClaude<Proposal>({
      model: MODEL,
      effort: EFFORT,
      system: SYSTEM_PROMPT,
      blocks: [{ text: exerciseBlock(library), cache: true }, { text: lines.join('\n') }],
      schema: RESPONSE_SCHEMA,
      timeoutMs: 100000,
      tag: 'adjust-exercise-program',
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    const changes = result.value.changes
      .filter(c => c.action === 'add_phase' || (c.phase_index != null && program.phases[c.phase_index]))
      .map(c => {
        const seen = new Set<number>()
        return {
          action: c.action,
          phase_index: c.action === 'update_phase' ? c.phase_index : null,
          title: c.title,
          starts_after_days: Math.max(0, (Math.max(1, c.starts_week) - 1) * 7),
          clinical_notes: c.clinical_notes,
          patient_intro: c.patient_intro,
          weekly_routine: c.weekly_routine,
          items: c.items
            .filter(it => library[it.exercise_idx] && !seen.has(it.exercise_idx) && seen.add(it.exercise_idx))
            .map(it => ({
              exercise: exercisePayload(library[it.exercise_idx]),
              sets: it.sets, reps: it.reps, hold_time: it.hold_time, rest_time: it.rest_time, frequency: it.frequency, notes: it.notes,
            })),
        }
      })
      .filter(c => c.items.length > 0)

    return NextResponse.json({ summary: result.value.summary, changes })
  } catch (err) {
    console.error('[adjust-exercise-program] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
