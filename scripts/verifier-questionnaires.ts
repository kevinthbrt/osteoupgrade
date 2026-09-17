/**
 * Vérification des règles de calcul des questionnaires.
 *
 * `npm run verifier:questionnaires`
 *
 * Un score faux ne se voit pas : il s'affiche proprement et fait décider de
 * travers. Ces cas couvrent ce que chaque instrument a de particulier, et pas
 * la simple addition.
 */
import { calculer, type Questionnaire, type QuestionnaireItem } from '../lib/questionnaires'

let echecs = 0

function verifie(nom: string, obtenu: unknown, attendu: unknown) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (ok) {
    console.log('ok       ' + nom)
  } else {
    echecs++
    console.log(`ÉCHEC    ${nom}\n  obtenu  : ${JSON.stringify(obtenu)}\n  attendu : ${JSON.stringify(attendu)}`)
  }
}

const item = (i: number, sous: string | null, max = 1): QuestionnaireItem => ({
  id: 'i' + i,
  questionnaire_id: 'q',
  order_index: i,
  label: 'item ' + i,
  aide: null,
  echelle: Array.from({ length: max + 1 }, (_, v) => ({ label: String(v), valeur: v })),
  sous_echelle: sous,
})

const base = {
  id: 'q', slug: 'q', name: 'q', purpose: '', region: 'lombaire', duration_minutes: null,
  instructions: null, source_citation: null, source_url: null, licence: null,
  licence_statut: 'libre' as const, licence_url: null, traduction_officielle: true,
  status: 'published', order_index: 0,
}

// --------------------------------------------------------------------------
// STarT Back : le classement se joue sur le sous-score, pas sur le seul total.
// --------------------------------------------------------------------------
const startBack: Questionnaire = {
  ...base, code: 'STarT Back', methode: 'start_back',
  interpretation: [
    { cle: 'faible', libelle: 'Risque faible', min: 0, max: 3, ton: 'ok', conduite: '' },
    { cle: 'moyen', libelle: 'Risque moyen', min: 4, max: 9, ton: 'attention', conduite: '' },
    { cle: 'eleve', libelle: 'Risque élevé', min: 4, max: 9, ton: 'alerte', conduite: '' },
  ],
}
const itemsSB = [1, 2, 3, 4].map((i) => item(i, 'physique')).concat([5, 6, 7, 8, 9].map((i) => item(i, 'psychosocial')))
const coche = (numeros: number[]) =>
  Object.fromEntries(itemsSB.map((it) => [it.id, numeros.includes(it.order_index) ? 1 : 0]))

verifie('STarT Back, 3 points, risque faible', calculer(startBack, itemsSB, coche([1, 2, 3])).niveau?.cle, 'faible')
verifie('STarT Back, 5 points dont 1 psychosocial, risque moyen', calculer(startBack, itemsSB, coche([1, 2, 3, 4, 5])).niveau?.cle, 'moyen')
verifie('STarT Back, 5 points tous psychosociaux, risque élevé', calculer(startBack, itemsSB, coche([5, 6, 7, 8, 9])).niveau?.cle, 'eleve')
// Dès que le total atteint 4, c'est le sous-score qui tranche : quatre points
// tous psychosociaux classent en risque élevé, malgré un total de quatre.
verifie('STarT Back, 4 points tous psychosociaux, risque élevé', calculer(startBack, itemsSB, coche([5, 6, 7, 8])).niveau?.cle, 'eleve')
verifie('STarT Back, 4 points dont 3 psychosociaux, risque moyen', calculer(startBack, itemsSB, coche([1, 5, 6, 7])).niveau?.cle, 'moyen')
verifie('STarT Back, sous-score rapporté', calculer(startBack, itemsSB, coche([5, 6, 7, 8, 9])).sousScores[0],
  { cle: 'psychosocial', libelle: 'Sous-score psychosocial', valeur: 5, sur: 5 })

// --------------------------------------------------------------------------
// ODI : une section laissée vide sort du dénominateur, elle ne vaut pas zéro.
// --------------------------------------------------------------------------
const odi: Questionnaire = {
  ...base, code: 'ODI', methode: 'odi',
  interpretation: [
    { cle: 'minime', libelle: 'Incapacité minime', min: 0, max: 20, ton: 'ok', conduite: '' },
    { cle: 'moderee', libelle: 'Incapacité modérée', min: 21, max: 40, ton: 'attention', conduite: '' },
  ],
}
const itemsODI = Array.from({ length: 10 }, (_, k) => item(k + 1, 'incapacite', 5))
const toutesSections = Object.fromEntries(itemsODI.map((it) => [it.id, 1]))
const sansLaHuitieme = { ...toutesSections }
delete (sansLaHuitieme as Record<string, number>).i8

verifie('ODI, un point sur dix sections, 20 %', calculer(odi, itemsODI, toutesSections).score, 20)
verifie('ODI, section vide, toujours 20 %', calculer(odi, itemsODI, sansLaHuitieme).score, 20)
verifie('ODI, dénominateur ramené à neuf sections', calculer(odi, itemsODI, sansLaHuitieme).sousScores[0],
  { cle: 'brut', libelle: 'Score brut sur les 9 sections remplies', valeur: 9, sur: 45 })

// --------------------------------------------------------------------------
// FABQ : onze items scorés sur seize, et c'est la sous-échelle travail qui décide.
// --------------------------------------------------------------------------
const fabq: Questionnaire = {
  ...base, code: 'FABQ', methode: 'sous_echelles',
  interpretation: [
    { cle: 'faible', libelle: 'Croyances faibles', min: 0, max: 18, ton: 'ok', conduite: '', sous_echelle: 'travail' },
    { cle: 'eleve', libelle: 'Croyances élevées', min: 19, max: 42, ton: 'alerte', conduite: '', sous_echelle: 'travail' },
  ],
}
const itemsFABQ = [
  item(1, null, 6),
  ...[2, 3, 4, 5].map((i) => item(i, 'activite_physique', 6)),
  ...[6, 7, 9, 10, 11, 12, 15].map((i) => item(i, 'travail', 6)),
]
const toutAuMaximum = Object.fromEntries(itemsFABQ.map((it) => [it.id, 6]))
const travailBas = Object.fromEntries(itemsFABQ.map((it) => [it.id, it.sous_echelle === 'travail' ? 2 : 6]))

verifie('FABQ, maximum de la sous-échelle travail, 42', calculer(fabq, itemsFABQ, toutAuMaximum).sousScores.find((s) => s.cle === 'travail'),
  { cle: 'travail', libelle: 'Sous-échelle travail', valeur: 42, sur: 42 })
verifie('FABQ, maximum de la sous-échelle activité physique, 24', calculer(fabq, itemsFABQ, toutAuMaximum).sousScores.find((s) => s.cle === 'activite_physique'),
  { cle: 'activite_physique', libelle: 'Sous-échelle activité physique', valeur: 24, sur: 24 })
verifie('FABQ, les items non scorés restent hors des sous-échelles', calculer(fabq, itemsFABQ, toutAuMaximum).sousScores.length, 2)
verifie('FABQ, le score rapporté est celui du travail', calculer(fabq, itemsFABQ, toutAuMaximum).score, 42)
verifie('FABQ, travail à 14 malgré une activité physique au maximum', calculer(fabq, itemsFABQ, travailBas).niveau?.cle, 'faible')

// --------------------------------------------------------------------------
// DN4 : somme simple, mais le seuil de 4 doit être inclusif.
// --------------------------------------------------------------------------
const dn4: Questionnaire = {
  ...base, code: 'DN4', methode: 'somme',
  interpretation: [
    { cle: 'peu_probable', libelle: 'Peu probable', min: 0, max: 3, ton: 'ok', conduite: '' },
    { cle: 'probable', libelle: 'Probable', min: 4, max: 10, ton: 'attention', conduite: '' },
  ],
}
const itemsDN4 = Array.from({ length: 10 }, (_, k) => item(k + 1, 'x'))
const oui = (n: number) => Object.fromEntries(itemsDN4.map((it, k) => [it.id, k < n ? 1 : 0]))

verifie('DN4 à 3 sur 10, sous le seuil', calculer(dn4, itemsDN4, oui(3)).niveau?.cle, 'peu_probable')
verifie('DN4 à 4 sur 10, au seuil', calculer(dn4, itemsDN4, oui(4)).niveau?.cle, 'probable')

console.log(echecs === 0 ? '\nTous les calculs sont conformes.' : `\n${echecs} échec(s).`)
process.exit(echecs === 0 ? 0 : 1)
