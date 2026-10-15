import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Programme partenaire écoles (cf. docs/PRICING_ANNUEL_PARTENAIRE.md).
 *
 * Une école transmet un code d'accès à ses stagiaires. Le saisir rattache le
 * compte au programme (`partner_program_members`), ce qui ouvre les tarifs
 * annuels partenaires. Module serveur uniquement : il lit les codes d'accès,
 * qui ne doivent jamais atteindre le navigateur.
 */

export type PartnerProgram = {
  id: string
  name: string
}

/** Un programme ouvre ses tarifs tant qu'il est actif et non échu. */
function programmeOuvert(p: { active: boolean; ends_at: string | null }): boolean {
  if (!p.active) return false
  if (p.ends_at && new Date(p.ends_at).getTime() < Date.now()) return false
  return true
}

/**
 * Programme partenaire auquel le compte est rattaché, s'il ouvre encore ses
 * tarifs. `null` sinon : jamais rattaché, programme désactivé ou échu.
 */
export async function activePartnerProgramFor(userId: string): Promise<PartnerProgram | null> {
  const { data } = await supabaseAdmin
    .from('partner_program_members')
    .select('program:partner_programs(id, name, active, ends_at)')
    .eq('user_id', userId)
    .maybeSingle()

  const programme = (data as any)?.program
  if (!programme || !programmeOuvert(programme)) return null
  return { id: programme.id, name: programme.name }
}

/**
 * Nom de l'école à laquelle le compte est rattaché, que son programme soit
 * encore ouvert ou non : un abonné garde son tarif école après la fermeture
 * du programme, et son profil doit continuer de le dire.
 */
export async function partnerProgramNameFor(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('partner_program_members')
    .select('program:partner_programs(name)')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as any)?.program?.name ?? null
}

/**
 * Rattache un compte au programme dont il présente le code d'accès.
 * Un compte n'appartient qu'à un programme : un nouveau code remplace l'ancien.
 */
export async function joinPartnerProgram(
  userId: string,
  code: string
): Promise<{ ok: true; program: PartnerProgram } | { ok: false; error: string }> {
  const normalise = code.trim().toUpperCase()
  if (normalise.length < 6) return { ok: false, error: 'Code école invalide.' }

  const { data: programme } = await supabaseAdmin
    .from('partner_programs')
    .select('id, name, active, ends_at')
    .eq('access_code', normalise)
    .maybeSingle()

  // Même message pour un code inconnu et un code fermé : inutile d'indiquer à
  // quelqu'un qui essaie des codes au hasard qu'il en a trouvé un vrai.
  if (!programme || !programmeOuvert(programme)) {
    return { ok: false, error: 'Code école invalide ou expiré.' }
  }

  const { error } = await supabaseAdmin
    .from('partner_program_members')
    .upsert({ user_id: userId, program_id: programme.id, joined_at: new Date().toISOString() })

  if (error) return { ok: false, error: 'Impossible d’enregistrer le code. Réessayez.' }
  return { ok: true, program: { id: programme.id, name: programme.name } }
}
