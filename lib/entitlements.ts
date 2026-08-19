/**
 * Droits d'accès dérivés de l'offre souscrite (`profiles.plan`).
 *
 * Contexte — passage à 3 offres (cf. docs/PRICING_3_OFFRES.md) :
 *
 *   plan            role miroir   MyOsteoFlow   OsteoUpgrade
 *   free            free          non           non (hors is_free_access)
 *   osteoflow       trial         oui           non
 *   osteoupgrade    premium       non           oui
 *   bundle          premium       oui           oui
 *
 * `profiles.role` reste maintenu par le trigger SQL `sync_profile_plan_role`
 * comme miroir de `plan`. Il continue donc de piloter correctement les policies
 * RLS, les RPC et les endpoints de contenu, sans réécriture.
 *
 * Ce module est volontairement sans dépendance (pas de client Supabase) pour
 * être utilisable côté serveur comme côté navigateur.
 */

export const PLANS = ['free', 'osteoflow', 'osteoupgrade', 'bundle'] as const
export type Plan = (typeof PLANS)[number]

/** Objet minimal accepté par les helpers : ce que renvoie un `select` sur profiles. */
export type ProfileAccess = {
  plan?: string | null
  role?: string | null
}

export function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value)
}

/** Miroir applicatif de la fonction SQL `role_to_plan`. */
export function roleToPlan(role: string | null | undefined): Plan {
  switch (role) {
    case 'admin':
    case 'premium':
      return 'bundle'
    case 'trial':
      return 'osteoflow'
    default:
      return 'free'
  }
}

/** Miroir applicatif de la fonction SQL `plan_to_role`. */
export function planToRole(plan: Plan): string {
  switch (plan) {
    case 'bundle':
    case 'osteoupgrade':
      return 'premium'
    case 'osteoflow':
      return 'trial'
    default:
      return 'free'
  }
}

/**
 * Offre effective d'un profil.
 *
 * Si `plan` est absent — requête qui ne l'a pas sélectionné, ligne écrite par
 * un chemin hérité — on retombe sur la dérivation depuis `role`, exactement
 * comme le fait le trigger SQL. Un `select` incomplet dégrade donc vers le
 * comportement actuel au lieu de retirer un accès à tort.
 */
export function planOf(profile: ProfileAccess | null | undefined): Plan {
  if (!profile) return 'free'
  if (isPlan(profile.plan)) return profile.plan
  return roleToPlan(profile.role)
}

/** Un admin dispose de tout, quelle que soit son offre. */
function isAdmin(profile: ProfileAccess | null | undefined): boolean {
  return profile?.role === 'admin'
}

/** Accès à l'application MyOsteoFlow (connexion desktop, IA, dossiers patients). */
export function hasOsteoflow(profile: ProfileAccess | null | undefined): boolean {
  if (isAdmin(profile)) return true
  const plan = planOf(profile)
  return plan === 'osteoflow' || plan === 'bundle'
}

/** Accès au contenu OsteoUpgrade (e-learning, pratique, flashcards, tests). */
export function hasOsteoupgrade(profile: ProfileAccess | null | undefined): boolean {
  if (isAdmin(profile)) return true
  const plan = planOf(profile)
  return plan === 'osteoupgrade' || plan === 'bundle'
}

/** Droits sérialisables, transmis au client desktop par /api/osteoflow/verify. */
export type Entitlements = { osteoflow: boolean; osteoupgrade: boolean }

export function entitlementsOf(profile: ProfileAccess | null | undefined): Entitlements {
  return {
    osteoflow: hasOsteoflow(profile),
    osteoupgrade: hasOsteoupgrade(profile),
  }
}

/** Libellé commercial d'une offre (badges, écrans d'abonnement, admin). */
export function planLabel(plan: Plan): string {
  switch (plan) {
    case 'bundle':
      return 'Premium'
    case 'osteoflow':
      return 'MyOsteoFlow'
    case 'osteoupgrade':
      return 'OsteoUpgrade'
    default:
      return 'Gratuit'
  }
}
