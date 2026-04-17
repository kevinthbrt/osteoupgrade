import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com/repos/kevinthbrt/Osteoflow/releases/latest'
const FALLBACK = 'https://github.com/kevinthbrt/Osteoflow/releases/latest'

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform')

  try {
    const res = await fetch(GITHUB_API, {
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.redirect(FALLBACK)

    const release = await res.json()
    const assets: Array<{ name: string; browser_download_url: string }> = release.assets || []

    let asset: (typeof assets)[0] | undefined
    if (platform === 'mac-arm64') {
      asset = assets.find(a => a.name.endsWith('-arm64.dmg'))
    } else if (platform === 'mac') {
      asset = assets.find(a => a.name.endsWith('.dmg') && !a.name.includes('arm64'))
    } else if (platform === 'windows') {
      asset = assets.find(a => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap'))
    }

    if (!asset) return NextResponse.redirect(FALLBACK)
    return NextResponse.redirect(asset.browser_download_url)
  } catch {
    return NextResponse.redirect(FALLBACK)
  }
}
