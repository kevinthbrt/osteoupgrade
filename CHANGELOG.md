# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [1.4.0] — 2026-09-02

### Ajouté

- **Funnels — pages de vente éditables** : nouveau module `/f/<slug>`, créé et modifié depuis **Administration → Funnels** sans redéploiement. Onze types de blocs (accroche, vidéo, bénéfices, témoignages, programme, tarifs, garantie, FAQ, appel à l'action, capture email, texte), réordonnables. Contenu stocké en JSONB, validé par `funnelInputSchema`. (`app/f/[slug]/`, `app/admin/funnels/`, `components/funnel/`, `lib/funnels.ts`)
- **Capture de leads sans compte** : bloc formulaire alimentant `mail_contacts` via `triggerAutomations`, donc la même liste de diffusion que l'inscription. Chaque opt-in déclenche les automatisations dont le déclencheur vaut `funnel:<slug>` — une séquence par campagne, créée dans Automatisations sans écrire de code. (`app/api/funnels/lead/`)
- **Échéance d'offre** : aucune, date fixe commune, ou J+N propre à chaque lead (offre permanente à fenêtre individuelle). Compte à rebours dans les blocs accroche, tarifs et appel à l'action. Un renvoi du formulaire ne repousse pas l'échéance.
- **Attribution des campagnes (UTM)** : les paramètres UTM sont captés à l'arrivée dans le cookie premier-partie `ou_attrib` (90 jours, premier contact conservé) et réinjectés dans les metadata de la session et de l'abonnement Stripe. Une vente est désormais rattachable à la campagne qui l'a produite. (`lib/utm.ts`)
- **Mesure par funnel** : vues, clics CTA, opt-ins et départs au paiement, avec la liste des derniers leads et leur campagne. (`app/api/funnels/track/`)
- **Tables `funnels`, `funnel_leads`, `funnel_events`** : RLS admin uniquement, aucune politique `anon` — le rendu public passe par la clé service-role, qui filtre sur `status = 'published'`. (`supabase/migrations/20260902_funnels.sql`)
- **Documentation** : `docs/FUNNELS.md`.

### Corrigé

- **Funnels — l'email capté n'entrait pas dans la liste de diffusion** : `triggerAutomations` sort dès qu'aucune séquence active ne correspond à l'événement, donc avant sa propre création de contact. Un formulaire dont la séquence n'était pas encore écrite — l'état normal juste après la publication d'une page — enregistrait le lead sans jamais créer le contact. La résolution du contact est extraite dans `ensureMailContact()` et appelée avant toute recherche de séquence. (`lib/automation-triggers.ts`, `app/api/funnels/lead/route.ts`)
- **Funnels — offre datée encore achetable après la fin** : `/api/stripe/checkout` ne vérifiait aucune échéance ; le compte à rebours n'engageait que le navigateur. La route résout désormais le funnel côté serveur et refuse une offre expirée (date fixe ou échéance individuelle du lead), ainsi qu'une offre ne correspondant pas à celle annoncée par la page.
- **Funnels — URL de CTA non filtrée** : `ctaUrl` n'était validé que comme texte court et était assigné à `window.location.href`. Une URL `javascript:` enregistrée en base s'exécutait donc dans l'origine de l'application au premier clic. Les liens sont restreints à `http(s)` à l'enregistrement et au clic (`safeLinkUrl`).
- **Funnels — attribution contradictoire** : lorsqu'un visiteur déjà attribué à une campagne rouvrait la page avec d'autres paramètres UTM, le cookie conservait bien la première campagne mais les leads et événements enregistraient la seconde. Le cookie fait désormais foi partout.
- **Funnels — séquence impossible à créer depuis l'interface** : l'éditeur renvoyait vers Administration → Automatisations, qui ne sait que lister et activer des séquences existantes (aucun écran n'appelle `POST /api/automations`). L'éditeur crée maintenant la séquence et son déclencheur, et signale explicitement qu'une séquence sans étape n'envoie rien.

### Amélioré

- **Parcours d'achat depuis un funnel** : `/auth` accepte `?plan=` et `?funnel=` et enchaîne sur le paiement Stripe dès le compte créé, au lieu de renvoyer au tableau de bord — le visiteur n'a plus à retrouver l'offre qu'il venait d'accepter.
- **Middleware** : les pages `/f/` sont exclues du contrôle de session, qui ajoutait une lecture Supabase à chaque visite sur les pages où la vitesse d'affichage se paie en conversions.

---

## [1.3.0] — 2026-05-25

### Ajouté

- **Notifications admin temps réel** : cloche dans la sidebar (section Administration uniquement) avec badge de non-lus. Panel slide-over droit listant les notifications par type (bug report, nouvel abonnement, parrainage). Marquage lu / tout lire. Alimentation automatique via Supabase Realtime (INSERT sur `admin_notifications`). (`components/AdminNotificationBell.tsx`, `lib/admin-notify.ts`)
- **Table `admin_notifications`** : migration Supabase avec RLS admin-only et publication realtime. (`apply_migration: create_admin_notifications`)
- **Bannière bêta** : bandeau visible sur toutes les pages avec bouton "Signaler un problème". Modal avec champ email optionnel et description. Envoi vers `ADMIN_EMAIL` via Resend + notification interne temps réel. (`components/BetaBanner.tsx`, `app/api/bug-report/route.ts`)
- **Notif admin nouvel abonnement** : le webhook Stripe insère automatiquement une notification interne à chaque `checkout.session.completed`. (`app/api/stripe/webhook/route.ts`)

### Amélioré

- **Landing page — OsteoFlow** : repositionné de "Bonus #1" à "Inclus avec Premium" avec 6 fonctionnalités détaillées (dossiers patients, consultations, prise de note par IA, objectifs cabinet, comptabilité, statistiques).
- **Landing page — Tarifs** : section comparatif et section tarifs fusionnées en un seul bloc. Calcul transparent affiché : 300 + 200 + 250 = 750€/an vs 240€/an OsteoUpgrade.
- **Landing page — Philosophie** : section preuve sociale remplacée par "Notre philosophie" (3 piliers : EBP, pratique cabinet, évolution mensuelle).
- **Footer public** : "Séminaires" supprimé des Ressources, lien "Modules" → "OsteoFlow" (`/#osteoflow`), accents corrigés dans la description.
- **Navigation utilisateur** : module Exercices retiré du menu (sera intégré à OsteoFlow à terme).

### Corrigé

- **Landing page** : tous les accents manquants corrigés (`référence`, `Développée`, `orthopédiques`, `détaillées`, etc.), tirets cadratins supprimés, lien nav "Modules" → "OsteoFlow" corrigé.
- **Landing page** : "Diagnostics & Pathologies" retiré de la liste des fonctionnalités (module non encore disponible aux utilisateurs).
- **Landing page — Outils professionnels** : description nettoyée des références aux fiches exercices patients.

---

## [1.2.0] — 2026-02-28

### Ajouté

- **Comptes free — navigation débloquée** : E-Learning, Pratique et Outils accessibles depuis la sidebar ; le contenu premium reste flouté page par page via `FreeContentGate`.
- **Comptes free — "Passer Premium"** : bouton doré animé dans la sidebar et bandeau d'upgrade sur le dashboard.
- **Revue de littérature** : articles non-épaule floutés pour les comptes free (cohérence avec Pratique et Tests).

### Corrigé

- **Quiz — verrouillage inter-chapitres** : `isSubpartAccessible` ne propageait pas le verrou entre chapitres. Remplacé par `computeAccessibleSubparts` (Set propagé). (`app/elearning/cours/page.tsx`)
- **Quiz — données vides pour les free** : politiques RLS trop restrictives empêchaient les comptes free de lire les quizzes. Nouvelle migration `20260228_free_user_quiz_access.sql` : les free peuvent lire les quizzes des formations `is_free_access = true`.
- **Pratique — `isVideoLocked` manquant** : variable perdue lors du merge avec conflit, corrigée dans la foulée.

---

## [1.1.0] — 2026-02-28

### Ajouté

- **Parrainage** : page `/parrainage` dédiée accessible à tous, contenu adapté au rôle (Gold : code + gains + cagnotte ; Silver : teasing Gold ; Free : CTA offres). Lien dans la navigation pour tous.
- **Admin — Codes promo** : page `/admin/promo` pour générer des codes Stripe -100€ sur Gold (personnalisable, nb d'utilisations, barre de progression, désactivation).
- **Checkout Stripe** : champ code promo visible lors du paiement (`allow_promotion_codes`).
- **Parrainage avant paiement** : rappel de code affiché avant redirection Stripe, passage sans code possible.
- **Miniatures Vimeo** : récupération serveur via oEmbed (`vimeo_id`, `thumbnail_url`, `duration_seconds`) pour éviter les cartes noires.
- **Module Pratique** : lecteur vidéo en modal, formulaire admin en modal, gestion catégories en modal, onglets régions avec retour à la ligne, pagination (12/page), région "Bassin", fusion "Pied & Cheville".
- **Footer** : présent sur toutes les pages avec liens légaux (Mentions légales, CGU/CGV, Confidentialité).
- **Bandeau cookies RGPD** : consentement à la première visite, mémorisé en localStorage.
- **Liens légaux** dans la sidebar sous le bouton déconnexion.
- **Mot de passe oublié** : lien sur l'écran de connexion + page dédiée.
- **Fenêtre changelog admin** : popup automatique à chaque mise à jour pour les administrateurs.
- **Tests orthopédiques** ajouté dans la navigation E-Learning.

### Amélioré

- **CGU** : tarifs corrects (Silver 29€/mois ou 240€/an, Gold 499€/an), suppression engagement 12 mois, section Programme Ambassadeur Gold.
- **Emails** : tarifs et conditions alignés avec les CGU.
- **Module Pratique** : ordre d'affichage automatique si champ laissé vide.
- **Page abonnement** : section parrainage enrichie selon le rôle.
- **Parrainage Silver mensuel** : codes non proposés sur l'offre mensuelle.

### Corrigé

- Sécurité — trigger gamification passé en `SECURITY DEFINER` (erreur 403 progression vidéo).
- CSP — autorisation du widget Vercel Live.
- Programme ambassadeur — virement bancaire dès 50€ cumulés (pas un crédit plateforme).
- Revue de littérature — retours à la ligne respectés dans l'affichage des articles.
- Module Pratique — bug qui chargeait toujours la première vidéo au lieu de celle cliquée.
- Module Pratique — fallback visuel si miniature échoue au chargement.
