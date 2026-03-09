import { NextRequest, NextResponse } from 'next/server'

let isProcessingFollowUps = false

export async function POST(request: NextRequest) {
  if (isProcessingFollowUps) {
    return NextResponse.json({ message: 'Déjà en cours de traitement', processed: 0 })
  }

  isProcessingFollowUps = true
  try {
    const { Resend } = await import('resend')
    const { createClient } = await import('@/lib/osteoflow/db/server')
    const { defaultEmailTemplates, replaceTemplateVariables, createFollowUpHtmlEmail } = await import('@/lib/osteoflow/email/templates')
    const { sendEmail } = await import('@/lib/osteoflow/email/smtp-service')
    const { formatDate } = await import('@/lib/osteoflow/utils')
    const { generateSurveyToken, getSurveyUrl } = await import('@/lib/osteoflow/survey/config')
    const { registerSurvey } = await import('@/lib/osteoflow/survey/service')
    const getResend = () => new Resend(process.env.RESEND_API_KEY)

    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isLocalCron = authHeader === 'Bearer local-desktop-cron'
    if (!isLocalCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const db = await createClient()
      const { data: { user } } = await db.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    const db = await createClient()
    const now = new Date().toISOString()

    const { data: tasks, error: tasksError } = await db
      .from('scheduled_tasks')
      .select('*')
      .eq('type', 'follow_up_email')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(10)

    if (tasksError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des tâches' }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'Aucune tâche à traiter', processed: 0 })
    }

    let processed = 0
    const errors: string[] = []

    for (const task of tasks) {
      try {
        const { data: consultation } = await db.from('consultations').select('*').eq('id', task.consultation_id).single()
        if (!consultation) {
          await db.from('scheduled_tasks').update({ status: 'failed', error_message: 'Consultation non trouvée', executed_at: new Date().toISOString() }).eq('id', task.id)
          continue
        }

        if (consultation.follow_up_sent_at) {
          await db.from('scheduled_tasks').update({ status: 'completed', executed_at: new Date().toISOString() }).eq('id', task.id)
          continue
        }

        const { data: patient } = await db.from('patients').select('*').eq('id', consultation.patient_id).single()
        if (!patient) {
          await db.from('scheduled_tasks').update({ status: 'failed', error_message: 'Patient non trouvé', executed_at: new Date().toISOString() }).eq('id', task.id)
          continue
        }
        if (!patient.email) {
          await db.from('scheduled_tasks').update({ status: 'failed', error_message: 'Patient sans email', executed_at: new Date().toISOString() }).eq('id', task.id)
          continue
        }

        const { data: practitioner } = await db.from('practitioners').select('*').eq('id', task.practitioner_id).single()
        if (!practitioner) {
          await db.from('scheduled_tasks').update({ status: 'failed', error_message: 'Praticien non trouvé', executed_at: new Date().toISOString() }).eq('id', task.id)
          continue
        }

        const { data: customTemplate } = await db.from('email_templates').select('*').eq('practitioner_id', practitioner.id).eq('type', 'follow_up_7d').single()
        const template = customTemplate || defaultEmailTemplates.follow_up_7d

        const variables = {
          patient_name: `${patient.first_name} ${patient.last_name}`,
          patient_first_name: patient.first_name,
          consultation_date: formatDate(consultation.date_time),
          consultation_reason: consultation.reason,
          practitioner_name: `${practitioner.first_name} ${practitioner.last_name}`,
          practice_name: practitioner.practice_name || `${practitioner.first_name} ${practitioner.last_name}`,
        }

        const subject = replaceTemplateVariables(template.subject, variables)
        const bodyText = replaceTemplateVariables(template.body, variables)
        const practitionerName = `${practitioner.first_name} ${practitioner.last_name}`

        let surveyUrl: string | null = null
        const { data: existingSurvey } = await db.from('survey_responses').select('token').eq('consultation_id', consultation.id).limit(1)

        if (existingSurvey && existingSurvey.length > 0) {
          surveyUrl = getSurveyUrl(existingSurvey[0].token)
        } else {
          const surveyToken = generateSurveyToken()
          try {
            const regResult = await registerSurvey({
              token: surveyToken,
              practitioner_name: practitionerName,
              practice_name: practitioner.practice_name || practitionerName,
              patient_first_name: patient.first_name,
              primary_color: practitioner.primary_color || '#2563eb',
              specialty: practitioner.specialty || undefined,
              consultation_id: consultation.id,
            })
            if (regResult.success) {
              surveyUrl = getSurveyUrl(surveyToken)
              await db.from('survey_responses').insert({
                consultation_id: consultation.id, patient_id: patient.id,
                practitioner_id: practitioner.id, token: surveyToken, status: 'pending',
              })
            }
          } catch (error) {
            console.warn('[FollowUp] Survey registration error:', error)
          }
        }

        const htmlContent = createFollowUpHtmlEmail({
          bodyText, practitionerName,
          practiceName: practitioner.practice_name,
          specialty: practitioner.specialty,
          primaryColor: practitioner.primary_color || '#2563eb',
          googleReviewUrl: practitioner.google_review_url,
          surveyUrl,
        })

        const { data: emailSettings } = await db.from('email_settings').select('*').eq('practitioner_id', practitioner.id).eq('is_verified', true).single()

        if (emailSettings) {
          const result = await sendEmail(
            { smtp_host: emailSettings.smtp_host, smtp_port: emailSettings.smtp_port, smtp_secure: emailSettings.smtp_secure, smtp_user: emailSettings.smtp_user, smtp_password: emailSettings.smtp_password, from_name: emailSettings.from_name, from_email: emailSettings.from_email },
            { to: patient.email, subject, html: htmlContent }
          )
          if (!result.success) throw new Error(`SMTP error: ${result.error}`)
        } else if (process.env.RESEND_API_KEY) {
          const { error: emailError } = await getResend().emails.send({
            from: `${practitioner.practice_name || practitioner.first_name} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
            to: patient.email, subject, html: htmlContent,
          })
          if (emailError) throw new Error(`Resend error: ${emailError.message}`)
        } else {
          throw new Error('Aucun service email configuré (SMTP ou Resend)')
        }

        await db.from('scheduled_tasks').update({ status: 'completed', executed_at: new Date().toISOString() }).eq('id', task.id)
        await db.from('consultations').update({ follow_up_sent_at: new Date().toISOString() }).eq('id', consultation.id)
        processed++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        errors.push(`Task ${task.id}: ${errorMessage}`)
        await db.from('scheduled_tasks').update({ status: 'failed', error_message: errorMessage, executed_at: new Date().toISOString() }).eq('id', task.id)
      }
    }

    return NextResponse.json({ message: `${processed} tâche(s) traitée(s)`, processed, sent: processed, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('[FollowUp] Fatal error:', error)
    return NextResponse.json({ error: 'Erreur lors du traitement des emails de suivi' }, { status: 500 })
  } finally {
    isProcessingFollowUps = false
  }
}
