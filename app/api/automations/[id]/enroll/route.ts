import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Inscrire un ou plusieurs contacts à une automatisation
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: automationId } = params
    const body = await request.json()
    const { contact_ids, contact_emails } = body

    // Vérifier que l'automatisation existe et est active
    const { data: automation, error: automationError } = await supabase
      .from('mail_automations')
      .select('id, active')
      .eq('id', automationId)
      .single()

    if (automationError || !automation) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      )
    }

    if (!automation.active) {
      return NextResponse.json(
        { error: 'Cette automatisation n\'est pas active' },
        { status: 400 }
      )
    }

    let contactIds: string[] = []

    // Si des emails sont fournis, récupérer ou créer les contacts
    if (contact_emails && Array.isArray(contact_emails)) {
      for (const email of contact_emails) {
        // Chercher le contact existant
        let { data: contact } = await supabase
          .from('mail_contacts')
          .select('id')
          .eq('email', email)
          .single()

        // Si le contact n'existe pas, le créer
        if (!contact) {
          const { data: newContact, error: createError } = await supabase
            .from('mail_contacts')
            .insert({
              email,
              status: 'subscribed'
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating contact:', createError)
            continue
          }
          contact = newContact
        }

        if (contact) {
          contactIds.push(contact.id)
        }
      }
    }

    // Ajouter les IDs fournis directement
    if (contact_ids && Array.isArray(contact_ids)) {
      contactIds = [...contactIds, ...contact_ids]
    }

    if (contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Aucun contact valide fourni' },
        { status: 400 }
      )
    }

    // Inscrire les contacts à l'automatisation
    const enrollments = contactIds.map(contactId => ({
      automation_id: automationId,
      contact_id: contactId,
      status: 'pending',
      next_step_order: 0
    }))

    const { data: enrolledContacts, error: enrollError } = await supabase
      .from('mail_automation_enrollments')
      .insert(enrollments)
      .select()

    if (enrollError) {
      console.error('Error enrolling contacts:', enrollError)
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      enrolled_count: enrolledContacts.length,
      enrollments: enrolledContacts
    })
  } catch (error: any) {
    console.error('Error in POST /api/automations/[id]/enroll:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

// GET - Récupérer les inscriptions d'une automatisation
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: automationId } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('mail_automation_enrollments')
      .select(`
        id,
        status,
        next_step_order,
        last_run_at,
        created_at,
        contact:mail_contacts(
          id,
          email,
          first_name,
          last_name,
          status
        )
      `)
      .eq('automation_id', automationId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching enrollments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enrollments: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/automations/[id]/enroll:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
