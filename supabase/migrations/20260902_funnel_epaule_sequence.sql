-- Séquence email du funnel « examen-clinique-epaule »
--
-- Déclencheur : `funnel:examen-clinique-epaule` — posé par l'opt-in de la page
-- /f/examen-clinique-epaule (cf. docs/FUNNELS.md).
--
-- Trois emails sur cinq jours. `wait_minutes` est un délai DEPUIS L'ÉTAPE
-- PRÉCÉDENTE (depuis l'inscription pour la première), comme dans les séquences
-- du cycle de vie existantes :
--   J+0   le lien pour créer l'accès gratuit
--   J+2   une raison de revenir (contenu utile), et le lien à nouveau
--   J+5   dernier rappel, puis on s'arrête
--
-- POURQUOI SI COURT. Le formulaire du funnel ne crée pas de compte : il capte
-- un email. Or la formation épaule demande un accès gratuit. Le rôle de cette
-- séquence est donc UNIQUEMENT d'amener à créer cet accès — pas de vendre.
--
-- Dès que le compte existe, les séquences d'inscription existantes prennent le
-- relais (« Bienvenue - Inscription » puis « Relance Premium - Séquence
-- onboarding », 4 emails). Prolonger celle-ci ferait arriver deux séquences de
-- prospection en parallèle dans la même boîte mail.
--
-- `stop_on_subscribe = true` : quelqu'un qui s'abonne cesse aussitôt de
-- recevoir la suite. Sans ça, un nouvel abonné lirait « essayez gratuitement »
-- pour une offre qu'il vient de payer.
--
-- Attention : ce drapeau ne coupe QUE sur une souscription payante. Créer un
-- compte gratuit n'annule rien — d'où le format court, pour que le
-- recouvrement avec l'onboarding reste d'un ou deux messages au pire.
--
-- La séquence est créée INACTIVE. Elle ne partira qu'une fois relue et activée
-- dans Administration → Automatisations.
--
-- Le pied de désinscription et les en-têtes List-Unsubscribe sont ajoutés
-- automatiquement à l'envoi (lib/mailing.ts) : ne pas les remettre ici.

BEGIN;

-- ── Gabarits ───────────────────────────────────────────────────────────────
-- Référencés par `template_slug` = `mail_templates.name` (le processor accepte
-- un nom ou un UUID).

-- Rejouable : `mail_templates.name` ne porte pas de contrainte d'unicité, donc
-- pas d'`ON CONFLICT` possible ici. On repart des gabarits de ce funnel, dont
-- les noms sont préfixés `funnel-epaule-`.
DELETE FROM public.mail_templates WHERE name LIKE 'funnel-epaule-%';

CREATE OR REPLACE FUNCTION pg_temp.gabarit_epaule(corps text) RETURNS text AS $fn$
  SELECT '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      || '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
      || '<body style="margin:0;padding:0;font-family:Inter,-apple-system,BlinkMacSystemFont,''Segoe UI'',Arial,sans-serif;background-color:#f3f4f6;">'
      || '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>'
      || '<td align="center" style="padding:40px 20px;">'
      || '<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" '
      || 'style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">'
      || '<tr><td style="padding:36px 40px;color:#0f172a;font-size:16px;line-height:1.65;">'
      || corps
      || '</td></tr></table></td></tr></table></body></html>'
$fn$ LANGUAGE sql;

INSERT INTO public.mail_templates (name, subject, description, html, text) VALUES
(
  'funnel-epaule-1-acces',
  'Votre formation épaule vous attend',
  'Funnel épaule — J+0, lien de création d''accès',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Votre formation <strong>« Examen clinique de l''épaule basé sur les preuves »</strong> est prête : 10 chapitres, 21 leçons.</p>'
    || '<p>Il vous reste une étape : créer votre accès gratuit. Trente secondes, aucune carte bancaire.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Créer mon accès et ouvrir la formation</a></p>'
    || '<p>Un conseil pour commencer : ne sautez pas au chapitre des tests orthopédiques. Le triage est celui qui change le plus de choses en consultation — c''est là que se joue ce qui ne relève pas de vous.</p>'
    || '<p style="margin-top:28px;">Bonne lecture,<br>Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nVotre formation « Examen clinique de l\'épaule basé sur les preuves » est prête : 10 chapitres, 21 leçons.\n\nIl vous reste une étape : créer votre accès gratuit. Trente secondes, aucune carte bancaire.\n\nhttps://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nUn conseil : ne sautez pas au chapitre des tests orthopédiques. Le triage est celui qui change le plus de choses en consultation.\n\nBonne lecture,\nKevin'
),
(
  'funnel-epaule-2-neer',
  'Le test de Neer, et ce qu''il ne dit pas',
  'Funnel épaule — J+2, contenu utile + rappel du lien',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Le Neer est sans doute le test d''épaule le plus pratiqué. C''est aussi l''un de ceux dont on tire le plus de conclusions abusives.</p>'
    || '<p>Sa sensibilité est correcte : un Neer négatif rend un conflit sous-acromial moins probable. Sa spécificité, elle, est faible — un Neer positif ne permet pas d''affirmer grand-chose.</p>'
    || '<p><strong>Il aide à écarter, pas à affirmer.</strong> Employé comme argument de confirmation, il oriente vers un diagnostic que rien ne soutient vraiment.</p>'
    || '<p>Le chapitre « Tests orthopédiques » reprend ça test par test, avec les valeurs et l''usage en cluster.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Ouvrir la formation</a></p>'
    || '<p style="margin-top:28px;">Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nLe Neer est le test d\'épaule le plus pratiqué, et l\'un de ceux dont on tire le plus de conclusions abusives.\n\nSa sensibilité est correcte : un Neer négatif rend un conflit sous-acromial moins probable. Sa spécificité est faible — un Neer positif ne permet pas d\'affirmer grand-chose.\n\nIl aide à écarter, pas à affirmer.\n\nOuvrir la formation : https://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nKevin'
),
(
  'funnel-epaule-3-rappel',
  'Je vous laisse tranquille',
  'Funnel épaule — J+5, dernier rappel',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Dernier message de ma part à ce sujet — ensuite je vous laisse à votre pratique.</p>'
    || '<p>Votre formation épaule reste disponible, sans limite de temps. Si vous n''avez pas encore créé votre accès, c''est ici :</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Créer mon accès gratuit</a></p>'
    || '<p>Et si le moment n''est pas le bon, ce n''est pas un problème : rien n''expire.</p>'
    || '<p style="margin-top:28px;">Merci de m''avoir lu,<br>Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nDernier message de ma part à ce sujet — ensuite je vous laisse à votre pratique.\n\nVotre formation épaule reste disponible, sans limite de temps. Si vous n\'avez pas encore créé votre accès :\n\nhttps://osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nEt si le moment n\'est pas le bon, rien n\'expire.\n\nMerci de m\'avoir lu,\nKevin'
);

-- ── Séquence ───────────────────────────────────────────────────────────────

INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
SELECT
  'Funnel — Épaule (formation offerte)',
  'Séquence déclenchée par les inscriptions sur /f/examen-clinique-epaule',
  'funnel:examen-clinique-epaule',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.mail_automations
  WHERE trigger_event = 'funnel:examen-clinique-epaule'
);

-- ── Étapes ─────────────────────────────────────────────────────────────────
-- Rejouable : on repart d'une table d'étapes vide pour cette séquence.

DELETE FROM public.mail_automation_steps
WHERE automation_id IN (
  SELECT id FROM public.mail_automations
  WHERE trigger_event = 'funnel:examen-clinique-epaule'
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug)
SELECT a.id, e.step_order, e.wait_minutes, e.subject, e.template_slug
FROM public.mail_automations a
CROSS JOIN (VALUES
  (1,    0, 'Votre formation épaule vous attend',        'funnel-epaule-1-acces'),
  (2, 2880, 'Le test de Neer, et ce qu''il ne dit pas',   'funnel-epaule-2-neer'),
  (3, 4320, 'Je vous laisse tranquille',                  'funnel-epaule-3-rappel')
) AS e(step_order, wait_minutes, subject, template_slug)
WHERE a.trigger_event = 'funnel:examen-clinique-epaule';

COMMIT;
