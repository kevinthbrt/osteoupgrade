import { supabaseAdmin } from './supabase-server'
import type { CustomerEventType } from './customer-tracking'

/**
 * Écriture de la chronologie client (`customer_events`).
 *
 * Séparé de `lib/customer-tracking.ts` parce que ce module importe la clé
 * service-role : il ne doit jamais être tiré dans un bundle navigateur.
 */

export type CustomerEventInput = {
  userId?: string | null
  email: string
  type: CustomerEventType
  plan?: string | null
  previousPlan?: string | null
  reason?: string | null
  comment?: string | null
  amountCents?: number | null
  source?: 'stripe' | 'app' | 'admin'
  occurredAt?: string | Date | null
  metadata?: Record<string, unknown>
}

/**
 * Pose un événement, sans jamais faire échouer l'appelant.
 *
 * Ces appels sont greffés sur des chemins critiques : webhook Stripe,
 * changement d'offre, envoi d'email. Une erreur d'écriture du suivi ne doit
 * pas annuler un abonnement ni bloquer un email, donc on avale l'exception
 * après l'avoir journalisée.
 */
export async function logCustomerEvent(input: CustomerEventInput): Promise<void> {
  if (!input.email) return

  try {
    const { error } = await supabaseAdmin.from('customer_events').insert({
      user_id: input.userId || null,
      email: input.email,
      event_type: input.type,
      plan: input.plan ?? null,
      previous_plan: input.previousPlan ?? null,
      reason: input.reason ?? null,
      comment: input.comment ?? null,
      amount_cents: input.amountCents ?? null,
      source: input.source || 'app',
      occurred_at: input.occurredAt
        ? new Date(input.occurredAt).toISOString()
        : new Date().toISOString(),
      metadata: input.metadata || {},
    })

    if (error) console.error('[customer-events] insert failed:', error.message)
  } catch (err: any) {
    console.error('[customer-events] insert threw:', err?.message)
  }
}

/**
 * Retrouve le compte correspondant à un client Stripe.
 *
 * Le webhook connaît le `customer`, pas l'utilisateur. Sans cette lecture,
 * l'événement serait posé sans `user_id` et la fiche client resterait vide.
 */
export async function profileForStripeCustomer(customerId: string) {
  if (!customerId) return null
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, plan')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data
}
