import { supabase } from './supabase'
import { sendTransactionalEmail } from './mailing'

interface AutomationStep {
  id: string
  step_order: number
  wait_minutes: number
  subject: string
  template_slug: string | null
  payload: any
}

interface Enrollment {
  id: string
  automation_id: string
  contact_id: string
  status: string
  next_step_order: number | null
  last_run_at: string | null
  created_at: string
  metadata?: any
}

interface Contact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  metadata: any
}

// Générer le HTML de l'email à partir du template
async function generateEmailContent(
  templateSlug: string | null,
  payload: any,
  contact: Contact,
  enrollmentMetadata?: any
): Promise<{ html: string; text: string }> {
  // Si un template_slug est fourni, charger le template depuis la base de données
  if (templateSlug) {
    const { data: template } = await supabase
      .from('mail_templates')
      .select('html, text, subject')
      .eq('id', templateSlug)
      .single()

    if (template) {
      // Remplacer les variables dans le template
      let html = template.html || ''
      let text = template.text || ''

      // Variables disponibles : {{first_name}}, {{last_name}}, {{email}}
      const replacements: Record<string, string> = {
        '{{first_name}}': contact.first_name || '',
        '{{last_name}}': contact.last_name || '',
        '{{email}}': contact.email || '',
        '{{full_name}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email
      }

      // Ajouter les variables custom du payload
      if (payload && typeof payload === 'object') {
        Object.keys(payload).forEach(key => {
          replacements[`{{${key}}}`] = String(payload[key] || '')
        })
      }

      // Ajouter les variables custom des métadonnées de l'enrollment (priorité la plus haute)
      if (enrollmentMetadata && typeof enrollmentMetadata === 'object') {
        Object.keys(enrollmentMetadata).forEach(key => {
          replacements[`{{${key}}}`] = String(enrollmentMetadata[key] || '')
        })
      }

      // Remplacer dans le HTML et le texte
      Object.keys(replacements).forEach(placeholder => {
        html = html.replace(new RegExp(placeholder, 'g'), replacements[placeholder])
        text = text.replace(new RegExp(placeholder, 'g'), replacements[placeholder])
      })

      return { html, text }
    }
  }

  // Si pas de template, utiliser le payload comme contenu
  const html = payload?.html || `
    <div style="font-family: Inter, sans-serif; color: #0f172a;">
      <p>Bonjour ${contact.first_name || contact.email},</p>
      <p>${payload?.message || 'Ceci est un message automatique.'}</p>
      <p>Cordialement,<br/>L'équipe OsteoUpgrade</p>
    </div>
  `

  const text = payload?.text || `Bonjour ${contact.first_name || contact.email},\n\n${payload?.message || 'Ceci est un message automatique.'}\n\nCordialement,\nL'équipe OsteoUpgrade`

  return { html, text }
}

// Résultat du traitement d'une inscription
type ProcessResult = 'sent' | 'waiting' | 'completed' | 'error'

// Traiter une inscription individuelle
async function processEnrollment(
  enrollment: Enrollment,
  steps: AutomationStep[],
  contact: Contact
): Promise<ProcessResult> {
  try {
    // Trouver l'étape suivante à exécuter
    // On cherche la première étape dont step_order >= next_step_order (et non une correspondance exacte)
    // car les steps en base commencent généralement à 1 alors que next_step_order démarre à 0.
    const nextStepOrder = enrollment.next_step_order ?? 0
    const nextStep = steps
      .filter(step => step.step_order >= nextStepOrder)
      .sort((a, b) => a.step_order - b.step_order)[0]

    if (!nextStep) {
      // Toutes les étapes sont terminées
      await supabase
        .from('mail_automation_enrollments')
        .update({ status: 'completed' })
        .eq('id', enrollment.id)

      return 'completed'
    }

    // Vérifier si assez de temps s'est écoulé depuis la dernière exécution
    const now = new Date()
    const createdAt = new Date(enrollment.created_at)
    const lastRunAt = enrollment.last_run_at ? new Date(enrollment.last_run_at) : createdAt

    // Calculer le temps écoulé en minutes
    const minutesSinceLastRun = (now.getTime() - lastRunAt.getTime()) / (1000 * 60)

    // Si c'est la première étape (step_order = 0), vérifier depuis created_at
    const referenceTime = nextStepOrder === 0 ? createdAt : lastRunAt
    const minutesSinceReference = (now.getTime() - referenceTime.getTime()) / (1000 * 60)

    if (minutesSinceReference < nextStep.wait_minutes) {
      // Pas encore le moment d'envoyer cet email
      return 'waiting'
    }

    // Générer le contenu de l'email
    const { html, text } = await generateEmailContent(
      nextStep.template_slug,
      nextStep.payload,
      contact,
      enrollment.metadata
    )

    // Envoyer l'email
    await sendTransactionalEmail({
      to: contact.email,
      subject: nextStep.subject,
      html,
      text,
      tags: ['automation', `automation-${enrollment.automation_id}`]
    })

    // Enregistrer l'événement
    await supabase.from('mail_events').insert({
      contact_id: contact.id,
      automation_id: enrollment.automation_id,
      provider: 'resend',
      event_type: 'automation_sent',
      payload: {
        step_order: nextStep.step_order,
        subject: nextStep.subject
      }
    })

    // Mettre à jour l'inscription pour la prochaine étape
    // On incrémente depuis le step_order réel de l'étape exécutée (pas depuis nextStepOrder)
    // pour garantir la cohérence même si les step_orders ne sont pas contigus.
    const hasMoreSteps = steps.some(step => step.step_order > nextStep.step_order)
    await supabase
      .from('mail_automation_enrollments')
      .update({
        next_step_order: nextStep.step_order + 1,
        last_run_at: now.toISOString(),
        status: hasMoreSteps ? 'processing' : 'completed'
      })
      .eq('id', enrollment.id)

    console.log(`✅ Email sent to ${contact.email} for step ${nextStepOrder}`)
    return 'sent'
  } catch (error) {
    console.error(`❌ Error processing enrollment ${enrollment.id}:`, error)
    return 'error'
  }
}

// Processeur principal
export async function processAutomations(): Promise<{
  processed: number
  sent: number
  errors: number
}> {
  console.log('🚀 Starting automation processor...')

  let processed = 0
  let sent = 0
  let errors = 0

  try {
    // Récupérer toutes les automatisations actives
    const { data: automations, error: automationsError } = await supabase
      .from('mail_automations')
      .select(`
        id,
        name,
        steps:mail_automation_steps(
          id,
          step_order,
          wait_minutes,
          subject,
          template_slug,
          payload
        )
      `)
      .eq('active', true)

    if (automationsError) {
      console.error('Error fetching active automations:', automationsError)
      return { processed, sent, errors: errors + 1 }
    }

    if (!automations || automations.length === 0) {
      console.log('No active automations found')
      return { processed, sent, errors }
    }

    console.log(`Found ${automations.length} active automation(s)`)

    // Pour chaque automatisation
    for (const automation of automations) {
      // Récupérer les inscriptions en attente ou en traitement
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('mail_automation_enrollments')
        .select(`
          id,
          automation_id,
          contact_id,
          status,
          next_step_order,
          last_run_at,
          created_at,
          metadata,
          contact:mail_contacts(
            id,
            email,
            first_name,
            last_name,
            status,
            metadata
          )
        `)
        .eq('automation_id', automation.id)
        .in('status', ['pending', 'processing'])

      if (enrollmentsError) {
        console.error(`Error fetching enrollments for automation ${automation.id}:`, enrollmentsError)
        errors++
        continue
      }

      if (!enrollments || enrollments.length === 0) {
        continue
      }

      console.log(`Processing ${enrollments.length} enrollment(s) for automation "${automation.name}"`)

      // Trier les étapes par ordre
      const steps = (automation.steps || []).sort((a, b) => a.step_order - b.step_order)

      // Traiter chaque inscription
      for (const enrollment of enrollments) {
        processed++

        // Vérifier que le contact existe et est abonné
        const contact = Array.isArray(enrollment.contact)
          ? enrollment.contact[0]
          : enrollment.contact

        if (!contact || contact.status !== 'subscribed') {
          console.log(`Skipping enrollment ${enrollment.id}: contact not subscribed`)
          continue
        }

        const result = await processEnrollment(
          enrollment as Enrollment,
          steps,
          contact
        )

        if (result === 'sent') {
          sent++
        } else if (result === 'error') {
          errors++
        }
        // 'waiting' et 'completed' ne sont pas des erreurs

        // Ajouter un petit délai pour éviter de surcharger l'API d'envoi
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Automation processing complete: ${processed} processed, ${sent} sent, ${errors} errors`)
    return { processed, sent, errors }
  } catch (error) {
    console.error('Fatal error in automation processor:', error)
    return { processed, sent, errors: errors + 1 }
  }
}
