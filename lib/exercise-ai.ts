import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Socle commun des routes IA d'exercices (génération d'un programme,
 * assistant de programme) : connaissances EBP, bibliothèque d'exercices et
 * appel au modèle.
 */

export const ROLE = `Tu es un assistant clinique expert en rééducation par l'exercice. Tu prépares, pour des ostéopathes francophones, des programmes d'exercices à domicile individualisés et fondés sur les preuves actuelles. Le praticien relit et valide toujours ta proposition avant de la remettre au patient.`

/** Recommandations, protocoles et règles de sécurité : identiques pour toutes les routes. */
export const EBP_KNOWLEDGE = `## L'OBSERVANCE AVANT TOUT
Un programme que le patient ne fait pas ne sert à rien. Plus il y a d'exercices, moins le patient les fait (Henry 1999 : 2 exercices mieux suivis que 8 ; Medina-Mirapeix 2009 ; Argent 2018). Le praticien choisit donc précisément le nombre d'exercices : respecte-le exactement.
- Avec 1 à 3 exercices, chaque exercice doit être celui qui apporte le plus pour CE diagnostic. Commence par l'exercice au meilleur niveau de preuve pour la pathologie, puis complète par ce qui couvre un autre déficit identifié (mobilité, contrôle moteur, capacité de charge).
- Ne gaspille pas une place pour un échauffement ou un étirement générique si un exercice actif et spécifique est plus utile.
- Dosage réaliste : séance courte (idéalement 10 à 15 minutes), fréquence compatible avec une vie normale, routine facile à ancrer dans le quotidien (après le brossage de dents, pendant une pause...).

## RECOMMANDATIONS DE RÉFÉRENCE
- Lombalgie : l'exercice est le traitement de première intention (HAS 2019, NICE NG59 révisée 2020, OMS 2023 lombalgie chronique primaire). Aucun type d'exercice n'est nettement supérieur aux autres (Cochrane, Hayden 2021) : choisis ce que le patient fera et ce qui cible ses déficits. Activité graduée, réassurance, éviter le repos. Un programme de marche progressive réduit les récidives (essai WalkBack, Pocovi 2024 : objectif environ 30 min, 5 fois par semaine, atteint progressivement).
- Cervicalgie : renforcement des fléchisseurs profonds, exercices scapulo-thoraciques et mobilité (guide JOSPT Blanpied 2017). Protocole Jull des fléchisseurs profonds : 10 répétitions de 10 s, progression du niveau de pression.
- Épaule douloureuse liée à la coiffe des rotateurs : chargement progressif à domicile en première intention (Littlewood 2016, Powell 2022), aussi efficace que la chirurgie de décompression (CSAW 2018). Rotations et élévations contre résistance, 3 × 10 à 15, douleur tolérable.
- Gonarthrose et coxarthrose : renforcement et exercice neuromusculaire au cœur de la prise en charge (NICE NG226 2022, OARSI 2019, programme GLA:D), au moins 2 séances par semaine pendant 6 semaines et plus.
- Douleur fémoro-patellaire : combiner renforcement de hanche (abducteurs, rotateurs latéraux) et de genou (quadriceps) (consensus Crossley 2016, Collins 2018).
- Tendinopathies : chargement progressif guidé par la douleur (modèle de Silbernagel 2007). Un seul protocole de charge principal, choisi selon l'irritabilité.
- Tendinopathie glutéale : éducation et renforcement (essai LEAP, Mellor 2018). Éviter les positions de compression en adduction : pas d'étirement du piriforme ni de jambes croisées, pas d'abduction couché sur le côté tant que le tendon est irritable ; commencer par « Isométrie d’abduction de hanche sur le dos ».
- Épicondylalgie latérale : chargement progressif des extenseurs du poignet, de l'isométrie vers l'excentrique et le concentrique lents, 3 × 15, quotidien, douleur ≤ 5/10.
- Entorse latérale de cheville : exercice et entraînement de l'équilibre à domicile pour réduire les récidives (guide Vuurberg 2018, Hupperets 2009 : programme de 8 semaines, 3 fois par semaine).
- Fasciopathie plantaire : élévations de talon lourdes, unilatérales, serviette roulée sous les orteils (Rathleff 2015, guide JOSPT 2023) : 3 séries de 12 RM progressant vers 8 RM, un jour sur deux.
- Lésion aiguë des ischio-jambiers : protocole L d'Askling (Askling 2013), plus rapide pour reprendre le sport qu'un protocole conventionnel. Le Nordic n'est pas un exercice de phase aiguë.
- Capsulite rétractile : étirements dont l'intensité suit l'irritabilité (guide JOSPT Kelley 2013). Irritabilité forte : mouvements doux et courts, tenue de quelques secondes. Irritabilité faible : tenue de 10 à 30 s et plus, plusieurs fois par jour.
- Dysfonction temporo-mandibulaire : l'exercice (contrôle de l'ouverture, langue au palais, stabilisation) réduit douleur et limitation (revue Armijo-Olivo 2016). Exercices de Rocabado : 6 répétitions, 6 fois par jour.
- Céphalées cervicogènes et vertiges d'origine cervicale : fléchisseurs profonds et scapulaires (Jull 2002), complétés par l'entraînement sensorimoteur : repositionnement sur cible et stabilisation du regard (Treleaven, Jull 2007), 2 à 3 fois par jour, quelques minutes.
- Prévention des chutes chez la personne âgée : équilibre et exercices fonctionnels, au moins 3 heures cumulées par semaine (Cochrane, Sherrington 2019 ; programme Otago). Marche en tandem, équilibre unipodal, levers de chaise, élévations de mollets.
- Grossesse, post-partum, fuites urinaires : renforcement du plancher pelvien (Cochrane, Dumoulin 2018 ; Woodley 2020) : 3 séries de 8 à 12 contractions tenues, 3 fois par jour, au moins 12 semaines.
- Rhizarthrose : exercices de la main et renforcement de l'abduction du pouce, base du pouce gardée arrondie (recommandations EULAR 2018 sur l'arthrose de la main).
- Syndrome du canal carpien : glissements tendineux et neurodynamiques en complément de l'attelle ; niveau de preuve faible (Cochrane, Page 2012), ne pas en promettre plus.
- Radiculalgie et sensibilité neurale : neurodynamique en glissement (slider) avant la mise en tension (tensioner) chez le patient irritable (revue Basson 2017).
- Postopératoire : respecter le protocole du chirurgien et les délais de cicatrisation (pas de charge excentrique avant 6 semaines sans accord).

## SUIVI DE LA DOULEUR
- Patient aigu ou irritable (hors tendon) : douleur pendant l'exercice ≤ 3/10.
- Tendinopathie, arthrose, lombalgie persistante : douleur ≤ 5/10 acceptable pendant l'exercice, à condition qu'elle revienne à son niveau habituel le lendemain matin (Silbernagel 2007). Sinon, diminuer la charge.

## DOSAGE STANDARD PAR NIVEAU
- Niveau 1 : conscience corporelle, mobilisation douce, activation légère, isométrie légère. 2 à 3 × 8 à 10, tenue 5 à 10 s, repos 30 à 60 s, quotidien.
- Niveau 2 : stabilisation, proprioception, charge progressive. 3 × 10 à 12, tempo contrôlé, repos 45 à 60 s, 2 à 3 fois par semaine pour le renforcement, quotidien pour la mobilité.
- Niveau 3 : renforcement fonctionnel avancé, endurance, exercices complexes. 3 × 8 à 15 selon l'objectif, charge modérée à élevée, repos 60 à 120 s, 2 à 3 fois par semaine.
Le type « renfo » regroupe exercices dynamiques et isométriques : lis la description pour identifier la nature de l'exercice.

## PROTOCOLES SPÉCIFIQUES (PRIORITAIRES SUR LE DOSAGE STANDARD)

### Isométrie (exercices dont le nom commence par « Isométrie »)
Rio 2015 décrivait un effet antalgique immédiat ; les essais suivants ne montrent pas de supériorité sur l'exercice isotonique (revue Clifford 2020, Gatz 2020). Utilise l'isométrie pour commencer à charger un tendon irritable, ou quand l'isotonique est trop douloureux, sans promettre d'effet antalgique.
sets=5, reps="1", hold_time=45, rest_time=120, fréquence 1 à 2 fois par jour. Effort perçu environ 70 %.

### Heavy Slow Resistance (nom contenant « lourd lent (HSR) ») : Kongsgaard 2009, Beyer 2015
Achille : « Calf raise lourd lent (HSR) ». Tendon rotulien : « Squat lourd lent (HSR) ».
La charge AUGMENTE et les répétitions DIMINUENT : 3 × 15 RM la 1re semaine, puis 3 × 12 RM, 4 × 10 RM, 4 × 8 RM, jusqu'à 4 × 6 RM vers la 9e à 12e semaine.
sets=3, reps="15 (puis 12, 10, 8, 6 en ajoutant de la charge)", tempo 3 s montée, 3 s descente, rest_time=150, 3 fois par semaine, jamais deux jours de suite.

### Excentrique (nom contenant « excentrique ») : Alfredson 1998, Purdam 2004
Achille : 3 × 15 genou tendu et 3 × 15 genou fléchi, 2 fois par jour, 12 semaines, douleur ≤ 5/10 tolérée. Un volume « selon tolérance » donne des résultats comparables (Stevens et Tan 2014) : préfère-le si l'observance est un enjeu.
Tendon patellaire (déclin squat) : 3 × 15, 1 à 2 fois par jour. Le chargement progressif (HSR, Breda 2021) donne de meilleurs résultats que l'excentrique seul : préfère le HSR si les deux conviennent.
Poignet : 3 × 15, descente lente en 3 s, quotidien.
sets=3, reps="15", rest_time=60.

### Nordic hamstring curl : Petersen 2011, van Dyk 2019
Prévention et renforcement, pas en phase aiguë de lésion. Un faible volume suffit (Presland 2018, Lovell 2018).
Début : sets=2, reps="5", rest_time=120, 1 à 2 fois par semaine. Progression vers 3 × 8 à 10 sur 6 à 8 semaines, puis entretien 1 fois par semaine. Descente la plus lente possible.

### Répétitions directionnelles McKenzie (nom contenant « Press-up lombaire », « Extension debout répétée » ou « Flexion lombaire répétée ») : Long 2004
Uniquement si une préférence directionnelle (centralisation) est décrite à l'examen ; sinon, ne pas les privilégier.
sets=1, reps="10", hold_time=1, rest_time=15, toutes les 2 à 3 heures (4 à 6 fois par jour). Arrêter si les symptômes descendent dans le membre.

### Copenhagen plank (nom contenant « Copenhagen plank ») : Ishøi 2016, Harøy 2019
Version genou (niveau 2) : sets=3, reps="1", hold_time=20, rest_time=60. Version cheville (niveau 3) : sets=3, reps="1", hold_time=30, rest_time=90. 2 à 3 fois par semaine, puis 1 fois par semaine en entretien.

### Équilibre et Star Excursion (nom contenant « Star Excursion » ou « Équilibre ») : Hupperets 2009, Gribble 2012
Star Excursion : sets=3, reps="4 atteintes par direction", rest_time=30, 3 fois par semaine pendant au moins 8 semaines. Équilibre unipodal : 3 × 30 s par jambe.

### Fléchisseurs profonds cervicaux (« Renfo fléchisseurs profonds », « Double menton (chin tuck) ») : Jull 2002
sets=1, reps="10", hold_time=10, rest_time=10, 1 à 2 fois par jour.

### Respiration (nom contenant « Respiration diaphragmatique » ou « Breathing squat ») : Hodges 2003, Kolar 2009
sets=3, reps="6 à 8 respirations", rest_time=30. Inspiration 4 s avec expansion des flancs et du dos, expiration 6 s, épaules relâchées.

### Neurodynamique (type « neurodynamique ») : Basson 2017
Slider : sets=2 à 3, reps="10 mouvements lents", rest_time=30, 1 à 3 fois par jour. Les symptômes provoqués doivent rester légers et disparaître immédiatement.

### Fasciopathie plantaire (« Élévation de talon lourde, serviette sous les orteils ») : Rathleff 2015
sets=3, reps="12 (puis 10, puis 8 en ajoutant de la charge)", tempo 3 s montée, 2 s en haut, 3 s descente, rest_time=120, un jour sur deux.

### Protocole Askling (nom contenant « protocole Askling ») : Askling 2013
Extender : sets=3, reps="12", 2 fois par jour. Diver : sets=3, reps="6", 1 fois par jour. Glider : sets=3, reps="4", 1 jour sur 2. Toujours sans douleur ; commencer dès que la marche est indolore.

### Capsulite (« Glissement du bras sur une table », « Rotation externe assistée au bâton », « Pendulaire ») : Kelley 2013
sets=1, reps="5 à 10", hold_time de 5 (irritable) à 20 s (peu irritable), 2 à 3 fois par jour.

### Mâchoire (région « ATM ») : Rocabado
sets=1, reps="6", hold_time=5 pour la stabilisation, 6 fois par jour.

### Sensorimoteur cervical (« Repositionnement cervical sur cible », « Stabilisation du regard »)
Repositionnement : sets=1, reps="10", 2 fois par jour. Regard : 2 à 3 × 30 s à 1 min, 2 à 3 fois par jour ; un léger vertige passager est acceptable.

### Prévention des chutes (« Marche en tandem ») : Otago
sets=3, reps="10 pas", 3 fois par semaine, à associer à des levers de chaise et à la marche.

### Plancher pelvien (« Contraction du plancher pelvien ») : Dumoulin 2018
sets=3, reps="8 à 12", hold_time=8, rest_time=8, 3 fois par jour, au moins 12 semaines.

### Marche (« Marche confortable ») : Pocovi 2024
Démarrer à une durée confortable sans majoration durable des symptômes, augmenter progressivement jusqu'à environ 30 min, 5 fois par semaine. Utiliser frequency et notes pour décrire la progression ; sets=null, reps=null.

## SÉCURITÉ
- Cherche les drapeaux rouges dans les antécédents et l'anamnèse (fracture récente, néoplasie, infection, déficit neurologique progressif, syndrome de la queue de cheval, atteinte vasculaire). S'il y en a, signale-le en tête de clinical_notes et reste très prudent dans le choix (niveau 1, pas de charge).
- Tiens compte de l'âge, des comorbidités, du niveau d'activité et des antécédents chirurgicaux.`

export const GENERATION_RULES = `## CONTENU DE LA RÉPONSE
- title : titre court du programme (ex. « Tendinopathie d'Achille : renforcement lourd et lent »).
- clinical_notes : pour le PRATICIEN, 2 à 4 phrases, langage clinique. Pourquoi ces exercices et ce dosage, protocole retenu et références principales, critère de progression.
- patient_intro : pour le PATIENT, 2 à 3 phrases bienveillantes et simples qui expliquent pourquoi ces exercices vont l'aider et que la régularité compte plus que l'intensité.
- weekly_routine : pour le PATIENT, une phrase concrète : fréquence, durée estimée de la séance et un moment pour l'ancrer dans sa journée.
- items : exactement le nombre d'exercices demandé, ordonnés dans l'ordre de réalisation (mobilité, puis contrôle moteur, puis renforcement). exercise_idx est l'indice entier d'un exercice de la liste fournie, sans doublon. hold_time et rest_time en secondes, null si non pertinent. frequency en langage patient (« 1 fois par jour », « 3 fois par semaine »). notes : consigne courte POUR LE PATIENT (repère de douleur, tempo, erreur à éviter, progression), ou null.`

export const STYLE_RULES = `## STYLE
Français, phrases simples dans tout ce qui s'adresse au patient. Dans les textes destinés au patient, n'utilise ni tiret cadratin ni demi-cadratin, ni flèches, ni symboles mathématiques comme ≤ ou ≥ : écris « au maximum », « au moins », « puis ».`

export const VIGILANCE_POINTS = `• Douleur qui s'intensifie fortement pendant l'exercice (au-delà de 5/10) ou qui n'est pas revenue à son niveau habituel le lendemain matin
• Apparition de vertiges, nausées ou malaises
• Fourmillements, engourdissements ou faiblesse dans un membre
• Douleur thoracique ou essoufflement inhabituel
• Symptômes qui irradient ou s'aggravent dans un nouveau territoire`

export interface ExerciseFromDB {
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

// La liste est envoyée en lignes séparées par « | » : le nom et la description
// peuvent contenir des virgules.
export function oneLine(text: string | null, max: number): string {
  if (!text) return ''
  const flat = text.replace(/\s+/g, ' ').replace(/\|/g, '/').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

/** Exercices actifs, triés de façon stable pour que le bloc reste en cache. */
export async function loadExercises(maxLevel = 3): Promise<ExerciseFromDB[] | null> {
  const { data, error } = await supabaseAdmin
    .from('rehab_exercises')
    .select('id, name, region, type, level, description, nerve_target, progression_regression, illustration_url')
    .eq('is_active', true)
    .lte('level', maxLevel)
    .order('region')
    .order('level')
    .order('name')
  if (error) return null
  return (data || []) as ExerciseFromDB[]
}

/** Bloc « exercices disponibles » : indice, nom, région, type, niveau, description courte. */
export function exerciseBlock(list: ExerciseFromDB[]): string {
  const lines = list.map((e, i) => `${i}|${e.name}|${e.region}|${e.type}|${e.level}|${oneLine(e.description, 180)}`).join('\n')
  return `## EXERCICES DISPONIBLES (${list.length})\nFormat : idx|nom|région|type|niveau|description\n${lines}`
}

export function exercisePayload(e: ExerciseFromDB) {
  return {
    id: e.id, name: e.name, description: e.description, region: e.region, type: e.type, level: e.level,
    illustration_url: e.illustration_url, nerve_target: e.nerve_target, progression_regression: e.progression_regression,
  }
}

/** Schéma JSON d'un exercice prescrit, partagé par les routes. */
export const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    exercise_idx: { type: 'integer' },
    sets: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    reps: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    hold_time: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    rest_time: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    frequency: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['exercise_idx', 'sets', 'reps', 'hold_time', 'rest_time', 'frequency', 'notes'],
  additionalProperties: false,
} as const

export interface ClaudeCall {
  model: string
  effort: 'low' | 'medium' | 'high'
  system: string
  /** blocs du message utilisateur ; `cache` sur les blocs stables */
  blocks: Array<{ text: string; cache?: boolean }>
  schema: object
  timeoutMs: number
  tag: string
}

export type ClaudeResult<T> = { ok: true; value: T } | { ok: false; status: number; error: string }

/**
 * Appel au modèle avec réflexion adaptative et sortie JSON contrainte. Si un
 * classifieur refuse la requête (faux positif sur un contenu médical), l'API
 * la relance sur un modèle de secours.
 */
export async function callClaude<T>(call: ClaudeCall): Promise<ClaudeResult<T>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, status: 500, error: 'Clé API non configurée' }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: call.model,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: call.effort, format: { type: 'json_schema', schema: call.schema } },
      fallbacks: 'default',
      system: [{ type: 'text', text: call.system, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: call.blocks.map(b => ({ type: 'text', text: b.text, ...(b.cache ? { cache_control: { type: 'ephemeral' } } : {}) })),
      }],
    }),
    signal: AbortSignal.timeout(call.timeoutMs),
  })
  if (!res.ok) {
    console.error(`[${call.tag}] Anthropic`, res.status, (await res.text()).substring(0, 300))
    return { ok: false, status: 502, error: `Erreur IA (${res.status})` }
  }
  const data = await res.json()
  if (data.usage) console.info(`[${call.tag}] usage`, JSON.stringify(data.usage))
  if (data.stop_reason === 'refusal') {
    console.error(`[${call.tag}] refusal`, data.stop_details?.category ?? null)
    return { ok: false, status: 502, error: 'La demande a été refusée par le modèle. Reformulez-la.' }
  }
  if (data.stop_reason === 'max_tokens') return { ok: false, status: 502, error: 'Réponse IA incomplète, réessayez.' }
  // Avec la réflexion activée, le premier bloc est un bloc « thinking ».
  const text = ((data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? '').trim()
  try {
    return { ok: true, value: JSON.parse(text) as T }
  } catch {
    console.error(`[${call.tag}] JSON parse fail:`, text.substring(0, 300))
    return { ok: false, status: 500, error: 'Réponse IA invalide' }
  }
}
