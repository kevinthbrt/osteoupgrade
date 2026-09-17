'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minus, Plus, Scan, X } from 'lucide-react'
import type { ArbreNoeud, ArbrePayload } from '@/lib/region-modules'

/**
 * Schéma complet de l'arbre de décision.
 *
 * Tout est à l'écran : aucune branche ne se découvre en cliquant. C'est ce que
 * le parcours pas à pas ne peut pas montrer, parce qu'il cache par construction
 * les chemins qu'on n'a pas pris, alors que ce sont eux qui donnent la mesure
 * du raisonnement.
 *
 * La mise en page est calculée ici plutôt que déléguée à une bibliothèque de
 * graphes : l'arbre tient en une trentaine de nœuds, et une dépendance de plus
 * pour un seul écran coûterait davantage que ces cent lignes.
 *
 * Le graphe n'est pas un arbre au sens strict : plusieurs branches se
 * rejoignent. Deux traitements différents selon ce qui converge.
 *
 * Une question atteinte depuis plusieurs endroits reste unique, les flèches y
 * convergent. Les mouvements répétés, par exemple, sont atteints depuis trois
 * chemins, et c'est précisément ce que le lecteur doit voir : quel que soit le
 * détour, on repasse par là.
 *
 * Une conclusion atteinte depuis plusieurs endroits est dessinée sous chacun de
 * ses parents. La partager obligerait à la placer sur la couche de son parent
 * le plus profond, loin des autres, avec une flèche traversant tout le schéma.
 * Une carte terminale répétée sous deux branches se lit sans effort ; une
 * flèche de quatre niveaux, non.
 */

type Ton = 'urgence' | 'orienter' | 'traiter'

const TONS: Record<Ton, { fond: string; bord: string; texte: string; trait: string; libelle: string }> = {
  urgence: { fond: '#fff1f2', bord: '#fda4af', texte: '#9f1239', trait: '#e11d48', libelle: 'Urgence' },
  orienter: { fond: '#fffbeb', bord: '#fcd34d', texte: '#92400e', trait: '#f59e0b', libelle: 'Réorienter' },
  traiter: { fond: '#ecfdf5', bord: '#6ee7b7', texte: '#065f46', trait: '#059669', libelle: 'Prendre en charge' },
}

const L_QUESTION = 300
const L_CONCLUSION = 256
const MARGE = 28
const ECART_X = 34
const ECART_Y = 58
const PAD = 14

/** Facteur empirique de largeur de caractère pour Inter, volontairement large :
 *  une ligne de trop agrandit la boîte, une ligne de moins tronque le texte. */
const LARGEUR_CAR = 0.55

/**
 * Espace insécable devant la ponctuation double et à l'intérieur des
 * guillemets. C'est la règle typographique française, et elle évite au passage
 * qu'un point d'interrogation se retrouve seul sur la dernière ligne d'une
 * question, ce qui arrivait sur la moitié des nœuds.
 */
function insecables(texte: string): string {
  return String(texte || '')
    .replace(/ ([?!:;»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0')
}

function couper(texte: string, largeur: number, taille: number): string[] {
  const max = Math.max(8, Math.floor(largeur / (taille * LARGEUR_CAR)))
  // Découpage sur les espaces sécables seulement : les insécables posées
  // ci-dessus doivent rester collées à ce qui les suit.
  const mots = insecables(texte).split(/[ \t\n\r]+/).filter(Boolean)
  const lignes: string[] = []
  let courante = ''
  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot
    if (essai.length <= max) courante = essai
    else {
      if (courante) lignes.push(courante)
      courante = mot
    }
  }
  if (courante) lignes.push(courante)
  return lignes.length ? lignes : ['']
}

type Boite = {
  cle: string
  type: 'question' | 'conclusion'
  ton?: Ton
  couche: number
  x: number
  y: number
  w: number
  h: number
  axe?: string
  axeY: number
  /** Lignes déjà positionnées : le rendu ne recalcule aucune géométrie. */
  titre: { texte: string; y: number }[]
  options: { numero: number; lignes: { texte: string; y: number }[]; vers: string; puceY: number }[]
  conduite: { texte: string; y: number }[]
  pourquoi: { texte: string; y: number }[]
  badgeY: number
}

type Arete = { de: string; vers: string; px: number; py: number; numero: number; ton?: Ton }

type Plan = { boites: Boite[]; aretes: Arete[]; largeur: number; hauteur: number }

function disposer(payload: ArbrePayload, detaille: boolean): Plan | null {
  const noeuds = payload?.noeuds || {}
  const racine = payload?.racine
  if (!racine || !noeuds[racine]) return null

  // 1. Instances. Une question vaut une instance ; une conclusion en reçoit une
  //    par arête entrante, pour être dessinée sous chacun de ses parents.
  const instances = new Map<string, string>() // identifiant -> clé du nœud
  const atteignables: string[] = []
  const sortantes = new Map<string, string[]>()
  const file = [racine]
  let compteur = 0

  while (file.length) {
    const id = file.shift() as string
    if (atteignables.includes(id) || !noeuds[id]) continue
    atteignables.push(id)
    instances.set(id, id)
    const noeud = noeuds[id]
    const cibles: string[] = []
    if (noeud.type === 'question') {
      for (const option of noeud.options) {
        const cible = noeuds[option.vers]
        if (!cible) continue
        if (cible.type === 'question') {
          cibles.push(option.vers)
          file.push(option.vers)
        } else {
          const idFeuille = `${option.vers}@${compteur++}`
          cibles.push(idFeuille)
          atteignables.push(idFeuille)
          instances.set(idFeuille, option.vers)
          sortantes.set(idFeuille, [])
        }
      }
    }
    sortantes.set(id, cibles)
  }

  // 2. Couche = plus long chemin depuis la racine, pour que toute flèche descende.
  const entrantes = new Map<string, number>()
  for (const cle of atteignables) entrantes.set(cle, 0)
  for (const cle of atteignables) {
    for (const cible of sortantes.get(cle) || []) {
      if (entrantes.has(cible)) entrantes.set(cible, (entrantes.get(cible) || 0) + 1)
    }
  }
  const couche = new Map<string, number>(atteignables.map((cle) => [cle, 0]))
  const pret = atteignables.filter((cle) => (entrantes.get(cle) || 0) === 0)
  const traites: string[] = []
  while (pret.length) {
    const cle = pret.shift() as string
    traites.push(cle)
    for (const cible of sortantes.get(cle) || []) {
      if (!entrantes.has(cible)) continue
      couche.set(cible, Math.max(couche.get(cible) || 0, (couche.get(cle) || 0) + 1))
      entrantes.set(cible, (entrantes.get(cible) || 0) - 1)
      if ((entrantes.get(cible) || 0) === 0) pret.push(cible)
    }
  }
  // Un cycle dans le payload laisserait des nœuds non traités : plutôt que de
  // boucler, on les pousse sur une dernière couche. Le schéma reste lisible et
  // l'anomalie se voit.
  const maxCouche = Math.max(0, ...traites.map((cle) => couche.get(cle) || 0))
  for (const cle of atteignables) {
    if (!traites.includes(cle)) couche.set(cle, maxCouche + 1)
  }

  // 3. Contenu et hauteur de chaque boîte.
  const boites = new Map<string, Boite>()
  for (const cle of atteignables) {
    const noeud: ArbreNoeud = noeuds[instances.get(cle) as string]
    const question = noeud.type === 'question'
    const w = question ? L_QUESTION : L_CONCLUSION
    const utile = w - PAD * 2
    let h = PAD

    const boite: Boite = {
      cle,
      type: question ? 'question' : 'conclusion',
      ton: question ? undefined : ((noeud as any).ton as Ton),
      couche: couche.get(cle) || 0,
      x: 0,
      y: 0,
      w,
      h: 0,
      axe: question ? (noeud as any).axe : undefined,
      axeY: 0,
      titre: [],
      options: [],
      conduite: [],
      pourquoi: [],
      badgeY: 0,
    }

    /** Empile des lignes de texte et retourne la hauteur consommée. */
    const empiler = (lignes: string[], interligne: number) =>
      lignes.map((texte) => {
        h += interligne
        return { texte, y: Math.round(h) }
      })

    if (question) {
      if (boite.axe) {
        h += 11
        boite.axeY = Math.round(h)
        h += 4
      }
      boite.titre = empiler(couper((noeud as any).texte, utile, 12.5), 16)
      h += 10
      ;(noeud as any).options.forEach((option: any, index: number) => {
        const puceY = Math.round(h + 8)
        const lignes = empiler(couper(option.label, utile - 20, 11), 14)
        boite.options.push({ numero: index + 1, lignes, vers: option.vers, puceY })
        h += 9
      })
      h += PAD - 4
    } else {
      boite.badgeY = Math.round(h)
      h += 20
      boite.titre = empiler(couper((noeud as any).titre, utile, 13), 17)
      if (detaille) {
        h += 8
        boite.conduite = empiler(couper((noeud as any).conduite, utile, 10.5), 13.5)
        if ((noeud as any).pourquoi) {
          h += 8
          boite.pourquoi = empiler(couper((noeud as any).pourquoi, utile, 10), 12.5)
        }
      }
      h += PAD
    }

    boite.h = Math.round(h)
    boites.set(cle, boite)
  }

  // 4. Ordonner chaque couche par le barycentre des parents, puis placer.
  const parCouche = new Map<number, string[]>()
  for (const cle of atteignables) {
    const c = couche.get(cle) || 0
    parCouche.set(c, [...(parCouche.get(c) || []), cle])
  }
  const parents = new Map<string, string[]>()
  for (const cle of atteignables) {
    for (const cible of sortantes.get(cle) || []) {
      if (boites.has(cible)) parents.set(cible, [...(parents.get(cible) || []), cle])
    }
  }

  const couches = [...parCouche.keys()].sort((a, b) => a - b)
  const largeurCouche = new Map<number, number>()
  for (const c of couches) {
    const cles = parCouche.get(c) || []
    largeurCouche.set(
      c,
      cles.reduce((somme, cle) => somme + (boites.get(cle)?.w || 0), 0) + (cles.length - 1) * ECART_X
    )
  }
  const largeur = Math.max(...largeurCouche.values()) + MARGE * 2

  let y = MARGE
  for (const c of couches) {
    const cles = (parCouche.get(c) || []).slice()
    cles.sort((a, b) => {
      const centre = (cle: string) => {
        const liste = (parents.get(cle) || []).map((p) => boites.get(p)).filter(Boolean) as Boite[]
        if (!liste.length) return 0
        return liste.reduce((somme, p) => somme + p.x + p.w / 2, 0) / liste.length
      }
      return centre(a) - centre(b)
    })

    let x = (largeur - (largeurCouche.get(c) || 0)) / 2
    let hauteurCouche = 0
    for (const cle of cles) {
      const boite = boites.get(cle) as Boite
      boite.x = Math.round(x)
      boite.y = Math.round(y)
      x += boite.w + ECART_X
      hauteurCouche = Math.max(hauteurCouche, boite.h)
    }
    parCouche.set(c, cles)
    y += hauteurCouche + ECART_Y
  }

  // 5. Arêtes, ancrées sur le bord bas de la boîte, une sortie par option.
  const aretes: Arete[] = []
  for (const boite of boites.values()) {
    const total = boite.options.length
    boite.options.forEach((option, index) => {
      const cible = boites.get(option.vers)
      if (!cible) return
      aretes.push({
        de: boite.cle,
        vers: option.vers,
        px: Math.round(boite.x + (boite.w * (index + 1)) / (total + 1)),
        py: boite.y + boite.h,
        numero: option.numero,
        ton: cible.ton,
      })
    })
  }

  return { boites: [...boites.values()], aretes, largeur: Math.round(largeur), hauteur: Math.round(y) }
}

export default function ArbreDecisionVisuel({ payload }: { payload: ArbrePayload }) {
  const [detaille, setDetaille] = useState(true)
  const [pleinEcran, setPleinEcran] = useState(false)

  const plan = useMemo(() => disposer(payload, detaille), [payload, detaille])
  if (!plan) return null

  return (
    <div>
      <Scene plan={plan} detaille={detaille} setDetaille={setDetaille} onAgrandir={() => setPleinEcran(true)} />

      {pleinEcran && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Arbre de décision</h2>
            <button
              onClick={() => setPleinEcran(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Fermer
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Scene plan={plan} detaille={detaille} setDetaille={setDetaille} pleineHauteur />
          </div>
        </div>
      )}
    </div>
  )
}

function Scene({
  plan,
  detaille,
  setDetaille,
  onAgrandir,
  pleineHauteur,
}: {
  plan: Plan
  detaille: boolean
  setDetaille: (valeur: boolean) => void
  onAgrandir?: () => void
  pleineHauteur?: boolean
}) {
  const conteneur = useRef<HTMLDivElement>(null)
  // zoom null : la largeur du schéma suit celle du conteneur. Dès que l'on
  // zoome à la main, on cesse de recalculer à chaque redimensionnement.
  const [zoom, setZoom] = useState<number | null>(null)
  const [ajuste, setAjuste] = useState(0.5)

  useEffect(() => {
    const mesurer = () => {
      const largeur = conteneur.current?.clientWidth
      if (largeur) setAjuste(Math.min(1, (largeur - 24) / plan.largeur))
    }
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [plan.largeur])

  const echelle = zoom ?? ajuste

  return (
    <div className={pleineHauteur ? 'flex h-full flex-col' : ''}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Legende />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setDetaille(!detaille)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {detaille ? 'Titres seuls' : 'Conduites détaillées'}
          </button>
          <button
            onClick={() => setZoom(Math.max(0.25, echelle - 0.15))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Réduire"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(null)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Ajuster à la largeur"
          >
            <Scan className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(Math.min(2, echelle + 0.15))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Agrandir"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {onAgrandir && (
            <button
              onClick={onAgrandir}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
              title="Plein écran"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={conteneur}
        className={`overflow-auto rounded-xl border border-slate-200 bg-white p-3 ${
          pleineHauteur ? 'h-full' : 'max-h-[75vh]'
        }`}
      >
        <svg
          width={plan.largeur * echelle}
          height={plan.hauteur * echelle}
          viewBox={`0 0 ${plan.largeur} ${plan.hauteur}`}
          role="img"
          aria-label="Arbre de décision complet, de la sécurité à la conduite thérapeutique"
        >
          <defs>
            {(['neutre', 'urgence', 'orienter', 'traiter'] as const).map((nom) => {
              const couleur = nom === 'neutre' ? '#a78bfa' : TONS[nom].trait
              return (
                <marker
                  key={nom}
                  id={`fleche-${nom}`}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 z" fill={couleur} />
                </marker>
              )
            })}
          </defs>

          {plan.aretes.map((arete, index) => {
            const cible = plan.boites.find((b) => b.cle === arete.vers)
            if (!cible) return null
            const cx = cible.x + cible.w / 2
            const cy = cible.y - 7
            const d = Math.max(26, (cy - arete.py) / 2)
            const couleur = arete.ton ? TONS[arete.ton].trait : '#a78bfa'
            return (
              <g key={index}>
                <path
                  d={`M ${arete.px} ${arete.py} C ${arete.px} ${arete.py + d}, ${cx} ${cy - d}, ${cx} ${cy}`}
                  fill="none"
                  stroke={couleur}
                  strokeWidth={1.4}
                  strokeOpacity={0.75}
                  markerEnd={`url(#fleche-${arete.ton || 'neutre'})`}
                />
                <circle cx={arete.px} cy={arete.py} r={7} fill={couleur} />
                <text
                  x={arete.px}
                  y={arete.py + 2.6}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={700}
                  fill="#ffffff"
                >
                  {arete.numero}
                </text>
              </g>
            )
          })}

          {plan.boites.map((boite) => (
            <BoiteRendue key={boite.cle} boite={boite} detaille={detaille} />
          ))}
        </svg>
      </div>
    </div>
  )
}

function BoiteRendue({ boite, detaille }: { boite: Boite; detaille: boolean }) {
  const question = boite.type === 'question'
  const ton = boite.ton ? TONS[boite.ton] : null

  return (
    <g transform={`translate(${boite.x}, ${boite.y})`}>
      <rect
        width={boite.w}
        height={boite.h}
        rx={12}
        fill={question ? '#ffffff' : ton?.fond || '#ffffff'}
        stroke={question ? '#c4b5fd' : ton?.bord || '#e2e8f0'}
        strokeWidth={question ? 1.6 : 1.4}
      />

      {question ? (
        <>
          {boite.axe && (
            <text x={PAD} y={boite.axeY} fontSize={9} fontWeight={700} fill="#7c3aed" letterSpacing="0.4">
              {boite.axe.toUpperCase()}
            </text>
          )}
          {boite.titre.map((ligne, index) => (
            <text key={index} x={PAD} y={ligne.y} fontSize={12.5} fontWeight={600} fill="#0f172a">
              {ligne.texte}
            </text>
          ))}
          {boite.options.map((option) => (
            <g key={option.numero}>
              <circle cx={PAD + 7} cy={option.puceY} r={6.5} fill="#ede9fe" />
              <text
                x={PAD + 7}
                y={option.puceY + 2.9}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={700}
                fill="#6d28d9"
              >
                {option.numero}
              </text>
              {option.lignes.map((ligne, index) => (
                <text key={index} x={PAD + 20} y={ligne.y} fontSize={11} fill="#334155">
                  {ligne.texte}
                </text>
              ))}
            </g>
          ))}
        </>
      ) : (
        <>
          <rect
            x={PAD}
            y={boite.badgeY}
            width={(ton?.libelle.length || 6) * 6.15 + 16}
            height={15}
            rx={7.5}
            fill={ton?.trait || '#94a3b8'}
          />
          <text x={PAD + 7} y={boite.badgeY + 11} fontSize={8.5} fontWeight={700} fill="#ffffff">
            {ton?.libelle.toUpperCase()}
          </text>
          {boite.titre.map((ligne, index) => (
            <text
              key={index}
              x={PAD}
              y={ligne.y}
              fontSize={13}
              fontWeight={700}
              fill={ton?.texte || '#0f172a'}
            >
              {ligne.texte}
            </text>
          ))}
          {detaille &&
            boite.conduite.map((ligne, index) => (
              <text key={`c${index}`} x={PAD} y={ligne.y} fontSize={10.5} fill="#334155">
                {ligne.texte}
              </text>
            ))}
          {detaille &&
            boite.pourquoi.map((ligne, index) => (
              <text key={`p${index}`} x={PAD} y={ligne.y} fontSize={10} fontStyle="italic" fill="#64748b">
                {ligne.texte}
              </text>
            ))}
        </>
      )}
    </g>
  )
}

function Legende() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border-2 border-violet-300 bg-white" />
        Question
      </span>
      {(['urgence', 'orienter', 'traiter'] as const).map((ton) => (
        <span key={ton} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: TONS[ton].fond, border: `2px solid ${TONS[ton].bord}` }}
          />
          {TONS[ton].libelle}
        </span>
      ))}
    </div>
  )
}
