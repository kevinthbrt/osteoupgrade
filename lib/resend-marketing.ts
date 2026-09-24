// Client léger pour l'API Marketing de Resend (segments, contacts, broadcasts).
// Distinct de lib/mailing.ts (API transactionnelle) : quota et facturation séparés
// chez Resend. Utilisé pour les envois en masse (newsletter, campagnes) afin de ne
// jamais consommer le quota transactionnel (emails de bienvenue, factures, etc.).

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_BASE_URL = 'https://api.resend.com'

// Respecte la limite Resend de 5 requêtes/seconde par équipe (marge de sécurité).
const REQUEST_DELAY_MS = 250

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resendRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY est manquant.')
  }

  const res = await fetch(`${RESEND_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status} on ${path}: ${body}`)
  }

  return res.json()
}

interface ResendSegment {
  id: string
  name: string
}

/**
 * Récupère l'ID d'un segment Resend existant par nom, ou le crée s'il n'existe pas.
 */
export async function getOrCreateSegment(name: string): Promise<string> {
  const list = await resendRequest<{ data: ResendSegment[] }>('/segments?limit=100')
  const existing = list.data?.find((s) => s.name === name)
  if (existing) return existing.id

  const created = await resendRequest<ResendSegment>('/segments', {
    method: 'POST',
    body: JSON.stringify({ name })
  })
  return created.id
}

/**
 * Ajoute ou met à jour un contact dans un segment Resend. Idempotent (déduplication
 * par email côté Resend) : il peut être rappelé sans risque de doublon.
 */
export async function upsertContactInSegment(
  email: string,
  segmentId: string,
  firstName?: string | null,
  lastName?: string | null
): Promise<void> {
  await resendRequest('/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      segments: [{ id: segmentId }]
    })
  })
}

interface ResendContact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  unsubscribed: boolean
}

/**
 * Liste les contacts actuellement dans un segment, toutes pages confondues.
 */
export async function listSegmentContacts(segmentId: string): Promise<ResendContact[]> {
  const tous: ResendContact[] = []
  let after: string | undefined

  // Garde-fou : 100 pages, soit 10 000 contacts. Au-delà, c'est une boucle
  // infinie sur un curseur qui n'avance pas, pas une liste de diffusion.
  for (let page = 0; page < 100; page++) {
    const params = new URLSearchParams({ limit: '100' })
    if (after) params.set('after', after)

    const res = await resendRequest<{ data: ResendContact[]; has_more?: boolean }>(
      `/segments/${segmentId}/contacts?${params.toString()}`
    )
    const lot = res.data ?? []
    tous.push(...lot)

    if (!res.has_more || lot.length === 0) break
    after = lot[lot.length - 1].id
    await sleep(REQUEST_DELAY_MS)
  }

  return tous
}

/**
 * Retire un contact d'un segment. Le contact lui-même n'est pas supprimé :
 * il garde son historique et son éventuelle désinscription.
 */
export async function removeContactFromSegment(
  emailOrId: string,
  segmentId: string
): Promise<void> {
  await resendRequest(
    `/contacts/${encodeURIComponent(emailOrId)}/segments/${segmentId}`,
    { method: 'DELETE' }
  )
}

/**
 * Aligne un segment Resend sur une audience calculée : ajoute ce qui manque,
 * retire ce qui n'a plus sa place.
 *
 * Le retrait n'est pas un confort. Un segment qui ne fait qu'accumuler finit
 * par contenir des gens qui ont décoché la lettre d'information dans
 * l'application : ils sont bien exclus de la liste calculée ici, mais la
 * campagne part au segment entier, donc ils la reçoivent quand même. Un
 * désabonnement qui ne prend pas effet n'est pas un défaut de confort.
 *
 * Deux règles de prudence :
 *   - un contact que Resend marque désinscrit n'est jamais réécrit, car un
 *     nouvel envoi sur `/contacts` risquerait de remettre ce drapeau à zéro ;
 *   - seuls les contacts absents ou dont le nom a changé sont réécrits. Envoyer
 *     les centaines d'autres à chaque campagne coûtait des minutes, pour ne
 *     rien changer.
 */
export async function syncContactsToSegment(
  contacts: { email: string; firstName?: string | null; lastName?: string | null }[],
  segmentId: string
): Promise<{ synced: number; removed: number; errors: string[] }> {
  let synced = 0
  let removed = 0
  const errors: string[] = []

  // La comparaison se fait sur l'adresse en minuscules : Resend ne distingue
  // pas la casse, la base non plus (citext), mais les deux sources peuvent
  // renvoyer des graphies différentes.
  const clef = (email: string) => email.trim().toLowerCase()

  let presents = new Map<string, ResendContact>()
  try {
    for (const c of await listSegmentContacts(segmentId)) {
      presents.set(clef(c.email), c)
    }
  } catch (err: any) {
    // Sans la liste, on ne peut pas retirer, mais on peut encore ajouter.
    // Mieux vaut une campagne qui part avec un segment imparfait qu'une
    // campagne qui ne part pas du tout.
    errors.push(`Lecture du segment impossible, aucun retrait effectué: ${err.message}`)
    presents = new Map()
  }

  const voulus = new Set(contacts.map((c) => clef(c.email)))

  for (const contact of contacts) {
    const existant = presents.get(clef(contact.email))

    // Déjà présent, à jour, et non désinscrit : rien à faire.
    if (existant) {
      if (existant.unsubscribed) continue
      const memeNom =
        (existant.first_name || '') === (contact.firstName || '') &&
        (existant.last_name || '') === (contact.lastName || '')
      if (memeNom) {
        synced++
        continue
      }
    }

    try {
      await upsertContactInSegment(contact.email, segmentId, contact.firstName, contact.lastName)
      synced++
    } catch (err: any) {
      errors.push(`${contact.email}: ${err.message}`)
    }
    await sleep(REQUEST_DELAY_MS)
  }

  for (const [email, contact] of presents) {
    if (voulus.has(email)) continue
    try {
      await removeContactFromSegment(contact.id, segmentId)
      removed++
    } catch (err: any) {
      errors.push(`retrait de ${contact.email}: ${err.message}`)
    }
    await sleep(REQUEST_DELAY_MS)
  }

  return { synced, removed, errors }
}

/**
 * Crée et envoie immédiatement une campagne (broadcast) à un segment Resend.
 */
export async function createAndSendBroadcast(params: {
  segmentId: string
  from: string
  subject: string
  html: string
  text?: string
  name?: string
}): Promise<{ id: string }> {
  return resendRequest('/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      segment_id: params.segmentId,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text,
      name: params.name,
      send: true
    })
  })
}
