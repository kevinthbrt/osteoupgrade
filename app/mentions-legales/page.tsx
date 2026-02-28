import PublicFooter from '@/components/PublicFooter'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Mentions légales</h1>
          <p className="text-slate-600">
            Dernière mise à jour : <strong>28 février 2026</strong>
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Éditeur du site</h2>
          <p className="text-slate-700">
            <strong>OsteoUpgrade</strong>
            <br />
            [Raison sociale]
            <br />
            [Adresse complète]
            <br />
            [SIRET]
            <br />
            Contact : <a className="text-sky-600 underline" href="mailto:contact@osteo-upgrade.fr">contact@osteo-upgrade.fr</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Directeur de la publication</h2>
          <p className="text-slate-700">[Nom du directeur de publication]</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Hébergement</h2>
          <p className="text-slate-700">
            Vercel Inc.
            <br />
            440 N Barranca Ave #4133, Covina, CA 91723, USA
            <br />
            Site : <a className="text-sky-600 underline" href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Propriété intellectuelle</h2>
          <p className="text-slate-700">
            L’ensemble des contenus (textes, images, vidéos, logos) est protégé par le droit d’auteur.
            Toute reproduction est interdite sans autorisation préalable.
          </p>
        </section>
      </div>
      </div>
      <PublicFooter />
    </div>
  )
}
