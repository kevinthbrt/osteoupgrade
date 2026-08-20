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

/** Nature d'un changement d'offre, du point de vue des droits accordés. */
export type PlanChange = 'gain' | 'perte' | 'echange' | null

/**
 * Compare deux offres en termes de droits, et non de prix.
 *
 * Le prix ne suffit pas : `osteoflow` et `osteoupgrade` coûtent le même
 * montant, un passage de l'un à l'autre n'est ni une évolution ni une
 * réduction — c'est un échange de produit, qui appelle un message à part.
 */
export function comparePlans(ancien: Plan, nouveau: Plan): PlanChange {
  const droits = (p: Plan) => ({
    flow: p === 'osteoflow' || p === 'bundle',
    up: p === 'osteoupgrade' || p === 'bundle',
  })
  const a = droits(ancien)
  const n = droits(nouveau)

  const gagne = (!a.flow && n.flow) || (!a.up && n.up)
  const perd = (a.flow && !n.flow) || (a.up && !n.up)

  if (gagne && perd) return 'echange'
  if (gagne) return 'gain'
  if (perd) return 'perte'
  return null
}

/**
 * Phrase décrivant concrètement un changement d'offre.
 *
 * Calculée ici plutôt que dans le template : le moteur d'emails ne fait que
 * du remplacement de `{{variable}}`, sans condition. Sans cette phrase, un
 * email de changement d'offre ne pourrait que rester vague — « votre offre a
 * changé » — au moment précis où le client veut savoir lequel des deux
 * produits vient de s'ouvrir ou de se fermer.
 */
export function describePlanChange(ancien: Plan, nouveau: Plan): string {
  const nom = { flow: 'MyOsteoFlow', up: 'OsteoUpgrade' }
  const droits = (p: Plan) => ({
    flow: p === 'osteoflow' || p === 'bundle',
    up: p === 'osteoupgrade' || p === 'bundle',
  })
  const a = droits(ancien)
  const n = droits(nouveau)

  const gagnes = [!a.flow && n.flow ? nom.flow : null, !a.up && n.up ? nom.up : null].filter(Boolean)
  const perdus = [a.flow && !n.flow ? nom.flow : null, a.up && !n.up ? nom.up : null].filter(Boolean)

  if (gagnes.length && perdus.length) {
    const verbe = gagnes.length > 1 ? 'remplacent' : 'remplace'
    return `${gagnes.join(' et ')} ${verbe} ${perdus.join(' et ')} dans votre abonnement.`
  }
  if (gagnes.length) {
    const verbe = gagnes.length > 1 ? "s'ajoutent" : "s'ajoute"
    return `${gagnes.join(' et ')} ${verbe} à votre abonnement.`
  }
  if (perdus.length) {
    const verbe = perdus.length > 1 ? 'ne sont plus compris' : "n'est plus compris"
    return `${perdus.join(' et ')} ${verbe} dans votre abonnement.`
  }
  return 'Vos accès restent identiques.'
}
