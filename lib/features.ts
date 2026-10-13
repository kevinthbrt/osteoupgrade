/**
 * Fonctions en accès restreint, annoncées à Osteoflow avec la licence
 * (`/api/osteoflow/auth` et `/api/osteoflow/verify`) et contrôlées par les
 * routes concernées.
 *
 * `programmes` : programmes d'exercices par étapes, appli patient, bilans et
 * assistant IA. Réservé aux administrateurs pendant la phase de test ; pour
 * l'ouvrir, changer la règle ici suffit, sans nouvelle version d'Osteoflow
 * (le droit est relu à chaque vérification de licence).
 */

export type Feature = 'programmes'

export function featuresOf(profile: { role?: string | null } | null | undefined): Feature[] {
  return profile?.role === 'admin' ? ['programmes'] : []
}

export function hasFeature(profile: { role?: string | null } | null | undefined, feature: Feature): boolean {
  return featuresOf(profile).includes(feature)
}
