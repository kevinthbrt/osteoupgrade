import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Récupérer toutes les automatisations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabase
      .from('mail_automations')
      .select(`
        id,
        name,
        description,
        trigger_event,
        active,
        created_at,
        steps:mail_automation_steps(
          id,
          step_order,
          wait_minutes,
          subject,
          template_slug,
          payload
        )
      `)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching automations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ automations: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/automations:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

// POST - Créer une nouvelle automatisation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, trigger_event, steps } = body

    if (!name || !trigger_event) {
      return NextResponse.json(
        { error: 'Le nom et le déclencheur sont requis' },
        { status: 400 }
      )
    }

    // Créer l'automatisation
    const { data: automation, error: automationError } = await supabase
      .from('mail_automations')
      .insert({
        name,
        description,
        trigger_event,
        active: false
      })
      .select()
      .single()

    if (automationError) {
      console.error('Error creating automation:', automationError)
      return NextResponse.json({ error: automationError.message }, { status: 500 })
    }

    // Créer les étapes si fournies
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: any, index: number) => ({
        automation_id: automation.id,
        step_order: step.step_order ?? index,
        wait_minutes: step.wait_minutes ?? 0,
        subject: step.subject,
        template_slug: step.template_slug,
        payload: step.payload ?? {}
      }))

      const { error: stepsError } = await supabase
        .from('mail_automation_steps')
        .insert(stepsToInsert)

      if (stepsError) {
        console.error('Error creating automation steps:', stepsError)
        // Rollback: supprimer l'automatisation créée
        await supabase.from('mail_automations').delete().eq('id', automation.id)
        return NextResponse.json({ error: stepsError.message }, { status: 500 })
      }
    }

    // Récupérer l'automatisation complète avec les étapes
    const { data: completeAutomation, error: fetchError } = await supabase
      .from('mail_automations')
      .select(`
        id,
        name,
        description,
        trigger_event,
        active,
        created_at,
        steps:mail_automation_steps(
          id,
          step_order,
          wait_minutes,
          subject,
          template_slug,
          payload
        )
      `)
      .eq('id', automation.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete automation:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ automation: completeAutomation }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/automations:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
