import { supabaseAdmin } from './supabase-server'
import { comparePlans, type Plan } from './entitlements'

/**
 * Séquence propre à une page funnel : `funnel:<slug>`.
 *
 * Les funnels sont créés depuis l'admin, pas dans le code — leur nombre n'est
 * donc pas connu à la compilation. `mail_automations.trigger_event` étant du
 * texte libre (cf. les séquences séminaire), il suffit de créer dans
 * /admin/automations une séquence dont le déclencheur porte ce nom pour
 * qu'un opt-in sur ce funnel l'enclenche.
 */
export type FunnelTriggerEvent = `funnel:${string}`

export type TriggerEvent =
  | FunnelTriggerEvent
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
  | 'user_registered'
  | 'Inscription'
  | 'Passage à Premium'
  | 'Abonnement MyOsteoFlow'
  | 'Abonnement OsteoUpgrade'
  | 'Essai gratuit démarré'
  | 'Essai gratuit annulé'
  | 'Renouvellement imminent'
  | 'Renouvellement effectué'
  | 'Abonnement expiré'
  | 'Paiement échoué'
  | 'Nouveau parrainage'
  | 'Bonus parrainage filleul'
  | 'Demande de paiement parrainage'
  | 'Paiement parrainage effectué'
  | 'Code partenaire utilisé'
  | 'Statut Fondateur activé'
  | 'Offre augmentée'
  | 'Offre réduite'
  | 'Offre échangée'

/**
 * Événement de bienvenue correspondant à l'offre souscrite.
 *
 * Une séquence par offre : le moteur ne sait que remplacer des {{variables}},
 * jamais brancher le contenu. Sans ce routage, un abonné OsteoUpgrade seul
 * recevrait les emails d'installation de MyOsteoflow — un logiciel qu'il n'a
 * pas acheté et ne peut pas ouvrir.
 *
 * `Passage à Premium` est conservé pour le bundle : cet événement existe déjà
 * dans les metadata des abonnements en cours et dans l'historique d'envoi.
 */
export function subscriptionEventFor(plan: string): TriggerEvent {
  switch (plan) {
    case 'osteoflow':
      return 'Abonnement MyOsteoFlow'
    case 'osteoupgrade':
      return 'Abonnement OsteoUpgrade'
    default:
      return 'Passage à Premium'
  }
}

/**
 * Événement correspondant à un changement d'offre en cours d'abonnement.
 *
 * Trois cas et non deux : `osteoflow` et `osteoupgrade` étant au même prix, en
 * changer n'est ni une évolution ni une réduction. Un message unique devrait
 * rester si vague qu'il n'annoncerait plus rien — or c'est précisément le
 * moment où le client veut savoir ce qui s'ouvre et ce qui se ferme.
 *
 * Renvoie `null` quand les droits ne bougent pas (changement de périodicité,
 * passage au tarif Fondateur) : il n'y a alors rien à annoncer, et la facture
 * Stripe suffit.
 */
export function planChangeEventFor(ancien: Plan, nouveau: Plan): TriggerEvent | null {
  switch (comparePlans(ancien, nouveau)) {
    case 'gain':
      return 'Offre augmentée'
    case 'perte':
      return 'Offre réduite'
    case 'echange':
      return 'Offre échangée'
    default:
      return null
  }
}

/**
 * Interrompt les séquences de prospection en cours pour un contact qui vient
 * de s'abonner.
 *
 * Les inscriptions n'étaient annulées qu'en cas de désabonnement : un compte
 * gratuit qui souscrivait continuait de recevoir « Passez Premium, débloquez
 * tout » pendant des semaines. Les séquences concernées sont marquées par
 * `mail_automations.stop_on_subscribe`.
 */
export async function cancelProspectSequences(contactEmail: string): Promise<number> {
  try {
    const { data: contact } = await supabaseAdmin
      .from('mail_contacts')
      .select('id')
      .eq('email', contactEmail)
      .maybeSingle()
    if (!contact) return 0

    const { data: automations } = await supabaseAdmin
      .from('mail_automations')
      .select('id')
      .eq('stop_on_subscribe', true)
    if (!automations || automations.length === 0) return 0

    const { data: cancelled, error } = await supabaseAdmin
      .from('mail_automation_enrollments')
      .update({ status: 'cancelled' })
      .eq('contact_id', contact.id)
      .in('automation_id', automations.map((a) => a.id))
      .not('status', 'in', '("completed","cancelled")')
      .select('id')

    if (error) {
      console.error('Error cancelling prospect sequences:', error.message)
      return 0
    }
    return cancelled?.length ?? 0
  } catch (err) {
    console.error('Error cancelling prospect sequences')
    return 0
  }
}

interface TriggerData {
  contact_id?: string
  contact_email?: string
  full_name?: string
  tag?: string
  subscription_type?: string
  metadata?: Record<string, any>
}

// Sépare un nom complet ("Prénom Nom") en first_name / last_name pour mail_contacts
function splitFullName(fullName?: string | null): { first_name: string | null; last_name: string | null } {
  const trimmed = fullName?.trim()
  if (!trimmed) return { first_name: null, last_name: null }
  const [first, ...rest] = trimmed.split(/\s+/)
  return { first_name: first, last_name: rest.join(' ') || null }
}

/**
 * Crée ou retrouve le contact de diffusion correspondant à une adresse.
 *
 * Extrait de `triggerAutomations` pour pouvoir être appelé seul : cette
 * dernière sort dès qu'aucune séquence active ne correspond à l'événement, et
 * n'atteignait donc pas la création du contact. Un formulaire de funnel dont
 * la séquence n'est pas encore écrite — l'état normal juste après la
 * publication d'une page — captait ainsi des adresses qui n'entraient jamais
 * dans la liste de diffusion.
 *
 * Renvoie `error` plutôt que de lever : l'appelant décide si l'échec est
 * bloquant.
 */
export async function ensureMailContact(data: {
  email: string
  full_name?: string | null
  metadata?: Record<string, any>
}): Promise<{ contactId: string | null; error?: string }> {
  const { data: existing } = await supabaseAdmin
    .from('mail_contacts')
    .select('id, status, first_name, last_name')
    .eq('email', data.email)
    .maybeSingle()

  if (!existing) {
    const { first_name, last_name } = splitFullName(data.full_name)
    const { data: created, error: createError } = await supabaseAdmin
      .from('mail_contacts')
      .insert({
        email: data.email,
        status: 'subscribed',
        first_name,
        last_name,
        metadata: data.metadata || {},
      })
      .select('id')
      .single()

    if (createError) {
      return { contactId: null, error: `Error creating contact: ${createError.message}` }
    }
    return { contactId: created?.id ?? null }
  }

  if (existing.status !== 'subscribed' && existing.status !== 'unsubscribed') {
    // Le contact existait avec un statut « lead » (ex: newsletter_pre_launch).
    // Une inscription / un passage Premium = consentement aux emails du service :
    // on le promeut en 'subscribed' pour que le processor n'annule pas les envois.
    // On respecte cependant un désabonnement explicite ('unsubscribed').
    const { error: promoteError } = await supabaseAdmin
      .from('mail_contacts')
      .update({ status: 'subscribed' })
      .eq('id', existing.id)

    if (promoteError) {
      return {
        contactId: existing.id,
        error: `Error promoting contact to subscribed: ${promoteError.message}`,
      }
    }
  }

  // Rattrapage : le contact avait été créé sans nom par un déclenchement
  // précédent (ex: avant que cet appelant ne transmette full_name) — on le
  // complète dès qu'on reçoit un nom, pour que {{full_name}} cesse de
  // retomber sur l'email dans les emails déjà en cours d'envoi.
  if (data.full_name && !existing.first_name && !existing.last_name) {
    const { first_name, last_name } = splitFullName(data.full_name)
    if (first_name) {
      await supabaseAdmin
        .from('mail_contacts')
        .update({ first_name, last_name })
        .eq('id', existing.id)
    }
  }

  return { contactId: existing.id }
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
      const resolved = await ensureMailContact({
        email: data.contact_email,
        full_name: data.full_name,
        metadata: data.metadata,
      })
      if (resolved.error) {
        errors.push(resolved.error)
        return { enrolled, errors }
      }
      contactId = resolved.contactId ?? undefined
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
 * Helper: Déclencher lors de l'inscription d'un utilisateur (user_registered)
 */
export async function onUserRegistered(email: string, metadata?: Record<string, any>) {
  return triggerAutomations('user_registered', {
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

