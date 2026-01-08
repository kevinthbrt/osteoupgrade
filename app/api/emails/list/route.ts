import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/emails/list
 * Lists all received emails (admin only)
 *
 * Query parameters:
 * - category: Filter by category (parrainage, support, general, spam)
 * - is_read: Filter by read status (true/false)
 * - is_archived: Filter by archive status (true/false)
 * - limit: Number of emails to return (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - search: Search in subject, from_email, from_name
 */
export async function GET(request: Request) {
  try {
    // Verify user is authenticated and is admin
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isRead = searchParams.get('is_read')
    const isArchived = searchParams.get('is_archived')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Build query
    let query = supabaseAdmin
      .from('received_emails')
      .select(
        `
        id,
        from_email,
        from_name,
        to_email,
        subject,
        resend_email_id,
        category,
        is_read,
        is_archived,
        received_at,
        created_at,
        attachments,
        tags
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true')
    }

    if (isArchived !== null) {
      query = query.eq('is_archived', isArchived === 'true')
    }

    // Search functionality
    if (search && search.trim()) {
      // Use PostgreSQL full-text search on subject
      // Or use ilike for simpler pattern matching
      query = query.or(
        `subject.ilike.%${search}%,from_email.ilike.%${search}%,from_name.ilike.%${search}%`
      )
    }

    // Order by most recent first
    query = query.order('received_at', { ascending: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: emails, error: emailsError, count } = await query

    if (emailsError) {
      console.error('❌ Error fetching emails:', emailsError)
      return NextResponse.json(
        { error: 'Failed to fetch emails', details: emailsError.message },
        { status: 500 }
      )
    }

    // Get counts by category for sidebar
    const { data: categoryCounts } = await supabaseAdmin
      .from('received_emails')
      .select('category, is_read')
      .eq('is_archived', false)

    const counts = {
      total: categoryCounts?.length || 0,
      unread: categoryCounts?.filter((e) => !e.is_read).length || 0,
      parrainage: categoryCounts?.filter((e) => e.category === 'parrainage').length || 0,
      support: categoryCounts?.filter((e) => e.category === 'support').length || 0,
      general: categoryCounts?.filter((e) => e.category === 'general').length || 0,
      spam: categoryCounts?.filter((e) => e.category === 'spam').length || 0
    }

    return NextResponse.json({
      emails: emails || [],
      total: count || 0,
      limit,
      offset,
      counts
    })
  } catch (error: any) {
    console.error('❌ Error in emails list API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
