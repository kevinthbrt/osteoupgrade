'use client'

import { useEffect, useState } from 'react'
import { isBlackFridayActive } from '@/lib/black-friday'

/**
 * État de l'offre côté navigateur.
 *
 * Dans un fichier à part, marqué client : `lib/black-friday.ts` est aussi
 * importé par des routes serveur, où un import de hooks React fait échouer
 * le build.
 *
 * La landing est rendue au build : y appeler `isBlackFridayActive()` figerait
 * l'état du jour du déploiement (bandeau absent si l'on déploie avant le 23,
 * resté affiché après le 30). La date est donc relue après le montage, puis
 * chaque minute, pour que le bandeau disparaisse à l'heure dite sans
 * rechargement.
 */
export function useBlackFridayActive(): boolean {
  const [actif, setActif] = useState(false)
  useEffect(() => {
    const maj = () => setActif(isBlackFridayActive())
    maj()
    const t = setInterval(maj, 60_000)
    return () => clearInterval(t)
  }, [])
  return actif
}
