import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/referrals/validate
 * Validates a referral code without requiring authentication
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = rateLimit(`referrals-validate:${ip}`, { limit: 10, windowSeconds: 60 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('validate_referral_code', {
      p_code: referralCode
    })

    if (error || !data || !data[0]) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 200 }
      )
    }

    const result = data[0]
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error || 'Invalid referral code' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      referralCode: result.referral_code,
      referrerName: result.referrer_name || 'A Premium Gold member'
    })
  } catch (error: any) {
    console.error('Error validating referral code:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
