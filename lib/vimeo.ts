export type VimeoMetadata = {
  vimeo_id: string
  thumbnail_url: string | null
  duration_seconds: number | null
}

const VIMEO_ID_REGEX = /(?:vimeo\.com\/(?:video\/)?)(\d+)/i

export const extractVimeoId = (vimeoUrl?: string | null): string | null => {
  if (!vimeoUrl) return null
  const trimmed = vimeoUrl.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()
    const segments = parsed.pathname.split('/').filter(Boolean)

    if (host.includes('player.vimeo.com')) {
      const videoIndex = segments.findIndex((segment) => segment === 'video')
      if (videoIndex >= 0) {
        const candidate = segments[videoIndex + 1]
        if (candidate && /^\d+$/.test(candidate)) return candidate
      }
    }

    const numericSegment = segments.find((segment) => /^\d+$/.test(segment))
    if (numericSegment) return numericSegment
  } catch {
    // Fallback regex below handles malformed URLs
  }

  const regexMatch = trimmed.match(VIMEO_ID_REGEX)
  return regexMatch?.[1] ?? null
}

const normalizeVimeoUrlForOEmbed = (vimeoUrl: string): string => {
  const extractedId = extractVimeoId(vimeoUrl)
  if (extractedId) return `https://vimeo.com/${extractedId}`
  return vimeoUrl.trim()
}

export const fetchVimeoOEmbedMetadata = async (vimeoUrl: string): Promise<VimeoMetadata> => {
  const normalizedVideoUrl = normalizeVimeoUrlForOEmbed(vimeoUrl)
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(normalizedVideoUrl)}`

  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': 'OsteoUpgrade Vimeo Metadata Fetcher',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`oEmbed Vimeo failed (${response.status})`)
  }

  const payload = await response.json() as {
    video_id?: number | string
    thumbnail_url?: string | null
    duration?: number | null
  }

  const vimeoId = String(payload.video_id ?? extractVimeoId(vimeoUrl) ?? '').trim()
  if (!vimeoId) throw new Error('No Vimeo ID found in oEmbed response')

  return {
    vimeo_id: vimeoId,
    thumbnail_url: payload.thumbnail_url ?? null,
    duration_seconds: typeof payload.duration === 'number' ? payload.duration : null,
  }
}
