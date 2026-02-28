import { Metadata } from 'next'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation | OsteoUpgrade',
  description: 'Conditions Générales d\'Utilisation et de Vente de la plateforme OsteoUpgrade'
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation et de Vente
          </h1>

          <p className="text-gray-600 mb-8">
            Dernière mise à jour : 28 février 2026
          </p>

          <div className="prose prose-blue max-w-none space-y-8">
            {/* Article 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 1 - Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU/CGV ») régissent
                l'accès et l'utilisation de la plateforme OsteoUpgrade (ci-après « la Plateforme ») accessible
                à l'adresse osteo-upgrade.fr, ainsi que la souscription aux offres d'abonnement Premium proposées.
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
                  Email : contact@osteo-upgrade.fr<br />
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
                <li><strong>Compte Gratuit :</strong> Accès limité au module épaule uniquement</li>
                <li><strong>Abonnement Premium Silver :</strong> Accès complet à la plateforme numérique, disponible en formule mensuelle (29 €/mois) ou annuelle (240 €/an)</li>
                <li><strong>Abonnement Premium Gold :</strong> Accès complet à la plateforme numérique avec avantages exclusifs (499 €/an)</li>
                <li><strong>Période de facturation :</strong> Durée correspondant à l'intervalle entre deux prélèvements automatiques (mensuel ou annuel selon l'offre choisie)</li>
                <li><strong>Programme Ambassadeur :</strong> Dispositif de parrainage réservé aux abonnés Gold permettant d'obtenir un crédit sur la plateforme</li>
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
              <div className="space-y-4 mb-6">

                {/* Free */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h4 className="font-bold text-lg text-gray-700 mb-1">Compte Gratuit</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-2">0 €</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    <li>✓ Module épaule complet</li>
                  </ul>
                </div>

                {/* Silver */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h4 className="font-bold text-lg text-blue-600 mb-1">Premium Silver</h4>
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">29 €<span className="text-base text-gray-600 font-normal">/mois</span></p>
                      <p className="text-sm text-gray-500">Formule mensuelle</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">240 €<span className="text-base text-gray-600 font-normal">/an</span></p>
                      <p className="text-sm text-gray-500">Formule annuelle — soit 20 €/mois (2 mois offerts, −17 %)</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    <li>✓ Tests orthopédiques complets + export PDF</li>
                    <li>✓ E-learning actualisé en continu</li>
                    <li>✓ Module pratique (techniques articulaires & mobilisations)</li>
                    <li>✓ Créateur de fiches d'exercices (export PDF)</li>
                    <li>✓ Topographies des pathologies</li>
                    <li>✓ Toutes les régions anatomiques</li>
                    <li>✓ Bibliothèque complète de tests diagnostiques</li>
                    <li>✓ Quiz complet</li>
                    <li>✓ Revue de littérature</li>
                  </ul>
                </div>

                {/* Gold */}
                <div className="border border-amber-200 rounded-lg p-5 bg-amber-50">
                  <h4 className="font-bold text-lg text-amber-600 mb-1">Premium Gold <span className="text-sm font-normal text-amber-700 ml-1">— Populaire</span></h4>
                  <p className="text-2xl font-bold text-gray-900 mb-1">499 €<span className="text-base text-gray-600 font-normal">/an</span></p>
                  <p className="text-sm text-gray-500 mb-2">soit 41,58 €/mois — Formule annuelle uniquement</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    <li>✓ Tout le contenu Silver</li>
                    <li>✓ Séminaire présentiel annuel (2 jours)</li>
                    <li>✓ Masterclasses exclusives</li>
                    <li>✓ Programme Ambassadeur (10 % de commission en crédit plateforme)</li>
                    <li>✓ Accès prioritaire aux nouveautés</li>
                    <li>✓ Support premium dédié</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-gray-600 italic">
                Les prix s'entendent en euros toutes taxes comprises (TTC). Aucune TVA n'est actuellement applicable
                (régime de franchise en base de TVA, sous réserve de modification).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 - Renouvellement automatique</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-4">
                <p className="font-bold text-blue-900 mb-2">✅ Sans engagement — résiliable à tout moment</p>
                <p className="text-gray-700 leading-relaxed">
                  Les abonnements OsteoUpgrade ne comportent <strong>aucun engagement de durée minimale</strong>.
                  Ils se renouvellent automatiquement à l'issue de chaque période de facturation (mensuelle ou annuelle)
                  et peuvent être résiliés à tout moment avant la prochaine date de renouvellement.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed">
                Le premier prélèvement intervient à la date de souscription. Les prélèvements suivants ont lieu :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li><strong>Silver mensuel :</strong> chaque mois, à la même date que la souscription initiale</li>
                <li><strong>Silver annuel :</strong> chaque année, à la même date que la souscription initiale</li>
                <li><strong>Gold annuel :</strong> chaque année, à la même date que la souscription initiale</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>L'Abonné est notifié par email 7 jours avant chaque renouvellement</strong>, lui permettant
                de résilier son abonnement s'il ne souhaite pas être débité pour la période suivante.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 - Modification des tarifs</h3>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de modifier ses tarifs à tout moment. Toute modification tarifaire
                sera notifiée à l'Abonné par email <strong>au moins 30 jours avant son entrée en vigueur</strong>.
                L'Abonné pourra résilier son abonnement sans frais avant l'application du nouveau tarif.
                À défaut de résiliation, la poursuite de l'abonnement vaut acceptation du nouveau tarif.
              </p>
            </section>

            {/* Article 6 - Résiliation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 6 - Résiliation</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 - Résiliation à l'initiative de l'Abonné</h3>
              <p className="text-gray-700 leading-relaxed">
                L'Abonné peut résilier son abonnement <strong>à tout moment</strong> sans frais ni pénalité,
                directement depuis son espace client en cliquant sur « Gérer mon abonnement » puis « Annuler l'abonnement ».
                La résiliation peut également être demandée par email à contact@osteo-upgrade.fr.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La résiliation prend effet à la date de fin de la période de facturation en cours :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li><strong>Silver mensuel :</strong> l'accès Premium reste actif jusqu'à la fin du mois payé en cours ; aucun nouveau prélèvement n'est effectué</li>
                <li><strong>Silver ou Gold annuel :</strong> l'accès Premium reste actif jusqu'à la fin de l'année payée en cours ; aucun renouvellement n'est effectué ; <strong>aucun remboursement au prorata</strong> n'est réalisé pour les mois non consommés de la période annuelle en cours</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 - Résiliation à l'initiative d'OsteoUpgrade</h3>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de suspendre ou résilier l'accès d'un Utilisateur en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>Violation des présentes CGU/CGV</li>
                <li>Défaut de paiement non régularisé</li>
                <li>Utilisation frauduleuse ou abusive de la Plateforme</li>
                <li>Comportement nuisible envers d'autres utilisateurs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 - Échec de paiement</h3>
              <p className="text-gray-700 leading-relaxed">
                En cas d'échec de prélèvement automatique, l'Abonné est informé par email et dispose d'un délai
                de 7 jours pour régulariser sa situation. Passé ce délai, l'accès Premium sera suspendu jusqu'au
                paiement effectif ou jusqu'à la résiliation du compte.
              </p>
            </section>

            {/* Article 7 - Droit de rétractation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 7 - Droit de Rétractation</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l'article L.221-18 du Code de la consommation, l'Abonné dispose d'un délai de
                rétractation de <strong>14 jours</strong> à compter de la souscription pour annuler son abonnement sans avoir
                à justifier de motifs ni à payer de pénalités.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour exercer ce droit, l'Abonné doit notifier sa décision par email à contact@osteo-upgrade.fr
                ou via son espace client. Le remboursement sera effectué dans un délai de 14 jours suivant la
                notification de rétractation.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Important :</strong> En acceptant de bénéficier immédiatement de l'accès Premium dès
                  la souscription, l'Abonné reconnaît et accepte expressément que l'exécution du service commence
                  avant la fin du délai de rétractation de 14 jours. En cas de rétractation après le début d'utilisation
                  du service, un remboursement partiel calculé au prorata des jours effectivement consommés pourra
                  être appliqué conformément à l'article L.221-25 du Code de la consommation.
                </p>
              </div>
            </section>

            {/* Article 8 - Prix et Paiement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 8 - Prix et Paiement</h2>
              <p className="text-gray-700 leading-relaxed">
                Les prix sont indiqués en euros (€). Les paiements s'effectuent par carte bancaire via la
                plateforme sécurisée Stripe. Les données de paiement sont gérées directement par Stripe et
                ne sont pas conservées par OsteoUpgrade.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                En cas de litige lié à un paiement, l'Abonné peut contacter OsteoUpgrade à contact@osteo-upgrade.fr
                ou ouvrir un ticket d'assistance depuis son espace client.
              </p>
            </section>

            {/* Article 9 - Programme Ambassadeur */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 9 - Programme Ambassadeur</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.1 - Accès et éligibilité</h3>
              <p className="text-gray-700 leading-relaxed">
                Le Programme Ambassadeur est réservé exclusivement aux abonnés ayant souscrit à l'offre
                <strong> Premium Gold</strong> en cours de validité. Il permet à l'Abonné Gold de parrainer
                de nouveaux utilisateurs et d'obtenir en contrepartie un crédit sur la plateforme OsteoUpgrade.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.2 - Fonctionnement</h3>
              <p className="text-gray-700 leading-relaxed">
                Chaque Abonné Gold dispose d'un lien de parrainage personnel. Lorsqu'un nouveau client souscrit
                un abonnement annuel OsteoUpgrade (Silver annuel ou Gold) en utilisant ce lien, l'Abonné parrain
                accumule une commission équivalente à <strong>10 % du montant de la première année</strong> d'abonnement
                du filleul.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>La commission est cumulée dans le solde ambassadeur du parrain, visible depuis son espace client</li>
                <li>Dès que le solde cumulé atteint <strong>50 € minimum</strong>, le parrain peut demander un virement bancaire</li>
                <li>Le virement est effectué sur le compte bancaire renseigné par le parrain dans son espace client</li>
                <li>La commission est attribuée une seule fois par filleul, sur la première année d'abonnement uniquement</li>
                <li>La commission est accordée dès lors que le paiement du filleul est confirmé et non contesté</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.3 - Conditions et restrictions</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>L'Abonné ne peut pas se parrainer lui-même</li>
                <li>Le virement n'est possible qu'à partir de <strong>50 € cumulés</strong> dans le solde ambassadeur</li>
                <li>Le solde ambassadeur non réclamé à la résiliation du compte Gold est définitivement perdu</li>
                <li>Le Programme Ambassadeur ne peut pas être utilisé à des fins de revente ou de commercialisation</li>
                <li>OsteoUpgrade se réserve le droit de modifier ou de suspendre le Programme Ambassadeur à tout moment, avec un préavis de 30 jours aux abonnés concernés</li>
                <li>Tout abus, fraude ou tentative de contournement des règles entraîne la perte définitive des commissions accumulées et peut conduire à la résiliation du compte</li>
              </ul>
            </section>

            {/* Article 10 - Séminaires */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 10 - Séminaires Présentiels (Gold)</h2>
              <p className="text-gray-700 leading-relaxed">
                L'abonnement Premium Gold inclut l'accès à <strong>un séminaire présentiel de 2 jours par période
                d'abonnement annuel</strong>. Cet accès est personnel et non transmissible.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Les dates, lieux et modalités d'inscription aux séminaires sont communiqués sur la Plateforme et
                par email. OsteoUpgrade se réserve le droit de modifier, reporter ou annuler un séminaire en cas
                de force majeure ou de circonstances exceptionnelles ; dans ce cas, une nouvelle date sera proposée
                à l'Abonné.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Le droit au séminaire est valable pour la période d'abonnement annuel en cours et ne peut pas être
                reporté à la période suivante en cas de non-utilisation.
              </p>
            </section>

            {/* Article 11 - Propriété intellectuelle */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 11 - Propriété Intellectuelle</h2>
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

            {/* Article 12 - Données personnelles */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 12 - Protection des Données Personnelles</h2>
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
                vos données personnelles, que vous pouvez exercer en contactant : privacy@osteo-upgrade.fr
              </p>
            </section>

            {/* Article 13 - Responsabilité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 13 - Limitation de Responsabilité</h2>
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

            {/* Article 14 - Force majeure */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 14 - Force Majeure</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade ne pourra être tenu responsable de l'inexécution de ses obligations en cas de
                survenance d'un événement de force majeure tel que défini par la jurisprudence française
                (catastrophe naturelle, guerre, émeute, grève, panne informatique majeure, etc.).
              </p>
            </section>

            {/* Article 15 - Modifications des CGU */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 15 - Modifications des CGU/CGV</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de modifier les présentes CGU/CGV à tout moment. Les
                Utilisateurs seront informés par email des modifications substantielles au moins 15 jours
                avant leur entrée en vigueur.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La poursuite de l'utilisation de la Plateforme après modification des CGU/CGV vaut acceptation
                des nouvelles conditions.
              </p>
            </section>

            {/* Article 16 - Médiation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 16 - Médiation et Règlement des Litiges</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l'article L.612-1 du Code de la consommation, en cas de litige, l'Abonné peut
                recourir gratuitement à un médiateur de la consommation :
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Médiateur de la consommation :</strong><br />
                  CM2C – Centre de Médiation de la Consommation de Conciliateurs de Justice<br />
                  14 rue Saint-Jean, 75017 Paris<br />
                  Site web :{' '}
                  <a href="https://www.cm2c.net" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    www.cm2c.net
                  </a>
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                En cas d'échec de la médiation, le litige pourra être porté devant les tribunaux compétents.
              </p>
            </section>

            {/* Article 17 - Loi applicable */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 17 - Loi Applicable et Juridiction</h2>
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
                <li>📧 Email : contact@osteo-upgrade.fr</li>
                <li>📞 Téléphone : [À compléter après création de la SAS]</li>
                <li>📍 Adresse : [À compléter après création de la SAS]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      </div>
      <PublicFooter />
    </div>
  )
}
