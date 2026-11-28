'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  PERSONNAGES,
  estPersonnage,
  imagePersonnage,
  type AnimationPersonnage,
} from '@/lib/personnages'

type Props = {
  id: string
  expression?: string | null
  /**
   * Animation jouée à chaque changement de `declencheur` (ou d'expression),
   * avant le retour à la respiration de repos.
   */
  animation?: AnimationPersonnage
  declencheur?: string | number
  className?: string
  alt?: string
}

const CLASSES: Record<AnimationPersonnage, string> = {
  apparait: 'perso-apparait',
  saute: 'perso-saute',
  tremble: 'perso-tremble',
}

/**
 * Un personnage détouré, qui respire au repos et réagit par une animation
 * courte. Un identifiant inconnu n'affiche rien : un contenu en base mal saisi
 * ne casse pas le chapitre.
 */
export default function Personnage({ id, expression, animation = 'apparait', declencheur, className = '', alt }: Props) {
  const [classe, setClasse] = useState('perso-repos')

  useEffect(() => {
    setClasse(CLASSES[animation])
  }, [animation, expression, declencheur])

  if (!estPersonnage(id)) return null
  const fiche = PERSONNAGES[id]

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${expression}-${declencheur ?? ''}`}
      src={imagePersonnage(id, expression)}
      alt={alt ?? fiche.nom}
      draggable={false}
      onAnimationEnd={() => setClasse('perso-repos')}
      className={`block h-auto max-w-full select-none ${classe} ${className}`}
    />
  )
}

/** La bulle de dialogue, avec le nom de celui qui parle. */
export function Bulle({
  qui,
  children,
  pointe = 'bas',
  declencheur,
  className = '',
}: {
  qui?: string | null
  children: ReactNode
  pointe?: 'bas' | 'gauche' | 'aucune'
  declencheur?: string | number
  className?: string
}) {
  const libelle = qui && estPersonnage(qui) ? PERSONNAGES[qui].role : qui
  return (
    <div
      key={declencheur}
      className={`bulle-entre relative rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold leading-snug text-slate-800 shadow-lg shadow-violet-900/10 ${className}`}
    >
      {libelle && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-violet-600">{libelle}</span>
      )}
      {children}
      {pointe === 'bas' && (
        <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white" aria-hidden="true" />
      )}
      {pointe === 'gauche' && (
        <span className="absolute -left-2 bottom-5 h-4 w-4 rotate-45 bg-white" aria-hidden="true" />
      )}
    </div>
  )
}

/** Le fond de scène sur lequel posent les personnages. */
export function Scene({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-violet-50 to-violet-100 ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[12%] bottom-3 h-4 rounded-[50%] bg-violet-900/10 blur-md"
      />
    </div>
  )
}
