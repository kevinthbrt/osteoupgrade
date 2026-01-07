import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/referrals/validate
 * Validates a referral code without requiring authentication
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Vérifier que le code existe et est actif
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select(
        `
        referral_code,
        is_active,
        user_id,
        profiles:user_id (
          role,
          full_name
        )
      `
      )
      .eq('referral_code', referralCode.toUpperCase())
      .single()

    if (codeError || !codeData) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid referral code'
        },
        { status: 200 }
      )
    }

    // Vérifier que le code est actif
    if (!codeData.is_active) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This referral code is no longer active'
        },
        { status: 200 }
      )
    }

    // Vérifier que l'utilisateur est toujours Premium Gold
    const profile = Array.isArray(codeData.profiles) ? codeData.profiles[0] : codeData.profiles
    if (!profile || profile.role !== 'premium_gold') {
      return NextResponse.json(
        {
          valid: false,
          error: 'This referral code is no longer valid'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      referralCode: codeData.referral_code,
      referrerName: profile.full_name || 'A Premium Gold member'
    })
  } catch (error: any) {
    console.error('Error validating referral code:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
