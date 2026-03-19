// IMPORTANT : utiliser le client admin (service role) pour bypasser la RLS
// car le worker s'exécute sans contexte utilisateur (auth.uid() = null en cron).
// Le client anon retournait systématiquement 0 ligne sur les tables mail_*.
import { supabaseAdmin as supabase } from './supabase-server'
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

// Construit la table de remplacement des variables {{...}}
// Priorité (du plus bas au plus haut) : contact < payload du step < metadata de l'enrollment
function buildReplacements(
  payload: any,
  contact: Contact,
  enrollmentMetadata?: any
): Record<string, string> {
  const replacements: Record<string, string> = {
    '{{first_name}}': contact.first_name || '',
    '{{last_name}}': contact.last_name || '',
    '{{email}}': contact.email || '',
    '{{full_name}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email
  }

  if (payload && typeof payload === 'object') {
    Object.keys(payload).forEach(key => {
      replacements[`{{${key}}}`] = String(payload[key] ?? '')
    })
  }

  if (enrollmentMetadata && typeof enrollmentMetadata === 'object') {
    Object.keys(enrollmentMetadata).forEach(key => {
      replacements[`{{${key}}}`] = String(enrollmentMetadata[key] ?? '')
    })
  }

  return replacements
}

// Applique une table de remplacement sur une chaîne
function applyReplacements(str: string, replacements: Record<string, string>): string {
  return Object.keys(replacements).reduce(
    (s, placeholder) =>
      s.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacements[placeholder]),
    str
  )
}

// Génère le HTML/texte de l'email ET résout le subject du step
async function generateEmailContent(
  templateSlug: string | null,
  payload: any,
  contact: Contact,
  enrollmentMetadata: any,
  stepSubject: string
): Promise<{ html: string; text: string; subject: string }> {
  const replacements = buildReplacements(payload, contact, enrollmentMetadata)
  // Bug 1 fix : le subject du step est résolu avec les mêmes variables que le corps
  const subject = applyReplacements(stepSubject, replacements)

  // Si un template_slug est fourni, charger le template depuis la base de données
  // template_slug peut être un UUID (anciens templates) ou un name/slug (templates séminaires)
  if (templateSlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateSlug)
    const { data: template } = await supabase
      .from('mail_templates')
      .select('html, text')
      .eq(isUuid ? 'id' : 'name', templateSlug)
      .single()

    if (template) {
      const html = applyReplacements(template.html || '', replacements)
      const text = applyReplacements(template.text || '', replacements)
      return { html, text, subject }
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

  return { html, text, subject }
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
      // Pas encore le moment d'envoyer cet email.
      // L'enrollment a été verrouillé (status='processing') par le claim atomique :
      // on le restitue à 'pending' pour qu'il soit re-claimé lors du prochain passage.
      await supabase
        .from('mail_automation_enrollments')
        .update({ status: 'pending' })
        .eq('id', enrollment.id)
      return 'waiting'
    }

    // Générer le contenu de l'email (subject résolu inclus — Bug 1 fix)
    const { html, text, subject } = await generateEmailContent(
      nextStep.template_slug,
      nextStep.payload,
      contact,
      enrollment.metadata,
      nextStep.subject
    )

    // Envoyer l'email
    await sendTransactionalEmail({
      to: contact.email,
      subject,
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
    // Bug 2 fix : le statut reste 'pending' entre les steps (pas 'processing') —
    // l'enrollment attend simplement le prochain step, il n'est pas "en cours de traitement".
    const hasMoreSteps = steps.some(step => step.step_order > nextStep.step_order)
    await supabase
      .from('mail_automation_enrollments')
      .update({
        next_step_order: nextStep.step_order + 1,
        last_run_at: now.toISOString(),
        status: hasMoreSteps ? 'pending' : 'completed'
      })
      .eq('id', enrollment.id)

    console.log(`✅ Email sent to ${contact.email} for step ${nextStep.step_order} — subject: "${subject}"`)
    return 'sent'
  } catch (error) {
    console.error(`❌ Error processing enrollment ${enrollment.id}:`, error)
    // Restituer l'enrollment à 'pending' pour permettre une nouvelle tentative.
    // Sans ce reset, l'enrollment reste bloqué en 'processing' après une erreur.
    try {
      await supabase
        .from('mail_automation_enrollments')
        .update({ status: 'pending' })
        .eq('id', enrollment.id)
    } catch (resetError) {
      console.error(`❌ Failed to reset enrollment ${enrollment.id} to pending:`, resetError)
    }
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
      // ── Claim atomique ──────────────────────────────────────────────────────
      // On fait un UPDATE status='processing' WHERE status='pending' en une seule
      // opération SQL. Postgres verrouille chaque ligne pendant l'UPDATE, garantissant
      // qu'une instance concurrente ne peut pas récupérer la même ligne : elle verra
      // déjà status='processing' et n'obtiendra rien.
      // Les enrollments retournés par cet UPDATE sont ceux que CETTE instance possède
      // exclusivement — aucune autre instance ne les traitera en parallèle.
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('mail_automation_enrollments')
        .update({ status: 'processing' })
        .eq('automation_id', automation.id)
        .eq('status', 'pending')
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

      if (enrollmentsError) {
        console.error(`Error claiming enrollments for automation ${automation.id}:`, enrollmentsError)
        errors++
        continue
      }

      if (!enrollments || enrollments.length === 0) {
        continue
      }

      console.log(`Claimed ${enrollments.length} enrollment(s) for automation "${automation.name}"`)

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
          // Libérer le claim : contact désabonné → on annule l'enrollment proprement
          await supabase
            .from('mail_automation_enrollments')
            .update({ status: 'cancelled' })
            .eq('id', enrollment.id)
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
