import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/referrals/request-payout
 * Request a payout for available referral earnings
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { payoutMethod = 'bank_transfer', payoutDetails = {}, ribFile = null } = body

    // Vérifier que le RIB est fourni
    if (!ribFile || !ribFile.data || !ribFile.name) {
      return NextResponse.json(
        { error: 'Veuillez joindre votre RIB (PDF, JPG ou PNG)' },
        { status: 400 }
      )
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est Premium Gold
    if (profile.role !== 'premium_gold') {
      return NextResponse.json(
        { error: 'Only Premium Gold members can request payouts' },
        { status: 403 }
      )
    }

    // Récupérer le résumé des gains disponibles
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('referral_earnings_summary')
      .select('*')
      .eq('referrer_id', user.id)
      .single()

    if (summaryError || !summary) {
      return NextResponse.json({ error: 'No earnings found' }, { status: 404 })
    }

    const availableAmount = summary.available_amount || 0

    // Vérifier qu'il y a des gains disponibles
    if (availableAmount <= 0) {
      return NextResponse.json(
        { error: 'No available earnings to withdraw' },
        { status: 400 }
      )
    }

    // Montant minimum pour un retrait : 10€
    const minimumPayout = 1000 // 10€ en centimes
    if (availableAmount < minimumPayout) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is ${minimumPayout / 100}€`,
          availableAmount: availableAmount / 100
        },
        { status: 400 }
      )
    }

    // Récupérer toutes les transactions disponibles
    const { data: availableTransactions, error: transactionsError } = await supabaseAdmin
      .from('referral_transactions')
      .select('id')
      .eq('referrer_id', user.id)
      .eq('commission_status', 'available')

    if (transactionsError) {
      console.error('Error fetching available transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const transactionIds = availableTransactions?.map((t) => t.id) || []

    // Créer la demande de paiement avec le RIB
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('referral_payouts')
      .insert({
        user_id: user.id,
        amount: availableAmount,
        transaction_ids: transactionIds,
        payout_method: payoutMethod,
        payout_details: {
          ...payoutDetails,
          rib_file: {
            name: ribFile.name,
            data: ribFile.data, // Base64 encoded file
            size: ribFile.size,
            type: ribFile.type
          }
        },
        payout_status: 'requested'
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Error creating payout request:', payoutError)
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // Marquer les transactions comme "en cours de paiement"
    const { error: updateError } = await supabaseAdmin
      .from('referral_transactions')
      .update({ commission_status: 'pending' })
      .in('id', transactionIds)

    if (updateError) {
      console.error('Error updating transaction status:', updateError)
      // Continue anyway, payout request is created
    }

    // Notifier les administrateurs par email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Demande de paiement parrainage',
          contact_email: process.env.ADMIN_EMAIL || 'admin@osteoupgrade.com',
          metadata: {
            user_name: profile.full_name || profile.email,
            user_email: profile.email,
            amount: `${(availableAmount / 100).toFixed(2)}€`,
            method: payoutMethod,
            payout_id: payout.id
          }
        })
      })
    } catch (err) {
      console.error('Error sending admin notification:', err)
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: availableAmount,
        status: 'requested',
        requestedAt: payout.requested_at
      }
    })
  } catch (error: any) {
    console.error('Error requesting payout:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
