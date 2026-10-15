import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, PARTNER_PROMO_PURPOSE, PUBLIC_PLAN_TYPES, MONTHLY_PLAN_TYPES, STRIPE_PLANS, productIdsFor } from '@/lib/stripe'

async function checkAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

function randomSuffix(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans caractères ambigus (0/O, 1/I)
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/**
 * Tarifs qu'un lot peut viser : les mensuels et annuels publics. Les tarifs
 * Fondateur n'en font jamais partie (déjà à -50 % à vie).
 */
const CIBLES_POSSIBLES: readonly string[] = PUBLIC_PLAN_TYPES

/** Libellé court d'un tarif, pour la liste des codes : « Premium annuel ». */
function libelleCible(clef: string): string {
  const offre = STRIPE_PLANS[clef]
  if (!offre) return clef
  const nom = offre.plan === 'bundle' ? 'Premium' : offre.plan === 'osteoflow' ? 'MyOsteoFlow' : 'OsteoUpgrade'
  return `${nom} ${offre.isAnnual ? 'annuel' : 'mensuel'}`
}

// POST /api/admin/partner-codes — Crée un coupon partenaire + un lot de codes
// promo Stripe à usage unique (ex: -10% pendant 12 mois pour les diplômés IFCOPS).
// `cibles` : clés des tarifs visés (ex. ['premium_annual']), toutes par défaut.
// Réservé aux nouveaux clients via restrictions.first_time_transaction, géré
// nativement par Stripe (pas de vérification côté app à écrire).
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { partner, percentOff, durationInMonths, count, note, cibles } = await request.json()

    const partnerName = typeof partner === 'string' ? partner.trim() : ''
    if (!partnerName) {
      return NextResponse.json({ error: 'Le nom du partenaire est requis' }, { status: 400 })
    }
    if (!percentOff || percentOff < 1 || percentOff > 100) {
      return NextResponse.json({ error: 'percentOff doit être entre 1 et 100' }, { status: 400 })
    }
    if (!durationInMonths || durationInMonths < 1 || durationInMonths > 60) {
      return NextResponse.json({ error: 'durationInMonths doit être entre 1 et 60' }, { status: 400 })
    }
    if (!count || count < 1 || count > 200) {
      return NextResponse.json({ error: 'count doit être entre 1 et 200' }, { status: 400 })
    }

    const batchNote = typeof note === 'string' ? note.trim() : ''

    // Tarifs visés par le lot. Stripe restreint un coupon par produit, et
    // chaque tarif (mensuel ou annuel d'une offre) a son propre produit : le
    // coupon ne s'appliquera qu'aux tarifs cochés. Les tarifs Fondateur ne
    // sont jamais proposés, déjà à -50 % à vie.
    const ciblesRetenues: string[] = Array.isArray(cibles) && cibles.length > 0
      ? cibles.filter((c: unknown): c is string => typeof c === 'string' && CIBLES_POSSIBLES.includes(c))
      : [...CIBLES_POSSIBLES]
    if (ciblesRetenues.length === 0) {
      return NextResponse.json({ error: 'Choisissez au moins une offre.' }, { status: 400 })
    }
    const sansPrix = ciblesRetenues.filter((c) => !STRIPE_PLANS[c]?.priceId)
    if (sansPrix.length > 0) {
      return NextResponse.json(
        { error: `Prix Stripe non configuré pour : ${sansPrix.map(libelleCible).join(', ')}` },
        { status: 400 }
      )
    }
    const produitsEligibles = await productIdsFor(ciblesRetenues)

    // Un coupon par lot généré, partagé par tous les codes du lot — chaque
    // code reste un code promo Stripe distinct et à usage unique.
    const couponParams: any = {
      percent_off: percentOff,
      duration: 'repeating',
      duration_in_months: durationInMonths,
      name: `${partnerName} -${percentOff}%`,
      metadata: {
        created_by: admin.id,
        purpose: PARTNER_PROMO_PURPOSE,
        partner: partnerName,
        cibles: ciblesRetenues.join(','),
        ...(batchNote ? { batch_note: batchNote } : {})
      }
    }
    // Par produit : Stripe refuse `applies_to.prices` et la création échouait.
    if (produitsEligibles.length > 0) {
      couponParams.applies_to = { products: produitsEligibles }
    }

    const coupon = await stripe.coupons.create(couponParams)

    const prefix = partnerName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'PARTNER'
    const codes: { id: string; code: string }[] = []

    for (let i = 0; i < count; i++) {
      let created = false
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        const code = `${prefix}-${randomSuffix()}`
        try {
          const promoCode = await stripe.promotionCodes.create({
            promotion: {
              type: 'coupon',
              coupon: coupon.id
            },
            code,
            max_redemptions: 1,
            // Réservé aux clients qui n'ont jamais payé sur ce compte Stripe —
            // c'est Stripe qui vérifie, pas nous. (restrictions est un attribut
            // du promotion code, pas du coupon.)
            restrictions: {
              first_time_transaction: true
            },
            metadata: {
              created_by: admin.id,
              purpose: PARTNER_PROMO_PURPOSE,
              partner: partnerName,
              ...(batchNote ? { batch_note: batchNote } : {})
            }
          } as any)
          codes.push({ id: promoCode.id, code: promoCode.code })
          created = true
        } catch (err: any) {
          // Collision de code aléatoire (très rare) : on retente avec un autre suffixe.
          if (attempt === 4) throw err
        }
      }
    }

    return NextResponse.json({
      success: true,
      partner: partnerName,
      couponId: coupon.id,
      percentOff,
      durationInMonths,
      cibles: ciblesRetenues.map(libelleCible),
      codes
    })
  } catch (error: any) {
    console.error('❌ Error generating partner codes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création des codes partenaire' },
      { status: 500 }
    )
  }
}

// GET /api/admin/partner-codes?partner=IFCOPS — Liste les codes partenaire
// (tous statuts, y compris déjà utilisés puisqu'ils sont à usage unique).
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const partnerFilter = searchParams.get('partner')?.trim() || null

    const promoCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.promotion.coupon']
    } as any)

    const items = (promoCodes.data as any[])
      .filter((pc) => {
        const coupon = pc.promotion?.coupon
        const purpose = pc.metadata?.purpose || (typeof coupon === 'object' ? coupon?.metadata?.purpose : null)
        return purpose === PARTNER_PROMO_PURPOSE
      })
      .filter((pc) => {
        if (!partnerFilter) return true
        const coupon = pc.promotion?.coupon
        const partner = pc.metadata?.partner || (typeof coupon === 'object' ? coupon?.metadata?.partner : null)
        return partner === partnerFilter
      })
      .map((pc: any) => {
        const coupon = pc.promotion?.coupon
        return {
          id: pc.id,
          code: pc.code,
          partner: pc.metadata?.partner || (typeof coupon === 'object' ? coupon?.metadata?.partner : null) || 'N/A',
          note: pc.metadata?.batch_note || (typeof coupon === 'object' ? coupon?.metadata?.batch_note : null) || null,
          percentOff: typeof coupon === 'object' ? coupon?.percent_off ?? null : null,
          // Lots créés avant le choix des cibles : restreints aux trois
          // offres mensuelles, ce que dit la valeur par défaut.
          cibles: ((typeof coupon === 'object' && coupon?.metadata?.cibles)
            ? String(coupon.metadata.cibles).split(',')
            : [...MONTHLY_PLAN_TYPES]
          ).map(libelleCible),
          durationInMonths: typeof coupon === 'object' ? coupon?.duration_in_months ?? null : null,
          maxRedemptions: pc.max_redemptions,
          timesRedeemed: pc.times_redeemed,
          active: pc.active,
          created: pc.created
        }
      })
      .sort((a, b) => b.created - a.created)

    return NextResponse.json({ codes: items })
  } catch (error: any) {
    console.error('❌ Error listing partner codes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des codes' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/partner-codes — Désactive un code partenaire
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { promoCodeId } = await request.json()
    if (!promoCodeId) return NextResponse.json({ error: 'promoCodeId requis' }, { status: 400 })

    await stripe.promotionCodes.update(promoCodeId, { active: false })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error deactivating partner code:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la désactivation' },
      { status: 500 }
    )
  }
}
