import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Vérifie que chaque offre du catalogue pointe vers le bon tarif Stripe.
 *
 * Les six Price ID vivent dans des variables d'environnement. En intervertir
 * deux ne provoque aucune erreur : la souscription aboutit, au mauvais montant
 * et pour le mauvais produit, et le webhook accorde ensuite l'offre du prix
 * réellement payé — sans qu'aucun signal ne remonte. C'est arrivé en
 * production le 20/08/2026 sur STRIPE_PRICE_PREMIUM_MONTHLY.
 *
 * Le checkout refuse désormais une souscription incohérente, mais il ne le
 * découvre qu'au moment où un client se présente. Cette route permet de
 * vérifier les six d'un coup, après toute modification des variables.
 *
 * Depuis la console du navigateur, connecté en administrateur :
 *
 *   await fetch('/api/admin/check-prices').then(r => r.json()).then(console.log)
 */
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const resultats = await Promise.all(
    Object.entries(STRIPE_PLANS).map(async ([cle, offre]) => {
      const base = { offre: cle, attendu: `${offre.name} · ${offre.displayPrice} · ${offre.plan}`, priceId: offre.priceId }

      if (!offre.priceId) {
        return { ...base, statut: 'variable absente', ecarts: ["aucun Price ID configuré"] }
      }

      try {
        const prix = await stripe.prices.retrieve(offre.priceId)
        const ecarts: string[] = []
        const planDuPrix = prix.metadata?.plan
        if (planDuPrix && planDuPrix !== offre.plan) ecarts.push(`offre ${planDuPrix} au lieu de ${offre.plan}`)
        if (prix.unit_amount !== offre.amount) ecarts.push(`${prix.unit_amount} centimes au lieu de ${offre.amount}`)
        if (prix.recurring?.interval !== offre.interval) ecarts.push(`facturation ${prix.recurring?.interval} au lieu de ${offre.interval}`)
        if (!prix.active) ecarts.push('prix désactivé dans Stripe')

        return {
          ...base,
          trouve: `${prix.nickname ?? '—'} · ${prix.unit_amount} centimes · ${prix.metadata?.plan ?? '—'}`,
          statut: ecarts.length ? 'INCOHÉRENT' : 'ok',
          ecarts,
        }
      } catch (err: any) {
        return { ...base, statut: 'INTROUVABLE', ecarts: [err?.message ?? 'prix introuvable dans Stripe'] }
      }
    })
  )

  const problemes = resultats.filter((r) => r.statut !== 'ok')
  return NextResponse.json({
    conforme: problemes.length === 0,
    resume: problemes.length === 0
      ? 'Les six offres pointent vers le bon tarif.'
      : `${problemes.length} offre(s) à corriger.`,
    offres: resultats,
  })
}
