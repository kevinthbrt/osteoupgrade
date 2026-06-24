import { supabaseAdmin } from '@/lib/supabase-server'

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
): Promise<{ userId: string; email: string; role: string } | null> {
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
      .select('email, role')
      .eq('id', session.user_id)
      .single()
    if (!profile || !['premium', 'admin'].includes(profile.role)) return null

    // Best-effort : rafraîchir l'activité de la session (ne bloque pas la requête)
    supabaseAdmin
      .from('osteoflow_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token)
      .then(
        () => {},
        () => {}
      )

    return { userId: session.user_id, email: profile.email, role: profile.role }
  } catch {
    return null
  }
}
