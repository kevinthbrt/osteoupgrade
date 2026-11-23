-- Black Friday 2026 : -30 % sur la première année des offres annuelles
-- (cf. docs/BLACK_FRIDAY_2026.md).
--
-- 1. `promo_email_sends` : journal des emails de campagne envoyés, une ligne
--    par (campagne, email, compte). La clé primaire rend le cron idempotent :
--    relancé le même jour, ou plusieurs jours de suite, il n'écrit à personne
--    deux fois. Aucune politique RLS : seul le serveur (service-role) y accède.
--
-- 2. Deux emails adressés aux adhérents mensuels payants (hors fondateurs et
--    comptes offerts), envoyés par /api/promo/black-friday/emails :
--      - lancement, à partir du lundi 23 novembre ;
--      - relance « dernier jour », le lundi 30 novembre, à ceux qui sont
--        toujours au mois.
--    Variables posées sur l'inscription : {{offre}}, {{prix_bf}},
--    {{prix_annuel}}, {{prix_mensuel_12}}, {{economie}}.
--    Gabarit de référence : Onboarding gratuit - J+1.

CREATE TABLE IF NOT EXISTS public.promo_email_sends (
  campaign text NOT NULL,
  email_kind text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign, email_kind, user_id)
);

COMMENT ON TABLE public.promo_email_sends IS
  'Emails de campagne promotionnelle déjà envoyés (anti-doublon du cron). Écrit uniquement par le serveur.';

ALTER TABLE public.promo_email_sends ENABLE ROW LEVEL SECURITY;

INSERT INTO public.mail_templates (id, name, subject, description, html, text)
VALUES (
  'bf000000-0000-4000-8000-000000000001',
  'Black Friday 2026 - Lancement adhérents',
  'Black Friday : passez à l’annuel à -30 % (réservé aux adhérents)',
  'Envoyé à partir du 23/11/2026 aux adhérents mensuels. Variables : {{offre}}, {{prix_bf}}, {{prix_annuel}}, {{prix_mensuel_12}}, {{economie}}.',
  $html$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">🖤</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Black Friday : -30 % pour nos adhérents</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Jusqu’au lundi 30 novembre à minuit</p>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Merci de votre confiance sur {{offre}}. Pour le Black Friday, nous réservons à nos adhérents une offre qui n’existe pas le reste de l’année :</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;"><strong>passez à l’abonnement annuel et payez votre première année 30 % moins cher.</strong></p>
        <div style="padding: 16px 20px; background-color: #f5f3ff; border-radius: 8px; margin: 0 0 20px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.04em;">Votre offre Black Friday</p>
          <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.6; color: #374151;"><strong>{{offre}} : {{prix_bf}}</strong> la première année, au lieu de {{prix_annuel}}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">Soit <strong>{{economie}} d’économie</strong> par rapport à douze mois au tarif mensuel ({{prix_mensuel_12}}).</p>
        </div>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Le reste de votre mois en cours est déduit automatiquement. Ensuite, votre abonnement se renouvelle au tarif annuel habituel : la remise porte sur la première année uniquement.</p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Passer à l’annuel à -30 %</a>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Vous verrez le montant exact sur la page de confirmation avant de valider : rien ne change tant que vous n’avez pas confirmé. Une question ? Répondez simplement à cet email.</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bien à vous,<br><strong style="color: #1f2937;">L’équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$html$,
  $text$Bonjour {{full_name}},

Merci de votre confiance sur {{offre}}. Pour le Black Friday, nous réservons à nos adhérents une offre qui n’existe pas le reste de l’année : passez à l’abonnement annuel et payez votre première année 30 % moins cher.

{{offre}} : {{prix_bf}} la première année, au lieu de {{prix_annuel}}.
Soit {{economie}} d’économie par rapport à douze mois au tarif mensuel ({{prix_mensuel_12}}).

Le reste de votre mois en cours est déduit automatiquement. Ensuite, votre abonnement se renouvelle au tarif annuel habituel : la remise porte sur la première année uniquement.

Offre valable jusqu’au lundi 30 novembre à minuit, depuis votre espace abonnement :
https://www.osteo-upgrade.fr/settings/subscription

Vous verrez le montant exact sur la page de confirmation avant de valider : rien ne change tant que vous n’avez pas confirmé. Une question ? Répondez simplement à cet email.

Bien à vous,
L’équipe OsteoUpgrade × MyOsteoflow$text$
)
ON CONFLICT (id) DO NOTHING;

WITH auto AS (
  INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
  SELECT 'Black Friday 2026 - Lancement adhérents', 'Offre Black Friday aux adhérents mensuels (/api/promo/black-friday/emails).', 'Black Friday 2026 - Lancement', true, false
  WHERE NOT EXISTS (SELECT 1 FROM public.mail_automations WHERE trigger_event = 'Black Friday 2026 - Lancement')
  RETURNING id
)
INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT id, 1, 0, 'Black Friday : passez à l’annuel à -30 % (réservé aux adhérents)', 'bf000000-0000-4000-8000-000000000001', '{}'::jsonb
FROM auto;

INSERT INTO public.mail_templates (id, name, subject, description, html, text)
VALUES (
  'bf000000-0000-4000-8000-000000000002',
  'Black Friday 2026 - Dernier jour',
  'Dernier jour : -30 % sur votre première année en annuel',
  'Envoyé le 30/11/2026 aux adhérents encore au mois. Variables : {{offre}}, {{prix_bf}}, {{prix_annuel}}, {{prix_mensuel_12}}, {{economie}}.',
  $html$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">⏳</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Dernier jour pour le Black Friday</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">L’offre se termine ce soir à minuit</p>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Petit rappel : l’offre Black Friday réservée à nos adhérents se termine <strong>ce soir, lundi 30 novembre, à minuit</strong>. Après, le passage à l’annuel reviendra à son tarif habituel.</p>
        <div style="padding: 16px 20px; background-color: #f5f3ff; border-radius: 8px; margin: 0 0 20px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.04em;">Encore aujourd’hui</p>
          <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.6; color: #374151;"><strong>{{offre}} : {{prix_bf}}</strong> la première année, au lieu de {{prix_annuel}}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">Soit <strong>{{economie}} d’économie</strong> par rapport à douze mois au tarif mensuel ({{prix_mensuel_12}}).</p>
        </div>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Le reste de votre mois en cours est déduit automatiquement. Ensuite, votre abonnement se renouvelle au tarif annuel habituel : la remise porte sur la première année uniquement.</p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Profiter de l’offre avant minuit</a>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Vous verrez le montant exact sur la page de confirmation avant de valider : rien ne change tant que vous n’avez pas confirmé. Une question ? Répondez simplement à cet email.</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bien à vous,<br><strong style="color: #1f2937;">L’équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$html$,
  $text$Bonjour {{full_name}},

Petit rappel : l’offre Black Friday réservée à nos adhérents se termine ce soir, lundi 30 novembre, à minuit. Après, le passage à l’annuel reviendra à son tarif habituel.

{{offre}} : {{prix_bf}} la première année, au lieu de {{prix_annuel}}.
Soit {{economie}} d’économie par rapport à douze mois au tarif mensuel ({{prix_mensuel_12}}).

Le reste de votre mois en cours est déduit automatiquement. Ensuite, votre abonnement se renouvelle au tarif annuel habituel : la remise porte sur la première année uniquement.

Votre espace abonnement : https://www.osteo-upgrade.fr/settings/subscription

Vous verrez le montant exact sur la page de confirmation avant de valider : rien ne change tant que vous n’avez pas confirmé.

Bien à vous,
L’équipe OsteoUpgrade × MyOsteoflow$text$
)
ON CONFLICT (id) DO NOTHING;

WITH auto AS (
  INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
  SELECT 'Black Friday 2026 - Dernier jour', 'Relance « dernier jour » de l’offre Black Friday (/api/promo/black-friday/emails).', 'Black Friday 2026 - Dernier jour', true, false
  WHERE NOT EXISTS (SELECT 1 FROM public.mail_automations WHERE trigger_event = 'Black Friday 2026 - Dernier jour')
  RETURNING id
)
INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT id, 1, 0, 'Dernier jour : -30 % sur votre première année en annuel', 'bf000000-0000-4000-8000-000000000002', '{}'::jsonb
FROM auto;
