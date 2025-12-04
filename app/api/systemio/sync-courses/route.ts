import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSystemioCourses } from '@/lib/systemio'

/**
 * POST /api/systemio/sync-courses
 * Synchronize courses from System.io (Admin only)
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    try {
      // Fetch courses from System.io
      const systemioCourses = await getSystemioCourses()

      if (!systemioCourses || systemioCourses.length === 0) {
        return NextResponse.json({
          message: 'No courses found in System.io',
          synced: 0,
        })
      }

      const syncedCourses = []
      const errors = []

      // Sync each course
      for (const course of systemioCourses) {
        try {
          // Check if course already exists
          const { data: existingCourse } = await supabase
            .from('systemio_courses')
            .select('id')
            .eq('systemio_course_id', course.id)
            .single()

          if (existingCourse) {
            // Update existing course
            const { error: updateError } = await supabase
              .from('systemio_courses')
              .update({
                title: course.title,
                description: course.description || null,
                thumbnail_url: course.thumbnail_url || null,
                course_url: course.url,
                updated_at: new Date().toISOString(),
              })
              .eq('systemio_course_id', course.id)

            if (updateError) {
              errors.push({
                course_id: course.id,
                error: updateError.message,
              })
            } else {
              syncedCourses.push({ id: course.id, action: 'updated' })
            }
          } else {
            // Create new course
            const { error: insertError } = await supabase
              .from('systemio_courses')
              .insert({
                systemio_course_id: course.id,
                title: course.title,
                description: course.description || null,
                thumbnail_url: course.thumbnail_url || null,
                course_url: course.url,
                is_active: true,
              })

            if (insertError) {
              errors.push({
                course_id: course.id,
                error: insertError.message,
              })
            } else {
              syncedCourses.push({ id: course.id, action: 'created' })
            }
          }
        } catch (courseError: any) {
          errors.push({
            course_id: course.id,
            error: courseError.message,
          })
        }
      }

      // Log sync
      await supabase.from('systemio_sync_logs').insert({
        user_id: session.user.id,
        sync_type: 'course_sync',
        status: errors.length === 0 ? 'success' : 'partial',
        metadata: {
          total_courses: systemioCourses.length,
          synced: syncedCourses.length,
          errors: errors.length,
          details: syncedCourses,
        },
      })

      return NextResponse.json({
        message: 'Courses synced',
        total: systemioCourses.length,
        synced: syncedCourses.length,
        errors: errors.length,
        details: {
          synced: syncedCourses,
          errors,
        },
      })
    } catch (systemioError: any) {
      // Log error
      await supabase.from('systemio_sync_logs').insert({
        user_id: session.user.id,
        sync_type: 'course_sync',
        status: 'failed',
        error_message: systemioError.message,
      })

      return NextResponse.json(
        {
          error: 'Failed to sync courses from System.io',
          details: systemioError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in sync-courses:', error)
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
 * GET /api/systemio/sync-courses
 * Get last sync status (Admin only)
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get last sync log
    const { data: lastSync, error: syncError } = await supabase
      .from('systemio_sync_logs')
      .select('*')
      .eq('sync_type', 'course_sync')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (syncError) {
      return NextResponse.json({
        message: 'No sync history found',
        last_sync: null,
      })
    }

    return NextResponse.json({
      last_sync: lastSync,
    })
  } catch (error: any) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
