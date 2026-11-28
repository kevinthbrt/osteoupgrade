/**
 * Les personnages des parcours animés et leurs expressions.
 *
 * Chaque expression est une image détourée servie depuis
 * `public/personnages/<personnage>/<expression>.webp`. Une expression inconnue
 * retombe sur l'expression par défaut du personnage : un contenu en base qui
 * cite une expression pas encore dessinée s'affiche quand même.
 *
 * Les rôles sont fixes (voir docs/PARCOURS_ANIMES.md) : le guide porte la
 * méthode, le patient le vécu, les personnages anatomiques les mécanismes.
 */

export type PersonnageId = 'osteo' | 'patient' | 'disque' | 'vertebre' | 'colonne' | 'bassin'

type Fiche = {
  nom: string
  /** Libellé affiché au-dessus de la bulle. */
  role: string
  defaut: string
  expressions: string[]
}

export const PERSONNAGES: Record<PersonnageId, Fiche> = {
  osteo: { nom: 'Votre guide', role: 'Votre guide', defaut: 'sourire', expressions: ['sourire', 'debout'] },
  patient: {
    nom: 'M. Bernard',
    role: 'Le patient',
    defaut: 'neutre',
    expressions: ['neutre', 'douleur', 'raconte', 'reflechit', 'soulage'],
  },
  disque: {
    nom: 'Le disque',
    role: 'Le disque',
    defaut: 'neutre',
    expressions: ['neutre', 'effraye', 'accuse', 'soulage', 'etirement'],
  },
  vertebre: {
    nom: 'La vertèbre',
    role: 'La vertèbre',
    defaut: 'heureux',
    expressions: ['heureux', 'stresse', 'perplexe', 'fier'],
  },
  colonne: { nom: 'La colonne', role: 'La colonne', defaut: 'neutre', expressions: ['neutre'] },
  bassin: {
    nom: 'Le bassin',
    role: 'Le bassin',
    defaut: 'fier',
    expressions: ['fier', 'joie', 'panique', 'perplexe', 'zen'],
  },
}

export function estPersonnage(id: string | null | undefined): id is PersonnageId {
  return Boolean(id && id in PERSONNAGES)
}

export function imagePersonnage(id: PersonnageId, expression?: string | null): string {
  const fiche = PERSONNAGES[id]
  const e = expression && fiche.expressions.includes(expression) ? expression : fiche.defaut
  return `/personnages/${id}/${e}.webp`
}

/** Les animations ponctuelles qu'un personnage peut jouer avant de revenir au repos. */
export type AnimationPersonnage = 'apparait' | 'saute' | 'tremble'
