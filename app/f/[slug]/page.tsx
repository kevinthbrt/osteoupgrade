import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerComponentClient } from '@/lib/supabase-server-helpers'
import {
  readFunnelContent,
  optinCookieName,
  promoCookieName,
  activePromoExpiry,
  type Funnel,
} from '@/lib/funnels'
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
 * devinant son slug : seul un admin en aperçu peut le voir.
 */
async function getFunnel(slug: string, autoriserBrouillon: boolean): Promise<Funnel | null> {
  let query = supabaseAdmin
    .from('funnels')
    .select(
      'id, slug, name, status, meta_title, meta_description, content, plan_type, deadline_mode, deadline_at, deadline_days, promo_enabled, published_at, created_at, updated_at'
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
 * brouillon : une offre en préparation, ses prix et sa date de lancement.
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
  searchParams: { preview?: string; visiteur?: string }
}) {
  const apercuDemande = searchParams.preview === '1'
  const apercu = apercuDemande && (await estAdmin())
  /** En aperçu, permet de regarder la page avec les yeux d'un non-inscrit. */
  const simulerVisiteur = apercu && searchParams.visiteur === '1'

  const funnel = await getFunnel(params.slug, apercu)
  if (!funnel) notFound()

  const tousLesBlocs = readFunnelContent(funnel.content)

  // Portillon : les blocs réservés ne sont pas rendus tant que le visiteur n'a
  // pas laissé son email. Le tri se fait ici, côté serveur, pour que les URL
  // des vidéos soient absentes de la source de la page. Les masquer en CSS
  // aurait laissé le contenu lisible d'un clic droit, ce qui aurait vidé
  // l'inscription de son intérêt.
  const inscrit = Boolean(cookies().get(optinCookieName(funnel.slug))?.value)

  // Échéance de la remise de ce visiteur, s'il en a une en cours. Sert à
  // afficher les prix remisés tant que le code vaut, et le prix plein ensuite.
  const promoExpire = funnel.promo_enabled
    ? activePromoExpiry(cookies().get(promoCookieName(funnel.slug))?.value)
    : null

  // En aperçu, un admin voit la page entière : sinon il ne peut relire ni les
  // vidéos, ni les tarifs, ni la garantie, soit l'essentiel de la page. Le
  // portillon reste entier pour les visiteurs, et `?visiteur=1` permet de
  // repasser sur leur vue depuis l'aperçu.
  const toutVoir = inscrit || (apercu && !simulerVisiteur)
  const blocks = toutVoir ? tousLesBlocs : tousLesBlocs.filter((b) => !b.gated)
  const blocsVerrouilles = tousLesBlocs.length - blocks.length
  const nbReserves = tousLesBlocs.filter((b) => b.gated).length

  const brouillon = funnel.status !== 'published'

  return (
    <main className="min-h-screen bg-white">
      {brouillon && (
        <div className="sticky top-0 z-50 bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-amber-950">
          Aperçu : cette page est en {funnel.status === 'draft' ? 'brouillon' : 'archive'} et
          renvoie une erreur 404 aux visiteurs. Passez son statut à « En ligne » pour la diffuser.
          {/* État du portillon, affiché en aperçu seulement. Sans ça,
              impossible de distinguer « le filtre ne marche pas » de « ce
              navigateur a déjà le cookie d'inscription ». */}
          {nbReserves > 0 && (
            <span className="mt-1 block font-normal">
              {simulerVisiteur ? (
                <>
                  Vue visiteur : {blocsVerrouilles} blocs réservés sont masqués.{' '}
                  <a href={`/f/${funnel.slug}?preview=1`} className="underline">
                    Revenir à l’aperçu complet
                  </a>
                </>
              ) : inscrit ? (
                `Contenu réservé affiché : ce navigateur porte le cookie d’inscription.`
              ) : (
                <>
                  Aperçu admin : les {nbReserves} blocs réservés sont affichés, un visiteur ne les
                  verrait qu’après avoir laissé son email.{' '}
                  <a href={`/f/${funnel.slug}?preview=1&visiteur=1`} className="underline">
                    Voir la page comme un visiteur
                  </a>
                </>
              )}
            </span>
          )}
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
          promo_enabled: Boolean(funnel.promo_enabled),
          promo_expires_at: promoExpire ? promoExpire.toISOString() : null,
        }}
        blocks={blocks}
        lockedCount={blocsVerrouilles}
      />
      <PublicFooter />
    </main>
  )
}
