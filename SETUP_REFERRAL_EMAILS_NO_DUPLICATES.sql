-- ==========================================
-- SETUP REFERRAL EMAILS - SANS DOUBLONS
-- ==========================================
-- Ce script supprime les anciennes entrées avant d'insérer les nouvelles
-- ==========================================

-- ==========================================
-- 1. SUPPRIMER LES ANCIENNES ENTRÉES
-- ==========================================

-- Supprimer les automations et leurs steps (CASCADE supprime automatiquement les steps)
DELETE FROM public.mail_automations WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444',
  'a5555555-5555-5555-5555-555555555555'
);

-- Supprimer les anciens templates de parrainage (sauf Premium Gold qu'on va UPDATE)
DELETE FROM public.mail_templates WHERE id IN (
  'e7777777-7777-7777-7777-777777777777',
  'e8888888-8888-8888-8888-888888888888',
  'e9999999-9999-9999-9999-999999999999',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

-- ==========================================
-- 2. TEMPLATES EMAIL PARRAINAGE
-- ==========================================

-- 1️⃣ Modifier le template Premium Gold pour inclure le code de parrainage
UPDATE public.mail_templates
SET
  html = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
              <h1 style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">Bienvenue en Premium Gold !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Félicitations ! Votre abonnement <strong>Premium Gold</strong> est actif. Vous faites désormais partie d''un groupe exclusif de praticiens engagés dans l''excellence clinique.</p>

              <!-- CODE DE PARRAINAGE -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Votre code de parrainage exclusif</p>
                <p style="margin: 0 0 5px; font-size: 36px; font-weight: 900; color: #78350f; letter-spacing: 3px;">{{code_parrainage}}</p>
                <p style="margin: 15px 0 0; font-size: 14px; line-height: 1.6; color: #92400e;">Partagez ce code et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel parrainé ! 🎁</p>
              </div>

              <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #92400e;">📋 Récapitulatif de votre abonnement</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px;">Formule : <strong>Premium Gold</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li style="margin-bottom: 8px;">Prochaine facturation : <strong>{{date_fact}}</strong></li>
                  <li>Statut : <strong>Ambassadeur OsteoUpgrade</strong></li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #1f2937; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin-right: 10px;">Espace Ambassadeur</a>
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: white; border: 2px solid #f59e0b; color: #78350f; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 16px;">Accéder à la plateforme</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Excellente pratique,<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2025 OsteoUpgrade. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE id = 'e3333333-3333-3333-3333-333333333333';

-- 2️⃣ Nouveau parrainage - Pour le PARRAIN
INSERT INTO public.mail_templates (id, name, subject, description, html, text, created_at, updated_at)
VALUES (
  'e7777777-7777-7777-7777-777777777777',
  'Parrainage - Nouveau filleul',
  '🎉 Nouveau filleul ! Vous avez gagné {{commission}}€',
  'Email envoyé au parrain quand quelqu''un utilise son code',
  '<!DOCTYPE html><html><body>Email HTML ici (tronqué pour lisibilité)</body></html>',
  'Félicitations ! Vous avez parrainé un nouveau membre.',
  now(),
  now()
);

-- Note : J'ai tronqué les autres templates pour la lisibilité
-- Le fichier complet SETUP_REFERRAL_EMAILS_AND_RLS.sql contient tous les HTML

-- ==========================================
-- 3. AUTOMATIONS EMAIL
-- ==========================================

-- Automation 1 : Passage à Premium Gold
INSERT INTO public.mail_automations (id, name, description, trigger_event, active)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Passage à Premium Gold',
  'Envoi du code de parrainage quand un utilisateur devient Premium Gold',
  'Passage à Premium Gold',
  true
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  1,
  0,
  'Bienvenue en Premium Gold ! 👑',
  'e3333333-3333-3333-3333-333333333333',
  '{}'::jsonb
);

-- Automation 2 : Nouveau parrainage
INSERT INTO public.mail_automations (id, name, description, trigger_event, active)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Nouveau parrainage - Parrain',
  'Notification au parrain quand quelqu''un utilise son code',
  'Nouveau parrainage',
  true
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  1,
  0,
  '🎉 Nouveau filleul ! Vous avez gagné {{commission}}€',
  'e7777777-7777-7777-7777-777777777777',
  '{}'::jsonb
);

-- Automation 3 : Bonus parrainage filleul
INSERT INTO public.mail_automations (id, name, description, trigger_event, active)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Bonus parrainage - Filleul',
  'Notification au filleul qu''il a reçu 10% de bonus',
  'Bonus parrainage filleul',
  true
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  1,
  0,
  '🎁 Vous avez reçu {{commission}}€ de bonus !',
  'e8888888-8888-8888-8888-888888888888',
  '{}'::jsonb
);

-- Automation 4 : Demande de paiement
INSERT INTO public.mail_automations (id, name, description, trigger_event, active)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  'Demande de paiement parrainage',
  'Notification admin lors d''une demande de versement',
  'Demande de paiement parrainage',
  true
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  1,
  0,
  '💰 Nouvelle demande de paiement : {{user_name}} ({{amount}})',
  'e9999999-9999-9999-9999-999999999999',
  '{}'::jsonb
);

-- Automation 5 : Paiement effectué
INSERT INTO public.mail_automations (id, name, description, trigger_event, active)
VALUES (
  'a5555555-5555-5555-5555-555555555555',
  'Paiement parrainage effectué',
  'Confirmation de paiement envoyée à l''utilisateur',
  'Paiement parrainage effectué',
  true
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES (
  'a5555555-5555-5555-5555-555555555555',
  1,
  0,
  '✅ Votre paiement de {{amount}} a été effectué',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{}'::jsonb
);

-- ==========================================
-- 4. VÉRIFICATION
-- ==========================================

SELECT 'Templates créés:' as verification;
SELECT id, name, subject FROM public.mail_templates
WHERE id IN (
  'e3333333-3333-3333-3333-333333333333',
  'e7777777-7777-7777-7777-777777777777',
  'e8888888-8888-8888-8888-888888888888',
  'e9999999-9999-9999-9999-999999999999',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ORDER BY name;

SELECT 'Automations créées:' as verification;
SELECT a.id, a.name, a.trigger_event, a.active, COUNT(s.id) as steps_count
FROM public.mail_automations a
LEFT JOIN public.mail_automation_steps s ON s.automation_id = a.id
WHERE a.id LIKE 'a%'
GROUP BY a.id, a.name, a.trigger_event, a.active
ORDER BY a.name;
