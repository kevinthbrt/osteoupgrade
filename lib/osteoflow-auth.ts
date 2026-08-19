import { supabaseAdmin } from '@/lib/supabase-server'
import { hasOsteoflow, planOf, type Plan } from '@/lib/entitlements'

/**
 * Étape 1 de la migration CF2 (auth osteoflow par jeton de session).
 *
 * Résout l'utilisateur osteoflow à partir du JETON de session personnel
 * (envoyé par le desktop dans les en-têtes `x-osteoflow-token` +
 * `x-osteoflow-device-id`), validé contre la table `osteoflow_sessions`.
 *
 * Tant que le desktop n'envoie pas ces en-têtes (clients actuels), cette
 * fonction renvoie `null` et les endpoints retombent sur l'ancienne
 * vérification par secret partagé → comportement strictement inchangé.
 *
 * Renvoie l'identité dérivée DE LA SESSION (jamais d'un email fourni par le
 * client), ce qui élimine l'usurpation par email.
 */
export async function getOsteoflowSessionUser(
  req: Request
): Promise<{ userId: string; email: string; role: string; plan: Plan } | null> {
  try {
    const token = req.headers.get('x-osteoflow-token')
    const deviceId = req.headers.get('x-osteoflow-device-id')
    if (!token || !deviceId) return null

    const { data: session } = await supabaseAdmin
      .from('osteoflow_sessions')
      .select('user_id')
      .eq('token', token)
      .eq('device_id', deviceId)
      .single()
    if (!session) return null

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, role, plan')
      .eq('id', session.user_id)
      .single()
    // Seules les offres incluant MyOsteoFlow ouvrent une session desktop
    // (`osteoflow` et `bundle`). L'offre OsteoUpgrade seule en est exclue,
    // alors que son rôle miroir vaut 'premium' : c'est précisément le contrôle
    // que `role` ne peut pas exprimer. Le contenu OsteoUpgrade reste, lui,
    // filtré par les endpoints appelants.
    if (!profile || !hasOsteoflow(profile)) return null

    // Best-effort : rafraîchir l'activité de la session (ne bloque pas la requête)
    supabaseAdmin
      .from('osteoflow_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token)
      .then(
        () => {},
        () => {}
      )

    // Repère temporaire (CF2) : permet de confirmer dans les logs que le chemin
    // "jeton" est bien emprunté pendant la transition. À retirer à l'étape 3.
    console.log('[osteoflow-auth] mode=token user=%s', profile.email)

    return { userId: session.user_id, email: profile.email, role: profile.role, plan: planOf(profile) }
  } catch {
    return null
  }
}
