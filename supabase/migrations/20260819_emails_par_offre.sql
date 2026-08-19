-- Phase 4 du passage à 3 offres — séquences d'emails par offre.
--
-- Problème corrigé : le déclencheur « Passage à Premium » partait pour
-- N'IMPORTE QUELLE offre payante et portait trois emails consacrés à
-- MyOsteoflow (bienvenue + installation, rappel J+7, astuces J+14). Un abonné
-- OsteoUpgrade seul aurait donc reçu trois relances sur un logiciel qu'il n'a
-- pas acheté et ne peut pas ouvrir — le premier partant immédiatement.
--
-- Le moteur d'emails ne fait que du remplacement {{variable}}, sans condition :
-- impossible de brancher le contenu dans un template. Il faut donc une
-- séquence par offre, et c'est le webhook qui émet l'événement correspondant.
--
-- Chaque séquence se termine par un email d'upsell à J+21, quand la personne a
-- pris ses marques : passer de 29,99 à 49,99 € coûte 20 € et donne l'autre
-- produit entier, soit 10 €/mois de moins que de le prendre séparément.

DO $mig$
DECLARE
  -- Gabarit commun, repris de l'habillage des emails existants.
  -- %1$s emoji · %2$s dégradé d'en-tête · %3$s titre · %4$s corps
  gabarit text :=
    '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
    '<body style="margin:0;padding:0;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background-color:#f3f4f6;">'
    '<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0"><tr>'
    '<td align="center" style="padding:40px 20px;">'
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" '
    'style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">'
    '<tr><td style="background:%2$s;padding:40px 40px 30px;border-radius:12px 12px 0 0;text-align:center;">'
    '<div style="font-size:48px;margin-bottom:10px;">%1$s</div>'
    '<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">%3$s</h1></td></tr>'
    '<tr><td style="padding:40px;">%4$s'
    '<p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Excellente pratique,<br>'
    '<strong style="color:#1f2937;">L&apos;équipe OsteoUpgrade × MyOsteoflow</strong></p>'
    '</td></tr><tr><td style="background-color:#f9fafb;padding:20px;border-radius:0 0 12px 12px;text-align:center;">'
    '<p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>'
    '</td></tr></table></td></tr></table></body></html>';

  bleu    text := 'linear-gradient(135deg,#4169F6 0%,#0ea5e9 100%)';
  violet  text := 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)';
  vert    text := 'linear-gradient(135deg,#059669 0%,#10b981 100%)';

  recap text := $r$
    <div style="background-color:#f5f3ff;border:2px solid #8b5cf6;padding:20px;margin:0 0 30px;border-radius:8px;">
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#6d28d9;">📋 Récapitulatif de votre abonnement</p>
      <ul style="margin:0;padding-left:20px;color:#4c1d95;">
        <li style="margin-bottom:8px;">Formule : <strong>{{nom}}</strong></li>
        <li style="margin-bottom:8px;">Prix : <strong>{{prix}}</strong></li>
        <li>Prochaine facturation : <strong>{{date_fact}}</strong></li>
      </ul>
      <p style="margin:14px 0 0;"><a href="{{facture_url}}" style="color:#6d28d9;font-weight:600;font-size:14px;text-decoration:underline;">🧾 Télécharger ma facture</a></p>
    </div>$r$;

  telechargement text := $t$
    <div style="background:linear-gradient(135deg,#eff6ff 0%,#e0e7ff 100%);border:2px solid #4169F6;padding:26px;margin:0 0 24px;border-radius:12px;">
      <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#1e3a8a;">💻 Installez MyOsteoflow sur votre ordinateur</p>
      <div style="text-align:center;">
        <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac-arm64" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:14px;margin:4px;">Mac (Apple Silicon)</a>
        <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:14px;margin:4px;">Mac (Intel)</a>
        <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=windows" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:14px;margin:4px;">Windows</a>
      </div>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#1e40af;">Connectez-vous avec les identifiants de votre compte OsteoUpgrade.</p>
    </div>$t$;

  cta_offre text := $c$
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display:inline-block;background:linear-gradient(135deg,#4169F6 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Changer d&apos;offre</a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">Le changement est immédiat, sans engagement, et le prorata est calculé automatiquement.</p>$c$;

  corps_a1 text; corps_a2 text; corps_b1 text; corps_b2 text; corps_b3 text;
  id_auto_of uuid := 'aa000000-0000-4000-8000-000000000001';
  id_auto_ou uuid := 'bb000000-0000-4000-8000-000000000001';
BEGIN

corps_a1 :=
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Bonjour <strong>{{full_name}}</strong>,</p>'
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Votre abonnement <strong>MyOsteoflow</strong> est actif. Vous pouvez dès maintenant installer le logiciel et commencer à gérer vos patients, vos consultations et votre facturation.</p>'
  || recap || telechargement ||
  '<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">Besoin d&apos;un coup de main pour démarrer ? Répondez simplement à cet email.</p>';

corps_a2 :=
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Bonjour <strong>{{full_name}}</strong>,</p>'
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Cela fait trois semaines que vous gérez votre cabinet avec MyOsteoflow. Votre pratique clinique, elle, mérite le même soin.</p>'
  '<div style="background-color:#ecfdf5;border:2px solid #10b981;padding:22px;margin:0 0 24px;border-radius:12px;">'
  '<p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#065f46;">Ce qu&apos;OsteoUpgrade ajoute à votre abonnement</p>'
  '<ul style="margin:0;padding-left:20px;color:#065f46;font-size:15px;line-height:1.7;">'
  '<li>L&apos;e-learning complet, actualisé en continu, avec quiz</li>'
  '<li>La bibliothèque de tests orthopédiques et leurs exports PDF</li>'
  '<li>Le module pratique en vidéo : techniques, mobilisations, palpations</li>'
  '<li>OsteoFlash, les flashcards cliniques</li>'
  '<li>La revue de littérature mensuelle et les topographies</li>'
  '</ul></div>'
  '<div style="background-color:#fffbeb;border:2px solid #f59e0b;padding:22px;margin:0 0 24px;border-radius:12px;text-align:center;">'
  '<p style="margin:0 0 6px;font-size:15px;color:#92400e;">Vous payez aujourd&apos;hui <strong>29,99 €/mois</strong></p>'
  '<p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#78350f;">L&apos;offre Premium est à 49,99 €/mois</p>'
  '<p style="margin:0;font-size:15px;color:#92400e;">Soit <strong>20 € de plus</strong> pour tout OsteoUpgrade, au lieu de 29,99 € s&apos;il était pris séparément — <strong>10 €/mois d&apos;économie</strong>.</p>'
  '</div>' || cta_offre;

corps_b1 :=
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Bonjour <strong>{{full_name}}</strong>,</p>'
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Votre abonnement <strong>OsteoUpgrade</strong> est actif. Toute la base clinique vous est ouverte, sur toutes les régions anatomiques.</p>'
  || recap ||
  '<div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:2px solid #7c3aed;padding:26px;margin:0 0 24px;border-radius:12px;">'
  '<p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#5b21b6;">🎓 Ce qui vient de se débloquer</p>'
  '<ul style="margin:0 0 18px;padding-left:20px;color:#5b21b6;font-size:15px;line-height:1.7;">'
  '<li>E-learning complet et quiz</li><li>Tests orthopédiques + export PDF</li>'
  '<li>Module pratique en vidéo</li><li>OsteoFlash — flashcards cliniques</li>'
  '<li>Revue de littérature mensuelle</li><li>Topographie clinique</li></ul>'
  '<div style="text-align:center;"><a href="https://www.osteo-upgrade.fr/dashboard" style="display:inline-block;background:#5b21b6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Accéder à ma plateforme</a></div>'
  '</div>';

corps_b2 :=
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Bonjour <strong>{{full_name}}</strong>,</p>'
  '<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">Une semaine que vous avez rejoint OsteoUpgrade. Si vous ne savez pas par où commencer, voici trois portes d&apos;entrée.</p>'
  '<div style="border-left:4px solid #7c3aed;padding:4px 0 4px 18px;margin:0 0 20px;">'
  '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1f2937;">1. Un cours, du début à la fin</p>'
  '<p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Les formations sont découpées en chapitres courts, avec un quiz à la clé. <a href="https://www.osteo-upgrade.fr/elearning/cours" style="color:#7c3aed;font-weight:600;">Voir les formations</a></p></div>'
  '<div style="border-left:4px solid #7c3aed;padding:4px 0 4px 18px;margin:0 0 20px;">'
  '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1f2937;">2. Les tests de la région que vous voyez le plus</p>'
  '<p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Indications, exécution, interprétation — et l&apos;export PDF à donner au patient. <a href="https://www.osteo-upgrade.fr/tests" style="color:#7c3aed;font-weight:600;">Explorer les tests</a></p></div>'
  '<div style="border-left:4px solid #7c3aed;padding:4px 0 4px 18px;margin:0 0 24px;">'
  '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1f2937;">3. Dix minutes d&apos;OsteoFlash</p>'
  '<p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Des flashcards en répétition espacée, pour ancrer ce que vous venez d&apos;apprendre. <a href="https://www.osteo-upgrade.fr/flashcards" style="color:#7c3aed;font-weight:600;">Réviser</a></p></div>';

corps_b3 :=
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Bonjour <strong>{{full_name}}</strong>,</p>'
  '<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Vous faites progresser votre pratique avec OsteoUpgrade depuis trois semaines. Et la gestion de votre cabinet, où en est-elle ?</p>'
  '<div style="background:linear-gradient(135deg,#eff6ff 0%,#e0e7ff 100%);border:2px solid #4169F6;padding:22px;margin:0 0 24px;border-radius:12px;">'
  '<p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#1e3a8a;">Ce que MyOsteoflow ajoute à votre abonnement</p>'
  '<ul style="margin:0;padding-left:20px;color:#1e40af;font-size:15px;line-height:1.7;">'
  '<li>Dossiers patients et consultations, sur votre ordinateur</li>'
  '<li>Prise de note par dictée vocale IA</li>'
  '<li>Aide au raisonnement clinique, adossée aux tests OsteoUpgrade</li>'
  '<li>Facturation, comptabilité et statistiques de cabinet</li>'
  '<li>Fiches d&apos;exercices patients avec export PDF</li>'
  '</ul></div>'
  '<div style="background-color:#fffbeb;border:2px solid #f59e0b;padding:22px;margin:0 0 24px;border-radius:12px;text-align:center;">'
  '<p style="margin:0 0 6px;font-size:15px;color:#92400e;">Vous payez aujourd&apos;hui <strong>29,99 €/mois</strong></p>'
  '<p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#78350f;">L&apos;offre Premium est à 49,99 €/mois</p>'
  '<p style="margin:0;font-size:15px;color:#92400e;">Soit <strong>20 € de plus</strong> pour tout MyOsteoflow, au lieu de 29,99 € s&apos;il était pris séparément — <strong>10 €/mois d&apos;économie</strong>.</p>'
  '</div>' || cta_offre;

-- ── Templates ────────────────────────────────────────────────────────────
INSERT INTO public.mail_templates (id, name, subject, description, html) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'MyOsteoFlow - Bienvenue',
   'Bienvenue sur MyOsteoflow ! 💻 Installez le logiciel',
   'Premier email de la séquence Abonnement MyOsteoFlow',
   format(gabarit, '💻', bleu, 'Bienvenue sur MyOsteoflow !', corps_a1)),
  ('a2000000-0000-4000-8000-000000000001', 'MyOsteoFlow - Upsell OsteoUpgrade J+21',
   'Et si votre pratique suivait le même rythme ? 🎓',
   'Upsell vers l''offre Premium, envoyé 21 jours après la souscription MyOsteoFlow',
   format(gabarit, '🎓', vert, 'Il vous manque l&apos;autre moitié', corps_a2)),
  ('b1000000-0000-4000-8000-000000000001', 'OsteoUpgrade - Bienvenue',
   'Bienvenue sur OsteoUpgrade ! 🎓',
   'Premier email de la séquence Abonnement OsteoUpgrade',
   format(gabarit, '🎓', violet, 'Bienvenue sur OsteoUpgrade !', corps_b1)),
  ('b2000000-0000-4000-8000-000000000001', 'OsteoUpgrade - Par où commencer J+7',
   '🧭 Par où commencer sur OsteoUpgrade ?',
   'Orientation envoyée 7 jours après la souscription OsteoUpgrade',
   format(gabarit, '🧭', violet, 'Par où commencer ?', corps_b2)),
  ('b3000000-0000-4000-8000-000000000001', 'OsteoUpgrade - Upsell MyOsteoFlow J+21',
   'Et si votre cabinet suivait le même rythme ? 💻',
   'Upsell vers l''offre Premium, envoyé 21 jours après la souscription OsteoUpgrade',
   format(gabarit, '💻', bleu, 'Et votre cabinet ?', corps_b3))
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, subject = EXCLUDED.subject,
      description = EXCLUDED.description, html = EXCLUDED.html, updated_at = now();

-- ── Automatisations ──────────────────────────────────────────────────────
INSERT INTO public.mail_automations (id, name, description, trigger_event, active, display_order) VALUES
  (id_auto_of, 'Abonnement MyOsteoFlow',
   'Séquence de bienvenue de l''offre MyOsteoFlow seul, avec upsell vers Premium à J+21',
   'Abonnement MyOsteoFlow', true, 12),
  (id_auto_ou, 'Abonnement OsteoUpgrade',
   'Séquence de bienvenue de l''offre OsteoUpgrade seul, avec upsell vers Premium à J+21',
   'Abonnement OsteoUpgrade', true, 13)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      trigger_event = EXCLUDED.trigger_event, active = EXCLUDED.active;

DELETE FROM public.mail_automation_steps WHERE automation_id IN (id_auto_of, id_auto_ou);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug) VALUES
  -- MyOsteoFlow : le rappel d'installation J+7 est partagé avec la séquence Premium
  (id_auto_of, 1, 0,     'Bienvenue sur MyOsteoflow ! 💻 Installez le logiciel', 'a1000000-0000-4000-8000-000000000001'),
  (id_auto_of, 2, 10080, '📲 Avez-vous installé MyOsteoflow ?',                  'f4444444-4444-4444-4444-444444444444'),
  (id_auto_of, 3, 30240, 'Et si votre pratique suivait le même rythme ? 🎓',      'a2000000-0000-4000-8000-000000000001'),
  -- OsteoUpgrade
  (id_auto_ou, 1, 0,     'Bienvenue sur OsteoUpgrade ! 🎓',                       'b1000000-0000-4000-8000-000000000001'),
  (id_auto_ou, 2, 10080, '🧭 Par où commencer sur OsteoUpgrade ?',                'b2000000-0000-4000-8000-000000000001'),
  (id_auto_ou, 3, 30240, 'Et si votre cabinet suivait le même rythme ? 💻',        'b3000000-0000-4000-8000-000000000001');

END $mig$;

-- ─────────────────────────────────────────────────────────────────────────
-- Sujets encore adossés à une offre unique
-- ─────────────────────────────────────────────────────────────────────────
-- {{nom}} porte le nom de l'offre réellement souscrite (MyOsteoFlow,
-- OsteoUpgrade ou Premium) et est déjà transmis par le webhook.

UPDATE public.mail_templates SET subject = 'Votre essai gratuit {{nom}} a démarré 🎁'
WHERE id = 'e3333333-3333-3333-3333-333333333333';
UPDATE public.mail_automation_steps SET subject = 'Votre essai gratuit {{nom}} a démarré 🎁'
WHERE template_slug = 'e3333333-3333-3333-3333-333333333333';

UPDATE public.mail_templates SET subject = 'Votre essai gratuit {{nom}} a été annulé'
WHERE id = 'e9999999-9999-9999-9999-999999999999';
UPDATE public.mail_automation_steps SET subject = 'Votre essai gratuit {{nom}} a été annulé'
WHERE template_slug = 'e9999999-9999-9999-9999-999999999999';

UPDATE public.mail_templates SET subject = 'Votre abonnement {{nom}} a été annulé'
WHERE id = 'e6666666-6666-6666-6666-666666666666';
UPDATE public.mail_automation_steps SET subject = 'Votre abonnement {{nom}} a été annulé'
WHERE template_slug = 'e6666666-6666-6666-6666-666666666666';

-- ─────────────────────────────────────────────────────────────────────────
-- Essai gratuit : le contenu ne peut plus prétendre que seul MyOsteoflow
-- est débloqué — l'essai donne désormais l'accès complet à l'offre choisie.
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.mail_templates
SET html = replace(
      replace(
        html,
        'Vous avez démarré votre essai gratuit de <strong>7 jours</strong> sur <strong>MyOsteoflow</strong>, le logiciel de gestion de cabinet. Vous pouvez dès maintenant l&apos;installer et gérer vos patients, consultations et dossiers.',
        'Vous avez démarré votre essai gratuit de <strong>7 jours</strong> sur l&apos;offre <strong>{{nom}}</strong>. Vous y avez accès en intégralité, dès maintenant et jusqu&apos;à la fin de l&apos;essai.'
      ),
      'Accès à <strong>MyOsteoflow</strong> jusqu&apos;au <strong>{{date_fin_essai}}</strong>',
      'Accès complet à <strong>{{nom}}</strong> jusqu&apos;au <strong>{{date_fin_essai}}</strong>'
    )
WHERE id = 'e3333333-3333-3333-3333-333333333333';

-- L'avertissement « seul MyOsteoflow est débloqué » est devenu faux : on
-- retire le bloc entier plutôt que de le réécrire.
UPDATE public.mail_templates
SET html = regexp_replace(
      html,
      '<div[^>]*>\s*<p[^>]*>⚠️ <strong>Important :</strong>.*?</div>',
      '',
      'gs'
    )
WHERE id = 'e3333333-3333-3333-3333-333333333333'
  AND html LIKE '%seul MyOsteoflow est débloqué%';

-- ─────────────────────────────────────────────────────────────────────────
-- Arrêt des relances prospect à la souscription
-- ─────────────────────────────────────────────────────────────────────────
-- Les inscriptions en séquence n'étaient annulées qu'en cas de désabonnement.
-- Un compte gratuit qui s'abonnait continuait donc de recevoir « Passez
-- Premium, débloquez tout » pendant des semaines. Ce drapeau marque les
-- séquences de prospection, que le webhook interrompt à la souscription.

ALTER TABLE public.mail_automations
  ADD COLUMN IF NOT EXISTS stop_on_subscribe boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mail_automations.stop_on_subscribe IS
  'Séquence de prospection : ses inscriptions en cours sont annulées dès que le contact souscrit une offre payante.';

UPDATE public.mail_automations
SET stop_on_subscribe = true
WHERE trigger_event = 'user_registered'
  AND name = 'Relance Premium - Séquence onboarding';
