/**
 * Parcours régionaux : types partagés et libellés d'affichage.
 *
 * Les requêtes restent dans les pages (client Supabase du navigateur, RLS
 * appliquée). Ce module ne porte que ce qui serait dupliqué autrement : la
 * forme des lignes, les libellés des énumérations et les helpers d'affichage.
 */

export type RegionModule = {
  id: string
  region: string
  slug: string
  title: string
  subtitle: string | null
  intro_html: string | null
  cover_image_url: string | null
  objectives: string[]
  prerequisites: string | null
  estimated_hours: number | null
  status: 'draft' | 'published' | 'archived'
  is_free_access: boolean
  order_index: number
}

export type RegionChapterKind =
  | 'fondamentaux' | 'raisonnement' | 'triage' | 'anamnese'
  | 'examen' | 'diagnostic' | 'traitement' | 'reorientation' | 'cas_clinique'

export type RegionChapter = {
  id: string
  module_id: string
  slug: string
  title: string
  subtitle: string | null
  part: string | null
  kind: RegionChapterKind
  summary: string | null
  objectives: string[]
  key_points: string[]
  estimated_minutes: number | null
  order_index: number
  is_free_access: boolean
}

export type SectionCallout =
  | 'none' | 'cle' | 'drapeau_rouge' | 'preuve' | 'piege' | 'pratique' | 'reorientation'

export type RegionSection = {
  id: string
  chapter_id: string
  title: string | null
  body_html: string
  callout: SectionCallout
  order_index: number
}

export type TechniqueApproach =
  | 'hvla' | 'lvla' | 'mwm' | 'mckenzie' | 'exercice' | 'neurodynamique'
  | 'dry_needling' | 'tissus_mous' | 'education' | 'auto_traitement' | 'adjuvant'

export type EvidenceLevel = 'fort' | 'modere' | 'faible' | 'incertain' | 'non_recommande'

export type RegionTechnique = {
  id: string
  chapter_id: string
  name: string
  approach: TechniqueApproach
  description_html: string | null
  indications: string | null
  contraindications: string | null
  dosage: string | null
  evidence_level: EvidenceLevel
  evidence_summary: string | null
  practice_video_id: string | null
  vimeo_url: string | null
  to_film: boolean
  film_brief: string | null
  order_index: number
}

export type RegionReference = {
  id: string
  chapter_id: string
  citation: string
  year: number | null
  source_type: string
  takeaway: string | null
  url: string | null
  order_index: number
}

/** Ordre d'affichage des parties dans le sommaire, indépendant de l'ordre alphabétique. */
export const PART_ORDER = [
  'Comprendre',
  'Trier',
  'Interroger et examiner',
  'Diagnostiquer',
  'Traiter',
  'Orienter',
  'Intégrer',
] as const

export function sortParts(parts: string[]): string[] {
  const rank = (p: string) => {
    const i = (PART_ORDER as readonly string[]).indexOf(p)
    return i === -1 ? PART_ORDER.length : i
  }
  return [...parts].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'fr'))
}

export const KIND_LABELS: Record<RegionChapterKind, string> = {
  fondamentaux: 'Fondamentaux',
  raisonnement: 'Raisonnement',
  triage: 'Triage',
  anamnese: 'Anamnèse',
  examen: 'Examen',
  diagnostic: 'Diagnostic',
  traitement: 'Traitement',
  reorientation: 'Réorientation',
  cas_clinique: 'Cas clinique',
}

export const APPROACH_LABELS: Record<TechniqueApproach, string> = {
  hvla: 'HVLA',
  lvla: 'Mobilisation (LVLA)',
  mwm: 'MWM / Mulligan',
  mckenzie: 'McKenzie / MDT',
  exercice: 'Exercice',
  neurodynamique: 'Neurodynamique',
  dry_needling: 'Puncture sèche',
  tissus_mous: 'Tissus mous',
  education: 'Éducation',
  auto_traitement: 'Auto-traitement',
  adjuvant: 'Adjuvant',
}

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  fort: 'Preuve forte',
  modere: 'Preuve modérée',
  faible: 'Preuve faible',
  incertain: 'Preuve incertaine',
  non_recommande: 'Non recommandé',
}

/**
 * Le niveau de preuve est un axe ordonné, du mieux établi au déconseillé :
 * les couleurs suivent cet axe plutôt que la palette des étiquettes voisines,
 * pour qu'un coup d'œil suffise à hiérarchiser deux techniques.
 */
export const EVIDENCE_STYLES: Record<EvidenceLevel, string> = {
  fort: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  modere: 'bg-sky-50 text-sky-700 border-sky-200',
  faible: 'bg-amber-50 text-amber-700 border-amber-200',
  incertain: 'bg-slate-100 text-slate-600 border-slate-200',
  non_recommande: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  recommandation: 'Recommandation',
  revue_systematique: 'Revue systématique',
  meta_analyse: 'Méta-analyse',
  essai_randomise: 'Essai randomisé',
  etude: 'Étude',
  consensus: 'Consensus',
  ouvrage: 'Ouvrage',
}

export const PATHOLOGY_ROLE_LABELS: Record<string, string> = {
  principal: 'Diagnostic principal',
  differentiel: 'Diagnostic différentiel',
  drapeau_rouge: 'Drapeau rouge',
}

/** Lecteur Vimeo : accepte un identifiant ou une URL, renvoie l'URL d'embed. */
export function vimeoEmbedUrl(vimeoId?: string | null, vimeoUrl?: string | null): string | null {
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`
  if (!vimeoUrl) return null
  try {
    const parsed = new URL(vimeoUrl)
    if (parsed.hostname.includes('player.vimeo.com')) return vimeoUrl
    const id = parsed.pathname.split('/').filter(Boolean).pop()
    return id ? `https://player.vimeo.com/video/${id}` : null
  } catch {
    return null
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m}` : `${h} h`
}
