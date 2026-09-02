import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerComponentClient } from '@/lib/supabase-server-helpers'
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
 * rien n'est lisible depuis le navigateur, et le filtre sur le statut est
 * appliqué ici. Un brouillon n'est donc jamais servi à un visiteur, même en
 * devinant son slug — seul un admin en aperçu peut le voir.
 */
async function getFunnel(slug: string, autoriserBrouillon: boolean): Promise<Funnel | null> {
  let query = supabaseAdmin
    .from('funnels')
    .select(
      'id, slug, name, status, meta_title, meta_description, content, plan_type, deadline_mode, deadline_at, deadline_days, published_at, created_at, updated_at'
    )
    .eq('slug', slug)

  if (!autoriserBrouillon) query = query.eq('status', 'published')

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Erreur de lecture du funnel:', error.message)
    return null
  }
  return (data as Funnel) ?? null
}

/**
 * Un aperçu n'est accordé qu'à un admin connecté.
 *
 * Sans cette vérification, `?preview=1` suffirait à lire n'importe quel
 * brouillon — une offre en préparation, ses prix et sa date de lancement.
 */
async function estAdmin(): Promise<boolean> {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    return profile?.role === 'admin'
  } catch {
    return false
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const funnel = await getFunnel(params.slug, false)
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

export default async function FunnelPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { preview?: string }
}) {
  const apercuDemande = searchParams.preview === '1'
  const apercu = apercuDemande && (await estAdmin())

  const funnel = await getFunnel(params.slug, apercu)
  if (!funnel) notFound()

  const blocks = readFunnelContent(funnel.content)
  const brouillon = funnel.status !== 'published'

  return (
    <main className="min-h-screen bg-white">
      {brouillon && (
        <div className="sticky top-0 z-50 bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-amber-950">
          Aperçu — cette page est en {funnel.status === 'draft' ? 'brouillon' : 'archive'} et
          renvoie une erreur 404 aux visiteurs. Passez son statut à « En ligne » pour la diffuser.
        </div>
      )}
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
