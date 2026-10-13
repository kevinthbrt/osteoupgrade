import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import type { LinkProgram } from '@/lib/patient-link-codec'
import type { DayLog } from './shared'

/**
 * Transfert du programme et du suivi vers l'appli installée.
 *
 * Sur iPhone, l'appli ajoutée à l'écran d'accueil a son propre stockage,
 * séparé de celui de Safari : sans transfert, le patient la retrouve vide.
 * Le patient copie un lien qui contient tout, puis le colle dans l'appli.
 * Comme le programme, ce lien ne passe par aucun serveur.
 */

const PREFIX = 'T1.'

export interface Transfer {
  programs: Record<string, { program: LinkProgram; savedAt: string; updated?: boolean }>
  logs: Record<string, Record<string, DayLog>>
  current: string | null
}

const toB64url = (bytes: Uint8Array) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64url = (text: string) => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

export function encodeTransfer(data: Transfer): string {
  return PREFIX + toB64url(deflateSync(strToU8(JSON.stringify(data)), { level: 9 }))
}

/** Accepte le lien entier, le fragment seul ou un texte qui le contient. */
export function decodeTransfer(text: string): Transfer | null {
  const at = text.indexOf(PREFIX)
  if (at < 0) return null
  const token = text.slice(at + PREFIX.length).match(/^[A-Za-z0-9_-]+/)?.[0]
  if (!token) return null
  try {
    const json = JSON.parse(strFromU8(inflateSync(fromB64url(token))))
    if (!json || typeof json.programs !== 'object' || typeof json.logs !== 'object') return null
    return json as Transfer
  } catch {
    return null
  }
}

/** iPhone ou iPad (les iPad récents se présentent comme un Mac tactile). */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

/** L'appli tourne depuis l'écran d'accueil, pas dans le navigateur. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
