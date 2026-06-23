import PublicFooter from '@/components/PublicFooter'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Mentions légales</h1>
          <p className="text-slate-600">
            Dernière mise à jour : <strong>23 juin 2026</strong>
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Éditeur du site</h2>
          <p className="text-slate-700">
            <strong>OsteoUpgrade</strong>
            <br />
            SAS
            <br />
            57 bis route nationale, résidence coté parc, bât A, 06440 Blausasc
            <br />
            SIRET : [en cours d&apos;immatriculation]
            <br />
            Téléphone : 06 63 24 42 80
            <br />
            Contact : <a className="text-sky-600 underline" href="mailto:contact@osteo-upgrade.fr">contact@osteo-upgrade.fr</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Directeur de la publication</h2>
          <p className="text-slate-700">
            Kevin Thubert et Gerald Stoppini, co-gérants de la SAS OsteoUpgrade.
          </p>
          <p className="text-sm text-slate-500">
            Le directeur de la publication est la personne physique ou morale qui a la responsabilité éditoriale du site internet, c&apos;est-à-dire qui décide des contenus publiés et en assume la responsabilité légale.
          </p>
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
            L&apos;ensemble des contenus (textes, images, vidéos, logos) est protégé par le droit d&apos;auteur.
            Toute reproduction est interdite sans autorisation préalable.
          </p>
        </section>
      </div>
      </div>
      <PublicFooter />
    </div>
  )
}
