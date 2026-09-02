'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Quote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { FunnelBlock } from '@/lib/funnels'
import { safeEmbedUrl, safeLinkUrl } from '@/lib/funnels'
import { formatAmount } from '@/lib/offers'
import {
  UTM_COOKIE,
  UTM_COOKIE_MAX_AGE,
  parseAttributionCookie,
  parseUtm,
  hasUtm,
  serializeAttribution,
  type Utm,
} from '@/lib/utm'
import Countdown from './Countdown'
import OptinForm from './OptinForm'

type FunnelSummary = {
  slug: string
  plan_type: string | null
  deadline_mode: 'none' | 'fixed' | 'relative'
  /** Échéance déjà résolue côté serveur pour le mode `fixed`. */
  deadline_at: string | null
}

const OPTIN_ANCHOR = 'funnel-optin'

/** Clé de stockage de l'échéance individuelle d'un lead (mode relatif). */
const deadlineKey = (slug: string) => `ou_funnel_deadline_${slug}`
const VISITOR_KEY = 'ou_visitor_id'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? match[1] : null
}

export default function FunnelRenderer({
  funnel,
  blocks,
}: {
  funnel: FunnelSummary
  blocks: FunnelBlock[]
}) {
  const router = useRouter()
  const [utm, setUtm] = useState<Utm>({})
  const [visitorId, setVisitorId] = useState('')
  const [leadDeadline, setLeadDeadline] = useState<string | null>(null)
  const viewTracked = useRef(false)

  // ── Attribution + identité anonyme du visiteur ──────────────────────────
  useEffect(() => {
    // Identifiant anonyme, purement local : il sert à ne pas compter dix fois
    // le même visiteur, jamais à l'identifier.
    let vid = localStorage.getItem(VISITOR_KEY)
    if (!vid) {
      vid = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, vid)
    }
    setVisitorId(vid)

    const fromUrl = parseUtm(window.location.search)
    const existing = parseAttributionCookie(readCookie(UTM_COOKIE))

    // Premier contact conservé : on n'écrase un cookie existant que s'il ne
    // portait aucune campagne. Sinon un retour en direct volerait la
    // conversion à la campagne qui l'a réellement produite.
    const attributed = existing && hasUtm(existing.utm) ? existing : null

    if (!attributed && hasUtm(fromUrl)) {
      const attribution = {
        utm: fromUrl,
        landing: window.location.pathname,
        referrer: document.referrer ? document.referrer.slice(0, 200) : undefined,
        first_seen: new Date().toISOString(),
      }
      document.cookie = `${UTM_COOKIE}=${serializeAttribution(attribution)}; path=/; max-age=${UTM_COOKIE_MAX_AGE}; SameSite=Lax`
    }

    // Le cookie fait foi dès qu'il porte une campagne : y compris quand l'URL
    // en annonce une autre. Prendre celle de l'URL ici enregistrerait la
    // campagne B sur le lead et les événements pendant que Stripe recevrait la
    // campagne A depuis le cookie : deux attributions contradictoires pour une
    // seule conversion.
    setUtm(attributed ? attributed.utm : fromUrl)

    setLeadDeadline(localStorage.getItem(deadlineKey(funnel.slug)))
  }, [funnel.slug])

  const track = useCallback(
    (type: 'view' | 'cta_click' | 'checkout_started', extra?: Record<string, unknown>) => {
      // `keepalive` : le clic CTA déclenche une navigation, et une requête
      // normale serait annulée avant d'atteindre le serveur.
      fetch('/api/funnels/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ slug: funnel.slug, type, utm, visitor_id: visitorId, ...extra }),
      }).catch(() => {
        // La mesure ne doit jamais casser la page.
      })
    },
    [funnel.slug, utm, visitorId]
  )

  useEffect(() => {
    if (viewTracked.current || !visitorId) return
    viewTracked.current = true
    track('view')
  }, [track, visitorId])

  // ── Échéance affichée ───────────────────────────────────────────────────
  const deadline = useMemo(() => {
    if (funnel.deadline_mode === 'fixed') return funnel.deadline_at
    if (funnel.deadline_mode === 'relative') return leadDeadline
    return null
  }, [funnel.deadline_mode, funnel.deadline_at, leadDeadline])

  const handleOptin = useCallback(
    (deadlineAt: string | null) => {
      if (deadlineAt) {
        localStorage.setItem(deadlineKey(funnel.slug), deadlineAt)
        setLeadDeadline(deadlineAt)
      }
    },
    [funnel.slug]
  )

  // ── Appels à l'action ───────────────────────────────────────────────────
  const handleCta = useCallback(
    (target: 'checkout' | 'optin' | 'url', url?: string) => {
      if (target === 'optin') {
        document.getElementById(OPTIN_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        track('cta_click', { target: 'optin' })
        return
      }

      if (target === 'url') {
        // Revalidé au clic et pas seulement à l'enregistrement : un lien
        // stocké avant l'ajout de cette règle serait sinon navigable tel quel.
        const safe = url ? safeLinkUrl(url) : null
        if (!safe) {
          console.warn('Lien de CTA ignoré (schéma non autorisé)')
          return
        }
        track('cta_click', { target: 'url' })
        window.location.href = safe
        return
      }

      // `checkout` : la souscription exige un compte (l'API Stripe refuse un
      // appel anonyme). On envoie donc vers l'inscription en conservant
      // l'offre et le funnel d'origine, que /auth relaie après création.
      track('checkout_started', { target: 'checkout' })
      const params = new URLSearchParams({ funnel: funnel.slug })
      if (funnel.plan_type) params.set('plan', funnel.plan_type)
      router.push(`/auth?${params.toString()}`)
    },
    [funnel.plan_type, funnel.slug, router, track]
  )

  const hasOptinBlock = blocks.some((b) => b.type === 'optin')

  return (
    <div className="bg-white">
      {blocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          slug={funnel.slug}
          deadline={deadline}
          utm={utm}
          visitorId={visitorId}
          onCta={handleCta}
          onOptin={handleOptin}
          // Un CTA « checkout » sans offre configurée et sans formulaire dans
          // la page n'aurait nulle part où envoyer le visiteur.
          fallbackToOptin={!funnel.plan_type && hasOptinBlock}
        />
      ))}
    </div>
  )
}

// ── Rendu d'un bloc ─────────────────────────────────────────────────────────

type BlockViewProps = {
  block: FunnelBlock
  slug: string
  deadline: string | null
  utm: Utm
  visitorId: string
  onCta: (target: 'checkout' | 'optin' | 'url', url?: string) => void
  onOptin: (deadlineAt: string | null) => void
  fallbackToOptin: boolean
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`px-5 py-14 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-3xl">{children}</div>
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
      {children}
    </h2>
  )
}

function CtaButton({
  label,
  target,
  url,
  onCta,
  fallbackToOptin,
}: {
  label: string
  target: 'checkout' | 'optin' | 'url'
  url?: string
  onCta: BlockViewProps['onCta']
  fallbackToOptin: boolean
}) {
  const effective = target === 'checkout' && fallbackToOptin ? 'optin' : target
  return (
    <button
      onClick={() => onCta(effective, url)}
      className="flow-gradient group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/** Conserve les sauts de ligne d'un texte saisi dans l'admin. */
function Paragraphs({ text, className = '' }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className={className}>
          {paragraph.split('\n').map((line, j, lines) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  )
}

function BlockView({
  block,
  slug,
  deadline,
  utm,
  visitorId,
  onCta,
  onOptin,
  fallbackToOptin,
}: BlockViewProps) {
  switch (block.type) {
    case 'hero': {
      const sombre = block.variant === 'sombre'
      return (
        <section
          className={`relative overflow-hidden px-5 py-20 sm:py-28 ${
            sombre
              ? 'bg-slate-950 text-white'
              : 'bg-gradient-to-b from-sky-50 via-white to-white text-slate-900'
          }`}
        >
          {/* Halos de marque : très présents sur fond sombre, seulement suggérés
              sur fond clair : au-delà, ils grisent le blanc au lieu de l'animer. */}
          <div
            className={`absolute left-1/4 top-10 h-[420px] w-[420px] rounded-full blur-[130px] ${
              sombre ? 'bg-[#4169F6]/[0.14]' : 'bg-[#4169F6]/[0.10]'
            }`}
          />
          <div
            className={`absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full blur-[110px] ${
              sombre ? 'bg-violet-500/[0.10]' : 'bg-violet-400/[0.09]'
            }`}
          />
          {block.logoWatermark && (
            <div
              className="pointer-events-none absolute right-0 top-0 translate-x-[10%] -translate-y-[14%]"
              aria-hidden="true"
            >
              {/* La marque seule, pas le lockup complet : celui-ci porte le nom
                  et la signature, dont le filigrane produisait des mots
                  fantômes derrière l'accroche. Débordement volontaire à droite,
                  qui donne une texture de marque plutôt qu'une image posée.
                  Plus d'opacité sur fond clair, la marque y étant elle-même
                  claire.

                  Ancrée en HAUT plutôt que centrée verticalement : une accroche
                  qui porte une illustration devient très haute, et un filigrane
                  centré s'y retrouve à mi-section, à côté de l'image, où il
                  ressemble à une décoration égarée. Ancré en haut, il reste sur
                  la zone de l'accroche quelle que soit la hauteur du bloc.

                  Largeur en `vw` au-delà du mobile, et non en pixels fixes :
                  une taille fixe collée au bord droit fond à mesure que
                  l'écran s'élargit, au point de devenir un détail invisible
                  dans un coin sur un moniteur large. */}
              <Image
                src="/logo-mark.png"
                alt=""
                width={640}
                height={640}
                priority
                className={`w-[300px] max-w-none sm:w-[min(620px,34vw)] ${
                  sombre ? 'opacity-[0.12]' : 'opacity-[0.22]'
                }`}
              />
            </div>
          )}
          <div className="relative mx-auto max-w-3xl text-center">
            {block.eyebrow && (
              <div
                className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-sm ${
                  sombre
                    ? 'border border-white/10 bg-white/5 text-slate-200'
                    : 'border border-blue-100 bg-white/80 text-blue-700 shadow-sm'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {block.eyebrow}
              </div>
            )}
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {block.title}
            </h1>
            {block.subtitle && (
              <div
                className={`mt-5 space-y-3 text-lg leading-relaxed ${
                  sombre ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <Paragraphs text={block.subtitle} />
              </div>
            )}
            {deadline && (
              <div className="mt-8 flex justify-center">
                <Countdown deadline={deadline} />
              </div>
            )}
            {block.ctaLabel && (
              <div className="mt-9">
                <CtaButton
                  label={block.ctaLabel}
                  target={block.ctaTarget}
                  url={block.ctaUrl || undefined}
                  onCta={onCta}
                  fallbackToOptin={fallbackToOptin}
                />
              </div>
            )}
            {block.imageUrl && (
              <div
                className={`mt-12 overflow-hidden rounded-2xl shadow-2xl ${
                  sombre ? 'border border-white/10' : 'border border-slate-200/80 shadow-blue-500/10'
                }`}
              >
                <Image
                  src={block.imageUrl}
                  alt=""
                  width={1600}
                  height={900}
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )
    }

    case 'video': {
      const src = safeEmbedUrl(block.embedUrl)
      return (
        <Section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          {src ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
              <div className="relative aspect-video">
                <iframe
                  src={src}
                  title={block.title || 'Vidéo'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          ) : (
            // Une URL non reconnue n'est pas chargée : mieux vaut un vide
            // visible en préproduction qu'une iframe arbitraire en ligne.
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
              Vidéo non affichée : hébergeur non autorisé (Vimeo ou YouTube attendu).
            </p>
          )}
          {block.caption && (
            <p className="mt-3 text-center text-sm text-slate-500">{block.caption}</p>
          )}
        </Section>
      )
    }

    case 'benefits':
      return (
        <Section className="bg-slate-50">
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="grid gap-4 sm:grid-cols-2">
            {block.items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                {item.text && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.text}</p>}
              </div>
            ))}
          </div>
        </Section>
      )

    case 'testimonials':
      return (
        <Section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="space-y-4">
            {block.items.map((item, i) => (
              <figure key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Quote className="mb-3 h-6 w-6 text-blue-200" />
                <blockquote className="space-y-3 text-slate-700">
                  <Paragraphs text={item.quote} className="leading-relaxed" />
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{item.author}</span>
                  {item.role && <span className="text-slate-500"> · {item.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )

    case 'curriculum':
      return (
        <Section className="bg-slate-50">
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          {block.subtitle && (
            <p className="-mt-4 mb-8 text-center text-slate-600">{block.subtitle}</p>
          )}
          <div className="space-y-3">
            {block.modules.map((module, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-900">{module.title}</span>
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 pl-11">
                  {module.description && (
                    <p className="mb-3 text-sm leading-relaxed text-slate-600">{module.description}</p>
                  )}
                  {module.lessons.length > 0 && (
                    <ul className="space-y-1.5">
                      {module.lessons.map((lesson, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Section>
      )

    case 'pricing':
      return (
        <Section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          {block.subtitle && (
            <p className="-mt-4 mb-8 text-center text-slate-600">{block.subtitle}</p>
          )}
          <div className="mx-auto max-w-lg rounded-3xl border-2 border-blue-500 bg-white p-8 shadow-xl shadow-blue-500/10">
            <div className="text-center">
              {block.originalAmount != null && (
                <span className="mr-2 text-xl text-slate-400 line-through">
                  {formatAmount(block.originalAmount)}
                </span>
              )}
              {block.amount != null && (
                <span className="text-5xl font-bold tracking-tight text-slate-900">
                  {formatAmount(block.amount)}
                </span>
              )}
              {block.priceNote && <p className="mt-2 text-sm text-slate-500">{block.priceNote}</p>}
            </div>

            {block.features.length > 0 && (
              <ul className="mt-7 space-y-2.5">
                {block.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {deadline && (
              <div className="mt-7">
                <Countdown deadline={deadline} />
              </div>
            )}

            <div className="mt-7 text-center">
              <CtaButton
                label={block.ctaLabel || 'Je m’abonne'}
                target="checkout"
                onCta={onCta}
                fallbackToOptin={fallbackToOptin}
              />
            </div>
          </div>
        </Section>
      )

    case 'guarantee':
      return (
        <Section>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            {block.title && (
              <h3 className="text-xl font-bold text-emerald-900">{block.title}</h3>
            )}
            <div className="mt-2 space-y-2 leading-relaxed text-emerald-800">
              <Paragraphs text={block.text} />
            </div>
          </div>
        </Section>
      )

    case 'faq':
      return (
        <Section className="bg-slate-50">
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  {item.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-2 leading-relaxed text-slate-600">
                  <Paragraphs text={item.answer} />
                </div>
              </details>
            ))}
          </div>
        </Section>
      )

    case 'cta': {
      const sombreCta = block.variant === 'sombre'
      return (
        <Section
          className={
            sombreCta
              ? 'bg-slate-950 text-white'
              : 'bg-gradient-to-b from-white to-sky-50 text-slate-900'
          }
        >
          <div className="text-center">
            {block.title && (
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            )}
            {block.text && (
              <div
                className={`mt-4 space-y-3 text-lg ${
                  sombreCta ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <Paragraphs text={block.text} />
              </div>
            )}
            {deadline && (
              <div className="mt-8 flex justify-center">
                <Countdown deadline={deadline} />
              </div>
            )}
            <div className="mt-8">
              <CtaButton
                label={block.ctaLabel}
                target={block.ctaTarget}
                url={block.ctaUrl || undefined}
                onCta={onCta}
                fallbackToOptin={fallbackToOptin}
              />
            </div>
          </div>
        </Section>
      )
    }

    case 'optin':
      return (
        <Section className="scroll-mt-8">
          <div id={OPTIN_ANCHOR}>
            <OptinForm
              slug={slug}
              title={block.title}
              text={block.text || undefined}
              buttonLabel={block.buttonLabel || undefined}
              askName={block.askName}
              consentText={block.consentText || undefined}
              successMessage={block.successMessage || undefined}
              utm={utm}
              visitorId={visitorId}
              onOptin={onOptin}
            />
          </div>
        </Section>
      )

    case 'image': {
      // Emplacement encore vide : on ne rend rien plutôt qu'un cadre creux.
      if (!block.imageUrl) return null

      // `next/image` non contraint en dimensions : on laisse la hauteur suivre
      // le ratio réel plutôt que d'imposer un cadre qui rognerait la photo.
      const photo = (
        <figure className={block.full ? '' : 'mx-auto max-w-3xl'}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={block.imageUrl}
              alt={block.alt || ''}
              width={1600}
              height={900}
              sizes={block.full ? '100vw' : '(max-width: 768px) 100vw, 768px'}
              className="h-auto w-full object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-slate-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

      // En pleine largeur, l'image sort de la colonne de lecture : on ne la
      // met donc pas dans `Section`, qui la contraindrait à `max-w-3xl`.
      return block.full ? (
        <section className="px-0 py-14 sm:py-20">{photo}</section>
      ) : (
        <Section>{photo}</Section>
      )
    }

    case 'text':
      return (
        <Section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="space-y-4 leading-relaxed text-slate-700">
            <Paragraphs text={block.body} />
          </div>
        </Section>
      )

    default:
      return null
  }
}
