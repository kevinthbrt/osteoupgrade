import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

## TYPES D'EXERCICES DISPONIBLES
Le champ "type" peut être : renfo, étirement, mobilité, neurodynamique, proprio, renfo doux.
Le type "renfo" regroupe exercices dynamiques ET isométriques — lis la description pour identifier la nature exacte de l'exercice et adapter le dosage via les protocoles ci-dessous.

## DOSAGE STANDARD PAR NIVEAU
- Niveau 1 : Conscience corporelle, mobilisation douce, activation légère, isométrie légère. 2-3×8-10, tenu 5-10s, repos 30-60s, 1×/jour ou quotidien
- Niveau 2 : Stabilisation, proprioception, charge progressive (HSR, excentrique débutant). 3×10-12, tempo contrôlé, repos 45-60s, 2-3×/semaine
- Niveau 3 : Renforcement fonctionnel avancé, endurance musculaire, exercices complexes. 3×12-15, charge modérée à élevée, repos 60-90s, 3×/semaine

## PROTOCOLES SPÉCIFIQUES — PRIORITÉ SUR LE DOSAGE STANDARD

### Tendinopathies phase aiguë/irritable — Isométrie analgésique (Rio 2015)
Identifier : exercices dont le **nom** commence par "Isométrie".
- Sets × reps : 4–5 répétitions × 1 contraction (champ sets=5, reps="1")
- Tenue : 30–45 s à 70–80 % de l'effort maximal toléré → hold_time=45
- Repos : 120 s entre répétitions → rest_time=120
- Fréquence : 2×/jour
- Notes : "Maintenir la contraction sans mouvement. Douleur EVA ≤ 3/10 acceptable."

### Tendinopathies phase sub-aiguë/chronique — Heavy Slow Resistance (Beyer 2015)
Identifier : exercices dont le **nom** contient "lourd lent (HSR)".
- Sets × reps : 4×8 → progresser vers 4×15 sur 12 semaines → sets=4, reps="8-15"
- Tempo : 3 s concentrique — 0 s pause — 3 s excentrique
- Repos : 120–180 s → rest_time=150
- Fréquence : 3×/semaine (jamais 2 jours consécutifs)
- Notes : "Tempo 3-0-3. Charge perçue 7-8/10. Douleur EVA ≤ 5/10 acceptable pendant l'effort."

### Tendinopathies — Excentrique pur (Alfredson 1998)
Identifier : exercices dont le **nom** contient "excentrique".
- Sets × reps : 3×15 → sets=3, reps="15"
- Tempo : descente contrôlée 3 s, remontée passive sur 2 jambes
- Repos : 60–90 s → rest_time=60
- Fréquence : 2×/jour, 7j/7, sur 12 semaines
- Notes : "Phase excentrique uniquement lors de la descente. Douleur EVA ≤ 5/10 tolérable et attendue."

### Nordic Hamstring Curl (van Dyk 2019, Petersen 2011)
Identifier : exercice dont le **nom** est "Nordic hamstring curl".
- Début de protocole : sets=3, reps="5-6"
- Tempo : descente la plus lente possible (objectif 5 s)
- Repos : 120 s → rest_time=120
- Fréquence : 2–3×/semaine (pas 2 jours consécutifs)
- Notes : "Remontée en poussant sur les mains. Allonger le temps de descente chaque semaine. Progresser vers 4×10 sur 6-8 semaines."

### McKenzie / Répétition directionnelle (Donelson 2012, Clare 2004)
Identifier : exercices dont le **nom** contient "Press-up lombaire", "Extension debout répétée" ou "Flexion lombaire répétée".
- Sets × reps : 1×10 (sets=1, reps="10")
- Pause 1 s en fin d'amplitude → hold_time=1
- Repos : minimal → rest_time=15
- Fréquence : 4–6 fois par jour
- Notes : "À répéter toutes les 2–3 heures. Arrêter si les symptômes périphériques s'aggravent. Objectif : centralisation de la douleur vers le centre."

### Copenhagen Plank (Haroy 2019)
Identifier : exercices dont le **nom** contient "Copenhagen plank".
- Phase 1 (version genou) : sets=3, hold_time=20, reps="1", rest_time=60
- Phase 2 (version cheville) : sets=3, hold_time=20, reps="1", rest_time=90
- Fréquence : 3×/semaine
- Notes : "Maintenir le bassin en ligne neutre. Ne pas laisser tomber la hanche."

### Star Excursion Balance (Gribble 2012)
Identifier : exercices dont le **nom** contient "Star Excursion".
- sets=3, reps="3 atteintes", rest_time=30
- Notes : "Mesurer et noter la distance d'atteinte maximale. Objectif : améliorer la symétrie entre les deux membres."

### Respiration diaphragmatique (Hodges 2003, Kolar 2009)
Identifier : exercices dont le **nom** contient "Respiration diaphragmatique" ou "Breathing squat".
- sets=3, reps="6-8 respirations", rest_time=30
- Notes : "Inspiration 4 s — expansion 360° (ventre, flancs, dos). Expiration 6 s. Ne pas élever les épaules."

## SÉCURITÉ ET CONTRE-INDICATIONS
- Repérer drapeaux rouges dans les antécédents (fracture récente, néoplasie, infection, AVC)
- EVA ≤ 3/10 en règle générale (sauf protocoles isométriques/excentriques spécifiés ci-dessus)
- Adapter à l'âge, comorbiditiés et niveau d'activité habituel
- Post-chirurgical : respecter les délais de cicatrisation (min 6 semaines avant charge excentrique)

## FORMAT DE RÉPONSE (JSON strict, sans markdown)
{
  "title": "Titre court du programme (ex: Tendinopathie Achille — protocole isométrique analgésique)",
  "clinical_notes": "Justification EBP en 2-3 phrases pour le PRATICIEN. Mentionner le protocole choisi et les bases scientifiques utilisées. Langage clinique.",
  "patient_intro": "Message d'introduction POUR LE PATIENT (2-3 phrases). Expliquer avec bienveillance POURQUOI ces exercices l'aideront, en langage simple et encourageant.",
  "vigilance_points": "Points de vigilance pour le patient. Liste de 3-5 signes qui doivent l'amener à stopper l'exercice ou contacter son praticien. Chaque item sur une nouvelle ligne commençant par '• '. Langage simple.",
  "weekly_routine": "Description courte de la routine hebdomadaire recommandée. Ex: '3 fois par semaine, avec au moins 1 jour de repos entre chaque séance. Durée estimée : 25 minutes.' Langage patient.",
  "items": [
    {
      "exercise_idx": 0,
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
- Durée estimée ≤ durée_max_minutes
- Exercices ordonnés : échauffement/mobilité → stabilisation/motricité → renforcement → étirement
- Diversité : 1-2 mobilité, 2-4 renfo/stabilisation, 0-1 étirement selon contexte
- Tendinopathie : choisir UN seul protocole adapté à la phase
- Utiliser UNIQUEMENT les exercise_idx de la liste fournie (entier, pas une chaîne)
- Répondre en JSON pur, sans bloc de code markdown
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

    // CSV format with sequential index instead of JSON with UUIDs
    // Saves ~60% of exercise list tokens (no repeated keys, no UUIDs, no descriptions)
    const exerciseLines = exerciseList
      .map((e, i) => `${i},${e.name},${e.region},${e.type},${e.level}`)
      .join('\n')
    const exerciseBlock = `## EXERCICES DISPONIBLES (${exerciseList.length})\nFormat: idx,nom,région,type,niveau\n${exerciseLines}`

    const consultationSections: string[] = [
      `## PATIENT\n${patientCtx.length > 0 ? patientCtx.join('\n') : 'Données non renseignées'}`,
    ]
    if (consultation?.reason) consultationSections.push(`## MOTIF\n${consultation.reason}`)
    if (consultation?.anamnesis) consultationSections.push(`## ANAMNÈSE\n${consultation.anamnesis}`)
    if (consultation?.examination) consultationSections.push(`## EXAMEN CLINIQUE\n${consultation.examination}`)
    consultationSections.push(`## DIAGNOSTIC DU PRATICIEN\n${diagnostic}`)
    consultationSections.push(`## PARAMÈTRES\nNiveau : ${level}/3\nDurée max séance : ${max_duration_minutes} minutes`)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: [
              // Exercise list first (stable for a given level) → cache hit across patients
              {
                type: 'text',
                text: exerciseBlock,
                cache_control: { type: 'ephemeral' },
              },
              // Patient-specific data (varies) → always fresh
              {
                type: 'text',
                text: consultationSections.join('\n\n'),
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(55000),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.error('[generate-exercise-prescription] Anthropic', aiRes.status, err.substring(0, 200))
      return NextResponse.json({ error: `Erreur IA (${aiRes.status})` }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const content = (aiData.content?.[0]?.text ?? '').trim()

    if (aiData.stop_reason === 'max_tokens') {
      console.error('[generate-exercise-prescription] response truncated (stop_reason=max_tokens), length:', content.length)
    }

    let parsed: {
      title: string
      clinical_notes: string
      patient_intro?: string | null
      vigilance_points?: string | null
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
    try {
      let json = content.replace(/```(?:json)?/gi, '').trim()
      const first = json.indexOf('{')
      const last = json.lastIndexOf('}')
      if (first !== -1 && last > first) json = json.slice(first, last + 1)
      parsed = JSON.parse(json)
    } catch {
      console.error('[generate-exercise-prescription] JSON parse fail:', content.substring(0, 300))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    // Map index back to exercise
    const enrichedItems = (parsed.items || [])
      .map(item => {
        const exercise = exerciseList[item.exercise_idx]
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
      patient_intro: parsed.patient_intro ?? null,
      vigilance_points: parsed.vigilance_points ?? null,
      weekly_routine: parsed.weekly_routine ?? null,
      items: enrichedItems,
    })
  } catch (err) {
    console.error('[generate-exercise-prescription] unhandled:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
