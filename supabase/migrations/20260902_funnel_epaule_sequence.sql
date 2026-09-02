-- Séquence email du funnel « examen-clinique-epaule »
--
-- Déclencheur : `funnel:examen-clinique-epaule` — posé par l'opt-in de la page
-- /f/examen-clinique-epaule (cf. docs/FUNNELS.md).
--
-- Cinq emails sur neuf jours. `wait_minutes` est un délai DEPUIS L'ÉTAPE
-- PRÉCÉDENTE (depuis l'inscription pour la première), comme dans les séquences
-- du cycle de vie existantes :
--   J+0   livraison de ce qui a été promis
--   J+2   un contenu utile, sans rien vendre
--   J+4   l'angle : pourquoi un test isolé ne suffit pas
--   J+6   l'offre, une seule fois, clairement
--   J+9   un dernier message, puis on s'arrête
--
-- `stop_on_subscribe = true` : quelqu'un qui s'abonne cesse aussitôt de
-- recevoir la suite. Sans ça, un nouvel abonné lirait « essayez gratuitement »
-- pour une offre qu'il vient de payer.
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
  'funnel-epaule-1-livraison',
  'Votre formation épaule est prête',
  'Funnel épaule — J+0, livraison',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Votre accès à <strong>« Examen clinique de l''épaule basé sur les preuves »</strong> est ouvert : 10 chapitres, 21 leçons.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/elearning" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Ouvrir la formation</a></p>'
    || '<p>Un conseil : ne commencez pas par les tests orthopédiques. Le chapitre sur le triage est celui qui change le plus de choses en consultation — c''est là que se joue ce qui ne relève pas de vous.</p>'
    || '<p>Vous avancez à votre rythme, l''accès ne se ferme pas.</p>'
    || '<p style="margin-top:28px;">Bonne lecture,<br>Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nVotre accès à « Examen clinique de l\'épaule basé sur les preuves » est ouvert : 10 chapitres, 21 leçons.\n\nOuvrir la formation : https://osteo-upgrade.fr/elearning\n\nUn conseil : ne commencez pas par les tests orthopédiques. Le chapitre sur le triage est celui qui change le plus de choses en consultation.\n\nVous avancez à votre rythme, l\'accès ne se ferme pas.\n\nBonne lecture,\nKevin'
),
(
  'funnel-epaule-2-neer',
  'Le test de Neer, et ce qu''il ne dit pas',
  'Funnel épaule — J+2, contenu utile',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Le Neer est sans doute le test d''épaule le plus pratiqué. Il est aussi l''un de ceux dont on tire le plus de conclusions abusives.</p>'
    || '<p>Sa sensibilité est correcte : un Neer négatif rend un conflit sous-acromial moins probable. Sa spécificité, en revanche, est faible — un Neer positif ne permet pas d''affirmer grand-chose. Beaucoup de choses le rendent positif.</p>'
    || '<p>Concrètement : ce test aide à <em>écarter</em>, pas à <em>affirmer</em>. Employé comme argument de confirmation, il oriente vers un diagnostic que rien ne soutient vraiment.</p>'
    || '<p>Le chapitre « Tests orthopédiques » de votre formation reprend ça test par test, avec les valeurs et l''usage recommandé.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/elearning" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Reprendre la formation</a></p>'
    || '<p style="margin-top:28px;">Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nLe Neer est sans doute le test d\'épaule le plus pratiqué, et l\'un de ceux dont on tire le plus de conclusions abusives.\n\nSa sensibilité est correcte : un Neer négatif rend un conflit sous-acromial moins probable. Sa spécificité est faible — un Neer positif ne permet pas d\'affirmer grand-chose.\n\nCe test aide à écarter, pas à affirmer.\n\nLe chapitre « Tests orthopédiques » reprend ça test par test.\n\nReprendre la formation : https://osteo-upgrade.fr/elearning\n\nKevin'
),
(
  'funnel-epaule-3-cluster',
  'Pourquoi un test isolé ne suffit jamais',
  'Funnel épaule — J+4, l''angle',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Un test isolé déplace peu la probabilité d''une hypothèse. Deux ou trois tests bien choisis, combinés à une anamnèse sérieuse, la déplacent assez pour décider.</p>'
    || '<p>C''est tout l''intérêt du raisonnement en cluster : on ne cherche pas le test parfait, on cherche à faire converger plusieurs signaux imparfaits.</p>'
    || '<p>Ça change la façon de mener une consultation. On arrête d''enchaîner les tests en espérant qu''un seul tranche, et on construit un raisonnement qui tient debout — y compris devant un patient qui demande pourquoi.</p>'
    || '<p>C''est la logique que suit toute la formation, du triage à la conclusion.</p>'
    || '<p style="margin-top:28px;">Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nUn test isolé déplace peu la probabilité d\'une hypothèse. Deux ou trois tests bien choisis, combinés à une anamnèse sérieuse, la déplacent assez pour décider.\n\nC\'est l\'intérêt du raisonnement en cluster : faire converger plusieurs signaux imparfaits.\n\nC\'est la logique que suit toute la formation, du triage à la conclusion.\n\nKevin'
),
(
  'funnel-epaule-4-offre',
  'Ce qu''il y a après l''épaule',
  'Funnel épaule — J+6, l''offre',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>La formation épaule reste à vous, gratuitement. Ce message est là pour vous dire ce qu''il y a autour, une fois, sans y revenir.</p>'
    || '<p>OsteoUpgrade, c''est six formations complètes (épaule, cheville, HVLA, mobilisations, éducation à la douleur, biostatistiques), une bibliothèque de tests orthopédiques avec leurs valeurs et leurs vidéos, une revue de littérature enrichie chaque mois, et des flashcards pour que tout ça reste.</p>'
    || '<p><strong>29,99 € par mois, sans engagement, avec 7 jours d''essai gratuit.</strong> Votre carte est demandée à l''inscription mais rien n''est prélevé pendant l''essai : si vous résiliez avant la fin, vous ne payez rien.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/f/examen-clinique-epaule" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Voir ce que ça contient</a></p>'
    || '<p>Et si ça ne vous intéresse pas, gardez la formation épaule : elle ne se ferme pas.</p>'
    || '<p style="margin-top:28px;">Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nLa formation épaule reste à vous, gratuitement. Ce message est là pour vous dire ce qu\'il y a autour, une fois.\n\nOsteoUpgrade : six formations complètes, une bibliothèque de tests orthopédiques avec leurs valeurs et leurs vidéos, une revue de littérature enrichie chaque mois, des flashcards.\n\n29,99 € par mois, sans engagement, avec 7 jours d\'essai gratuit. Rien n\'est prélevé pendant l\'essai.\n\nVoir ce que ça contient : https://osteo-upgrade.fr/f/examen-clinique-epaule\n\nEt si ça ne vous intéresse pas, gardez la formation épaule : elle ne se ferme pas.\n\nKevin'
),
(
  'funnel-epaule-5-cloture',
  'Je vous laisse tranquille',
  'Funnel épaule — J+9, dernier message',
  pg_temp.gabarit_epaule(
    '<p>Bonjour {{first_name}},</p>'
    || '<p>Dernier message de cette série — ensuite je vous laisse à votre pratique.</p>'
    || '<p>Si la formation épaule vous a été utile, le reste d''OsteoUpgrade suit la même logique : ce que dit la littérature, ce qu''on peut en conclure, et ce qu''on en fait en consultation.</p>'
    || '<p style="margin:28px 0;"><a href="https://osteo-upgrade.fr/f/examen-clinique-epaule" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;display:inline-block;">Essayer 7 jours</a></p>'
    || '<p>Et si le moment n''est pas le bon, ce n''est pas un problème : votre accès à la formation épaule reste ouvert, sans limite de temps.</p>'
    || '<p style="margin-top:28px;">Merci de m''avoir lu,<br>Kevin</p>'
  ),
  E'Bonjour {{first_name}},\n\nDernier message de cette série — ensuite je vous laisse à votre pratique.\n\nSi la formation épaule vous a été utile, le reste d\'OsteoUpgrade suit la même logique : ce que dit la littérature, ce qu\'on peut en conclure, et ce qu\'on en fait en consultation.\n\nEssayer 7 jours : https://osteo-upgrade.fr/f/examen-clinique-epaule\n\nEt si le moment n\'est pas le bon, votre accès à la formation épaule reste ouvert, sans limite de temps.\n\nMerci de m\'avoir lu,\nKevin'
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
  (1,    0, 'Votre formation épaule est prête',          'funnel-epaule-1-livraison'),
  (2, 2880, 'Le test de Neer, et ce qu''il ne dit pas',   'funnel-epaule-2-neer'),
  (3, 2880, 'Pourquoi un test isolé ne suffit jamais',    'funnel-epaule-3-cluster'),
  (4, 2880, 'Ce qu''il y a après l''épaule',              'funnel-epaule-4-offre'),
  (5, 4320, 'Je vous laisse tranquille',                  'funnel-epaule-5-cloture')
) AS e(step_order, wait_minutes, subject, template_slug)
WHERE a.trigger_event = 'funnel:examen-clinique-epaule';

COMMIT;
