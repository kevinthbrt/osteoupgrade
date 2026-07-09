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
 * par email côté Resend) — peut être rappelé sans risque de doublon.
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

/**
 * Synchronise une liste de contacts dans un segment Resend, en respectant la
 * limite de débit de l'API (séquentiel, avec un court délai entre chaque appel).
 */
export async function syncContactsToSegment(
  contacts: { email: string; firstName?: string | null; lastName?: string | null }[],
  segmentId: string
): Promise<{ synced: number; errors: string[] }> {
  let synced = 0
  const errors: string[] = []

  for (const contact of contacts) {
    try {
      await upsertContactInSegment(contact.email, segmentId, contact.firstName, contact.lastName)
      synced++
    } catch (err: any) {
      errors.push(`${contact.email}: ${err.message}`)
    }
    await sleep(REQUEST_DELAY_MS)
  }

  return { synced, errors }
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
