import { NextResponse } from 'next/server'
import {
  ROLE, EBP_KNOWLEDGE, GENERATION_RULES, STYLE_RULES, VIGILANCE_POINTS, ITEM_SCHEMA,
  loadExercises, exerciseBlock, exercisePayload, callClaude,
} from '@/lib/exercise-ai'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'
import { hasFeature } from '@/lib/features'

export const dynamic = 'force-dynamic'
// Plan Pro : jusqu'à 300 s. La réflexion clinique (thinking adaptatif, effort
// high) peut dépasser la minute sur les dossiers chargés.
export const maxDuration = 300

// Raisonnement clinique : on privilégie la qualité du choix et du dosage au
// coût (une génération par patient, pas un flux massif).
const MODEL = 'claude-opus-5-5'
const EFFORT = 'high'

const MIN_EXERCISES = 1
const MAX_EXERCISES = 6

const SYSTEM_PROMPT = `${ROLE}\n\n${EBP_KNOWLEDGE}\n\n${GENERATION_RULES}\n\n${STYLE_RULES}`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    clinical_notes: { type: 'string' },
    patient_intro: { type: 'string' },
    weekly_routine: { type: 'string' },
    items: { type: 'array', items: ITEM_SCHEMA },
  },
  required: ['title', 'clinical_notes', 'patient_intro', 'weekly_routine', 'items'],
  additionalProperties: false,
}

interface ParsedPrescription {
  title: string
  clinical_notes: string
  patient_intro?: string | null
  weekly_routine?: string | null
  items: Array<{
    exercise_idx: number
    sets?: number | null
    reps?: string | null
    hold_time?: number | null
    rest_time?: number | null
    frequency?: string | null
    notes?: string | null
  }>
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!process.env.OSTEOFLOW_PROXY_SECRET || authHeader !== process.env.OSTEOFLOW_PROXY_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { patient, consultation, diagnostic, include_factors, level, exercise_count, max_duration_minutes, program_context } = body

    if (!diagnostic?.trim()) {
      return NextResponse.json({ error: 'Diagnostic requis' }, { status: 400 })
    }

    // Les versions d'Osteoflow antérieures envoient une durée de séance au lieu
    // d'un nombre d'exercices : on garde leur comportement (4 à 6 exercices).
    const requestedCount = Number.isInteger(exercise_count)
      ? Math.min(MAX_EXERCISES, Math.max(MIN_EXERCISES, exercise_count as number))
      : null

    const exerciseList = await loadExercises(level)
    if (!exerciseList) return NextResponse.json({ error: 'Erreur base exercices' }, { status: 500 })

    const patientCtx: string[] = []
    if (include_factors?.age && patient?.age) patientCtx.push(`Âge : ${patient.age} ans`)
    if (include_factors?.gender && patient?.gender) patientCtx.push(`Sexe : ${patient.gender === 'M' ? 'Homme' : 'Femme'}`)
    if (include_factors?.profession && patient?.profession) patientCtx.push(`Profession : ${patient.profession}`)
    if (include_factors?.sport && patient?.sport_activity) patientCtx.push(`Activité sportive : ${patient.sport_activity}`)
    if (include_factors?.trauma && patient?.trauma_history) patientCtx.push(`Antécédents traumatiques : ${patient.trauma_history}`)
    if (include_factors?.medical && patient?.medical_history) patientCtx.push(`Antécédents médicaux : ${patient.medical_history}`)
    if (include_factors?.surgical && patient?.surgical_history) patientCtx.push(`Antécédents chirurgicaux : ${patient.surgical_history}`)

    const consultationSections: string[] = [
      `## PATIENT\n${patientCtx.length > 0 ? patientCtx.join('\n') : 'Données non renseignées'}`,
    ]
    if (consultation?.reason) consultationSections.push(`## MOTIF\n${consultation.reason}`)
    if (consultation?.anamnesis) consultationSections.push(`## ANAMNÈSE\n${consultation.anamnesis}`)
    if (consultation?.examination) consultationSections.push(`## EXAMEN CLINIQUE\n${consultation.examination}`)
    consultationSections.push(`## DIAGNOSTIC DU PRATICIEN\n${diagnostic}`)
    // Nouvelle étape d'un programme en cours : étapes précédentes, bilans du
    // patient et modifications, pour une vraie progression.
    // Le contexte de programme n'est pris en compte que pour les comptes qui
    // ont accès aux programmes (fonction en test) : les autres gardent la
    // génération habituelle.
    if (typeof program_context === 'string' && program_context.trim() && hasFeature(await getOsteoflowSessionUser(req), 'programmes')) {
      consultationSections.push(`## PROGRAMME EN COURS\nTu prépares une nouvelle étape de ce programme. Pars de l'étape qui la précède et du suivi rapporté par le patient : progresse si la douleur au réveil reste sous 5 et revient à son niveau habituel, maintiens si elle stagne, allège si elle dépasse 5 ou si les séances ne sont pas faites. Dis dans clinical_notes ce qui change par rapport à l'étape précédente et pourquoi.\n\n${program_context.trim()}`)
    }
    consultationSections.push(
      requestedCount != null
        ? `## PARAMÈTRES\nNiveau maximal : ${level}/3\nNombre d'exercices : exactement ${requestedCount}`
        : `## PARAMÈTRES\nNiveau maximal : ${level}/3\nNombre d'exercices : 4 à 6\nDurée maximale de séance : ${max_duration_minutes ?? 30} minutes`,
    )

    const result = await callClaude<ParsedPrescription>({
      model: MODEL,
      effort: EFFORT,
      system: SYSTEM_PROMPT,
      blocks: [
        // Liste d'exercices d'abord (stable pour un niveau donné) → cache entre patients
        { text: exerciseBlock(exerciseList), cache: true },
        { text: consultationSections.join('\n\n') },
      ],
      schema: RESPONSE_SCHEMA,
      timeoutMs: 270000,
      tag: 'generate-exercise-prescription',
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    const parsed = result.value

    // Indice → exercice, sans doublon, et jamais plus que le nombre demandé.
    const seen = new Set<number>()
    const enrichedItems = (parsed.items || [])
      .filter(item => {
        if (!exerciseList[item.exercise_idx] || seen.has(item.exercise_idx)) return false
        seen.add(item.exercise_idx)
        return true
      })
      .slice(0, requestedCount ?? MAX_EXERCISES + 2)
      .map(item => ({
        exercise: exercisePayload(exerciseList[item.exercise_idx]),
        sets: item.sets ?? null,
        reps: item.reps ?? null,
        hold_time: item.hold_time ?? null,
        rest_time: item.rest_time ?? null,
        frequency: item.frequency ?? null,
        notes: item.notes ?? null,
      }))

    return NextResponse.json({
      title: parsed.title,
      clinical_notes: parsed.clinical_notes,
      patient_intro: parsed.patient_intro ?? null,
      vigilance_points: VIGILANCE_POINTS,
      weekly_routine: parsed.weekly_routine ?? null,
      items: enrichedItems,
    })
  } catch (err) {
    console.error('[generate-exercise-prescription] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
