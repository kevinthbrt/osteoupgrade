import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Briques communes aux deux lectures d’usage des contenus : la vue d’ensemble
 * (`/api/admin/content-usage`) et la fiche d’un client
 * (`/api/admin/content-usage/[userId]`). Les deux lisent le même catalogue et
 * doivent compter pareil, sans quoi un total de page contredirait la somme des
 * fiches.
 */

export const MS_DAY = 24 * 60 * 60 * 1000
export const FENETRE_JOURS = 90

// PostgREST plafonne une lecture à 1000 lignes : les tables de progression
// grossissent avec chaque abonné, on pagine donc plutôt que de tronquer en
// silence le jour où le catalogue décolle.
const PAGE = 1000

export async function lireTout<T>(table: string, colonnes: string, filtre?: { colonne: string; valeur: string }): Promise<T[]> {
  const lignes: T[] = []
  for (let depuis = 0; ; depuis += PAGE) {
    let requete = supabaseAdmin.from(table).select(colonnes)
    if (filtre) requete = requete.eq(filtre.colonne, filtre.valeur)
    const { data, error } = await requete.range(depuis, depuis + PAGE - 1)
    if (error) throw new Error(`${table} : ${error.message}`)
    const lot = (data || []) as unknown as T[]
    lignes.push(...lot)
    if (lot.length < PAGE) return lignes
  }
}

/** Clé de regroupement journalier, en UTC comme le reste des séries admin. */
export function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Date la plus récente d’une série, au format ISO, ou null si la série est vide. */
export function plusRecente(dates: (string | null | undefined)[]): string | null {
  let max = 0
  for (const d of dates) {
    if (!d) continue
    const t = new Date(d).getTime()
    if (t > max) max = t
  }
  return max > 0 ? new Date(max).toISOString() : null
}

/** Série vide de `FENETRE_JOURS` jours, prête à être incrémentée par famille. */
export type JourUsage = { date: string; elearning: number; quiz: number; pratique: number; tests: number; flashcards: number }
export type FamilleCle = 'elearning' | 'quiz' | 'pratique' | 'tests' | 'flashcards'

export function serieVide(maintenant: number): Map<string, JourUsage> {
  const serie = new Map<string, JourUsage>()
  for (let i = FENETRE_JOURS - 1; i >= 0; i--) {
    const k = jourISO(new Date(maintenant - i * MS_DAY))
    serie.set(k, { date: k, elearning: 0, quiz: 0, pratique: 0, tests: 0, flashcards: 0 })
  }
  return serie
}
