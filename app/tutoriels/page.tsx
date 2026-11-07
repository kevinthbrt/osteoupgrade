import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PlayCircle } from 'lucide-react'
import PublicFooter from '@/components/PublicFooter'
import TutorialHeader from '@/components/tutorials/TutorialHeader'
import { TUTORIALS } from '@/lib/tutorials'

export const metadata: Metadata = {
  title: 'Tutoriels MyOsteoflow | OsteoUpgrade & MyOsteoflow',
  description: 'Les nouveautés de MyOsteoflow en vidéo et pas à pas : exercices et appli patient, agenda Doctolib, tableau de bord, onglets, consultation.',
}

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TutorialHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Tutoriels</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Les nouveautés de MyOsteoflow, pas à pas</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Une courte vidéo par fonctionnalité, puis chaque étape en capture, avec les réponses aux questions fréquentes.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((tutorial) => (
            <Link
              key={tutorial.slug}
              href={`/tutoriels/${tutorial.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="relative">
                <Image src={`/tutoriels/videos/${tutorial.slug}.webp`} alt="" width={1280} height={800} className="h-auto w-full" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition group-hover:bg-blue-700">
                  <PlayCircle className="h-4 w-4" />
                  Voir la vidéo · {tutorial.duration}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <span className="text-sm font-bold text-blue-600">{tutorial.kicker}</span>
                <h2 className="text-xl font-bold leading-snug">{tutorial.title}</h2>
                <p className="text-slate-600 leading-relaxed">{tutorial.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
