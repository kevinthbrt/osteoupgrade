import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un assistant clinique expert en rééducation ostéopathique et physiothérapeutique. Tu génères des prescriptions d'exercices individualisées et scientifiquement validées pour des ostéopathes francophones.

## PRINCIPES EBP
Tu appliques les recommandations actuelles (NICE, Cochrane, HAS, KNGF) :
- Graded Activity / Graded Exposure pour la douleur chronique
- Progressive overload pour le renforcement musculaire
- Stabilisation segmentaire avant renforcement global
- Exercices actifs et fonctionnels > exercices passifs
- Spécificité : zone anatomique, type de tissu, fonction
- Motor Control Training pour les dysfonctions posturales
- Exercice thérapeutique validé pour lombalgies, cervicalgies, tendinopathies, pathologies de l'épaule

## DOSAGE PAR NIVEAU
- Niveau 1 : Conscience corporelle, mobilisation articulaire douce, activation musculaire légère. 2-3×8-10, tenu 5-10s, repos 30-60s, 1×/jour ou quotidien
- Niveau 2 : Stabilisation segmentaire, proprioception, renforcement sous-maximal. 3×10-12, charge légère, repos 45-60s, 2-3×/semaine
- Niveau 3 : Renforcement fonctionnel en charge, endurance musculaire, exercices complexes. 3×12-15, charge modérée, repos 60-90s, 3×/semaine

## SÉCURITÉ ET CONTRE-INDICATIONS
- Repérer drapeaux rouges dans les antécédents (fracture récente, néoplasie, infection, AVC)
- Exercice pendant EVA ≤ 3/10
- Adapter à l'âge, comorbidités et niveau d'activité habituel
- Post-chirurgical : respecter les délais de cicatrisation

## FORMAT DE RÉPONSE (JSON strict, sans markdown)
{
  "title": "Titre court du programme (ex: Programme lombaire niveau 1)",
  "clinical_notes": "Justification EBP en 2-3 phrases, mentionner les bases scientifiques",
  "items": [
    {
      "exercise_id": "uuid-exact-de-la-liste",
      "sets": 3,
      "reps": "10",
      "hold_time": null,
      "rest_time": 30,
      "frequency": "1 fois par jour",
      "notes": null
    }
  ]
}

## CONTRAINTES
- 4 à 8 exercices maximum
- Durée estimée (sets × reps × 4s + repos) ≤ durée_max_minutes
- Exercices ordonnés : échauffement → stabilisation → renforcement → étirement
- Diversité : 1-2 mobilité, 2-3 stabilité/renforcement, 1 étirement
- Utiliser UNIQUEMENT les exercise_id de la liste fournie
- Répondre en JSON pur, sans bloc de code
- Langue française`

interface ExerciseFromDB {
  id: string
  name: string
  region: string
  type: string
  level: number
  description: string | null
  nerve_target: string | null
  progression_regression: string | null
  illustration_url: string | null
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  if (!process.env.OSTEOFLOW_PROXY_SECRET || authHeader !== process.env.OSTEOFLOW_PROXY_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { patient, consultation, diagnostic, include_factors, level, max_duration_minutes } = body

    if (!diagnostic?.trim()) {
      return NextResponse.json({ error: 'Diagnostic requis' }, { status: 400 })
    }

    const { data: exercises, error: exError } = await supabaseAdmin
      .from('rehab_exercises')
      .select('id, name, region, type, level, description, nerve_target, progression_regression, illustration_url')
      .eq('is_active', true)
      .lte('level', level)
      .order('region')
      .order('level')

    if (exError) return NextResponse.json({ error: 'Erreur base exercices' }, { status: 500 })

    const exerciseList = (exercises || []) as ExerciseFromDB[]

    const patientCtx: string[] = []
    if (include_factors?.age && patient?.age) patientCtx.push(`Âge : ${patient.age} ans`)
    if (include_factors?.gender && patient?.gender) patientCtx.push(`Sexe : ${patient.gender === 'M' ? 'Homme' : 'Femme'}`)
    if (include_factors?.profession && patient?.profession) patientCtx.push(`Profession : ${patient.profession}`)
    if (include_factors?.sport && patient?.sport_activity) patientCtx.push(`Activité sportive : ${patient.sport_activity}`)
    if (include_factors?.trauma && patient?.trauma_history) patientCtx.push(`Antécédents traumatiques : ${patient.trauma_history}`)
    if (include_factors?.medical && patient?.medical_history) patientCtx.push(`Antécédents médicaux : ${patient.medical_history}`)
    if (include_factors?.surgical && patient?.surgical_history) patientCtx.push(`Antécédents chirurgicaux : ${patient.surgical_history}`)

    const exercisesCompact = exerciseList.map(e => ({
      id: e.id,
      name: e.name,
      region: e.region,
      type: e.type,
      level: e.level,
      ...(e.description ? { desc: e.description.substring(0, 100) } : {}),
    }))

    const sections: string[] = [
      `## PATIENT\n${patientCtx.length > 0 ? patientCtx.join('\n') : 'Données non renseignées'}`,
    ]
    if (consultation?.reason) sections.push(`## MOTIF\n${consultation.reason}`)
    if (consultation?.anamnesis) sections.push(`## ANAMNÈSE\n${consultation.anamnesis}`)
    if (consultation?.examination) sections.push(`## EXAMEN CLINIQUE\n${consultation.examination}`)
    sections.push(`## DIAGNOSTIC DU PRATICIEN\n${diagnostic}`)
    sections.push(`## PARAMÈTRES\nNiveau : ${level}/3\nDurée max séance : ${max_duration_minutes} minutes`)
    sections.push(`## EXERCICES DISPONIBLES (${exercisesCompact.length})\n${JSON.stringify(exercisesCompact)}`)

    const userContent = sections.join('\n\n')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.error('[generate-exercise-prescription] Anthropic', aiRes.status, err.substring(0, 200))
      return NextResponse.json({ error: `Erreur IA (${aiRes.status})` }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const content = (aiData.content?.[0]?.text ?? '').trim()

    let parsed: {
      title: string
      clinical_notes: string
      items: Array<{
        exercise_id: string
        sets?: number | null
        reps?: string | null
        hold_time?: number | null
        rest_time?: number | null
        frequency?: string | null
        notes?: string | null
      }>
    }
    try {
      const json = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      parsed = JSON.parse(json)
    } catch {
      console.error('[generate-exercise-prescription] JSON parse fail:', content.substring(0, 300))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    const exerciseById = new Map(exerciseList.map(e => [e.id, e]))
    const enrichedItems = (parsed.items || [])
      .map(item => {
        const exercise = exerciseById.get(item.exercise_id)
        if (!exercise) return null
        return {
          exercise: {
            id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            region: exercise.region,
            type: exercise.type,
            level: exercise.level,
            illustration_url: exercise.illustration_url,
            nerve_target: exercise.nerve_target,
            progression_regression: exercise.progression_regression,
          },
          sets: item.sets ?? null,
          reps: item.reps ?? null,
          hold_time: item.hold_time ?? null,
          rest_time: item.rest_time ?? null,
          frequency: item.frequency ?? null,
          notes: item.notes ?? null,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      title: parsed.title,
      clinical_notes: parsed.clinical_notes,
      items: enrichedItems,
    })
  } catch (err) {
    console.error('[generate-exercise-prescription] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
