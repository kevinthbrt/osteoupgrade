export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
          <p className="text-slate-600">
            Dernière mise à jour : <strong>[À compléter]</strong>
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">1. Responsable du traitement</h2>
          <p className="text-slate-700">
            <strong>OsteoUpgrade</strong> — [Raison sociale], [Adresse], [SIRET].
            <br />
            Contact : <a className="text-sky-600 underline" href="mailto:privacy@osteo-upgrade.fr">privacy@osteo-upgrade.fr</a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">2. Données collectées</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Identité : nom, prénom, email.</li>
            <li>Données de compte : rôle, statut d’abonnement, historique de connexion.</li>
            <li>Données de facturation : identifiants Stripe (sans données de carte).</li>
            <li>Données d’usage : progression, quiz, activités.</li>
            <li>Support : échanges email et fichiers transmis.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">3. Finalités & bases légales</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Création et gestion du compte (exécution du contrat).</li>
            <li>Accès aux contenus et fonctionnalités (exécution du contrat).</li>
            <li>Facturation & paiements (obligation légale / contrat).</li>
            <li>Support client (intérêt légitime).</li>
            <li>Amélioration produit & sécurité (intérêt légitime).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">4. Durées de conservation</h2>
          <p className="text-slate-700">
            Les données sont conservées pendant la durée de la relation contractuelle,
            puis archivées conformément aux obligations légales (facturation, comptabilité).
            Les logs techniques sont conservés pour une durée maximale de <strong>[À compléter]</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">5. Sous-traitants</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Hébergement : Vercel (UE/US).</li>
            <li>Base de données & Auth : Supabase (UE).</li>
            <li>Paiement : Stripe.</li>
            <li>Email : Resend.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">6. Droits des personnes</h2>
          <p className="text-slate-700">
            Vous disposez d’un droit d’accès, rectification, suppression, opposition,
            limitation et portabilité. Pour exercer vos droits :
            <a className="text-sky-600 underline ml-1" href="mailto:privacy@osteo-upgrade.fr">
              privacy@osteo-upgrade.fr
            </a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">7. Cookies</h2>
          <p className="text-slate-700">
            Les cookies nécessaires au fonctionnement sont déposés. Les cookies d’analyse,
            si activés, nécessitent un consentement préalable via le bandeau de cookies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">8. Sécurité</h2>
          <p className="text-slate-700">
            Des mesures techniques et organisationnelles sont mises en œuvre pour protéger
            vos données (contrôle d’accès, chiffrement en transit, journalisation).
          </p>
        </section>
      </div>
    </div>
  )
}
