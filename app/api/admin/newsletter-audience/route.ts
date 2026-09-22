import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isPlan } from '@/lib/entitlements'

/**
 * Combien de personnes recevront la newsletter.
 *
 * Un compte est plus parlant qu'un nom de liste : c'est ce qui permet de voir,
 * avant d'envoyer, qu'on s'apprêtait à écrire à trois personnes ou à deux mille.
 * Les mêmes filtres que l'envoi, au même endroit qu'eux dans l'esprit : hors
 * pré-lancement, seuls les comptes ayant coché la newsletter sont comptés.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const url = new URL(request.url)
  const audience = url.searchParams.get('audience') || 'all'
  const filter = url.searchParams.get('filter') || undefined

  try {
    if (audience === 'prelaunch') {
      const { count, error } = await supabaseAdmin
        .from('mail_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'newsletter_pre_launch')
        .not('email', 'is', null)
      if (error) throw error
      return NextResponse.json({ count: count ?? 0 })
    }

    let query = supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('email', 'is', null)
      .eq('newsletter_opt_in', true)

    if (audience === 'plan') {
      if (!filter) return NextResponse.json({ count: 0 })
      query = query.eq(isPlan(filter) ? 'plan' : 'role', filter)
    }

    const { count, error } = await query
    if (error) throw error

    return NextResponse.json({ count: count ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
