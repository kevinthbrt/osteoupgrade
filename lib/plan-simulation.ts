/**
 * Simulation d'offre — outil d'administration.
 *
 * Un administrateur ne peut pas voir l'application « avec les yeux » d'un
 * abonné en modifiant sa propre ligne en base :
 *
 * - écrire `plan` sur un compte admin ne change rien, car le trigger SQL ne
 *   rétrograde jamais un admin et tous les helpers (`hasOsteoflow`,
 *   `hasOsteoupgrade`) comme les policies RLS court-circuitent sur `admin` ;
 * - écrire `role` fait perdre l'accès à `/admin`, et **aucune valeur de rôle
 *   ne correspond à l'offre OsteoUpgrade seule** — `premium` se dérive en
 *   `bundle`, `trial` en `osteoflow`. Cette offre serait donc intestable.
 *
 * La simulation résout les deux : elle vit dans un cookie, ne touche à aucune
 * donnée, et s'annule d'un clic. Elle n'est honorée que si le compte est
 * réellement administrateur (vérifié à chaque lecture, côté serveur).
 *
 * Portée : c'est une simulation d'**affichage**. Les policies RLS et les
 * endpoints de contenu continuent de voir le vrai rôle `admin` et renverraient
 * donc le contenu Premium ; l'interface, elle, se verrouille exactement comme
 * pour l'offre simulée. C'est ce qu'on cherche à vérifier.
 */

import { isPlan, type Plan } from '@/lib/entitlements'

export const SIMULATION_COOKIE = 'simulation_offre'

/** Durée de vie volontairement courte : une simulation oubliée s'éteint seule. */
export const SIMULATION_MAX_AGE = 60 * 60 * 4

export function parseSimulatedPlan(value: string | undefined | null): Plan | null {
  return isPlan(value) ? value : null
}
