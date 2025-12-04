import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createOrUpdateSystemioContact, getRoleBasedTags } from '@/lib/systemio'

/**
 * POST /api/systemio/sync-user
 * Synchronize a user to System.io
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if already synced
    if (profile.systemio_contact_id) {
      return NextResponse.json({
        message: 'User already synced',
        contact_id: profile.systemio_contact_id,
      })
    }

    // Create or update contact in System.io
    const nameParts = profile.full_name?.split(' ') || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const tags = getRoleBasedTags(profile.role)

    try {
      const systemioContact = await createOrUpdateSystemioContact({
        email: profile.email,
        first_name: firstName,
        last_name: lastName,
        tags,
        custom_fields: {
          osteoupgrade_user_id: profile.id,
          subscription_role: profile.role,
        },
      })

      // Update profile with System.io contact ID
      await supabase
        .from('profiles')
        .update({
          systemio_contact_id: systemioContact.id || systemioContact.contact_id,
          systemio_synced_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      // Log sync
      await supabase.from('systemio_sync_logs').insert({
        user_id: profile.id,
        sync_type: 'user_creation',
        status: 'success',
        metadata: {
          systemio_contact_id: systemioContact.id || systemioContact.contact_id,
          tags,
        },
      })

      return NextResponse.json({
        message: 'User synced successfully',
        contact_id: systemioContact.id || systemioContact.contact_id,
      })
    } catch (systemioError: any) {
      // Log error
      await supabase.from('systemio_sync_logs').insert({
        user_id: profile.id,
        sync_type: 'user_creation',
        status: 'failed',
        error_message: systemioError.message,
      })

      return NextResponse.json(
        {
          error: 'Failed to sync with System.io',
          details: systemioError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in sync-user:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/systemio/sync-user
 * Check sync status
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('systemio_contact_id, systemio_synced_at')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      synced: !!profile.systemio_contact_id,
      contact_id: profile.systemio_contact_id,
      synced_at: profile.systemio_synced_at,
    })
  } catch (error: any) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
