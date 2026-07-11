import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/**
 * Renvoie une URL de lecture directe (HLS de préférence, sinon MP4 progressif)
 * pour une vidéo de pratique, afin de la lire nativement dans l'app mobile
 * (expo-video) au lieu de la WebView Vimeo.
 *
 * Garde-fou : l'id demandé doit correspondre à une vidéo `practice_videos`
 * active — l'endpoint ne peut pas servir de proxy Vimeo générique.
 *
 * Les URLs Vimeo directes sont temporaires : l'app les redemande à chaque lecture.
 */
export async function GET(request: Request) {
  const token = process.env.VIMEO_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Vimeo non configuré' }, { status: 501, headers: CORS })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') // vimeo_id (numérique)
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'id invalide' }, { status: 400, headers: CORS })
  }

  try {
    // Vérifie que la vidéo existe et est active (anti-proxy générique)
    const { data: match } = await supabaseAdmin
      .from('practice_videos')
      .select('id')
      .eq('vimeo_id', id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!match) {
      return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404, headers: CORS })
    }

    // Récupère les fichiers de lecture via l'API Vimeo
    const res = await fetch(
      `https://api.vimeo.com/videos/${id}?fields=uri,name,privacy,is_playable,play,files,download,user.uri`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
        cache: 'no-store',
      },
    )

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json({ error: 'Vimeo API error', status: res.status, body: body.slice(0, 400) }, { status: 502, headers: CORS })
    }

    const data = await res.json()

    // Mode debug : renvoie la structure brute pour diagnostiquer
    if (searchParams.get('debug') === '1') {
      return NextResponse.json({
        uri: data?.uri,
        user_uri: data?.user?.uri,
        privacy: data?.privacy,
        is_playable: data?.is_playable,
        has_play: !!data?.play,
        play_status: data?.play?.status,
        play_keys: data?.play ? Object.keys(data.play) : [],
        progressive_count: (data?.play?.progressive ?? data?.files ?? []).length,
        hls: data?.play?.hls?.link ? 'yes' : 'no',
        download_count: Array.isArray(data?.download) ? data.download.length : 'n/a',
        files_count: Array.isArray(data?.files) ? data.files.length : 'n/a',
      }, { headers: CORS })
    }

    // 1) HLS (adaptatif, idéal mobile) via le champ `play`
    const hls: string | undefined = data?.play?.hls?.link
    // 2) MP4 progressif : meilleure résolution disponible
    type Prog = { link: string; height?: number; rendition?: string }
    const progressiveList: Prog[] = data?.play?.progressive ?? data?.files ?? []
    const mp4 = progressiveList
      .filter((f) => f.link)
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0]?.link

    const url = hls ?? mp4
    if (!url) {
      return NextResponse.json({ error: 'Aucun flux disponible' }, { status: 404, headers: CORS })
    }

    return NextResponse.json(
      { url, type: hls ? 'hls' : 'mp4' },
      { headers: { ...CORS, 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('vimeo-play error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}
