import { NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY || !STRIPE_PREMIUM_PRICE_ID) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré. Ajoutez les variables STRIPE_SECRET_KEY et STRIPE_PREMIUM_PRICE_ID.' },
      { status: 500 }
    )
  }

  const { userId, email } = await request.json()

  if (!userId || !email) {
    return NextResponse.json(
      { error: 'Impossible de démarrer le paiement sans utilisateur authentifié.' },
      { status: 400 }
    )
  }

  const payload = new URLSearchParams()
  payload.append('mode', 'subscription')
  payload.append('success_url', `${APP_URL}/settings?checkout=success`)
  payload.append('cancel_url', `${APP_URL}/settings?checkout=cancelled`)
  payload.append('line_items[0][price]', STRIPE_PREMIUM_PRICE_ID)
  payload.append('line_items[0][quantity]', '1')
  payload.append('metadata[userId]', userId)
  payload.append('customer_email', email)

  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    })

    const data = await stripeResponse.json()

    if (!stripeResponse.ok) {
      const message = data?.error?.message || 'Erreur lors de la création de la session Stripe'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!data?.url) {
      return NextResponse.json({ error: 'Lien Stripe indisponible' }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    console.error('Stripe checkout error', error)
    return NextResponse.json({ error: 'Une erreur est survenue avec Stripe' }, { status: 500 })
  }
}

