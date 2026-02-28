export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="text-xl font-bold text-slate-900 mb-4">
              Osteo<span className="text-amber-500">Upgrade</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              La plateforme de reference pour structurer ton raisonnement clinique.
              Developpee par des osteopathes, pour des osteopathes.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Fonctionnalites', href: '/#features' },
                { label: 'Modules', href: '/#modules' },
                { label: 'Tarifs', href: '/#pricing' },
                { label: 'Essai gratuit', href: '/auth' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Ressources</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'E-Learning', href: '/auth' },
                { label: 'Seminaires', href: '/auth' },
                { label: 'Revue de littérature', href: '/auth' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Mentions légales', href: '/mentions-legales' },
                { label: 'Confidentialité', href: '/politique-confidentialite' },
                { label: 'CGU / CGV', href: '/cgu' },
                { label: 'Contact', href: 'mailto:contact@osteo-upgrade.fr' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} OsteoUpgrade. Tous droits réservés.
          </div>
          <div className="text-sm text-slate-400">
            Fait avec rigueur, pour des praticiens exigeants.
          </div>
        </div>
      </div>
    </footer>
  )
}
