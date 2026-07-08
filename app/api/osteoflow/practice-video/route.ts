import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-osteoflow-secret',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-osteoflow-secret')
  const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  }

  try {
    const { data: videos, error } = await supabaseAdmin
      .from('practice_videos')
      .select('id, title, region, vimeo_id, vimeo_url, thumbnail_url, duration_seconds, description')
      .eq('is_active', true)
      .not('vimeo_id', 'is', null)

    if (error) throw error

    if (!videos || videos.length === 0) {
      return NextResponse.json({ video: null }, { headers: CORS })
    }

    const randomIndex = Math.floor(Math.random() * videos.length)
    const video = videos[randomIndex]

    return NextResponse.json({ video }, { headers: CORS })
  } catch (error) {
    console.error('Error fetching practice video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}
