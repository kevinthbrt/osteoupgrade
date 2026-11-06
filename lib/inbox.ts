/**
 * Boîte mail admin : classement, conversations et réglages (côté serveur).
 *
 * Le classement suit un ordre fixe, du plus sûr au plus deviné :
 *   1. les règles écrites dans l'admin (`inbox_rules`), toujours prioritaires ;
 *   2. le spam, sauf pour un expéditeur qui a un compte ;
 *   3. les messages automatiques (notifications internes, absences, rebonds) ;
 *   4. les mots-clés métier (facturation, parrainage, support, prospection) ;
 *   5. l'IA, en dernier recours, uniquement si rien de sûr n'a tranché.
 */

import { supabaseAdmin } from './supabase-server'
import { htmlToText, isCategory, normalizeSubject, type InboxCategory, type InboxLayout, type InboxStatus } from './inbox-render'

// ── Réglages ───────────────────────────────────────────────────────────────

export interface InboxSettings {
  from_name: string
  signature: string
  default_layout: InboxLayout
  quote_original: boolean
  ai_enabled: boolean
  notify_categories: string[]
}

const DEFAULT_SETTINGS: InboxSettings = {
  from_name: 'OsteoUpgrade',
  signature: 'Belle journée,\nL’équipe OsteoUpgrade × MyOsteoflow',
  default_layout: 'simple',
  quote_original: true,
  ai_enabled: true,
  notify_categories: ['support', 'facturation', 'parrainage'],
}

export async function getInboxSettings(): Promise<InboxSettings> {
  const { data } = await supabaseAdmin.from('inbox_settings').select('*').eq('id', 1).maybeSingle()
  return { ...DEFAULT_SETTINGS, ...(data || {}) }
}

// ── En-têtes ───────────────────────────────────────────────────────────────

/** Les en-têtes arrivent en objet ou en liste `{name, value}` selon la source. */
export function normalizeHeaders(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw) return out
  if (Array.isArray(raw)) {
    for (const h of raw) {
      const name = (h as any)?.name ?? (h as any)?.key
      const value = (h as any)?.value
      if (typeof name === 'string' && value != null) out[name.toLowerCase()] = String(value)
    }
    return out
  }
  if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v != null) out[k.toLowerCase()] = Array.isArray(v) ? v.join(' ') : String(v)
    }
  }
  return out
}

/** Extrait les identifiants `<...>` d'un en-tête References / In-Reply-To. */
export function parseMessageIds(value?: string | null): string[] {
  if (!value) return []
  return Array.from(value.matchAll(/<[^<>\s]+>/g)).map((m) => m[0])
}

// ── Classement ─────────────────────────────────────────────────────────────

export interface ClassifyInput {
  fromEmail: string
  fromName?: string | null
  subject: string
  text: string
  headers: Record<string, string>
  isKnownCustomer: boolean
}

export interface Classification {
  category: InboxCategory
  status: InboxStatus
  source: 'auto' | 'rule'
  reason: string
  /** Faux quand seule la catégorie par défaut a été retenue : l'IA peut alors trancher. */
  confident: boolean
  ruleId?: string
}

interface Rule {
  id: string
  field: 'from' | 'domain' | 'subject' | 'body'
  pattern: string
  category: InboxCategory
  mark_done: boolean
  priority: number
}

const OWN_DOMAIN = 'osteo-upgrade.fr'

// Bureaux d'enregistrement et hébergeurs réels : leurs relances de domaine ne
// doivent pas tomber dans le spam avec les arnaques qui les imitent.
const TRUSTED_DOMAINS = [
  'ovh.com', 'ovh.net', 'ovhcloud.com', 'gandi.net', 'ionos.fr', 'ionos.com', 'vercel.com',
  'google.com', 'supabase.com', 'supabase.io', 'stripe.com', 'resend.com', 'github.com', 'apple.com',
]

const IMPERSONATED_BRANDS: [string, string[]][] = [
  ['ovh', ['ovh.com', 'ovh.net', 'ovhcloud.com', 'ovh.fr']],
  ['paypal', ['paypal.com', 'paypal.fr']],
  ['stripe', ['stripe.com']],
  ['vercel', ['vercel.com']],
  ['ionos', ['ionos.fr', 'ionos.com']],
  ['gandi', ['gandi.net']],
]

const FREEMAIL = ['gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'yahoo.com', 'yahoo.fr', 'live.fr', 'icloud.com', 'laposte.net', 'orange.fr', 'free.fr', 'sfr.fr', 'wanadoo.fr']

/** Échappe `%` et `_` pour une comparaison exacte avec `ilike`. */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`)
}

function domainOf(email: string): string {
  return email.split('@')[1]?.toLowerCase() || ''
}

function matchesDomain(domain: string, list: string[]): boolean {
  return list.some((d) => domain === d || domain.endsWith(`.${d}`))
}

/** Minuscules et sans accents, pour comparer « problème » et « probleme ». */
function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function ruleMatches(rule: Rule, input: ClassifyInput): boolean {
  const pattern = fold(rule.pattern.trim())
  if (!pattern) return false
  switch (rule.field) {
    case 'from':
      return fold(input.fromEmail) === pattern || fold(input.fromEmail).includes(pattern)
    case 'domain': {
      const d = domainOf(input.fromEmail)
      return d === pattern || d.endsWith(`.${pattern}`)
    }
    case 'subject':
      return fold(input.subject).includes(pattern)
    case 'body':
      return fold(input.text.slice(0, 5000)).includes(pattern)
  }
}

function isAutomatic(input: ClassifyInput): string | null {
  const from = input.fromEmail.toLowerCase()
  const local = from.split('@')[0] || ''
  const h = input.headers
  const subject = fold(input.subject)

  // Nos propres formulaires (signalement de bug, contact) passent par
  // no-reply@ : ce sont des demandes à traiter, pas des notifications.
  if (domainOf(from) === OWN_DOMAIN) {
    return /signalement|bug|contact|demande|question/.test(subject) ? null : 'Notification interne'
  }
  if (/(^|[-_.])(no-?reply|noreply|notifications?|mailer-daemon|postmaster|bounces?)([-_.]|$)/.test(local)) {
    return 'Expéditeur automatique'
  }
  if (h['auto-submitted'] && h['auto-submitted'].toLowerCase() !== 'no') return 'Réponse automatique'
  if (h['x-autoreply'] || h['x-autorespond']) return 'Réponse automatique'
  if (/^(reponse automatique|automatic reply|auto(-|matic )?reply|out of office|absent|absence)/.test(subject)) {
    return 'Réponse automatique'
  }
  if (/(undeliverable|delivery status|non remis|mail delivery failed|echec de (la )?remise)/.test(subject)) {
    return 'Message non distribué'
  }
  return null
}

const SPAM_PATTERNS: [RegExp, number][] = [
  [/domaine.*(expir|renouvel|regularis|suspen|desactiv)|(expir|renouvel|regularis|suspen).*domaine/, 3],
  [/facture impayee|paiement (refuse|echoue)|echec du paiement|informations de facturation/, 2],
  [/action (immediate|requise)|dernier rappel|\burgent\b|compte (suspendu|bloque)/, 2],
  [/solde (de|cpf)|\bcpf\b|panneaux solaires|aides? de l.etat|pompe a chaleur|isolation a 1/, 3],
  [/colis|livraison en attente|element en attente/, 2],
  [/crypto|bitcoin|casino|viagra|gagnant|loterie|heritage/, 3],
  [/sondage.*clients|invitation sondage|carte cadeau/, 2],
]

const KEYWORDS: [InboxCategory, RegExp][] = [
  ['parrainage', /parrain|filleul|commission|referral|code (de )?parrainage|affiliation/],
  ['facturation', /factur|paiement|prelevement|rembours|abonnement|resili|desabonn|tarif|\bprix\b|carte bancaire|changement d.offre|annuel|mensuel/],
  ['support', /\baide\b|aidez|probleme|souci|\bbug\b|erreur|connexion|connecter|mot de passe|acces|impossible|fonctionne pas|marche pas|ne s.affiche|bloque|question|comment (faire|puis|on)|telecharg|install|myosteoflow|osteoflow|video|module|compte/],
  ['prospection', /proposition|partenariat|accompagnement|analyse gratuite|audit|\bseo\b|referencement|visibilite|collaboration|prise de rendez-vous|nouvel elan|votre site|developper votre|prospect|agence|expertise comptable|offre speciale/],
]

/** Classement déterministe (règles + heuristiques). L'IA intervient ensuite. */
export async function classifyEmail(input: ClassifyInput): Promise<Classification> {
  // 1. Règles de l'admin.
  const { data: rules } = await supabaseAdmin
    .from('inbox_rules')
    .select('id, field, pattern, category, mark_done, priority')
    .eq('is_active', true)
    .order('priority', { ascending: true })

  for (const rule of (rules || []) as Rule[]) {
    if (ruleMatches(rule, input)) {
      const auto = rule.category === 'spam' || rule.category === 'notification'
      return {
        category: rule.category,
        status: rule.mark_done || auto ? 'done' : 'todo',
        source: 'rule',
        reason: `Règle : ${labelField(rule.field)} « ${rule.pattern} »`,
        confident: true,
        ruleId: rule.id,
      }
    }
  }

  const subject = fold(input.subject)
  const body = fold(input.text.slice(0, 3000))
  const domain = domainOf(input.fromEmail)

  // 2. Spam, avant les expéditeurs automatiques : les arnaques arrivent souvent
  //    d'une adresse « noreply ». Jamais pour un client connu, un prestataire
  //    de confiance ou nos propres formulaires.
  if (!input.isKnownCustomer && domain !== OWN_DOMAIN && !matchesDomain(domain, TRUSTED_DOMAINS)) {
    let score = 0
    const motifs: string[] = []
    for (const [re, poids] of SPAM_PATTERNS) {
      if (re.test(subject)) { score += poids; motifs.push(re.source.split('|')[0]) }
      else if (re.test(body)) score += Math.max(1, poids - 1)
    }
    // Une adresse gratuite qui parle de domaine ou de facture : arnaque classique.
    if (matchesDomain(domain, FREEMAIL) && /domaine|factur|paiement|renouvel/.test(subject)) score += 2
    // Notre propre nom de domaine dans l'objet, envoyé par un inconnu.
    if (subject.includes(OWN_DOMAIN)) score += 1
    // Usurpation de marque : le message se réclame d'un prestataire connu
    // (OVHcloud surtout, dans le courrier réellement reçu) sans venir de son
    // domaine.
    for (const [marque, domaines] of IMPERSONATED_BRANDS) {
      if ((subject.includes(marque) || body.includes(marque)) && !matchesDomain(domain, domaines)) {
        score += 3
        break
      }
    }
    if (score >= 3) {
      return { category: 'spam', status: 'done', source: 'auto', reason: 'Motifs d’hameçonnage ou de démarchage abusif', confident: true }
    }
  }

  // 3. Messages automatiques.
  const auto = isAutomatic(input)
  if (auto) {
    return { category: 'notification', status: 'done', source: 'auto', reason: auto, confident: true }
  }

  // 4. Mots-clés métier, l'objet d'abord puis le corps.
  for (const zone of [subject, body]) {
    for (const [category, re] of KEYWORDS) {
      if (category === 'prospection' && input.isKnownCustomer) continue
      if (re.test(zone)) {
        return {
          category,
          status: category === 'prospection' ? 'done' : 'todo',
          source: 'auto',
          reason: zone === subject ? 'Mots-clés dans l’objet' : 'Mots-clés dans le message',
          confident: zone === subject,
        }
      }
    }
  }

  // 5. Rien de sûr : un client est présumé avoir besoin d'aide.
  if (input.isKnownCustomer) {
    return { category: 'support', status: 'todo', source: 'auto', reason: 'Expéditeur client', confident: false }
  }
  return { category: 'general', status: 'todo', source: 'auto', reason: 'Aucun motif reconnu', confident: false }
}

export function labelField(field: string): string {
  return { from: 'expéditeur', domain: 'domaine', subject: 'objet', body: 'contenu' }[field] || field
}

/** Comptabilise l'usage d'une règle (pour repérer celles qui ne servent plus). */
export async function recordRuleHit(ruleId: string) {
  const { data } = await supabaseAdmin.from('inbox_rules').select('hit_count').eq('id', ruleId).maybeSingle()
  await supabaseAdmin
    .from('inbox_rules')
    .update({ hit_count: (data?.hit_count || 0) + 1, last_hit_at: new Date().toISOString() })
    .eq('id', ruleId)
}

// ── Conversations ──────────────────────────────────────────────────────────

export interface ThreadMatch {
  thread_id: string
  category: InboxCategory
  category_source: string
}

/**
 * Retrouve la conversation d'un message entrant.
 *
 * D'abord par les en-têtes : nos réponses portent `In-Reply-To` et
 * `References` vers le message d'origine, et les clients mail recopient
 * `References` en répondant, donc la réponse du client cite forcément un
 * identifiant déjà en base. À défaut (client mail qui les supprime), même
 * expéditeur et même objet sur les 90 derniers jours.
 */
export async function findThread(params: {
  fromEmail: string
  subject: string
  messageIds: string[]
}): Promise<ThreadMatch | null> {
  const ids = Array.from(new Set(params.messageIds)).slice(0, 50)
  if (ids.length) {
    const { data } = await supabaseAdmin
      .from('received_emails')
      .select('thread_id, category, category_source')
      .in('resend_message_id', ids)
      .order('received_at', { ascending: false })
      .limit(1)
    if (data?.[0]) return data[0] as ThreadMatch
  }

  const sujet = normalizeSubject(params.subject)
  if (!sujet || sujet.length < 4) return null
  const depuis = new Date(Date.now() - 90 * 86400000).toISOString()
  const { data } = await supabaseAdmin
    .from('received_emails')
    .select('thread_id, category, category_source, subject')
    .ilike('from_email', escapeLike(params.fromEmail))
    .gte('received_at', depuis)
    .order('received_at', { ascending: false })
    .limit(30)
  const match = (data || []).find((r: any) => normalizeSubject(r.subject || '').toLowerCase() === sujet.toLowerCase())
  if (match) return { thread_id: match.thread_id, category: match.category, category_source: match.category_source }

  // Une réponse à l'un de nos envois depuis la boîte (objet « Re: ... »).
  const { data: envois } = await supabaseAdmin
    .from('inbox_replies')
    .select('thread_id, subject')
    .ilike('to_email', escapeLike(params.fromEmail))
    .gte('created_at', depuis)
    .order('created_at', { ascending: false })
    .limit(30)
  const envoi = (envois || []).find((r: any) => normalizeSubject(r.subject || '').toLowerCase() === sujet.toLowerCase())
  if (envoi) {
    const { data: tete } = await supabaseAdmin
      .from('received_emails')
      .select('thread_id, category, category_source')
      .eq('thread_id', envoi.thread_id)
      .limit(1)
    if (tete?.[0]) return tete[0] as ThreadMatch
    // Réponse à un nouveau message écrit depuis la boîte : le fil n'a encore
    // aucun message reçu, il commence ici.
    return { thread_id: envoi.thread_id, category: 'general', category_source: 'auto' }
  }
  return null
}

// ── Contexte client ────────────────────────────────────────────────────────

export interface InboxProfile {
  id: string
  email: string
  full_name: string | null
  plan: string | null
  role: string | null
  is_founding_member: boolean | null
  created_at: string | null
}

export async function findProfileByEmail(email: string): Promise<InboxProfile | null> {
  if (!email) return null
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, plan, role, is_founding_member, created_at')
    .ilike('email', escapeLike(email.trim()))
    .limit(1)
  return (data?.[0] as InboxProfile) || null
}

// ── Validation des modèles ─────────────────────────────────────────────────

/** Champs modifiables d'un modèle, validés. */
export function templateFields(body: any): { fields: Record<string, unknown>; error?: string } {
  const fields: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return { fields, error: 'Nom requis' }
    fields.name = body.name.trim().slice(0, 120)
  }
  if (body.body !== undefined) {
    if (typeof body.body !== 'string' || !body.body.trim()) return { fields, error: 'Contenu requis' }
    fields.body = body.body.slice(0, 10000)
  }
  if (body.category !== undefined) fields.category = isCategory(body.category) ? body.category : null
  if (body.subject !== undefined) fields.subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim().slice(0, 200) : null
  if (body.layout !== undefined) fields.layout = body.layout === 'brand' ? 'brand' : 'simple'
  if (body.emoji !== undefined) fields.emoji = typeof body.emoji === 'string' && body.emoji.trim() ? body.emoji.trim().slice(0, 8) : null
  if (body.banner_title !== undefined) {
    fields.banner_title = typeof body.banner_title === 'string' && body.banner_title.trim() ? body.banner_title.trim().slice(0, 120) : null
  }
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) fields.sort_order = Number(body.sort_order)
  return { fields }
}

// ── Reclassement ───────────────────────────────────────────────────────────

/**
 * Repasse les conversations existantes dans le classement déterministe
 * (règles + heuristiques, sans IA). Ne touche jamais une catégorie choisie à
 * la main, et ne rouvre jamais une conversation traitée : au plus, une
 * conversation « à traiter » devient « traitée » si elle tombe en spam ou en
 * notification.
 */
export async function reclassifyExisting(): Promise<{ examined: number; changed: number }> {
  const { data: rows } = await supabaseAdmin
    .from('received_emails')
    .select('id, thread_id, from_email, from_name, subject, text_content, html_content, headers, profile_id, category, category_source, status')
    .eq('is_latest', true)
    .neq('category_source', 'manual')
    .order('received_at', { ascending: false })
    .limit(2000)

  let changed = 0
  for (const r of rows || []) {
    const c = await classifyEmail({
      fromEmail: r.from_email,
      fromName: r.from_name,
      subject: r.subject || '',
      text: r.text_content || (r.html_content ? htmlToText(r.html_content) : ''),
      headers: normalizeHeaders(r.headers),
      isKnownCustomer: Boolean(r.profile_id),
    })
    // Une catégorie posée par l'IA n'est remplacée que par un résultat sûr.
    if (r.category_source === 'ai' && !c.confident) continue
    if (c.category === r.category) continue

    const updates: Record<string, unknown> = {
      category: c.category,
      category_source: c.source,
      category_reason: c.reason,
    }
    if (r.status === 'todo' && c.status === 'done') {
      updates.status = 'done'
      updates.status_changed_at = new Date().toISOString()
    }
    await supabaseAdmin.from('received_emails').update(updates).eq('thread_id', r.thread_id)
    if (c.ruleId) await recordRuleHit(c.ruleId)
    changed++
  }
  return { examined: rows?.length || 0, changed }
}
