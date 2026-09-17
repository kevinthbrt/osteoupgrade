/**
 * Questionnaires cliniques : types et règles de calcul.
 *
 * Les règles vivent ici plutôt qu'en base parce qu'aucune n'est une simple
 * somme. Le STarT Back combine un total et un sous-score psychosocial, l'ODI se
 * rapporte aux seules sections remplies, le FABQ ne score que onze de ses seize
 * items. Une colonne « formule » aurait fini par contenir du code déguisé.
 *
 * La base ne porte donc que les seuils et ce qu'on en conclut, ce qui reste
 * modifiable sans déploiement le jour où une recommandation bouge.
 */

export type EchelleOption = { label: string; valeur: number }

export type QuestionnaireItem = {
  id: string
  questionnaire_id: string
  order_index: number
  label: string
  aide: string | null
  echelle: EchelleOption[]
  /** Null pour un item non scoré : le FABQ en compte cinq. */
  sous_echelle: string | null
}

export type Interpretation = {
  cle: string
  libelle: string
  min: number
  max: number
  ton: 'ok' | 'attention' | 'alerte'
  conduite: string
  /** Pour un questionnaire à sous-échelles : celle qui porte la décision. */
  sous_echelle?: string
}

export type Questionnaire = {
  id: string
  slug: string
  code: string
  name: string
  purpose: string
  region: string
  duration_minutes: number | null
  instructions: string | null
  methode: 'somme' | 'start_back' | 'odi' | 'sous_echelles'
  interpretation: Interpretation[]
  source_citation: string | null
  source_url: string | null
  licence: string | null
  licence_statut: 'libre' | 'a_verifier' | 'demande_a_faire' | 'demandee' | 'obtenue'
  licence_url: string | null
  traduction_officielle: boolean
  status: string
  order_index: number
}

export type SousScore = { cle: string; libelle: string; valeur: number; sur: number }

export type Resultat = {
  score: number
  sur: number | null
  unite: 'points' | '%'
  sousScores: SousScore[]
  niveau: Interpretation | null
  /** Ligne à recopier dans le dossier, sans donnée identifiante. */
  resume: string
}

export const LIBELLES_SOUS_ECHELLE: Record<string, string> = {
  psychosocial: 'Sous-score psychosocial',
  travail: 'Sous-échelle travail',
  activite_physique: 'Sous-échelle activité physique',
}

export const LIBELLES_LICENCE: Record<Questionnaire['licence_statut'], string> = {
  libre: 'Libre de droits',
  a_verifier: 'Licence à vérifier',
  demande_a_faire: 'Licence à demander',
  demandee: 'Licence demandée',
  obtenue: 'Licence obtenue',
}

/** Valeur maximale atteignable sur un item. */
function maxItem(item: QuestionnaireItem): number {
  return Math.max(0, ...item.echelle.map((option) => option.valeur))
}

function somme(items: QuestionnaireItem[], reponses: Record<string, number>): number {
  return items.reduce((total, item) => total + (reponses[item.id] ?? 0), 0)
}

function niveauPour(questionnaire: Questionnaire, valeur: number, sousEchelle?: string) {
  const candidats = questionnaire.interpretation.filter(
    (entree) => !sousEchelle || !entree.sous_echelle || entree.sous_echelle === sousEchelle
  )
  return candidats.find((entree) => valeur >= entree.min && valeur <= entree.max) || null
}

/**
 * Calcule le résultat d'une passation.
 *
 * `reponses` associe l'identifiant d'un item à la valeur choisie. Un item sans
 * réponse vaut zéro, sauf pour l'ODI où il est exclu du dénominateur : c'est la
 * règle de l'instrument, une section laissée vide ne doit pas faire baisser le
 * pourcentage d'incapacité.
 */
export function calculer(
  questionnaire: Questionnaire,
  items: QuestionnaireItem[],
  reponses: Record<string, number>
): Resultat {
  const ordonnes = [...items].sort((a, b) => a.order_index - b.order_index)

  if (questionnaire.methode === 'start_back') {
    const total = somme(ordonnes, reponses)
    const psychosociaux = ordonnes.filter((item) => item.sous_echelle === 'psychosocial')
    const sousScore = somme(psychosociaux, reponses)

    // Le classement n'est pas un simple seuil sur le total : un patient à cinq
    // points dont quatre viennent des items psychosociaux n'est pas au même
    // endroit qu'un patient à cinq points d'incapacité physique.
    const cle = total <= 3 ? 'faible' : sousScore <= 3 ? 'moyen' : 'eleve'
    const niveau = questionnaire.interpretation.find((entree) => entree.cle === cle) || null

    return {
      score: total,
      sur: ordonnes.reduce((t, item) => t + maxItem(item), 0),
      unite: 'points',
      sousScores: [
        {
          cle: 'psychosocial',
          libelle: LIBELLES_SOUS_ECHELLE.psychosocial,
          valeur: sousScore,
          sur: psychosociaux.reduce((t, item) => t + maxItem(item), 0),
        },
      ],
      niveau,
      resume: `${questionnaire.code} : ${total} sur 9, sous-score psychosocial ${sousScore} sur 5, ${
        niveau?.libelle.toLowerCase() || 'non classé'
      }.`,
    }
  }

  if (questionnaire.methode === 'odi') {
    const repondus = ordonnes.filter((item) => reponses[item.id] !== undefined)
    const maximum = repondus.reduce((t, item) => t + maxItem(item), 0)
    const brut = somme(repondus, reponses)
    const pourcentage = maximum > 0 ? Math.round((brut / maximum) * 100) : 0
    const niveau = niveauPour(questionnaire, pourcentage)

    return {
      score: pourcentage,
      sur: 100,
      unite: '%',
      sousScores: [
        {
          cle: 'brut',
          libelle: `Score brut sur les ${repondus.length} section${repondus.length > 1 ? 's' : ''} remplie${repondus.length > 1 ? 's' : ''}`,
          valeur: brut,
          sur: maximum,
        },
      ],
      niveau,
      resume: `${questionnaire.code} : ${pourcentage} %, ${niveau?.libelle.toLowerCase() || 'non classé'}.`,
    }
  }

  if (questionnaire.methode === 'sous_echelles') {
    const cles = [...new Set(ordonnes.map((item) => item.sous_echelle).filter(Boolean))] as string[]
    const sousScores: SousScore[] = cles.map((cle) => {
      const groupe = ordonnes.filter((item) => item.sous_echelle === cle)
      return {
        cle,
        libelle: LIBELLES_SOUS_ECHELLE[cle] || cle,
        valeur: somme(groupe, reponses),
        sur: groupe.reduce((t, item) => t + maxItem(item), 0),
      }
    })

    // La sous-échelle qui porte la décision est celle nommée par les seuils.
    const cleDecisive = questionnaire.interpretation.find((entree) => entree.sous_echelle)?.sous_echelle
    const principal = sousScores.find((s) => s.cle === cleDecisive) || sousScores[0]
    const niveau = principal ? niveauPour(questionnaire, principal.valeur, principal.cle) : null

    return {
      score: principal?.valeur ?? 0,
      sur: principal?.sur ?? null,
      unite: 'points',
      sousScores,
      niveau,
      resume: `${questionnaire.code} : ${sousScores
        .map((s) => `${s.libelle.toLowerCase()} ${s.valeur} sur ${s.sur}`)
        .join(', ')}. ${niveau?.libelle || ''}`.trim(),
    }
  }

  const total = somme(ordonnes, reponses)
  const maximum = ordonnes.reduce((t, item) => t + maxItem(item), 0)
  const niveau = niveauPour(questionnaire, total)

  return {
    score: total,
    sur: maximum,
    unite: 'points',
    sousScores: [],
    niveau,
    resume: `${questionnaire.code} : ${total} sur ${maximum}, ${
      niveau?.libelle.toLowerCase() || 'non classé'
    }.`,
  }
}

export const TONS_NIVEAU: Record<Interpretation['ton'], string> = {
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  attention: 'border-amber-300 bg-amber-50 text-amber-900',
  alerte: 'border-rose-300 bg-rose-50 text-rose-900',
}
