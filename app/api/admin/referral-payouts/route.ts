import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/admin/referral-payouts
 * Liste toutes les demandes de paiement de parrainage (admin only)
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et le rôle admin
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Récupérer toutes les demandes de paiement avec les infos utilisateur
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('referral_payouts')
      .select(
        `
        *,
        user:user_id (
          id,
          email,
          full_name
        )
      `
      )
      .order('requested_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    return NextResponse.json({ payouts })
  } catch (error: any) {
    console.error('Error in admin payouts API:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/referral-payouts
 * Marquer une demande de paiement comme complétée
 */
export async function PUT(request: Request) {
  try {
    // Vérifier l'authentification et le rôle admin
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { payoutId, status, notes } = body

    if (!payoutId || !status) {
      return NextResponse.json({ error: 'Missing payoutId or status' }, { status: 400 })
    }

    // Récupérer les informations du payout
    const { data: payout, error: fetchError } = await supabaseAdmin
      .from('referral_payouts')
      .select('*, user:user_id(email, full_name)')
      .eq('id', payoutId)
      .single()

    if (fetchError || !payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    // Mettre à jour le statut du payout
    const updateData: any = {
      payout_status: status,
      notes
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedPayout, error: updateError } = await supabaseAdmin
      .from('referral_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payout:', updateError)
      return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
    }

    // Si le paiement est marqué comme complété, mettre à jour les transactions et envoyer un email
    if (status === 'completed') {
      // Mettre à jour les transactions comme payées
      await supabaseAdmin
        .from('referral_transactions')
        .update({ commission_status: 'paid' })
        .in('id', payout.transaction_ids)

      // Envoyer un email au bénéficiaire
      const userInfo = Array.isArray(payout.user) ? payout.user[0] : payout.user
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Paiement parrainage effectué',
            contact_email: userInfo.email,
            metadata: {
              montant: `${(payout.amount / 100).toFixed(2)}€`,
              date_paiement: new Date().toLocaleDateString('fr-FR')
            }
          })
        })
        console.log('✅ Payout completion email sent to', userInfo.email)
      } catch (err) {
        console.error('⚠️ Error sending payout completion email:', err)
      }
    }

    return NextResponse.json({ success: true, payout: updatedPayout })
  } catch (error: any) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
