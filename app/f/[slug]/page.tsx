import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-server'
import { readFunnelContent, type Funnel } from '@/lib/funnels'
import FunnelRenderer from '@/components/funnel/FunnelRenderer'
import PublicFooter from '@/components/PublicFooter'

// Le contenu est édité depuis l'admin et doit être visible dès l'enregistrement :
// une page de vente mise en cache continuerait d'afficher l'ancien prix.
export const dynamic = 'force-dynamic'

/**
 * Lecture côté serveur avec la clé service-role.
 *
 * Les tables funnel n'ont aucune politique `anon` (cf. migration 20260902) :
 * rien n'est lisible depuis le navigateur, et le filtre `status = published`
 * est appliqué ici. Un brouillon n'est donc jamais servi, même en devinant
 * son slug.
 */
async function getPublishedFunnel(slug: string): Promise<Funnel | null> {
  const { data, error } = await supabaseAdmin
    .from('funnels')
    .select(
      'id, slug, name, status, meta_title, meta_description, content, plan_type, deadline_mode, deadline_at, deadline_days, published_at, created_at, updated_at'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Erreur de lecture du funnel:', error.message)
    return null
  }
  return (data as Funnel) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const funnel = await getPublishedFunnel(params.slug)
  if (!funnel) return { title: 'Page introuvable' }

  return {
    title: funnel.meta_title || funnel.name,
    description: funnel.meta_description || undefined,
    openGraph: {
      title: funnel.meta_title || funnel.name,
      description: funnel.meta_description || undefined,
      type: 'website',
    },
    // Une page de vente n'a pas vocation à être indexée : elle est diffusée
    // par email et par publicité, et son référencement viendrait concurrencer
    // la page d'accueil sur les mêmes requêtes.
    robots: { index: false, follow: false },
  }
}

export default async function FunnelPage({ params }: { params: { slug: string } }) {
  const funnel = await getPublishedFunnel(params.slug)
  if (!funnel) notFound()

  const blocks = readFunnelContent(funnel.content)

  return (
    <main className="min-h-screen bg-white">
      <FunnelRenderer
        funnel={{
          slug: funnel.slug,
          plan_type: funnel.plan_type,
          deadline_mode: funnel.deadline_mode,
          // Le mode `relative` dépend du lead : il est résolu côté client à
          // partir de l'échéance renvoyée à l'opt-in.
          deadline_at: funnel.deadline_mode === 'fixed' ? funnel.deadline_at : null,
        }}
        blocks={blocks}
      />
      <PublicFooter />
    </main>
  )
}
