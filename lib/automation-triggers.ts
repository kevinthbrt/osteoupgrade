import { supabaseAdmin } from './supabase-server'

export type TriggerEvent =
  | 'contact_created'
  | 'contact_subscribed'
  | 'tag_added'
  | 'subscription_started'
  | 'subscription_ended'
  | 'subscription_upgraded'
  | 'email_opened'
  | 'email_clicked'
  | 'inactive_30_days'
  | 'free_14_days'
  | 'Inscription'
  | 'Passage à Premium Silver'
  | 'Passage à Premium Gold'
  | 'Renouvellement imminent'
  | 'Renouvellement effectué'
  | 'Abonnement expiré'
  | 'seminar_registration_created'
  | 'seminar_registration_cancelled'
  | 'seminar_reminder_1_month'
  | 'seminar_reminder_1_week'
  | 'seminar_reminder_1_day'

interface TriggerData {
  contact_id?: string
  contact_email?: string
  tag?: string
  subscription_type?: string
  metadata?: Record<string, any>
}

/**
 * Déclenche les automatisations correspondant à un événement
 */
export async function triggerAutomations(
  event: TriggerEvent,
  data: TriggerData
): Promise<{ enrolled: number; errors: string[] }> {
  const errors: string[] = []
  let enrolled = 0

  try {
    // Récupérer toutes les automatisations actives pour cet événement
    const { data: automations, error: automationsError } = await supabaseAdmin
      .from('mail_automations')
      .select('id, name, trigger_event')
      .eq('active', true)
      .eq('trigger_event', event)

    if (automationsError) {
      errors.push(`Error fetching automations: ${automationsError.message}`)
      return { enrolled, errors }
    }

    if (!automations || automations.length === 0) {
      console.log(`No active automations found for event: ${event}`)
      return { enrolled, errors }
    }

    // Déterminer l'ID du contact
    let contactId = data.contact_id

    if (!contactId && data.contact_email) {
      // Chercher ou créer le contact par email
      let { data: contact } = await supabaseAdmin
        .from('mail_contacts')
        .select('id')
        .eq('email', data.contact_email)
        .single()

      if (!contact) {
        const { data: newContact, error: createError } = await supabaseAdmin
          .from('mail_contacts')
          .insert({
            email: data.contact_email,
            status: 'subscribed',
            metadata: data.metadata || {}
          })
          .select('id')
          .single()

        if (createError) {
          errors.push(`Error creating contact: ${createError.message}`)
          return { enrolled, errors }
        }

        contact = newContact
      }

      contactId = contact?.id
    }

    if (!contactId) {
      errors.push('No contact ID or email provided')
      return { enrolled, errors }
    }

    // Inscrire le contact à chaque automatisation
    for (const automation of automations) {
      try {
        // Vérifier si le contact n'est pas déjà inscrit
        const { data: existingEnrollment } = await supabaseAdmin
          .from('mail_automation_enrollments')
          .select('id, status')
          .eq('automation_id', automation.id)
          .eq('contact_id', contactId)
          .single()

        if (existingEnrollment) {
          // Si l'inscription existe déjà et est complétée ou annulée, on peut la réinscrire
          if (existingEnrollment.status === 'completed' || existingEnrollment.status === 'cancelled') {
            await supabaseAdmin
              .from('mail_automation_enrollments')
              .update({
                status: 'pending',
                next_step_order: 0,
                last_run_at: null,
                metadata: data.metadata || {}
              })
              .eq('id', existingEnrollment.id)

            enrolled++
            console.log(`✅ Contact re-enrolled in automation "${automation.name}"`)
          } else {
            console.log(`Contact already enrolled in automation "${automation.name}"`)
          }
          continue
        }

        // Créer une nouvelle inscription
        const { error: enrollError } = await supabaseAdmin
          .from('mail_automation_enrollments')
          .insert({
            automation_id: automation.id,
            contact_id: contactId,
            status: 'pending',
            next_step_order: 0,
            metadata: data.metadata || {}
          })

        if (enrollError) {
          errors.push(`Error enrolling in ${automation.name}: ${enrollError.message}`)
          continue
        }

        enrolled++
        console.log(`✅ Contact enrolled in automation "${automation.name}"`)
      } catch (error: any) {
        errors.push(`Error processing automation ${automation.name}: ${error.message}`)
      }
    }

    return { enrolled, errors }
  } catch (error: any) {
    errors.push(`Fatal error in triggerAutomations: ${error.message}`)
    return { enrolled, errors }
  }
}

/**
 * Helper: Déclencher lors de la création d'un contact
 */
export async function onContactCreated(email: string, metadata?: Record<string, any>) {
  return triggerAutomations('contact_created', {
    contact_email: email,
    metadata
  })
}

/**
 * Helper: Déclencher lors de l'ajout d'un tag
 */
export async function onTagAdded(contactId: string, tag: string) {
  return triggerAutomations('tag_added', {
    contact_id: contactId,
    tag
  })
}

/**
 * Helper: Déclencher lors du début d'un abonnement
 */
export async function onSubscriptionStarted(
  contactId: string,
  subscriptionType: string
) {
  return triggerAutomations('subscription_started', {
    contact_id: contactId,
    subscription_type: subscriptionType
  })
}

/**
 * Helper: Déclencher lors de la fin d'un abonnement
 */
export async function onSubscriptionEnded(contactId: string) {
  return triggerAutomations('subscription_ended', {
    contact_id: contactId
  })
}

/**
 * Helper: Déclencher lors de l'upgrade d'un abonnement
 */
export async function onSubscriptionUpgraded(
  contactId: string,
  subscriptionType: string
) {
  return triggerAutomations('subscription_upgraded', {
    contact_id: contactId,
    subscription_type: subscriptionType
  })
}

/**
 * Helper: Déclencher lors de l'inscription à un séminaire
 */
export async function onSeminarRegistration(
  email: string,
  seminarData: Record<string, any>
) {
  return triggerAutomations('seminar_registration_created', {
    contact_email: email,
    metadata: seminarData
  })
}

/**
 * Helper: Déclencher lors de l'annulation d'une inscription à un séminaire
 */
export async function onSeminarCancellation(
  email: string,
  seminarData: Record<string, any>
) {
  return triggerAutomations('seminar_registration_cancelled', {
    contact_email: email,
    metadata: seminarData
  })
}

/**
 * Helper: Déclencher un rappel de séminaire (1 mois, 1 semaine, ou 1 jour)
 */
export async function onSeminarReminder(
  reminderType: 'seminar_reminder_1_month' | 'seminar_reminder_1_week' | 'seminar_reminder_1_day',
  email: string,
  seminarData: Record<string, any>
) {
  return triggerAutomations(reminderType, {
    contact_email: email,
    metadata: seminarData
  })
}
