import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendTransactionalEmail } from '@/lib/mailing'

// POST /api/automations/test-send
// Body: { automationId: string, email: string }
// Envoie toutes les étapes d'une automation immédiatement (ignore wait_minutes) à l'email de test.
export async function POST(req: NextRequest) {
  try {
    // Auth admin
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

    const { automationId, email } = await req.json()
    if (!automationId || !email?.trim()) {
      return NextResponse.json({ error: 'automationId et email requis' }, { status: 400 })
    }

    // Récupérer l'automation
    const { data: automation, error: autoError } = await supabaseAdmin
      .from('mail_automations')
      .select('id, name, active')
      .eq('id', automationId)
      .single()

    if (autoError || !automation) {
      return NextResponse.json({ error: 'Automation introuvable' }, { status: 404 })
    }

    // Récupérer les steps ordonnés
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from('mail_automation_steps')
      .select('id, step_order, wait_minutes, subject, template_slug, payload')
      .eq('automation_id', automationId)
      .order('step_order', { ascending: true })

    if (stepsError || !steps?.length) {
      return NextResponse.json({ error: 'Aucune étape trouvée pour cette automation' }, { status: 404 })
    }

    // Contact fictif pour les variables de test
    const testContact = {
      first_name: 'Testeur',
      last_name: 'Admin',
      email: email.trim(),
    }

    // Metadata de test pour les variables {{...}}
    const testMetadata: Record<string, string> = {
      nom: 'Premium',
      prix: '49,99€',
      interval: 'mensuel',
      date_fact: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      date_renouv: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      jours: '7',
      recompense: '1 mois offert',
      amount: '49,99€',
      user_name: 'Testeur Admin',
      code_parrainage: 'TEST123',
      cycle: '1',
      facture_url: 'https://invoice.stripe.com/test-facture-exemple',
    }

    const applyVars = (str: string): string => {
      const all = {
        '{{first_name}}': testContact.first_name,
        '{{last_name}}': testContact.last_name,
        '{{email}}': testContact.email,
        '{{full_name}}': `${testContact.first_name} ${testContact.last_name}`,
        ...Object.fromEntries(Object.entries(testMetadata).map(([k, v]) => [`{{${k}}}`, v])),
      }
      return Object.entries(all).reduce((s, [placeholder, val]) =>
        s.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), val), str)
    }

    const results: { step: number; subject: string; sent: boolean; error?: string }[] = []

    for (const step of steps) {
      try {
        const subject = applyVars(step.subject || `Test — étape ${step.step_order}`)
        let html = ''
        let text = ''

        // Charger le template si disponible
        if (step.template_slug) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step.template_slug)
          const { data: template } = await supabaseAdmin
            .from('mail_templates')
            .select('html, text')
            .eq(isUuid ? 'id' : 'name', step.template_slug)
            .single()

          if (template) {
            html = applyVars(template.html || '')
            text = applyVars(template.text || '')
          }
        }

        if (!html) {
          html = `<div style="font-family:sans-serif;padding:24px;"><p>Bonjour ${testContact.first_name},</p><p><em>[Test automation — ${automation.name} — étape ${step.step_order}]</em></p></div>`
          text = `Bonjour ${testContact.first_name},\n\n[Test automation — ${automation.name} — étape ${step.step_order}]`
        }

        // Bandeau de test visible dans l'email
        const testBanner = `<div style="background:#fef3c7;border:2px dashed #f59e0b;padding:12px 16px;margin-bottom:16px;border-radius:8px;font-family:sans-serif;font-size:13px;color:#92400e;">
          <strong>⚠️ Email de test</strong> — Automation : <strong>${automation.name}</strong> · Étape ${step.step_order} · wait_minutes ignoré (${step.wait_minutes} min en prod)
        </div>`

        await sendTransactionalEmail({
          to: email.trim(),
          subject: `[TEST] ${subject}`,
          html: testBanner + html,
          text: `[TEST] ${text}`,
          skipUnsubscribeFooter: true,
        })

        results.push({ step: step.step_order, subject, sent: true })
      } catch (err: any) {
        results.push({ step: step.step_order, subject: step.subject || '', sent: false, error: err.message })
      }
    }

    const allSent = results.every(r => r.sent)
    return NextResponse.json({
      ok: true,
      automation: automation.name,
      email: email.trim(),
      steps: results,
      summary: `${results.filter(r => r.sent).length}/${results.length} email(s) envoyé(s)`,
    }, { status: allSent ? 200 : 207 })

  } catch (err: any) {
    console.error('test-send error:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
