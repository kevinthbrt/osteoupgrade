import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Verify admin access helper
 */
async function verifyAdminAccess() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    return { authorized: false, userId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { authorized: false, userId: null }
  }

  return { authorized: true, userId: session.user.id }
}

/**
 * GET /api/emails/[id]
 * Get full email details including HTML content
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, userId } = await verifyAdminAccess()

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const emailId = params.id

    // Fetch full email
    const { data: email, error: emailError } = await supabaseAdmin
      .from('received_emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (emailError || !email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Auto-mark as read when opened
    if (!email.is_read) {
      await supabaseAdmin
        .from('received_emails')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: userId
        })
        .eq('id', emailId)

      email.is_read = true
      email.read_at = new Date().toISOString()
      email.read_by = userId
    }

    return NextResponse.json({ email })
  } catch (error: any) {
    console.error('❌ Error fetching email:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/emails/[id]
 * Update email status (mark as read/unread, archive, add tags, etc.)
 *
 * Body:
 * {
 *   "is_read": true/false,
 *   "is_archived": true/false,
 *   "category": "parrainage" | "support" | "general" | "spam",
 *   "tags": ["important", "to-reply"]
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, userId } = await verifyAdminAccess()

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const emailId = params.id
    const body = await request.json()

    const updates: any = {}

    // Handle is_read update
    if (typeof body.is_read === 'boolean') {
      updates.is_read = body.is_read
      if (body.is_read) {
        updates.read_at = new Date().toISOString()
        updates.read_by = userId
      } else {
        updates.read_at = null
        updates.read_by = null
      }
    }

    // Handle is_archived update
    if (typeof body.is_archived === 'boolean') {
      updates.is_archived = body.is_archived
      if (body.is_archived) {
        updates.archived_at = new Date().toISOString()
      } else {
        updates.archived_at = null
      }
    }

    // Handle category update
    if (body.category) {
      const validCategories = ['parrainage', 'support', 'general', 'spam']
      if (validCategories.includes(body.category)) {
        updates.category = body.category
      }
    }

    // Handle tags update
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags
    }

    // Update email
    const { data: updatedEmail, error: updateError } = await supabaseAdmin
      .from('received_emails')
      .update(updates)
      .eq('id', emailId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating email:', updateError)
      return NextResponse.json(
        { error: 'Failed to update email', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      email: updatedEmail
    })
  } catch (error: any) {
    console.error('❌ Error in email update API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/emails/[id]
 * Permanently delete an email
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized } = await verifyAdminAccess()

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const emailId = params.id

    const { error: deleteError } = await supabaseAdmin
      .from('received_emails')
      .delete()
      .eq('id', emailId)

    if (deleteError) {
      console.error('❌ Error deleting email:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete email', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully'
    })
  } catch (error: any) {
    console.error('❌ Error in email delete API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
