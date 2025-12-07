import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Récupérer une automatisation spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Automatisation non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ automation: data })
  } catch (error: any) {
    console.error('Error in GET /api/automations/[id]:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

// PATCH - Mettre à jour une automatisation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, trigger_event, active, steps } = body

    // Mettre à jour l'automatisation
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (trigger_event !== undefined) updateData.trigger_event = trigger_event
    if (active !== undefined) updateData.active = active

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('mail_automations')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating automation:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Mettre à jour les étapes si fournies
    if (steps) {
      // Supprimer les anciennes étapes
      await supabase.from('mail_automation_steps').delete().eq('automation_id', id)

      // Créer les nouvelles étapes
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step: any, index: number) => ({
          automation_id: id,
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
          console.error('Error updating automation steps:', stepsError)
          return NextResponse.json({ error: stepsError.message }, { status: 500 })
        }
      }
    }

    // Récupérer l'automatisation mise à jour
    const { data: updatedAutomation, error: fetchError } = await supabase
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
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated automation:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ automation: updatedAutomation })
  } catch (error: any) {
    console.error('Error in PATCH /api/automations/[id]:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

// DELETE - Supprimer une automatisation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Supprimer les étapes
    await supabase.from('mail_automation_steps').delete().eq('automation_id', id)

    // Supprimer les inscriptions
    await supabase.from('mail_automation_enrollments').delete().eq('automation_id', id)

    // Supprimer l'automatisation
    const { error } = await supabase.from('mail_automations').delete().eq('id', id)

    if (error) {
      console.error('Error deleting automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/automations/[id]:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
