import { Metadata } from 'next'
import PublicFooter from '@/components/PublicFooter'

/**
 * Politique de confidentialité de l'extension navigateur « Osteoflow : import
 * Doctolib ». Page publique : son adresse est exigée par le Chrome Web Store.
 * Le texte source est tenu à jour dans le dépôt Osteoflow
 * (doctolib-extension/PRIVACY.md) : les deux doivent rester identiques.
 */
export const metadata: Metadata = {
  title: 'Confidentialité de l’extension Osteoflow : import Doctolib | OsteoUpgrade & MyOsteoflow',
  description:
    'Données traitées par l’extension navigateur « Osteoflow : import Doctolib » : uniquement sur le poste du praticien, sans serveur intermédiaire.',
}

export default function PolitiqueConfidentialiteExtensionDoctolibPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-10">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">
              Politique de confidentialité de l’extension « Osteoflow : import Doctolib »
            </h1>
            <p className="text-slate-600">
              Dernière mise à jour : <strong>4 novembre 2026</strong>
            </p>
            <p className="text-slate-700">
              Cette extension pour Chrome et Edge est éditée par SAS OsteoUpgrade, éditeur du logiciel MyOsteoflow.
              Elle est indépendante de Doctolib : elle n’est ni affiliée à Doctolib, ni approuvée par Doctolib.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">1. À quoi sert l’extension</h2>
            <p className="text-slate-700">
              Elle permet à un praticien qui utilise Doctolib Pro et MyOsteoflow de copier les rendez-vous d’un jour
              de son agenda Doctolib vers « Ma journée » de MyOsteoflow, installé sur son propre ordinateur. C’est sa
              seule fonction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">2. Données traitées</h2>
            <p className="text-slate-700">
              Quand le praticien clique sur « Envoyer les rendez-vous », et seulement à ce moment, l’extension lit
              dans son agenda Doctolib Pro, avec sa session déjà ouverte, les rendez-vous du jour qu’il a choisi.
              Elle conserve uniquement :
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>l’identifiant, le type, le statut, l’heure de début et de fin du rendez-vous ;</li>
              <li>
                le prénom, le nom, le nom de naissance, la date de naissance, le sexe, le téléphone et l’adresse email
                du patient.
              </li>
            </ul>
            <p className="text-slate-700">
              Les notes du rendez-vous, l’adresse postale du patient et toute autre information de l’agenda ne sont
              pas reprises.
            </p>
            <p className="text-slate-700">
              Ces informations peuvent constituer des données de santé : elles révèlent qu’une personne consulte un
              professionnel de santé.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">3. Où vont les données</h2>
            <p className="text-slate-700">
              Les données vont <strong>directement de l’onglet Doctolib du praticien à MyOsteoflow, sur le même
              ordinateur</strong> (adresse <code className="rounded bg-slate-100 px-1">localhost</code>). Elles ne
              transitent par aucun serveur de l’éditeur ni d’un tiers. L’éditeur n’y a pas accès.
            </p>
            <p className="text-slate-700">
              Dans MyOsteoflow, elles sont enregistrées dans la base de données locale du praticien, en attente de sa
              validation. Rien n’est ajouté sans son accord.
            </p>
            <p className="text-slate-700">
              L’extension garde seulement dans le navigateur, sur l’ordinateur du praticien, ses réglages : le code
              d’appairage avec MyOsteoflow et, s’il est renseigné, l’identifiant de l’agenda Doctolib.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">4. Ce que l’extension ne fait pas</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Elle ne vend, ne loue et ne partage aucune donnée.</li>
              <li>Elle n’utilise aucun outil de mesure d’audience, de publicité ou de suivi.</li>
              <li>
                Elle ne lit rien en dehors de <code className="rounded bg-slate-100 px-1">pro.doctolib.fr</code>, et
                rien sans clic du praticien.
              </li>
              <li>Elle ne connaît ni l’identifiant ni le mot de passe Doctolib.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">5. Responsabilités</h2>
            <p className="text-slate-700">
              Pour les données de ses patients, le praticien reste responsable du traitement au sens du RGPD.
              L’extension est un outil qu’il utilise sur son propre poste, pour la gestion de ses rendez-vous.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">6. Désinstallation</h2>
            <p className="text-slate-700">
              La suppression de l’extension depuis la page des extensions du navigateur efface ses réglages. Les
              rendez-vous déjà importés restent dans MyOsteoflow, où le praticien peut les supprimer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">7. Contact</h2>
            <p className="text-slate-700">
              <strong>SAS OsteoUpgrade</strong>
              <br />
              57 bis route nationale, résidence coté parc, bât A, 06440 Blausasc
              <br />
              Contact :{' '}
              <a className="text-sky-600 underline" href="mailto:contact@osteo-upgrade.fr">
                contact@osteo-upgrade.fr
              </a>
              <br />
              Données personnelles :{' '}
              <a className="text-sky-600 underline" href="mailto:privacy@osteo-upgrade.fr">
                privacy@osteo-upgrade.fr
              </a>
            </p>
            <p className="text-slate-700">
              Pour le reste des services OsteoUpgrade et MyOsteoflow, voir la{' '}
              <a className="text-sky-600 underline" href="/politique-confidentialite">
                politique de confidentialité générale
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
