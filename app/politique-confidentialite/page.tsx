import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | OsteoUpgrade',
  description: 'Politique de confidentialité et protection des données personnelles de la plateforme OsteoUpgrade'
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique de Confidentialité
          </h1>

          <p className="text-gray-600 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-blue max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                OsteoUpgrade (ci-après « nous », « notre », « la Plateforme ») s'engage à protéger
                la vie privée et les données personnelles de ses utilisateurs conformément au
                Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi
                Informatique et Libertés du 6 janvier 1978 modifiée.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Cette politique de confidentialité décrit comment nous collectons, utilisons,
                stockons et protégeons vos données personnelles lorsque vous utilisez notre plateforme.
              </p>
            </section>

            {/* Responsable du traitement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Responsable du Traitement</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <p className="text-gray-700 font-medium mb-2">OsteoUpgrade</p>
                <p className="text-gray-600 text-sm">
                  [Forme juridique]<br />
                  Siège social : [adresse complète]<br />
                  Email : privacy@[votre-domaine].com<br />
                  Téléphone : [numéro]
                </p>
              </div>
            </section>

            {/* Données collectées */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Personnelles Collectées</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Données fournies directement</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Données d'identification :</strong> nom, prénom, adresse email</li>
                <li><strong>Données de connexion :</strong> identifiant, mot de passe (hashé)</li>
                <li><strong>Données de facturation :</strong> informations de paiement (traitées par Stripe)</li>
                <li><strong>Données de parrainage :</strong> code de parrainage, historique des commissions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Données collectées automatiquement</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages consultées</li>
                <li><strong>Données d'utilisation :</strong> progression dans les formations, quiz complétés, temps passé</li>
                <li><strong>Données techniques :</strong> type d'appareil, système d'exploitation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Données relatives à la pratique professionnelle</h3>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <p className="font-bold text-amber-900 mb-2">Données sensibles (santé)</p>
                <p className="text-gray-700 leading-relaxed">
                  Dans le cadre de l'utilisation des outils de consultation et de diagnostic,
                  vous pouvez être amené à saisir des informations relatives à des cas cliniques.
                  Ces données sont considérées comme des données de santé au sens du RGPD et font
                  l'objet d'une protection renforcée.
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  <strong>Important :</strong> Nous vous recommandons de ne pas saisir de données
                  permettant d'identifier directement vos patients (nom, prénom, numéro de sécurité sociale).
                  Utilisez des pseudonymes ou identifiants anonymes.
                </p>
              </div>
            </section>

            {/* Finalités */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalités du Traitement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vos données personnelles sont traitées pour les finalités suivantes :
              </p>
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Finalité</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Gestion du compte utilisateur</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Fourniture des services de formation</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Traitement des paiements</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Envoi de communications (newsletters, alertes)</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Consentement / Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Amélioration de nos services</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Gestion du programme de parrainage</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Conformité légale et fiscale</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Obligation légale</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Durée de conservation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Durée de Conservation</h2>
              <ul className="space-y-3 text-gray-700">
                <li><strong>Données de compte :</strong> Conservées pendant toute la durée de votre abonnement + 3 ans après la résiliation</li>
                <li><strong>Données de facturation :</strong> 10 ans (obligation comptable)</li>
                <li><strong>Données de navigation :</strong> 13 mois maximum</li>
                <li><strong>Données de consultation clinique :</strong> 3 ans après la dernière utilisation, sauf demande de suppression anticipée</li>
                <li><strong>Logs de connexion :</strong> 1 an</li>
              </ul>
            </section>

            {/* Destinataires */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Destinataires des Données</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vos données peuvent être transmises aux catégories de destinataires suivantes :
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Sous-traitants techniques</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Supabase Inc.</strong> (États-Unis) - Hébergement base de données et authentification</li>
                <li><strong>Vercel Inc.</strong> (États-Unis) - Hébergement de l'application</li>
                <li><strong>Stripe Inc.</strong> (États-Unis) - Traitement des paiements</li>
                <li><strong>Resend Inc.</strong> (États-Unis) - Envoi d'emails transactionnels</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Ces sous-traitants sont soumis à des clauses contractuelles types (CCT) approuvées
                par la Commission européenne pour garantir un niveau de protection adéquat.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Autres destinataires</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Autorités publiques (sur réquisition légale)</li>
                <li>Professionnels du droit et de la comptabilité (si nécessaire)</li>
              </ul>
            </section>

            {/* Transferts hors UE */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Transferts de Données Hors UE</h2>
              <p className="text-gray-700 leading-relaxed">
                Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts sont
                encadrés par les mécanismes suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4 ml-4">
                <li>Clauses Contractuelles Types (CCT) de la Commission européenne</li>
                <li>Certifications et engagements de conformité des prestataires</li>
              </ul>
            </section>

            {/* Vos droits */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos Droits</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="space-y-3 text-gray-700">
                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger vos données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                <li><strong>Droit à la limitation :</strong> Restreindre le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                <li><strong>Droit de retirer votre consentement :</strong> À tout moment, sans affecter la licéité du traitement antérieur</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-6">
                <p className="font-bold text-blue-900 mb-2">Comment exercer vos droits ?</p>
                <p className="text-gray-700">
                  Envoyez votre demande par email à <strong>privacy@[votre-domaine].com</strong> en
                  joignant une copie de votre pièce d'identité. Nous répondrons dans un délai d'un mois.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                Vous disposez également du droit d'introduire une réclamation auprès de la CNIL :
                <a href="https://www.cnil.fr" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                  www.cnil.fr
                </a>
              </p>
            </section>

            {/* Sécurité */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Sécurité des Données</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
                pour protéger vos données personnelles :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4 ml-4">
                <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                <li>Chiffrement des données au repos</li>
                <li>Authentification sécurisée avec hashage des mots de passe</li>
                <li>Contrôle d'accès strict aux données (Row Level Security)</li>
                <li>Sauvegardes régulières et chiffrées</li>
                <li>Surveillance continue des accès et anomalies</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies et Traceurs</h2>
              <p className="text-gray-700 leading-relaxed">
                Notre plateforme utilise des cookies pour assurer son bon fonctionnement :
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies strictement nécessaires</h3>
              <p className="text-gray-700 leading-relaxed">
                Ces cookies sont essentiels au fonctionnement de la plateforme (authentification,
                sécurité). Ils ne nécessitent pas votre consentement.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies analytiques (si applicable)</h3>
              <p className="text-gray-700 leading-relaxed">
                Ces cookies nous permettent de mesurer l'audience et d'améliorer nos services.
                Ils sont soumis à votre consentement préalable.
              </p>

              <p className="text-gray-700 leading-relaxed mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres
                de votre navigateur ou via notre bandeau de consentement.
              </p>
            </section>

            {/* Mineurs */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Protection des Mineurs</h2>
              <p className="text-gray-700 leading-relaxed">
                Notre plateforme s'adresse exclusivement aux professionnels de santé et étudiants
                majeurs. Nous ne collectons pas sciemment de données concernant des mineurs.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications de la Politique</h2>
              <p className="text-gray-700 leading-relaxed">
                Cette politique de confidentialité peut être modifiée à tout moment. En cas de
                modification substantielle, nous vous en informerons par email au moins 15 jours
                avant l'entrée en vigueur des nouvelles dispositions.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t-2 border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative à cette politique ou à vos données personnelles :
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li>Email : privacy@[votre-domaine].com</li>
                <li>Adresse : [adresse complète]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
