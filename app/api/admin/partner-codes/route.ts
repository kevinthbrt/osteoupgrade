import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, PARTNER_PROMO_PURPOSE } from '@/lib/stripe'

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

// POST /api/admin/partner-codes — Crée un coupon partenaire + un lot de codes
// promo Stripe à usage unique (ex: -10% pendant 12 mois pour les diplômés IFCOPS).
// Réservé aux nouveaux clients via restrictions.first_time_transaction, géré
// nativement par Stripe (pas de vérification côté app à écrire).
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { partner, percentOff, durationInMonths, count, note } = await request.json()

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
    const premiumPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY

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
        ...(batchNote ? { batch_note: batchNote } : {})
      },
      // Réservé aux clients qui n'ont jamais eu de transaction sur ce compte
      // Stripe — c'est Stripe qui vérifie, pas nous.
      restrictions: {
        first_time_transaction: true
      }
    }
    if (premiumPriceId) {
      couponParams.applies_to = { prices: [premiumPriceId] }
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
