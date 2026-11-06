/**
 * Fonctions en accès restreint, annoncées à Osteoflow avec la licence
 * (`/api/osteoflow/auth` et `/api/osteoflow/verify`) et contrôlées par les
 * routes concernées.
 *
 * `programmes` : programmes d'exercices par étapes, appli patient, bilans et
 * assistant IA. Ouvert à tous les comptes depuis novembre 2026 (réservé aux
 * administrateurs pendant la phase de test). La règle se change ici, sans
 * nouvelle version d'Osteoflow : le droit est relu à chaque vérification de
 * licence.
 */

export type Feature = 'programmes'

const OPEN_TO_ALL: Feature[] = ['programmes']

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function featuresOf(profile: { role?: string | null } | null | undefined): Feature[] {
  return [...OPEN_TO_ALL]
}

export function hasFeature(profile: { role?: string | null } | null | undefined, feature: Feature): boolean {
  return featuresOf(profile).includes(feature)
}
