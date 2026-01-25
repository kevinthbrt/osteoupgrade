import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/automations/enroll
 * Déclenche automatiquement toutes les automatisations correspondant à un événement
 * pour un utilisateur donné
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }

    const hasCronToken = cronSecret && authHeader === `Bearer ${cronSecret}`
    if (!isAdmin && !hasCronToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, triggerEvent, metadata = {} } = body

    if (!userId || !triggerEvent) {
      return NextResponse.json(
        { error: 'userId et triggerEvent sont requis' },
        { status: 400 }
      )
    }

    // Trouver toutes les automatisations actives avec ce trigger_event
    const { data: automations, error: automationsError } = await supabaseAdmin
      .from('mail_automations')
      .select('id, name, trigger_event')
      .eq('trigger_event', triggerEvent)
      .eq('active', true)

    if (automationsError) {
      console.error('Error fetching automations:', automationsError)
      return NextResponse.json({ error: automationsError.message }, { status: 500 })
    }

    if (!automations || automations.length === 0) {
      // Pas d'automatisation active pour ce déclencheur - ce n'est pas une erreur
      return NextResponse.json({
        success: true,
        message: 'Aucune automatisation active trouvée pour ce déclencheur',
        enrolled_count: 0
      })
    }

    // Récupérer le profil utilisateur pour obtenir l'email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.email) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou email manquant' },
        { status: 404 }
      )
    }

    // Trouver ou créer le contact dans mail_contacts
    let { data: contact } = await supabaseAdmin
      .from('mail_contacts')
      .select('id')
      .eq('email', profile.email)
      .single()

    // Si le contact n'existe pas, le créer
    if (!contact) {
      const { data: newContact, error: createError } = await supabaseAdmin
        .from('mail_contacts')
        .insert({
          email: profile.email,
          first_name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
          status: 'subscribed',
          metadata: { user_id: userId }
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating contact:', createError)
        return NextResponse.json({ error: 'Erreur lors de la création du contact' }, { status: 500 })
      }
      contact = newContact
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 })
    }

    // Créer les enrollments pour chaque automatisation
    const enrollments = automations.map(automation => ({
      automation_id: automation.id,
      contact_id: contact.id,
      status: 'pending',
      next_step_order: 0,
      metadata: {
        ...metadata,
        user_id: userId,
        trigger_event: triggerEvent,
        enrolled_at: new Date().toISOString()
      }
    }))

    const { data: enrolledData, error: enrollError } = await supabaseAdmin
      .from('mail_automation_enrollments')
      .insert(enrollments)
      .select()

    if (enrollError) {
      console.error('Error creating enrollments:', enrollError)
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      enrolled_count: enrolledData.length,
      automations: automations.map(a => ({ id: a.id, name: a.name })),
      enrollments: enrolledData
    })
  } catch (error: any) {
    console.error('Error in POST /api/automations/enroll:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
