import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/referrals/earnings
 * Returns the referral earnings summary for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est Premium Gold
    if (profile.role !== 'premium_gold') {
      return NextResponse.json(
        { error: 'Only Premium Gold members have access to referral earnings' },
        { status: 403 }
      )
    }

    // Récupérer le résumé des gains depuis la vue
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('referral_earnings_summary')
      .select('*')
      .eq('referrer_id', user.id)
      .single()

    if (summaryError && summaryError.code !== 'PGRST116') {
      // PGRST116 = no rows found (normal si pas encore de parrainages)
      console.error('Error fetching earnings summary:', summaryError)
    }

    // Récupérer les transactions détaillées
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('referral_transactions')
      .select(
        `
        *,
        referred_user:referred_user_id (
          email,
          full_name
        )
      `
      )
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }

    // Récupérer l'historique des paiements
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('referral_payouts')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
    }

    return NextResponse.json({
      summary: summary || {
        referrer_id: user.id,
        total_referrals: 0,
        available_referrals: 0,
        pending_amount: 0,
        available_amount: 0,
        paid_amount: 0,
        total_earned: 0
      },
      transactions: transactions || [],
      payouts: payouts || []
    })
  } catch (error: any) {
    console.error('Error fetching referral earnings:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
