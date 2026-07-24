/**
 * Règles d'accès aux formations — identiques au site web
 * (cf. app/elearning/cours/page.tsx : canAccessFormation).
 *
 * - Pas de rôle : aucun accès
 * - Formation privée : réservée aux admins
 * - free : uniquement si la formation est en accès gratuit (is_free_access)
 * - premium / admin : accès complet
 */
export type Role = 'free' | 'premium' | 'admin' | null | undefined;

export function canAccessFormation(
  role: Role,
  isPrivate?: boolean | null,
  isFreeAccess?: boolean | null,
): boolean {
  if (!role) return false;
  if (isPrivate) return role === 'admin';
  if (isFreeAccess && role === 'free') return true;
  return role === 'premium' || role === 'admin';
}

export function isPremium(role: Role): boolean {
  return role === 'premium' || role === 'admin';
}
