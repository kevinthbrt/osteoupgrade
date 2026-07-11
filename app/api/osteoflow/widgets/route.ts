import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Client admin (service role) : literature_reviews et elearning_formations
    // sont en RLS "authenticated only", or cette route sert un widget public
    // sans session utilisateur — la clé anon ne verrait donc jamais de lignes.
    const supabase = supabaseAdmin

    // Get a random literature review via count + offset
    const { count: reviewCount } = await supabase
      .from('literature_reviews')
      .select('*', { count: 'exact', head: true })

    const randomOffset = (reviewCount && reviewCount > 0)
      ? Math.floor(Math.random() * reviewCount)
      : 0

    const [reviewResult, formationResult] = await Promise.all([
      supabase
        .from('literature_reviews')
        .select('id, title, summary, image_url, published_date')
        .range(randomOffset, randomOffset)
        .single(),
      supabase
        .from('elearning_formations')
        .select('id, title, description, photo_url')
        .eq('is_featured_osteoflow', true)
        .limit(1)
        .maybeSingle(),
    ])

    if (reviewResult.error) {
      console.error('[widgets] review err:', reviewResult.error.code, reviewResult.error.message)
    }
    if (formationResult.error) {
      console.error('[widgets] formation err:', formationResult.error.code, formationResult.error.message)
    }

    return NextResponse.json({
      review: reviewResult.data ?? null,
      featured_formation: formationResult.data ?? null,
    })
  } catch (err) {
    console.error('[widgets] unhandled:', err)
    return NextResponse.json({ review: null, featured_formation: null })
  }
}
