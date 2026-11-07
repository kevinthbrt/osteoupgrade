import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import PublicFooter from '@/components/PublicFooter'
import TutorialHeader from '@/components/tutorials/TutorialHeader'
import { TUTORIALS, getTutorial } from '@/lib/tutorials'

export function generateStaticParams() {
  return TUTORIALS.map((tutorial) => ({ slug: tutorial.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tutorial = getTutorial(params.slug)
  if (!tutorial) return {}
  return {
    title: `${tutorial.title} | Tutoriel MyOsteoflow`,
    description: tutorial.summary,
  }
}

export default function TutorialPage({ params }: { params: { slug: string } }) {
  const tutorial = getTutorial(params.slug)
  if (!tutorial) notFound()
  const others = TUTORIALS.filter((other) => other.slug !== tutorial.slug)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TutorialHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <Link href="/tutoriels" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Tous les tutoriels
        </Link>

        <p className="mt-8 text-sm font-bold uppercase tracking-wider text-blue-600">{tutorial.kicker}</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{tutorial.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{tutorial.intro}</p>

        <div className="mt-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 flex-none" />
          <p>{tutorial.availability}</p>
        </div>

        <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-2xl shadow-slate-900/15">
          <video
            src={`/tutoriels/videos/${tutorial.slug}.mp4`}
            poster={`/tutoriels/videos/${tutorial.slug}.webp`}
            controls
            playsInline
            preload="metadata"
            className="block aspect-[16/10] w-full"
            aria-label={`Vidéo : ${tutorial.title}`}
          />
        </figure>
        <p className="mt-2 text-sm text-slate-500">Vidéo de {tutorial.duration}, sans son. Démonstration avec un cabinet et des patients fictifs.</p>

        <h2 className="mt-14 text-2xl font-extrabold tracking-tight">Pas à pas</h2>
        <ol className="mt-6 flex flex-col gap-12">
          {tutorial.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-slate-600">{step.text}</p>
                </div>
              </div>
              <Image
                src={`/tutoriels/${tutorial.slug}/etape-${index + 1}.webp`}
                alt={`Étape ${index + 1} : ${step.title}`}
                width={1280}
                height={800}
                className="h-auto w-full rounded-xl border border-slate-200 shadow-lg shadow-slate-900/10"
              />
            </li>
          ))}
        </ol>

        {tutorial.faq.length > 0 && (
          <>
            <h2 className="mt-16 text-2xl font-extrabold tracking-tight">Questions fréquentes</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {tutorial.faq.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-slate-400 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-16 text-2xl font-extrabold tracking-tight">Les autres nouveautés</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {others.map((other) => (
            <Link
              key={other.slug}
              href={`/tutoriels/${other.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <Image src={`/tutoriels/videos/${other.slug}.webp`} alt="" width={160} height={100} className="h-16 w-24 flex-none rounded-lg object-cover" />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-blue-600">{other.kicker}</span>
                <span className="block font-semibold leading-snug">{other.title}</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 flex-none text-slate-400 transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
