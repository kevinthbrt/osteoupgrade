-- Séquence email du funnel « examen-clinique-epaule »
--
-- Déclencheur : `funnel:examen-clinique-epaule` : posé par l'opt-in de la page
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
-- séquence est donc UNIQUEMENT d'amener à créer cet accès : pas de vendre.
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
-- compte gratuit n'annule rien : d'où le format court, pour que le
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

-- Coquille reprise des gabarits existants (cf. « Onboarding gratuit - J+1 ») :
-- bandeau dégradé violet, corps blanc, encarts lavande, bouton dégradé, pied
-- de page. Les emails du funnel doivent être indistinguables des autres.
CREATE OR REPLACE FUNCTION pg_temp.gabarit_epaule(
  emoji text, titre text, sous_titre text, corps text
) RETURNS text AS $fn$
  SELECT '<!DOCTYPE html>' || chr(10) || '<html>' || chr(10)
    || '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' || chr(10)
    || '<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif; background-color: #f3f4f6;">' || chr(10)
    || '  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">' || chr(10)
    || '    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' || chr(10)
    || '      <tr><td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">' || chr(10)
    || '        <div style="font-size: 42px; margin-bottom: 6px;">' || emoji || '</div>' || chr(10)
    || '        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">' || titre || '</h1>' || chr(10)
    || '        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">' || sous_titre || '</p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '      <tr><td style="padding: 40px;">' || chr(10)
    || corps || chr(10)
    || '        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">À très vite,<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade × MyOsteoflow</strong></p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">' || chr(10)
    || '        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '    </table>' || chr(10)
    || '  </td></tr></table>' || chr(10)
    || '</body></html>'
$fn$ LANGUAGE sql;

INSERT INTO public.mail_templates (name, subject, description, html, text) VALUES
(
  'funnel-epaule-1-acces',
  'Votre formation épaule vous attend',
  'Funnel épaule : J+0, lien de création d''accès',
  pg_temp.gabarit_epaule(
    '🦴',
    'Votre formation vous attend',
    'Examen clinique de l''épaule basé sur les preuves',
    '        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{first_name}}</strong>,</p>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Votre formation est prête : <strong>10 chapitres, 21 leçons</strong>. Il vous reste une étape, créer votre accès gratuit. Trente secondes, aucune carte bancaire.</p>'
    || '<div style="text-align: center; margin: 0 0 28px;"><a href="https://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Créer mon accès et ouvrir la formation</a></div>'
    || '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 8px;"><tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #374151;"><strong>Un conseil pour commencer.</strong> Ne sautez pas au chapitre des tests orthopédiques. Le triage est celui qui change le plus de choses en consultation : c''est là que se joue ce qui ne relève pas de vous.</td></tr></table>'
  ),
  E'Bonjour {{first_name}},\n\nVotre formation « Examen clinique de l\'épaule basé sur les preuves » est prête : 10 chapitres, 21 leçons.\n\nIl vous reste une étape, créer votre accès gratuit. Trente secondes, aucune carte bancaire.\n\nhttps://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nUn conseil pour commencer : ne sautez pas au chapitre des tests orthopédiques. Le triage est celui qui change le plus de choses en consultation.\n\nÀ très vite,\nL\'équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-epaule-2-neer',
  'Le test de Neer, et ce qu''il ne dit pas',
  'Funnel épaule : J+2, contenu utile et rappel du lien',
  pg_temp.gabarit_epaule(
    '🔬',
    'Le test de Neer',
    'Ce qu''il permet de conclure, et ce qu''il ne permet pas',
    '        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{first_name}}</strong>,</p>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">C''est sans doute le test d''épaule le plus pratiqué. C''est aussi l''un de ceux dont on tire le plus de conclusions abusives.</p>'
    || '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">'
    || '<tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #374151;"><strong>Sensibilité correcte.</strong> Un Neer négatif rend un conflit sous-acromial moins probable.</td></tr>'
    || '<tr><td style="height: 8px;"></td></tr>'
    || '<tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #374151;"><strong>Spécificité faible.</strong> Un Neer positif ne permet pas d''affirmer grand-chose. Beaucoup de choses le rendent positif.</td></tr>'
    || '</table>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Autrement dit, il aide à <strong>écarter</strong>, pas à <strong>affirmer</strong>. Employé comme argument de confirmation, il oriente vers un diagnostic que rien ne soutient vraiment.</p>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Le chapitre « Tests orthopédiques » reprend ça test par test, avec les valeurs et l''usage en cluster.</p>'
    || '<div style="text-align: center; margin: 0;"><a href="https://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Ouvrir la formation</a></div>'
  ),
  E'Bonjour {{first_name}},\n\nLe Neer est sans doute le test d\'épaule le plus pratiqué, et l\'un de ceux dont on tire le plus de conclusions abusives.\n\nSensibilité correcte : un Neer négatif rend un conflit sous-acromial moins probable.\nSpécificité faible : un Neer positif ne permet pas d\'affirmer grand-chose.\n\nAutrement dit, il aide à écarter, pas à affirmer.\n\nLe chapitre « Tests orthopédiques » reprend ça test par test.\n\nOuvrir la formation : https://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nÀ très vite,\nL\'équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-epaule-3-rappel',
  'Je vous laisse tranquille',
  'Funnel épaule : J+5, dernier rappel',
  pg_temp.gabarit_epaule(
    '👋',
    'Dernier message',
    'Votre formation reste disponible, sans limite de temps',
    '        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{first_name}}</strong>,</p>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Dernier message de notre part à ce sujet. Ensuite nous vous laissons à votre pratique.</p>'
    || '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Si vous n''avez pas encore créé votre accès, la formation vous attend toujours : 10 chapitres, 21 leçons, gratuitement.</p>'
    || '<div style="text-align: center; margin: 0 0 24px;"><a href="https://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Créer mon accès gratuit</a></div>'
    || '<p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">Et si le moment n''est pas le bon, ce n''est pas un problème : rien n''expire.</p>'
  ),
  E'Bonjour {{first_name}},\n\nDernier message de notre part à ce sujet. Ensuite nous vous laissons à votre pratique.\n\nSi vous n\'avez pas encore créé votre accès, la formation vous attend toujours : 10 chapitres, 21 leçons, gratuitement.\n\nhttps://www.osteo-upgrade.fr/auth?funnel=examen-clinique-epaule\n\nEt si le moment n\'est pas le bon, ce n\'est pas un problème : rien n\'expire.\n\nÀ très vite,\nL\'équipe OsteoUpgrade × MyOsteoflow'
);

-- ── Séquence ───────────────────────────────────────────────────────────────

INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
SELECT
  'Funnel : Épaule (formation offerte)',
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
