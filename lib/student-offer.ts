import { stripe, ANNUAL_PLAN_TYPES, productIdsFor } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { STUDENT_DISCOUNT_PERCENT } from '@/lib/offers'

/**
 * Offre étudiant (cf. docs/OFFRE_ETUDIANT.md) : -50 % la première année sur
 * les trois offres annuelles, débloquée par un justificatif vérifié à la main.
 * Module serveur uniquement (clé service-role, SDK Stripe).
 */

export const STUDENT_BUCKET = 'student-documents'

/** Identifiant fixe du coupon : le retrouver ne demande aucune recherche. */
const STUDENT_COUPON_ID = 'ETUDIANT_50_ANNUEL'

export type StudentVerification = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  document_path: string | null
  document_name: string | null
  submitted_at: string
  stripe_subscription_id: string | null
  discount_applied_at: string | null
  decided_at: string | null
  rejection_reason: string | null
  regularisation_amount: number | null
}

/**
 * Coupon de l'offre : -50 %, restreint aux produits annuels, pendant 12 mois.
 * Sur un abonnement annuel, 12 mois couvrent la seule première facture :
 * Stripe arrête la remise au renouvellement, sans rien à programmer.
 * Créé à la première utilisation, puis simplement relu.
 */
export async function ensureStudentCoupon(): Promise<string> {
  try {
    const existant = await stripe.coupons.retrieve(STUDENT_COUPON_ID)
    if (existant.valid) return existant.id
  } catch (err: any) {
    if (err?.code !== 'resource_missing') throw err
  }
  const produits = await productIdsFor(ANNUAL_PLAN_TYPES)
  if (produits.length === 0) throw new Error('Prix annuels non configurés')
  const coupon = await stripe.coupons.create({
    id: STUDENT_COUPON_ID,
    name: `Étudiant -${STUDENT_DISCOUNT_PERCENT} % (1re année)`,
    percent_off: STUDENT_DISCOUNT_PERCENT,
    duration: 'repeating',
    duration_in_months: 12,
    applies_to: { products: produits },
    metadata: { purpose: 'student_discount' },
  })
  return coupon.id
}

export async function studentVerificationFor(userId: string): Promise<StudentVerification | null> {
  const { data } = await supabaseAdmin
    .from('student_verifications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as StudentVerification) ?? null
}

/**
 * Le compte peut-il souscrire au tarif étudiant ? Il faut un justificatif
 * déposé et non refusé, et que la remise n'ait encore jamais servi : une
 * seule première année à -50 % par compte.
 */
export function canUseStudentDiscount(v: StudentVerification | null): boolean {
  return Boolean(v && v.status !== 'rejected' && !v.discount_applied_at)
}

/** Supprime le justificatif du stockage (après décision, ou remplacement). */
export async function deleteStudentDocument(path: string | null): Promise<void> {
  if (!path) return
  const { error } = await supabaseAdmin.storage.from(STUDENT_BUCKET).remove([path])
  if (error) console.error('[student-offer] suppression du justificatif impossible:', error.message)
}

/**
 * Retire la remise étudiant d'un abonnement refusé et facture la différence
 * déjà accordée.
 *
 * - Pendant l'essai, rien n'a été payé : retirer la remise suffit, le premier
 *   prélèvement se fera au plein tarif.
 * - Après paiement, la remise accordée sur la première facture est facturée
 *   à part, tout de suite (une facture « Régularisation tarif étudiant »).
 *
 * Renvoie le montant facturé, en centimes.
 */
export async function revokeStudentDiscount(subscriptionId: string): Promise<number> {
  const abonnement: any = await stripe.subscriptions.retrieve(subscriptionId)

  // Retirer la remise : les factures suivantes seront au plein tarif.
  try {
    await stripe.subscriptions.deleteDiscount(subscriptionId)
  } catch (err: any) {
    if (err?.code !== 'resource_missing') throw err
  }

  if (abonnement.status === 'trialing') return 0

  // Montant de la remise réellement accordée sur les factures payées de cet
  // abonnement (en pratique, la première facture annuelle).
  const factures = await stripe.invoices.list({ subscription: subscriptionId, status: 'paid', limit: 10 })
  const remise = factures.data.reduce((total, facture: any) => {
    const montants = (facture.total_discount_amounts ?? []) as { amount: number }[]
    return total + montants.reduce((s, d) => s + (d.amount ?? 0), 0)
  }, 0)
  if (remise <= 0) return 0

  const client = typeof abonnement.customer === 'string' ? abonnement.customer : abonnement.customer.id
  await stripe.invoiceItems.create({
    customer: client,
    amount: remise,
    currency: 'eur',
    description: 'Régularisation tarif étudiant (justificatif non validé)',
  })
  const facture = await stripe.invoices.create({
    customer: client,
    collection_method: 'charge_automatically',
    pending_invoice_items_behavior: 'include',
    auto_advance: true,
    description: 'Régularisation : le tarif étudiant demande un justificatif valide.',
  } as any)
  const finalisee = await stripe.invoices.finalizeInvoice(facture.id as string)
  try {
    await stripe.invoices.pay(finalisee.id as string)
  } catch (err: any) {
    // Carte refusée : la facture reste ouverte, Stripe relance selon ses
    // réglages de recouvrement. Le refus du justificatif reste acquis.
    console.error('[student-offer] paiement de la régularisation refusé:', err?.message)
  }
  return remise
}
