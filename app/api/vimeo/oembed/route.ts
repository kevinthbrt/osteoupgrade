import { NextRequest, NextResponse } from 'next/server'
import { extractVimeoId, fetchVimeoOEmbedMetadata } from '@/lib/vimeo'

export async function GET(request: NextRequest) {
  const vimeoUrl = request.nextUrl.searchParams.get('url')

  if (!vimeoUrl) {
    return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 })
  }

  try {
    const metadata = await fetchVimeoOEmbedMetadata(vimeoUrl)
    return NextResponse.json(metadata)
  } catch (error) {
    const extractedId = extractVimeoId(vimeoUrl)

    if (extractedId) {
      return NextResponse.json(
        { vimeo_id: extractedId, thumbnail_url: null, duration_seconds: null },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Unable to fetch Vimeo metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 422 }
    )
  }
}
