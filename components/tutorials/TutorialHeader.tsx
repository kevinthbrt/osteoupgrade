import Link from 'next/link'

/** En-tête simple des pages tutoriels : marque et retour à la liste. */
export default function TutorialHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
          <span>
            Osteo<span className="text-sky-500">Upgrade</span>
          </span>
          <span className="font-normal text-slate-900">×</span>
          <span className="font-display italic flow-text font-bold">MyOsteoflow</span>
        </Link>
        <Link href="/tutoriels" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Tous les tutoriels
        </Link>
      </div>
    </header>
  )
}
