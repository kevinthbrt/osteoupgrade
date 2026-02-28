import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { stripe } from '@/lib/stripe'

async function checkAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// POST /api/admin/generate-promo — Crée un coupon + un code promo Stripe
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code, maxRedemptions, amountOff } = await request.json()

    if (!maxRedemptions || maxRedemptions < 1) {
      return NextResponse.json({ error: 'maxRedemptions doit être >= 1' }, { status: 400 })
    }

    const discountAmount = amountOff ?? 10000 // 100€ par défaut en centimes

    // Crée le coupon Stripe
    const coupon = await stripe.coupons.create({
      amount_off: discountAmount,
      currency: 'eur',
      duration: 'once',
      max_redemptions: maxRedemptions,
      name: `Gold Promo -${discountAmount / 100}€`,
      metadata: {
        created_by: admin.id,
        purpose: 'gold_promo'
      }
    })

    // Crée le code promo lisible, ou laisse Stripe en générer un
    const promoCodeParams: any = {
      coupon: coupon.id,
      max_redemptions: maxRedemptions,
      metadata: {
        created_by: admin.id
      }
    }
    if (code && code.trim().length > 0) {
      promoCodeParams.code = code.trim().toUpperCase()
    }

    const promoCode = await stripe.promotionCodes.create(promoCodeParams)

    return NextResponse.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        couponId: coupon.id,
        amountOff: discountAmount,
        maxRedemptions,
        timesRedeemed: 0,
        active: promoCode.active,
        created: promoCode.created
      }
    })
  } catch (error: any) {
    console.error('❌ Error generating promo code:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du code promo' },
      { status: 500 }
    )
  }
}

// GET /api/admin/generate-promo — Liste les codes promo existants (purpose: gold_promo)
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const admin = await checkAdmin(supabase)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Récupère tous les codes promo actifs
    const promoCodes = await stripe.promotionCodes.list({
      active: true,
      limit: 50
    })

    // Filtre sur les coupons créés pour la promo Gold
    const goldCodes = (promoCodes.data as any[]).filter(
      (pc) => pc.coupon?.metadata?.purpose === 'gold_promo'
    )

    const result = goldCodes.map((pc: any) => ({
      id: pc.id,
      code: pc.code,
      couponId: pc.coupon?.id ?? pc.coupon,
      amountOff: pc.coupon?.amount_off ?? null,
      maxRedemptions: pc.max_redemptions,
      timesRedeemed: pc.times_redeemed,
      active: pc.active,
      created: pc.created
    }))

    return NextResponse.json({ promoCodes: result })
  } catch (error: any) {
    console.error('❌ Error listing promo codes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des codes' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/generate-promo — Désactive un code promo
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
    console.error('❌ Error deactivating promo code:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la désactivation' },
      { status: 500 }
    )
  }
}
