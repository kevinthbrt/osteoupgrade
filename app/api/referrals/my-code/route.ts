import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/referrals/my-code
 * Returns the referral code for the authenticated user (Premium Gold only)
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
        { error: 'Only Premium Gold members have access to referral codes' },
        { status: 403 }
      )
    }

    // Récupérer le code de parrainage
    const { data: referralCode, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('referral_code, is_active, created_at')
      .eq('user_id', user.id)
      .single()

    if (codeError) {
      // Si le code n'existe pas encore, il sera créé automatiquement par le trigger
      return NextResponse.json(
        { error: 'Referral code not found. Please contact support.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      referralCode: referralCode.referral_code,
      isActive: referralCode.is_active,
      createdAt: referralCode.created_at
    })
  } catch (error: any) {
    console.error('Error fetching referral code:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
