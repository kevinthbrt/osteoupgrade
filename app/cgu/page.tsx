import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation | OsteoUpgrade',
  description: 'Conditions Générales d\'Utilisation et de Vente de la plateforme OsteoUpgrade'
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation et de Vente
          </h1>

          <p className="text-gray-600 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-blue max-w-none space-y-8">
            {/* Article 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 1 - Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU/CGV ») régissent
                l'accès et l'utilisation de la plateforme OsteoUpgrade (ci-après « la Plateforme ») accessible
                à l'adresse [votre-domaine.com], ainsi que la souscription aux offres d'abonnement Premium proposées.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU/CGV.
              </p>
            </section>

            {/* Article 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 2 - Éditeur</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <p className="text-gray-700 font-medium mb-2">OsteoUpgrade</p>
                <p className="text-gray-600 text-sm">
                  [Forme juridique : SARL, SAS, etc.]<br />
                  Capital social : [montant]<br />
                  Siège social : [adresse complète]<br />
                  RCS : [ville] [numéro]<br />
                  SIRET : [numéro]<br />
                  TVA intracommunautaire : [numéro]<br />
                  Email : contact@[votre-domaine].com<br />
                  Directeur de publication : [Nom Prénom]<br />
                  Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
                </p>
              </div>
            </section>

            {/* Article 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 3 - Définitions</h2>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Utilisateur :</strong> Toute personne accédant à la Plateforme</li>
                <li><strong>Abonné :</strong> Utilisateur ayant souscrit à une offre Premium</li>
                <li><strong>Compte Gratuit :</strong> Accès limité aux fonctionnalités de base</li>
                <li><strong>Abonnement Premium :</strong> Accès complet aux fonctionnalités (Silver ou Gold)</li>
                <li><strong>Période d'Engagement :</strong> Durée minimale de 12 mois consécutifs</li>
              </ul>
            </section>

            {/* Article 4 - Accès à la Plateforme */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 4 - Accès à la Plateforme</h2>
              <p className="text-gray-700 leading-relaxed">
                L'accès à la Plateforme nécessite la création d'un compte utilisateur. L'Utilisateur s'engage
                à fournir des informations exactes et à maintenir ces informations à jour.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et
                de toutes les activités effectuées sous son compte.
              </p>
            </section>

            {/* Article 5 - Offres d'abonnement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 5 - Offres d'Abonnement</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 - Offres disponibles</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-bold text-lg text-blue-600 mb-2">Premium Silver</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">29,99€<span className="text-base text-gray-600">/mois</span></p>
                  <p className="text-sm text-gray-600">Soit 359,88€ sur 12 mois</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    <li>✓ Accès à tous les modules</li>
                    <li>✓ Tests et exercices avancés</li>
                    <li>✓ Suivi de progression</li>
                  </ul>
                </div>
                <div className="border border-amber-200 rounded-lg p-6 bg-amber-50">
                  <h4 className="font-bold text-lg text-amber-600 mb-2">Premium Gold</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">49,99€<span className="text-base text-gray-600">/mois</span></p>
                  <p className="text-sm text-gray-600">Soit 599,88€ sur 12 mois</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    <li>✓ Tous les avantages Silver</li>
                    <li>✓ Contenu exclusif avancé</li>
                    <li>✓ Support prioritaire</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 - Engagement et Facturation</h3>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mb-4">
                <p className="font-bold text-amber-900 mb-2">⚠️ Engagement de 12 mois</p>
                <p className="text-gray-700 leading-relaxed">
                  Tous les abonnements Premium sont soumis à un <strong>engagement minimum de 12 mois consécutifs</strong>.
                  La facturation s'effectue mensuellement par prélèvement automatique.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed">
                Le premier paiement est effectué lors de la souscription, puis automatiquement chaque mois
                à la même date. Les tarifs incluent la TVA applicable au taux en vigueur.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 - Durée de l'Engagement</h3>
              <p className="text-gray-700 leading-relaxed">
                L'abonnement débute à la date de validation du paiement initial et s'étend sur une période
                minimale de 12 mois. Durant cette période :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>L'Abonné ne peut pas résilier son abonnement avant la fin de la période d'engagement</li>
                <li>En cas de résiliation anticipée demandée, l'accès Premium sera maintenu jusqu'à la fin de la période d'engagement</li>
                <li>Aucun remboursement ne sera effectué pour les mois déjà facturés</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 - Renouvellement</h3>
              <p className="text-gray-700 leading-relaxed">
                À l'issue de la période d'engagement initiale de 12 mois, l'abonnement se renouvelle
                automatiquement pour une nouvelle période de 12 mois, aux mêmes conditions tarifaires
                (sous réserve d'une éventuelle révision des tarifs notifiée au moins 30 jours à l'avance).
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>L'Abonné est informé par email 7 jours avant la fin de chaque période d'engagement</strong>,
                lui permettant de résilier son abonnement s'il ne souhaite pas le renouveler.
              </p>
            </section>

            {/* Article 6 - Résiliation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 6 - Résiliation</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 - Résiliation à l'initiative de l'Abonné</h3>
              <p className="text-gray-700 leading-relaxed">
                L'Abonné peut résilier son abonnement uniquement <strong>après la période d'engagement de 12 mois</strong>,
                via son espace client, en cliquant sur « Gérer mon abonnement » puis « Annuler l'abonnement ».
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La résiliation prend effet à la date de fin du cycle d'engagement en cours. L'Abonné conserve
                son accès Premium jusqu'à cette date et continue d'être facturé mensuellement jusqu'à la fin de
                la période.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 - Résiliation à l'initiative d'OsteoUpgrade</h3>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de suspendre ou résilier l'accès d'un Utilisateur en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>Violation des présentes CGU/CGV</li>
                <li>Défaut de paiement</li>
                <li>Utilisation frauduleuse ou abusive de la Plateforme</li>
                <li>Comportement nuisible envers d'autres utilisateurs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 - Échec de Paiement</h3>
              <p className="text-gray-700 leading-relaxed">
                En cas d'échec de paiement mensuel, l'Abonné dispose d'un délai de 7 jours pour régulariser
                sa situation. Passé ce délai, l'accès Premium sera suspendu. L'engagement de 12 mois reste
                cependant en vigueur et les sommes dues restent exigibles.
              </p>
            </section>

            {/* Article 7 - Droit de rétractation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 7 - Droit de Rétractation</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l'article L221-18 du Code de la consommation, l'Abonné dispose d'un délai de
                rétractation de 14 jours à compter de la souscription pour annuler son abonnement sans avoir
                à justifier de motifs ni à payer de pénalités.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour exercer ce droit, l'Abonné doit notifier sa décision par email à contact@[votre-domaine].com
                ou via son espace client. Le remboursement sera effectué dans un délai de 14 jours suivant la
                notification de rétractation.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Important :</strong> En acceptant de bénéficier immédiatement de l'accès Premium dès
                  la souscription, l'Abonné reconnaît et accepte expressément que l'exécution du service commence
                  avant la fin du délai de rétractation de 14 jours.
                </p>
              </div>
            </section>

            {/* Article 8 - Prix et Paiement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 8 - Prix et Paiement</h2>
              <p className="text-gray-700 leading-relaxed">
                Les prix sont indiqués en euros (€) toutes taxes comprises (TTC). OsteoUpgrade se réserve le
                droit de modifier ses tarifs à tout moment, sous réserve d'en informer l'Abonné au moins 30 jours
                avant l'entrée en vigueur des nouveaux tarifs.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Les paiements s'effectuent par carte bancaire via la plateforme sécurisée Stripe. Les données
                de paiement ne sont pas conservées par OsteoUpgrade.
              </p>
            </section>

            {/* Article 9 - Propriété intellectuelle */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 9 - Propriété Intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                L'ensemble des contenus présents sur la Plateforme (textes, images, vidéos, graphismes, logos,
                etc.) sont protégés par le droit d'auteur et appartiennent exclusivement à OsteoUpgrade ou à
                ses partenaires.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Toute reproduction, représentation, modification ou exploitation sans autorisation expresse est
                strictement interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et
                suivants du Code de la propriété intellectuelle.
              </p>
            </section>

            {/* Article 10 - Données personnelles */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 10 - Protection des Données Personnelles</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade s'engage à protéger les données personnelles de ses utilisateurs conformément au
                Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour plus d'informations sur le traitement de vos données, consultez notre
                <a href="/politique-confidentialite" className="text-blue-600 hover:underline"> Politique de Confidentialité</a>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant
                vos données personnelles, que vous pouvez exercer en contactant : privacy@[votre-domaine].com
              </p>
            </section>

            {/* Article 11 - Responsabilité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 11 - Limitation de Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade met tout en œuvre pour assurer l'accès à la Plateforme 24h/24 et 7j/7, sous réserve
                des opérations de maintenance et des cas de force majeure.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                OsteoUpgrade ne saurait être tenu responsable des dommages directs ou indirects résultant de
                l'utilisation ou de l'impossibilité d'utiliser la Plateforme, notamment en cas d'interruption
                de service, de perte de données ou de préjudice commercial.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Avertissement :</strong> Les contenus proposés sur la Plateforme ont une vocation
                  pédagogique et ne sauraient se substituer à une formation professionnelle complète ou à un
                  diagnostic médical.
                </p>
              </div>
            </section>

            {/* Article 12 - Force majeure */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 12 - Force Majeure</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade ne pourra être tenu responsable de l'inexécution de ses obligations en cas de
                survenance d'un événement de force majeure tel que défini par la jurisprudence française
                (catastrophe naturelle, guerre, émeute, grève, panne informatique majeure, etc.).
              </p>
            </section>

            {/* Article 13 - Modifications des CGU */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 13 - Modifications des CGU/CGV</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de modifier les présentes CGU/CGV à tout moment. Les
                modifications entreront en vigueur dès leur mise en ligne. Les Utilisateurs seront informés
                par email des modifications substantielles au moins 15 jours avant leur entrée en vigueur.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La poursuite de l'utilisation de la Plateforme après modification des CGU/CGV vaut acceptation
                des nouvelles conditions.
              </p>
            </section>

            {/* Article 14 - Médiation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 14 - Médiation et Règlement des Litiges</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l'article L.612-1 du Code de la consommation, en cas de litige, l'Abonné peut
                recourir gratuitement à un médiateur de la consommation :
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Médiateur de la consommation :</strong><br />
                  [Nom du médiateur]<br />
                  [Adresse]<br />
                  Site web : [URL]
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                En cas d'échec de la médiation, le litige pourra être porté devant les tribunaux compétents.
              </p>
            </section>

            {/* Article 15 - Loi applicable */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 15 - Loi Applicable et Juridiction</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes CGU/CGV sont régies par le droit français. En cas de litige et à défaut de
                règlement amiable ou de médiation, les tribunaux français seront seuls compétents.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t-2 border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant les présentes CGU/CGV, vous pouvez nous contacter :
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li>📧 Email : contact@[votre-domaine].com</li>
                <li>📞 Téléphone : [numéro]</li>
                <li>📍 Adresse : [adresse complète]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
