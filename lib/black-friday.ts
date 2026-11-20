/**
 * Black Friday 2026 : -30 % sur la première année des trois offres annuelles.
 *
 * Module d'affichage, sans SDK Stripe : importable par la landing et les pages
 * client. La partie serveur (coupon, éligibilité) vit dans
 * `lib/black-friday-server.ts`.
 *
 * Qui en profite :
 *   - un nouveau client qui choisit un tarif annuel standard pendant la période ;
 *   - un adhérent mensuel (hors fondateur et compte offert) qui passe à l'annuel.
 *
 * Ce qui ne se cumule pas : l'essai gratuit (une souscription annuelle Black
 * Friday est payée tout de suite), le tarif étudiant (-50 %, plus favorable,
 * il passe avant) et les tarifs Fondateur (déjà à -50 % à vie, jamais remisés).
 *
 * « Un an maximum » est garanti par construction : la remise porte sur une
 * facture annuelle, et le coupon s'arrête au bout de douze mois. Le
 * renouvellement se fait au tarif annuel normal.
 */

import { useEffect, useState } from 'react'
import { OFFERS, type Offer } from '@/lib/offers'

export const BLACK_FRIDAY_PERCENT = 30

/** Lundi 23 novembre 2026, 0 h, heure de Paris (UTC+1 en hiver). */
export const BLACK_FRIDAY_START = new Date('2026-11-23T00:00:00+01:00')

/**
 * Fin exclusive : mardi 1er décembre 2026, 0 h, heure de Paris. L'offre court
 * donc jusqu'au lundi 30 novembre à 23 h 59 (Cyber Monday inclus).
 */
export const BLACK_FRIDAY_END = new Date('2026-12-01T00:00:00+01:00')

/** Libellé de l'échéance, tel qu'il apparaît sur les pages et dans les emails. */
export const BLACK_FRIDAY_END_LABEL = 'lundi 30 novembre à minuit'

/** Nom affiché dans l'administration (colonne « remise » des abonnés). */
export const BLACK_FRIDAY_LABEL = 'Black Friday 2026'

export function isBlackFridayActive(now: Date = new Date()): boolean {
  return now >= BLACK_FRIDAY_START && now < BLACK_FRIDAY_END
}

/**
 * Prix de la première année au tarif Black Friday. Stripe arrondit la remise
 * au centime : 30 % de 499,99 € font 150,00 €, soit 349,99 € la première année.
 */
export function blackFridayFirstYearAmount(offer: Offer): number {
  return offer.annualAmount - Math.round((offer.annualAmount * BLACK_FRIDAY_PERCENT) / 100)
}

/** Économie de la première année, en centimes. */
export function blackFridaySavedAmount(offer: Offer): number {
  return offer.annualAmount - blackFridayFirstYearAmount(offer)
}

/** Prix Black Friday le plus bas des trois offres (accroche du bandeau). */
export const BLACK_FRIDAY_FROM_AMOUNT = Math.min(...OFFERS.map(blackFridayFirstYearAmount))

/**
 * Le compte peut-il passer de l'abonnement mensuel à l'annuel Black Friday ?
 * Lecture d'affichage uniquement : la route de bascule revérifie tout côté
 * serveur, y compris la présence d'un abonnement Stripe.
 */
export function canSwitchToBlackFridayAnnual(
  profile: {
    plan?: string | null
    billing_interval?: string | null
    is_founding_member?: boolean | null
    is_complimentary?: boolean | null
    subscription_status?: string | null
  } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!profile || !isBlackFridayActive(now)) return false
  return (
    ['osteoflow', 'osteoupgrade', 'bundle'].includes(profile.plan ?? '') &&
    profile.billing_interval !== 'year' &&
    !profile.is_founding_member &&
    !profile.is_complimentary &&
    ['active', 'trialing'].includes(profile.subscription_status ?? '')
  )
}

/**
 * État de l'offre côté navigateur.
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
