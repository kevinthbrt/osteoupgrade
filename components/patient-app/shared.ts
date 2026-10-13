export interface DayLog {
  /** douleur au réveil */
  m?: number | null
  /** exercices faits ce jour-là, par id d'exercice */
  done: Record<string, true>
  /** douleur pendant chaque exercice */
  pains: Record<string, number>
  /** séance du jour terminée */
  complete?: boolean
}

export interface LibraryItem {
  id: string
  description: string | null
  progression_regression: string | null
  illustration_url: string | null
}
export type Library = Record<string, LibraryItem>

/** Date locale au format AAAA-MM-JJ. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}

export function dayOffset(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 864e5)
}

export function frDate(day: string, long = false): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' })
}
