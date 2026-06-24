import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Vérifie que l'appelant est authentifié ET admin (via le cookie de session).
 * À utiliser dans les routes API sensibles côté navigateur (pages admin).
 */
export async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

/** Vrai si l'en-tête Authorization correspond au secret CRON. */
export function isValidCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

/** Autorise l'appel s'il vient d'un admin (cookie) OU d'un cron (secret). */
export async function isAdminOrCron(request: Request): Promise<boolean> {
  if (isValidCron(request)) return true
  return verifyAdmin()
}

// ── Validation des uploads d'images ────────────────────────────────────────
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 Mo
// Extensions d'images autorisées (SVG exclu volontairement : risque XSS via URL publique)
export const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

/**
 * Valide un fichier image. Retourne un message d'erreur, ou null si OK.
 */
export function validateImageUpload(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Type de fichier non autorisé (image attendue)'
  if (file.size > MAX_IMAGE_BYTES) return 'Fichier trop volumineux (max 10 Mo)'
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_IMAGE_EXT.includes(ext)) return `Extension non autorisée (.${ext})`
  return null
}

/** Renvoie une extension d'image sûre (jamais issue d'un nom de fichier non validé). */
export function safeImageExt(file: File): string {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return ALLOWED_IMAGE_EXT.includes(ext) ? ext : 'jpg'
}
