import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/customers
 *
 * Liste complète des comptes, enrichie par la vue `admin_customer_overview` :
 * étape du cycle de vie, essai, résiliation et son motif, engagement email,
 * dernière connexion.
 *
 * Le tri et le filtrage se font côté page, sur le jeu complet : la base
 * compte quelques centaines de comptes, et charger la totalité évite un
 * aller-retour à chaque changement de filtre. Une pagination serveur devra
 * être ajoutée si ce volume change d'ordre de grandeur.
 */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('admin_customer_overview')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const clients = data || []

  // Motifs de départ agrégés : la question « pourquoi partent-ils ? » se lit
  // ici, pas fiche par fiche.
  const motifs: Record<string, number> = {}
  for (const c of clients) {
    if (c.churn_reason) motifs[c.churn_reason] = (motifs[c.churn_reason] || 0) + 1
  }

  const actifs = clients.filter((c: any) => c.lifecycle_stage === 'abonne').length
  const essais = clients.filter((c: any) => c.has_trialed).length
  const essaisConvertis = clients.filter((c: any) => c.has_trialed && c.first_subscribed_at).length

  return NextResponse.json({
    clients,
    stats: {
      total: clients.length,
      inscrits: clients.filter((c: any) => c.lifecycle_stage === 'inscrit').length,
      essaiEnCours: clients.filter((c: any) => c.lifecycle_stage === 'essai_en_cours').length,
      essaiTermine: clients.filter((c: any) => c.lifecycle_stage === 'essai_termine').length,
      abonnes: actifs,
      impayes: clients.filter((c: any) => c.lifecycle_stage === 'impaye').length,
      resilies: clients.filter((c: any) => c.lifecycle_stage === 'resilie').length,
      essaisPris: essais,
      // Taux de conversion de l'essai : la mesure qui manquait pour savoir si
      // l'essai gratuit sert à quelque chose.
      tauxConversionEssai: essais ? Math.round((essaisConvertis / essais) * 100) : 0,
      enquetesEnAttente: clients.reduce(
        (n: number, c: any) => n + Math.max(0, (c.surveys_sent || 0) - (c.surveys_answered || 0)),
        0
      ),
      motifsResiliation: motifs,
    },
  })
}
