import { Metadata } from 'next'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation | OsteoUpgrade & MyOsteoflow',
  description: 'Conditions Générales d\'Utilisation et de Vente communes à la plateforme OsteoUpgrade et à l\'application MyOsteoflow'
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d&apos;Utilisation et de Vente
          </h1>

          <p className="text-gray-600 mb-8">
            Dernière mise à jour : 15 juillet 2026
          </p>

          <div className="prose prose-blue max-w-none space-y-8">
            {/* Article 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 1 - Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales d&apos;Utilisation et de Vente (ci-après &laquo; CGU/CGV &raquo;) régissent
                l&apos;accès et l&apos;utilisation de l&apos;ensemble des services proposés par OsteoUpgrade SAS, à savoir :
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-3 ml-4">
                <li><strong>OsteoUpgrade</strong> : plateforme web de formation et de ressources cliniques pour praticiens, accessible à l&apos;adresse osteo-upgrade.fr</li>
                <li><strong>MyOsteoflow</strong> : logiciel de gestion de cabinet sous forme d&apos;application de bureau (desktop), distribué via osteo-upgrade.fr</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                L&apos;utilisation de l&apos;un ou l&apos;autre de ces services implique l&apos;acceptation pleine et entière des présentes CGU/CGV.
              </p>
            </section>

            {/* Article 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 2 - Éditeur</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <p className="text-gray-700 font-medium mb-2">OsteoUpgrade SAS</p>
                <p className="text-gray-600 text-sm">
                  Forme juridique : SAS (Société par Actions Simplifiée) au capital de 1 000 €<br />
                  Siège social : 57 bis route nationale, résidence coté parc, bât A, 06440 Blausasc<br />
                  RCS Nice : 106 919 715<br />
                  Téléphone : 06 63 24 42 80<br />
                  Email : contact@osteo-upgrade.fr<br />
                  Président : Gerald Stoppini — Directeur général : Kevin Thubert<br />
                  Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
                </p>
              </div>
            </section>

            {/* Article 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 3 - Définitions</h2>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Utilisateur :</strong> Toute personne accédant aux services OsteoUpgrade ou MyOsteoflow</li>
                <li><strong>Abonné :</strong> Utilisateur ayant souscrit à une offre Premium</li>
                <li><strong>Compte Gratuit :</strong> Accès limité au module épaule uniquement (OsteoUpgrade)</li>
                <li><strong>Abonnement Premium :</strong> Accès complet aux deux services, au tarif de 49,99 €/mois, sans engagement, prélevé automatiquement chaque mois jusqu&apos;à résiliation</li>
                <li><strong>OsteoUpgrade :</strong> Plateforme web accessible via navigateur incluant tests orthopédiques, e-learning, revue de littérature, topographie clinique, OsteoFlash (flashcards), aide au raisonnement clinique, techniques en vidéo et quiz</li>
                <li><strong>MyOsteoflow :</strong> Application desktop (Mac, Windows) de gestion de cabinet, sans mode navigateur, incluant gestion des patients et consultations, dictée vocale par IA, courriers générés par IA, messagerie patients, facturation, comptabilité, statistiques, suivi patient automatisé et aide au raisonnement clinique</li>
                <li><strong>Programme Ambassadeur :</strong> Dispositif de parrainage réservé aux abonnés Premium permettant au parrain et au filleul d&apos;obtenir chacun un mois d&apos;abonnement offert</li>
                <li><strong>Essai gratuit :</strong> Période de 7 jours, réservée au premier abonnement d&apos;un Compte Gratuit n&apos;ayant jamais souscrit auparavant, donnant accès à MyOsteoflow uniquement (voir Article 5.4)</li>
              </ul>
            </section>

            {/* Article 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 4 - Accès aux services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 - OsteoUpgrade (plateforme web)</h3>
              <p className="text-gray-700 leading-relaxed">
                L&apos;accès à OsteoUpgrade nécessite la création d&apos;un compte utilisateur via le site osteo-upgrade.fr.
                La plateforme est accessible depuis un navigateur web. L&apos;Utilisateur s&apos;engage à fournir des informations exactes et à maintenir ces informations à jour.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 - MyOsteoflow (application desktop)</h3>
              <p className="text-gray-700 leading-relaxed">
                MyOsteoflow est une application de bureau téléchargeable, disponible pour Mac et Windows.
                <strong> Il n&apos;existe pas de mode navigateur pour MyOsteoflow.</strong> L&apos;application fonctionne localement sur l&apos;ordinateur de l&apos;Utilisateur.
                Les données patients sont stockées localement et ne transitent pas par un serveur cloud tiers.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et
                de toutes les activités effectuées sous son compte.
              </p>
            </section>

            {/* Article 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 5 - Offres d&apos;Abonnement</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 - Offres disponibles</h3>
              <div className="space-y-4 mb-6">

                {/* Free */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h4 className="font-bold text-lg text-gray-700 mb-1">Compte Gratuit</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-2">0 €</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    <li>✓ Module épaule complet (OsteoUpgrade)</li>
                  </ul>
                </div>

                {/* Premium */}
                <div className="border border-sky-200 rounded-lg p-5 bg-sky-50">
                  <h4 className="font-bold text-lg text-sky-600 mb-1">Premium</h4>
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">49,99 €<span className="text-base text-gray-600 font-normal">/mois</span></p>
                      <p className="text-sm text-gray-500">Sans engagement — prélevé automatiquement chaque mois, résiliable à tout moment</p>
                      <p className="text-sm text-emerald-600 font-semibold mt-1">Déductible des frais professionnels</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    <li>✓ MyOsteoflow : logiciel de cabinet complet (desktop)</li>
                    <li>✓ Dictée vocale IA & suivi patient automatisé</li>
                    <li>✓ Aide au raisonnement clinique avec proposition de tests ortho</li>
                    <li>✓ Tests orthopédiques complets + export PDF</li>
                    <li>✓ OsteoFlash - Flashcards cliniques</li>
                    <li>✓ E-learning actualisé en continu</li>
                    <li>✓ Module pratique (techniques articulaires & mobilisations)</li>
                    <li>✓ Créateur de fiches d&apos;exercices (export PDF)</li>
                    <li>✓ Topographies des pathologies</li>
                    <li>✓ Toutes les régions anatomiques</li>
                    <li>✓ Bibliothèque complète de tests diagnostiques</li>
                    <li>✓ Quiz complet</li>
                    <li>✓ Revue de littérature mensuelle</li>
                    <li>✓ Programme Ambassadeur (1 mois offert pour le parrain et le filleul à chaque parrainage)</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-gray-600 italic">
                Les prix s&apos;entendent en euros toutes taxes comprises (TTC). Aucune TVA n&apos;est actuellement applicable
                (régime de franchise en base de TVA, sous réserve de modification).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 - Renouvellement automatique</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-4">
                <p className="font-bold text-blue-900 mb-2">✅ Sans engagement — résiliable à tout moment</p>
                <p className="text-gray-700 leading-relaxed">
                  L&apos;abonnement OsteoUpgrade/MyOsteoflow ne comporte <strong>aucun engagement de durée minimale</strong>.
                  Il se renouvelle automatiquement à l&apos;issue de chaque période de facturation mensuelle
                  et peut être résilié à tout moment avant la prochaine date de renouvellement.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed">
                Le premier prélèvement intervient à la date de souscription. Les prélèvements suivants ont lieu
                <strong> chaque mois, à la même date que la souscription initiale</strong>, jusqu&apos;à résiliation.
              </p>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>L&apos;Abonné est notifié par email 7 jours avant chaque renouvellement</strong>, lui permettant
                de résilier son abonnement s&apos;il ne souhaite pas être débité pour la période suivante.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 - Modification des tarifs</h3>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de modifier ses tarifs à tout moment. Toute modification tarifaire
                sera notifiée à l&apos;Abonné par email <strong>au moins 30 jours avant son entrée en vigueur</strong>.
                L&apos;Abonné pourra résilier son abonnement sans frais avant l&apos;application du nouveau tarif.
                À défaut de résiliation, la poursuite de l&apos;abonnement vaut acceptation du nouveau tarif.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 - Essai gratuit MyOsteoflow</h3>
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-lg mb-4">
                <p className="font-bold text-emerald-900 mb-2">🎁 7 jours d&apos;essai gratuit, réservé au premier abonnement</p>
                <p className="text-gray-700 leading-relaxed">
                  Un Compte Gratuit n&apos;ayant jamais souscrit auparavant à une offre payante peut bénéficier, une seule fois,
                  d&apos;un essai gratuit de <strong>7 jours</strong> donnant accès à <strong>MyOsteoflow uniquement</strong>.
                  Les autres services de la plateforme OsteoUpgrade (e-learning, OsteoFlash, tests orthopédiques, topographie,
                  module pratique, revue de littérature) restent inaccessibles pendant l&apos;essai et ne sont débloqués qu&apos;à
                  la conversion en abonnement Premium.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>Une carte bancaire valide est requise pour démarrer l&apos;essai, dès la souscription</li>
                <li>Aucun prélèvement n&apos;est effectué pendant les 7 jours de l&apos;essai</li>
                <li>À l&apos;issue de l&apos;essai, l&apos;abonnement se convertit <strong>automatiquement</strong> en abonnement Premium payant (49,99 €/mois) et le premier prélèvement est effectué, <strong>sauf résiliation avant la fin de l&apos;essai</strong></li>
                <li>La résiliation pendant l&apos;essai s&apos;effectue selon les mêmes modalités que la résiliation d&apos;un abonnement (Article 6.1) et n&apos;entraîne aucun frais</li>
                <li>L&apos;essai gratuit est limité à une utilisation unique par Utilisateur et par moyen de paiement ; OsteoUpgrade se réserve le droit de refuser ou d&apos;interrompre un essai en cas de tentative d&apos;utilisation abusive ou répétée (comptes multiples, moyen de paiement déjà utilisé pour un essai précédent, etc.)</li>
                <li>Le Programme Ambassadeur (Article 9) ne s&apos;applique pas pendant la période d&apos;essai ; la récompense de parrainage n&apos;est créditée qu&apos;à la conversion effective en abonnement payant</li>
              </ul>
            </section>

            {/* Article 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 6 - Résiliation</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 - Résiliation à l&apos;initiative de l&apos;Abonné</h3>
              <p className="text-gray-700 leading-relaxed">
                L&apos;Abonné peut résilier son abonnement <strong>à tout moment</strong> sans frais ni pénalité,
                directement depuis son espace client en cliquant sur &laquo; Gérer mon abonnement &raquo; puis &laquo; Annuler l&apos;abonnement &raquo;.
                La résiliation peut également être demandée par email à contact@osteo-upgrade.fr ou par téléphone au 06 63 24 42 80.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La résiliation prend effet à la date de fin de la période de facturation en cours :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>L&apos;accès Premium reste actif jusqu&apos;à la fin du mois payé en cours ; aucun nouveau prélèvement n&apos;est effectué pour les périodes suivantes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 - Résiliation à l&apos;initiative d&apos;OsteoUpgrade</h3>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de suspendre ou résilier l&apos;accès d&apos;un Utilisateur en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>Violation des présentes CGU/CGV</li>
                <li>Défaut de paiement non régularisé</li>
                <li>Utilisation frauduleuse ou abusive des services</li>
                <li>Comportement nuisible envers d&apos;autres utilisateurs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 - Échec de paiement</h3>
              <p className="text-gray-700 leading-relaxed">
                En cas d&apos;échec de prélèvement automatique, l&apos;Abonné est informé par email et dispose d&apos;un délai
                de 7 jours pour régulariser sa situation. Passé ce délai, l&apos;accès Premium sera suspendu jusqu&apos;au
                paiement effectif ou jusqu&apos;à la résiliation du compte.
              </p>
            </section>

            {/* Article 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 7 - Droit de Rétractation</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l&apos;article L.221-18 du Code de la consommation, l&apos;Abonné dispose d&apos;un délai de
                rétractation de <strong>14 jours</strong> à compter de la souscription pour annuler son abonnement sans avoir
                à justifier de motifs ni à payer de pénalités.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour exercer ce droit, l&apos;Abonné doit notifier sa décision par email à contact@osteo-upgrade.fr
                ou via son espace client. Le remboursement sera effectué dans un délai de 14 jours suivant la
                notification de rétractation.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Important :</strong> En acceptant de bénéficier immédiatement de l&apos;accès Premium dès
                  la souscription, l&apos;Abonné reconnaît et accepte expressément que l&apos;exécution du service commence
                  avant la fin du délai de rétractation de 14 jours. En cas de rétractation après le début d&apos;utilisation
                  du service, un remboursement partiel calculé au prorata des jours effectivement consommés pourra
                  être appliqué conformément à l&apos;article L.221-25 du Code de la consommation.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Cas particulier de l&apos;essai gratuit (Article 5.4) :</strong> le délai de rétractation de 14 jours
                court à compter du début de l&apos;essai. Aucun remboursement n&apos;est applicable tant qu&apos;aucun prélèvement
                n&apos;a eu lieu ; l&apos;Abonné peut simplement résilier avant la fin de l&apos;essai pour éviter tout prélèvement.
                Si la rétractation est exercée après le premier prélèvement (conversion automatique de l&apos;essai), le
                remboursement au prorata décrit ci-dessus s&apos;applique.
              </p>
            </section>

            {/* Article 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 8 - Prix et Paiement</h2>
              <p className="text-gray-700 leading-relaxed">
                Les prix sont indiqués en euros (€). Les paiements s&apos;effectuent par carte bancaire via la
                plateforme sécurisée Stripe. Les données de paiement sont gérées directement par Stripe et
                ne sont pas conservées par OsteoUpgrade.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                En cas de litige lié à un paiement, l&apos;Abonné peut contacter OsteoUpgrade à contact@osteo-upgrade.fr,
                par téléphone au 06 63 24 42 80, ou ouvrir un ticket d&apos;assistance depuis son espace client.
              </p>
            </section>

            {/* Article 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 9 - Programme Ambassadeur</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.1 - Accès et éligibilité</h3>
              <p className="text-gray-700 leading-relaxed">
                Le Programme Ambassadeur est réservé exclusivement aux abonnés ayant souscrit à l&apos;offre
                <strong> Premium</strong> en cours de validité.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.2 - Fonctionnement</h3>
              <p className="text-gray-700 leading-relaxed">
                Chaque Abonné Premium dispose d&apos;un lien de parrainage personnel. Lorsqu&apos;un nouveau client souscrit
                un abonnement Premium en utilisant ce lien, le parrain <strong>et</strong> le filleul
                bénéficient chacun d&apos;<strong>un mois d&apos;abonnement offert</strong> (valeur 49,99 €).
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>Le mois offert est crédité automatiquement sur le compte de paiement (Stripe) de chaque bénéficiaire</li>
                <li>Le bénéfice est accordé dès lors que le paiement du filleul est confirmé et non contesté</li>
                <li>Un même utilisateur ne peut être parrainé qu&apos;une seule fois</li>
                <li>Le nombre de parrainages est illimité et cumulable</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.3 - Conditions et restrictions</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3 ml-4">
                <li>L&apos;Abonné ne peut pas se parrainer lui-même</li>
                <li>Les mois offerts non consommés à la résiliation du compte Premium sont définitivement perdus</li>
                <li>OsteoUpgrade se réserve le droit de modifier ou suspendre le Programme Ambassadeur avec un préavis de 30 jours</li>
                <li>Tout abus ou fraude entraîne la perte des avantages accumulés et peut conduire à la résiliation du compte</li>
              </ul>
            </section>

            {/* Article 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 10 - Avertissement sur l&apos;usage de l&apos;Intelligence Artificielle</h2>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <p className="text-gray-700 font-semibold mb-3">
                  Les fonctionnalités intégrant l&apos;intelligence artificielle (dictée vocale, courriers générés, aide au raisonnement clinique) sont des <strong>outils d&apos;assistance uniquement</strong>.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>L&apos;aide au raisonnement clinique et les suggestions de tests orthopédiques sont des <strong>propositions d&apos;aide à la décision</strong>, non des diagnostics</li>
                  <li>Les courriers générés par IA doivent être <strong>vérifiés et validés</strong> par le praticien avant tout envoi</li>
                  <li>La responsabilité clinique repose en totalité sur le praticien, qui reste seul juge de la pertinence de ses actes</li>
                  <li>Aucun arbre décisionnel automatisé ne remplace l&apos;examen clinique ni le jugement du professionnel de santé</li>
                  <li>Les contenus pédagogiques (e-learning, revue de littérature, tests, techniques) ont une vocation de formation continue et ne sauraient se substituer à un acte de diagnostic ou de traitement</li>
                </ul>
              </div>
            </section>

            {/* Article 11 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 11 - Propriété Intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                L&apos;ensemble des contenus présents sur les services (textes, images, vidéos, graphismes, logos,
                etc.) sont protégés par le droit d&apos;auteur et appartiennent exclusivement à OsteoUpgrade SAS ou à
                ses partenaires.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Toute reproduction, représentation, modification ou exploitation sans autorisation expresse est
                strictement interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et
                suivants du Code de la propriété intellectuelle.
              </p>
            </section>

            {/* Article 12 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 12 - Protection des Données Personnelles</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade s&apos;engage à protéger les données personnelles de ses utilisateurs conformément au
                Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                MyOsteoflow stocke les données patients <strong>localement sur l&apos;ordinateur du praticien</strong>. Ces données ne transitent pas par un serveur cloud tiers et restent sous l&apos;entière responsabilité du praticien, conformément à ses obligations RGPD en tant que responsable de traitement.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour plus d&apos;informations sur le traitement de vos données, consultez notre
                <a href="/politique-confidentialite" className="text-blue-600 hover:underline"> Politique de Confidentialité</a>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition concernant
                vos données personnelles, que vous pouvez exercer en contactant : privacy@osteo-upgrade.fr
              </p>
            </section>

            {/* Article 13 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 13 - Limitation de Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade met tout en oeuvre pour assurer l&apos;accès à la plateforme web 24h/24 et 7j/7, sous réserve
                des opérations de maintenance et des cas de force majeure.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                OsteoUpgrade ne saurait être tenu responsable des dommages directs ou indirects résultant de
                l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser les services.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Avertissement :</strong> Les contenus proposés ont une vocation pédagogique et ne sauraient se substituer à une formation professionnelle complète, à un acte de diagnostic médical, ni au jugement clinique du praticien. L&apos;intelligence artificielle intégrée est un outil d&apos;assistance uniquement (voir Article 10).
                </p>
              </div>
            </section>

            {/* Article 14 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 14 - Force Majeure</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade ne pourra être tenu responsable de l&apos;inexécution de ses obligations en cas de
                survenance d&apos;un événement de force majeure tel que défini par la jurisprudence française
                (catastrophe naturelle, guerre, émeute, grève, panne informatique majeure, etc.).
              </p>
            </section>

            {/* Article 15 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 15 - Modifications des CGU/CGV</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade se réserve le droit de modifier les présentes CGU/CGV à tout moment. Les
                Utilisateurs seront informés par email des modifications substantielles au moins 15 jours
                avant leur entrée en vigueur.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                La poursuite de l&apos;utilisation des services après modification des CGU/CGV vaut acceptation
                des nouvelles conditions.
              </p>
            </section>

            {/* Article 16 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article 16 - Médiation et Règlement des Litiges</h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à l&apos;article L.612-1 du Code de la consommation, en cas de litige, l&apos;Abonné peut
                recourir gratuitement à un médiateur de la consommation :
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-4">
                <p className="text-gray-700">
                  <strong>Médiateur de la consommation :</strong><br />
                  CM2C - Centre de Médiation de la Consommation de Conciliateurs de Justice<br />
                  14 rue Saint-Jean, 75017 Paris<br />
                  Site web :{' '}
                  <a href="https://www.cm2c.net" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    www.cm2c.net
                  </a>
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                En cas d&apos;échec de la médiation, le litige pourra être porté devant les tribunaux compétents.
              </p>
            </section>

            {/* Article 17 */}
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
                <li>📞 Téléphone : 06 63 24 42 80</li>
                <li>📍 Adresse : 57 bis route nationale, résidence coté parc, bât A, 06440 Blausasc</li>
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
