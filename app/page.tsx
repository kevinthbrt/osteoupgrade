"use client"

import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const year = new Date().getFullYear()

  return (
    <div className="page">
      <header>
        <div className="container header-inner">
          <div className="logo-wrap">
            <div className="logo-mark"></div>
            <div>
              <div className="logo-text-title">OsteoUpgrade</div>
              <div className="logo-text-sub">Outil clinique des thérapeutes manuels</div>
            </div>
          </div>

          <nav>
            <a href="#features">Fonctionnalités</a>
            <a href="#premium">Premium</a>
            <a href="#how">Comment ça marche</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="header-cta">
            <Link href="/auth" className="btn-outline">
              Connexion membre
            </Link>
            <a href="#premium" className="btn-primary">
              Devenir membre premium
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="badge">
                <span className="badge-dot"></span>
                Plateforme clinique pour ostéos & thérapeutes manuels
              </div>
              <h1 className="hero-title">
                Structure ton raisonnement clinique
                <span>sans lâcher le contact patient.</span>
              </h1>
              <p className="hero-subtitle">
                Module 3D des tests orthopédiques par région, guide diagnostique topographique,
                exports de sessions de testing et accès à un écosystème de formations pensé pour les
                thérapeutes manuels.
              </p>

              <div className="hero-checks">
                <div className="hero-check">
                  <div className="check-icon">✓</div>
                  <div>
                    Tests orthopédiques en 3D par région, avec description et vidéo pour chaque test.
                  </div>
                </div>
                <div className="hero-check">
                  <div className="check-icon">✓</div>
                  <div>
                    Export des sessions de testing pour les intégrer directement à ton logiciel de gestion de
                    patientèle.
                  </div>
                </div>
                <div className="hero-check">
                  <div className="check-icon">✓</div>
                  <div>
                    Accès premium : guide diagnostique topographique, contenus en ligne et, en offre Gold,
                    séminaires présentiels annuels.
                  </div>
                </div>
              </div>

              <div className="hero-cta-row">
                <Link href="/auth" className="btn-primary">
                  Je veux tester OsteoUpgrade
                </Link>
                <a href="#features" className="btn-ghost">
                  Voir les fonctionnalités
                </a>
              </div>
              <div className="hero-note">
                Destiné aux <span>ostéopathes, kinés, chiropracteurs</span> et thérapeutes manuels qui veulent
                structurer leur pratique sans perdre leur style.
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-card">
                <div className="hero-card-header">
                  <div>
                    <div className="hero-card-title">Session de testing – Rachis lombaire</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Vue clinique en temps réel
                    </div>
                  </div>
                  <div className="hero-pill">Mode praticien</div>
                </div>

                <div className="hero-3d">
                  <div className="hero-3d-view">
                    <div className="hero-3d-ribbon">Module 3D – Tests ortho</div>
                    <Image
                      src="/hero-3d-model.svg"
                      alt="Modèle 3D avec une moitié anatomique et l'autre musculaire"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="hero-3d-img"
                    />
                    <div className="hero-3d-region">
                      <span className="hero-3d-region-dot"></span>
                      Région lombaire sélectionnée
                    </div>
                  </div>
                  <div>
                    <div className="hero-tests-list">
                      <div className="hero-test-row">
                        <div className="hero-test-name">
                          <span className="hero-test-dot"></span>
                          Lasègue / SLR
                        </div>
                        <div className="hero-test-tag">Vidéo + description</div>
                      </div>
                      <div className="hero-test-row">
                        <div className="hero-test-name">
                          <span className="hero-test-dot"></span>
                          Extension passive lombaire
                        </div>
                        <div className="hero-test-tag">Instabilité</div>
                      </div>
                      <div className="hero-test-row">
                        <div className="hero-test-name">
                          <span className="hero-test-dot"></span>
                          Slump test
                        </div>
                        <div className="hero-test-tag">Neurodynamique</div>
                      </div>
                      <div className="hero-test-row">
                        <div className="hero-test-name">
                          <span className="hero-test-dot"></span>
                          P-A segmentaires
                        </div>
                        <div className="hero-test-tag">Palpation</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-bottom-strip">
                  <div className="hero-counter">
                    <span className="hero-counter-badge">+120 tests 3D</span>
                    via toutes les régions du corps
                  </div>
                  <div>
                    <span style={{ color: '#38bdf8' }}>●</span>
                    Session prête à être exportée dans ton dossier patient
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features">
          <div className="container">
            <div className="section-label">Fonctionnalités clés</div>
            <h2 className="section-title">Tout ce dont tu as besoin au cabinet.</h2>
            <p className="section-subtitle">
              OsteoUpgrade ne remplace pas ton raisonnement clinique. Il le structure, le trace et te fait gagner du
              temps sur tout ce qui est répétitif, pour que tu restes concentré sur le patient.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">3D</div>
                <div className="feature-title">Module 3D des tests orthopédiques</div>
                <div className="feature-text">
                  Navigue par région anatomique, sélectionne une zone et retrouve les tests associés avec description
                  claire et vidéo d’exécution.
                </div>
                <div className="feature-tag">Tous niveaux</div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">▶</div>
                <div className="feature-title">Vidéo &amp; description structurée</div>
                <div className="feature-text">
                  Chaque test est accompagné d’un texte synthétique (indications, positionnement, interprétation) et d’une
                  vidéo courte. Plus besoin de fouiller YouTube ou des PDF éparpillés.
                </div>
                <div className="feature-tag">Vidéothèque</div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🧭</div>
                <div className="feature-title">Guide diagnostique topographique</div>
                <div className="feature-text">
                  Bibliothèque de photos par zone, avec tracé des symptomatologies et des points douloureux associés à
                  chaque pathologie, accompagnés d’une explication claire de ce qu’elle est.
                  <br />
                  <br />
                  <em style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Bientôt : un guide diagnostique complet qui partira de la symptomatologie pour établir un diagnostic
                    via un modèle d’arbre décisionnel.
                  </em>
                </div>
                <div className="feature-tag">Premium</div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⬇</div>
                <div className="feature-title">Export des sessions de testing</div>
                <div className="feature-text">
                  Construis une session de testing, coche les tests réalisés, note les résultats et exporte le tout pour
                  l’intégrer directement à ton logiciel de gestion de patientèle.
                </div>
                <div className="feature-tag">Gain de temps</div>
              </div>
            </div>
          </div>
        </section>

        <section id="premium">
          <div className="container premium-grid">
            <div>
              <div className="section-label">Accès premium</div>
              <h2 className="section-title">Bien plus qu’une app : un écosystème de formation.</h2>
              <p className="section-subtitle">
                L’abonnement premium ouvre l’accès à la plateforme complète et à un socle de contenus pour faire évoluer ta
                pratique chaque année.
              </p>

              <div className="premium-card">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                  Ce que tu obtiens en tant que membre premium
                </h3>
                <div className="premium-items">
                  <div className="premium-item">
                    <div className="premium-bullet">•</div>
                    <div>
                      <strong>Accès à tous les modules de l’app</strong> : toutes les régions anatomiques, tous les tests et
                      leurs exports, bien au-delà de l’épaule de la version gratuite.
                    </div>
                  </div>
                  <div className="premium-item">
                    <div className="premium-bullet">•</div>
                    <div>
                      <strong>Accès à toutes les formations en ligne</strong>, avec une base de contenus qui s’enrichit en
                      continu (pathologies, raisonnement, cas cliniques, exercices…).
                    </div>
                  </div>
                  <div className="premium-item">
                    <div className="premium-bullet">•</div>
                    <div>
                      <strong>Guide diagnostique topographique</strong> : bibliothèque de photos par zone, avec tracé des
                      symptomatologies et explication de chaque pathologie.
                      <br />
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Un guide diagnostique complet basé sur un modèle d’arbre décisionnel arrivera prochainement.
                      </span>
                    </div>
                  </div>
                  <div className="premium-item">
                    <div className="premium-bullet">•</div>
                    <div>
                      <strong>Séminaire présentiel de 2 jours par an</strong> pour travailler la clinique, l’analyse de cas et
                      l’application concrète au cabinet <strong>(inclus avec l’offre Gold)</strong>.
                    </div>
                  </div>
                </div>
                <div className="premium-note">
                  Tu gardes ta liberté clinique. L’outil n’impose pas une école ou un dogme, il te donne des repères et une
                  structure.
                </div>

                <div className="seminar-card">
                  <div className="seminar-pill">
                    <span></span> Séminaire présentiel (offre Gold)
                  </div>
                  <div style={{ marginBottom: '0.3rem' }}>
                    2 jours par an pour passer de la théorie au fauteuil : workshops, cas réels, pratique guidée.
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    Inclus dans l’abonnement premium Gold. Places limitées pour garder la qualité de l’accompagnement.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="price-card">
                <div className="price-title">Offre de lancement</div>
                <div className="price-value">
                  Accès gratuit <span>pour découvrir l’app</span>
                </div>
                <ul className="price-list">
                  <li>Accès complet au module <strong>épaule</strong> : tests 3D, descriptions et exports.</li>
                  <li>Permet de voir exactement comment fonctionne l’application au cabinet.</li>
                </ul>

                <div className="price-tier">
                  <div className="price-tier-header">
                    <strong>Premium Silver</strong>
                    <span>29,99 € / mois</span>
                  </div>
                  <div className="price-tier-note">
                    Facturé annuellement. Accès à toute l’application (toutes les régions, exports avancés) et à toutes les
                    formations en ligne. Séminaires présentiels non inclus.
                  </div>
                </div>

                <div className="price-tier">
                  <div className="price-tier-header">
                    <strong>Premium Gold</strong>
                    <span>49,99 € / mois</span>
                  </div>
                  <div className="price-tier-note">
                    Facturé annuellement. Inclut tout le contenu de l’offre Silver <strong>+ participation aux séminaires
                    présentiels</strong>.
                  </div>
                </div>

                <Link
                  href="/auth"
                  className="btn-primary"
                  style={{ display: 'inline-flex', justifyContent: 'center', width: '100%', textAlign: 'center', marginTop: '1rem', marginBottom: '0.7rem' }}
                >
                  Tester gratuitement avec l’épaule
                </Link>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Les offres Premium Silver &amp; Gold sont des abonnements annuels : le paiement se fait pour 12 mois, non
                  résiliables en cours d’année. Tu peux choisir de ne pas renouveler à l’échéance.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="container">
            <div className="section-label">Utilisation au quotidien</div>
            <h2 className="section-title">Tu l’ouvres, tu testes, tu traces. C’est tout.</h2>
            <p className="section-subtitle">
              Pas besoin de changer tout ton cabinet. OsteoUpgrade vient se brancher sur ce que tu fais déjà : ton logiciel
              de gestion, tes habitudes de prise de notes et ta façon de raisonner.
            </p>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-title">Crée ta session de testing</div>
                <div className="step-text">
                  Choisis la région (par ex. lombaire), sélectionne les tests pertinents via le module 3D et coche ceux que tu
                  souhaites réaliser pour ce patient.
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-title">Réalise les tests au fauteuil</div>
                <div className="step-text">
                  L’app te rappelle la description et la vidéo du test si besoin. Tu notes simplement “+ / – / douteux” ou tes
                  commentaires cliniques.
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-title">Exporte &amp; intègre au dossier</div>
                <div className="step-text">
                  En un clic, tu exportes la session (PDF ou format compatible) et tu l’intègres dans ton logiciel de gestion.
                  Tes notes sont propres, lisibles et traçables.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container">
            <div className="section-label">Pour qui ?</div>
            <h2 className="section-title">Pensé pour le terrain.</h2>
            <p className="section-subtitle">
              Que tu sois jeune diplômé ou praticien installé depuis 15 ans, l’objectif est le même : garder un raisonnement
              clinique solide, tout en rendant ton quotidien plus fluide.
            </p>

            <div className="audience-grid">
              <div className="audience-card">
                <div className="audience-title">Ostéopathes</div>
                <div>
                  Pour structurer tes bilans, mieux tracer tes décisions et sécuriser tes prises en charge, notamment sur les
                  lombalgies, cervicalgies, épaules complexes, etc.
                </div>
              </div>
              <div className="audience-card">
                <div className="audience-title">Kinés &amp; thérapeutes manuels</div>
                <div>
                  Pour intégrer plus facilement les tests ortho dans tes prises en charge, suivre le patient sur la durée et
                  communiquer clairement avec les médecins.
                </div>
              </div>
              <div className="audience-card">
                <div className="audience-title">Formateurs &amp; équipes de cabinet</div>
                <div>
                  Pour harmoniser les pratiques, partager des protocoles de testing et utiliser la même base de tests et de
                  diagnostics dans toute l’équipe.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="container">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Questions fréquentes.</h2>

            <div className="faq-grid">
              <div className="faq-item">
                <div className="faq-q">Est-ce que l’app remplace mon logiciel de gestion de patientèle ?</div>
                <div className="faq-a">
                  Non. OsteoUpgrade vient en complément : tu construis tes sessions de testing et tu exportes les comptes rendus
                  pour les intégrer dans ton logiciel actuel.
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-q">Est-ce que les données de mes patients sont sécurisées ?</div>
                <div className="faq-a">
                  OsteoUpgrade ne stocke pas de données sensibles de tes patients. L’app te permet d’exporter les tests que tu as
                  réalisés, mais il n’y a pas de sauvegarde en ligne des séances. Tu peux, si tu le souhaites, enregistrer ces
                  exports localement (PDF, dossier patient, etc.) sur tes propres outils.
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-q">Puis-je annuler mon abonnement premium ?</div>
                <div className="faq-a">
                  Les abonnements Premium Silver et Gold sont des engagements annuels : le montant est réglé pour 12 mois et n’est
                  pas résiliable en cours d’année. En revanche, tu peux tout à fait décider de ne pas renouveler l’abonnement à son
                  échéance.
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-q">Y a-t-il un accompagnement pour apprendre à utiliser l’app ?</div>
                <div className="faq-a">
                  L’application est pensée pour être très intuitive, tu peux donc l’utiliser sans formation particulière. Nous
                  prévoyons néanmoins de courtes vidéos de prise en main et quelques cas cliniques guidés pour t’accompagner si tu
                  préfères être accompagné au départ.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <div>© {year} OsteoUpgrade – Tous droits réservés.</div>
          <div className="footer-links">
            <a href="#">Mentions légales</a>
            <a href="#">CGU</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        :root {
          --bg: #020617;
          --bg-soft: #020617;
          --card: #020617;
          --border: #1e293b;
          --accent: #38bdf8;
          --accent-soft: rgba(56, 189, 248, 0.12);
          --text: #e5e7eb;
          --muted: #94a3b8;
          --danger: #f97373;
          --radius-lg: 18px;
          --radius-full: 999px;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: radial-gradient(circle at top, #0f172a 0, #020617 45%);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        img {
          max-width: 100%;
          display: block;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

    .container {
      width: min(1200px, calc(100% - 2.5rem));
      margin: 0 auto;
      padding: 0 1.25rem;
    }

        header {
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
          position: sticky;
          top: 0;
          backdrop-filter: blur(14px);
          background: radial-gradient(circle at top left, #020617ee, #020617f9);
          z-index: 30;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 0;
          gap: 1rem;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          background: conic-gradient(from 160deg, #38bdf8, #0ea5e9, #38bdf8, #0369a1);
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
        }

        .logo-text-title {
          font-weight: 700;
          letter-spacing: -0.03em;
          font-size: 1.1rem;
        }

        .logo-text-sub {
          font-size: 0.75rem;
          color: var(--muted);
        }

        nav {
          display: flex;
          gap: 1.5rem;
          font-size: 0.87rem;
          color: var(--muted);
        }

        nav a {
          position: relative;
        }

        nav a::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 2px;
          width: 0;
          background: var(--accent);
          border-radius: 999px;
          transition: width 0.2s ease;
        }

        nav a:hover {
          color: #e2e8f0;
        }

        nav a:hover::after {
          width: 18px;
        }

        .header-cta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-outline {
          padding: 0.55rem 0.95rem;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          font-size: 0.8rem;
          color: var(--muted);
        }

        .btn-primary {
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          border: none;
          font-size: 0.8rem;
          font-weight: 600;
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
          color: #020617;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
          cursor: pointer;
        }

        .btn-primary:hover {
          filter: brightness(1.05);
        }

        main {
          flex: 1;
        }

        section {
          padding: 3.5rem 0;
        }

        @media (min-width: 768px) {
          section {
            padding: 5rem 0;
          }
        }

        .hero {
          padding-top: 3rem;
          padding-bottom: 4rem;
        }

        .hero-grid {
          display: grid;
          gap: 2.5rem;
        }

        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1.15fr 1fr;
            align-items: center;
          }
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.3rem 0.85rem;
          border-radius: 999px;
          border: 1px solid rgba(56, 189, 248, 0.6);
          background: var(--accent-soft);
          color: #e0f2fe;
          font-size: 0.75rem;
          margin-bottom: 0.8rem;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #38bdf8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
        }

        .hero-title {
          font-size: 2.1rem;
          line-height: 1.1;
          letter-spacing: -0.035em;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 2.8rem;
          }
        }

        .hero-title span {
          color: #38bdf8;
        }

        .hero-subtitle {
          font-size: 0.98rem;
          color: var(--muted);
          max-width: 32rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .hero-checks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
        }

        .hero-check {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          font-size: 0.9rem;
          color: #cbd5f5;
        }

        .check-icon {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 1px solid rgba(56, 189, 248, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #e0f2fe;
          flex-shrink: 0;
        }

        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .btn-ghost {
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          font-size: 0.8rem;
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .hero-note {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .hero-note span {
          color: #bfdbfe;
        }

        .hero-right {
          position: relative;
        }

        .hero-card {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: radial-gradient(circle at top left, #0b1120, #020617);
          padding: 1.4rem;
          box-shadow: 0 25px 50px rgba(15, 23, 42, 0.9);
          position: relative;
          overflow: hidden;
        }

        .hero-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .hero-card-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .hero-pill {
          font-size: 0.7rem;
          padding: 0.18rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.5);
          color: var(--muted);
        }

        .hero-3d {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: radial-gradient(circle at top, #0b1120, #020617);
          padding: 0.9rem;
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .hero-3d-view {
          border-radius: 14px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: radial-gradient(circle at 20% 0, #38bdf822, #020617);
          position: relative;
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-size: 0.8rem;
          color: #a5b4fc;
        }

        .hero-3d-img {
          object-fit: contain;
          z-index: 1;
        }

        .hero-3d-view::before,
        .hero-3d-view::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          inset: 18%;
          transform: rotate(14deg);
          z-index: 0;
        }

        .hero-3d-view::after {
          inset: 28%;
          transform: rotate(-12deg);
        }

        .hero-3d-ribbon {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 0.18rem 0.6rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.5);
          color: var(--muted);
          font-size: 0.7rem;
          z-index: 2;
        }

        .hero-3d-region {
          position: absolute;
          bottom: 10px;
          right: 10px;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          color: #e5e7eb;
          font-size: 0.7rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          z-index: 2;
        }

        .hero-3d-region-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #38bdf8;
        }

        .hero-tests-list {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          font-size: 0.8rem;
        }

        .hero-test-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0.5rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(51, 65, 85, 0.9);
        }

        .hero-test-name {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .hero-test-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #38bdf8;
        }

        .hero-test-tag {
          font-size: 0.68rem;
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 1);
          border: 1px solid rgba(148, 163, 184, 0.45);
          color: var(--muted);
        }

        .hero-bottom-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.4rem;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .hero-counter {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .hero-counter-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.8);
          color: #e0f2fe;
          font-size: 0.7rem;
        }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-size: 1.6rem;
          letter-spacing: -0.04em;
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          font-size: 0.95rem;
          color: var(--muted);
          max-width: 36rem;
          margin-bottom: 1.8rem;
        }

        .features-grid {
          display: grid;
          gap: 1.4rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .feature-card {
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: radial-gradient(circle at top left, #020617, #020617);
          padding: 1.1rem;
          font-size: 0.9rem;
          position: relative;
          overflow: hidden;
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 1);
          border: 1px solid rgba(148, 163, 184, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          margin-bottom: 0.6rem;
          color: #a5b4fc;
        }

        .feature-title {
          font-weight: 600;
          margin-bottom: 0.35rem;
        }

        .feature-text {
          color: var(--muted);
          font-size: 0.86rem;
          line-height: 1.5;
        }

        .feature-tag {
          position: absolute;
          top: 0.8rem;
          right: 0.9rem;
          padding: 0.12rem 0.55rem;
          border-radius: 999px;
          font-size: 0.68rem;
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: var(--muted);
          background: rgba(15, 23, 42, 0.9);
        }

        .premium-grid {
          display: grid;
          gap: 1.4rem;
          align-items: flex-start;
        }

        @media (min-width: 900px) {
          .premium-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        .premium-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: radial-gradient(circle at top left, #0f172a, #020617);
          padding: 1.4rem;
        }

        .premium-items {
          display: grid;
          gap: 0.9rem;
          margin-top: 0.6rem;
          margin-bottom: 1.2rem;
        }

        .premium-item {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          font-size: 0.9rem;
          color: #e5e7eb;
        }

        .premium-bullet {
          font-size: 1rem;
          color: #38bdf8;
          line-height: 1.1;
        }

        .premium-note {
          font-size: 0.78rem;
          color: var(--muted);
        }

        .seminar-card {
          border-radius: 18px;
          border: 1px dashed rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.9);
          padding: 0.9rem;
          font-size: 0.85rem;
          margin-top: 0.9rem;
        }

        .seminar-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.18rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(248, 250, 252, 0.3);
          font-size: 0.7rem;
          margin-bottom: 0.45rem;
        }

        .seminar-pill span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #38bdf8;
        }

        .price-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: radial-gradient(circle at top right, #020617, #020617);
          padding: 1.4rem;
          font-size: 0.9rem;
        }

        .price-title {
          font-weight: 600;
          margin-bottom: 0.3rem;
        }

        .price-value {
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0.6rem 0;
        }

        .price-value span {
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--muted);
        }

        .price-list {
          margin: 0.7rem 0 1rem;
          padding-left: 1.1rem;
          color: var(--muted);
          font-size: 0.86rem;
          line-height: 1.5;
        }

        .price-tier {
          margin-top: 0.8rem;
          padding-top: 0.8rem;
          border-top: 1px solid rgba(148, 163, 184, 0.35);
          font-size: 0.86rem;
        }

        .price-tier-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .price-tier-header span {
          font-weight: 600;
        }

        .price-tier-note {
          color: var(--muted);
        }

        .steps-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .step-card {
          border-radius: 18px;
          border: 1px solid var(--border);
          background: rgba(15, 23, 42, 0.85);
          padding: 1rem;
          font-size: 0.88rem;
        }

        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          color: var(--muted);
          margin-bottom: 0.6rem;
        }

        .step-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .step-text {
          color: var(--muted);
        }

        .audience-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .audience-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .audience-card {
          border-radius: 18px;
          border: 1px dashed var(--border);
          padding: 1rem;
          font-size: 0.88rem;
          background: rgba(15, 23, 42, 0.7);
        }

        .audience-title {
          font-weight: 600;
          margin-bottom: 0.3rem;
        }

        .faq-grid {
          display: grid;
          gap: 0.7rem;
        }

        .faq-item {
          border-radius: 14px;
          border: 1px solid var(--border);
          padding: 0.85rem 1rem;
          font-size: 0.88rem;
          background: rgba(15, 23, 42, 0.9);
        }

        .faq-q {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .faq-a {
          color: var(--muted);
        }

        footer {
          border-top: 1px solid rgba(148, 163, 184, 0.25);
          padding: 1.3rem 0 2rem;
          font-size: 0.78rem;
          color: var(--muted);
        }

        .footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .footer-links {
          display: flex;
          gap: 1.2rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          nav {
            display: none;
          }

          .header-cta .btn-outline {
            display: none;
          }

          .hero {
            padding-top: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
