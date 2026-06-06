-- =============================================================================
-- Migration : nouveaux emails automatisés (suite de la refonte 2 piliers)
-- Date : 2026-06-06
-- =============================================================================
-- Ajoute 4 emails :
--   A. Onboarding gratuit J+1  → étape sur la séquence « user_registered » (b2222222)
--   B. Échec de paiement       → nouvelle automation (trigger « Paiement échoué »)
--   C. Astuces MyOsteoflow J+21 → étape sur l'automation Premium (c1111111)
--   D. Revue OsteoUpgrade (mois) → template réutilisable pour les broadcasts (sans automation)
-- =============================================================================


-- =============================================================================
-- A. ONBOARDING GRATUIT J+1 (template f5555555) — utilisateurs gratuits
-- =============================================================================
INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'f5555555-5555-5555-5555-555555555555',
  'Onboarding gratuit - J+1',
  '👋 Vos premiers pas sur OsteoUpgrade (module épaule offert)',
  'Email envoyé 1 jour après l''inscription pour activer les comptes gratuits sur le module épaule',
  $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">🧭</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Vos premiers pas</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Le module épaule complet vous attend — gratuitement.</p>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Votre compte gratuit vous donne accès au <strong>module épaule complet</strong> sur OsteoUpgrade. Voici 3 choses à essayer en 5 minutes :</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
          <tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;"><strong>1. 🔬 Lancez un test orthopédique</strong> — procédure, sensibilité/spécificité et interprétation clinique.</td></tr>
          <tr><td style="height: 8px;"></td></tr>
          <tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;"><strong>2. 🎓 Suivez un cours e-learning</strong> — et validez vos acquis avec un quiz.</td></tr>
          <tr><td style="height: 8px;"></td></tr>
          <tr><td style="padding: 12px 16px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;"><strong>3. 📍 Ouvrez une fiche topographie</strong> — pour orienter votre raisonnement face à une douleur d'épaule.</td></tr>
        </table>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Explorer le module épaule</a>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">Besoin des autres régions et du logiciel de cabinet MyOsteoflow ? Le <a href="https://www.osteo-upgrade.fr/settings/subscription" style="color: #7c3aed;">plan Premium</a> débloque tout (dès 24,90 €/mois).</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bonne découverte,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$,
  'Bonjour {{full_name}}, votre compte gratuit donne acces au module epaule complet sur OsteoUpgrade : lancez un test orthopedique, suivez un cours e-learning, ouvrez une fiche topographie. https://www.osteo-upgrade.fr/dashboard'
) ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, subject=EXCLUDED.subject, description=EXCLUDED.description,
  html=EXCLUDED.html, text=EXCLUDED.text, updated_at=NOW();

-- Étape J+1 (1440 min) en tête de la séquence onboarding (b2222222), avant le J+7.
-- On réduit l'attente du J+7 (étape 1) de 10080 → 8640 pour conserver l'envoi à J+7 absolu
-- (J+1 puis +6 jours = J+7).
INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT 'b2222222-2222-2222-2222-222222222222', 0, 1440,
       '👋 Vos premiers pas sur OsteoUpgrade (module épaule offert)',
       'f5555555-5555-5555-5555-555555555555', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM mail_automation_steps
  WHERE automation_id='b2222222-2222-2222-2222-222222222222'
    AND template_slug='f5555555-5555-5555-5555-555555555555'
);

UPDATE mail_automation_steps SET wait_minutes = 8640
WHERE automation_id='b2222222-2222-2222-2222-222222222222'
  AND step_order = 1 AND wait_minutes = 10080;


-- =============================================================================
-- B. ÉCHEC DE PAIEMENT (template f6666666 + automation c4444444)
--    Déclenché par invoice.payment_failed (webhook Stripe) → event « Paiement échoué »
-- =============================================================================
INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'f6666666-6666-6666-6666-666666666666',
  'Paiement échoué',
  '⚠️ Votre paiement n''a pas abouti',
  'Email de relance (dunning) lorsqu''un paiement d''abonnement échoue',
  $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">⚠️</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Votre paiement n'a pas abouti</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Le dernier paiement de votre abonnement <strong>Premium</strong> n'a pas pu être traité. Cela arrive souvent pour une carte expirée ou un plafond atteint — rien d'inquiétant.</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px 20px; margin: 0 0 26px; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">Pour <strong>conserver votre accès à MyOsteoflow et OsteoUpgrade</strong>, mettez à jour votre moyen de paiement. Une nouvelle tentative sera effectuée automatiquement dans les prochains jours.</p>
        </div>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Mettre à jour mon paiement</a>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">Un souci ? Écrivez-nous à <a href="mailto:contact@osteo-upgrade.fr" style="color: #d97706;">contact@osteo-upgrade.fr</a>.</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Merci,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$,
  'Bonjour {{full_name}}, le dernier paiement de votre abonnement Premium n a pas abouti. Mettez a jour votre moyen de paiement pour conserver l acces : https://www.osteo-upgrade.fr/settings/subscription'
) ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, subject=EXCLUDED.subject, description=EXCLUDED.description,
  html=EXCLUDED.html, text=EXCLUDED.text, updated_at=NOW();

INSERT INTO mail_automations (id, name, description, trigger_event, active)
VALUES ('c4444444-4444-4444-4444-444444444444', 'Notification - Paiement échoué',
        'Relance automatique en cas d''échec de paiement d''abonnement', 'Paiement échoué', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT 'c4444444-4444-4444-4444-444444444444', 1, 0,
       '⚠️ Votre paiement n''a pas abouti',
       'f6666666-6666-6666-6666-666666666666', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM mail_automation_steps
  WHERE automation_id='c4444444-4444-4444-4444-444444444444'
    AND template_slug='f6666666-6666-6666-6666-666666666666'
);


-- =============================================================================
-- C. ASTUCES MyOsteoflow J+21 (template f7777777) — étape sur l'automation Premium
-- =============================================================================
INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'f7777777-7777-7777-7777-777777777777',
  'MyOsteoflow - Astuces J+21',
  '💡 3 astuces pour tirer le meilleur de MyOsteoflow',
  'Email envoyé ~21 jours après le passage à Premium pour ancrer l''usage de MyOsteoflow',
  $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #4169F6 0%, #2563eb 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">💡</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Tirez le meilleur de MyOsteoflow</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Voici 3 fonctionnalités de MyOsteoflow qui font gagner le plus de temps au quotidien :</p>
        <div style="background-color: #f9fafb; border-radius: 10px; padding: 22px; margin: 0 0 26px;">
          <p style="margin: 0 0 14px; font-size: 15px; color: #374151;"><span style="font-size:18px;">🎙️</span> <strong>Dictez vos consultations</strong> — parlez naturellement, l'IA remplit le dossier (motif, anamnèse, antécédents). Vous gardez les yeux sur le patient.</p>
          <p style="margin: 0 0 14px; font-size: 15px; color: #374151;"><span style="font-size:18px;">📈</span> <strong>Activez le suivi J+7</strong> — un email part automatiquement 7 jours après la séance pour mesurer l'évolution (EVA, mobilité, satisfaction).</p>
          <p style="margin: 0; font-size: 15px; color: #374151;"><span style="font-size:18px;">📊</span> <strong>Pilotez votre cabinet</strong> — objectifs de CA, statistiques, factures et compta prêtes pour votre comptable.</p>
        </div>
        <div style="text-align: center; margin: 0 0 22px;">
          <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4169F6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Ouvrir MyOsteoflow</a>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">Pas encore installé ? <a href="https://www.osteo-upgrade.fr/dashboard" style="color: #2563eb;">Téléchargez l'application</a> (Mac &amp; Windows).</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bonne pratique,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$,
  'Bonjour {{full_name}}, 3 astuces MyOsteoflow : dictez vos consultations (IA), activez le suivi patient J+7, pilotez votre cabinet (stats, factures, compta). https://www.osteo-upgrade.fr/dashboard'
) ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, subject=EXCLUDED.subject, description=EXCLUDED.description,
  html=EXCLUDED.html, text=EXCLUDED.text, updated_at=NOW();

-- Étape 3 sur l'automation Premium (c1111111) : ~J+21
-- (étape 2 = J+7 ; +14 jours = 20160 min → J+21)
INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT 'c1111111-1111-1111-1111-111111111111', 3, 20160,
       '💡 3 astuces pour tirer le meilleur de MyOsteoflow',
       'f7777777-7777-7777-7777-777777777777', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM mail_automation_steps
  WHERE automation_id='c1111111-1111-1111-1111-111111111111'
    AND template_slug='f7777777-7777-7777-7777-777777777777'
);


-- =============================================================================
-- D. REVUE OsteoUpgrade DU MOIS (template f8888888) — pour broadcasts manuels
--    (pas d'automation : à envoyer chaque mois depuis l'admin, contenu éditable)
-- =============================================================================
INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'f8888888-8888-8888-8888-888888888888',
  'Revue OsteoUpgrade du mois',
  '📚 La Revue OsteoUpgrade — {{mois}}',
  'Gabarit mensuel (EBP + nouveautés) à utiliser pour les broadcasts. Variables : {{mois}}, {{titre_etude}}, {{resume_etude}}, {{nouveaute}}',
  $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #0ea5e9 0%, #4169F6 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0 0 6px; color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">La Revue OsteoUpgrade</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">{{mois}}</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Votre synthèse mensuelle pour garder une pratique alignée sur les dernières preuves.</p>

        <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.05em;">🔬 L'étude du mois</p>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 18px 20px; margin: 0 0 26px; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #075985;">{{titre_etude}}</p>
          <p style="margin: 0; font-size: 14px; color: #0c4a6e; line-height: 1.6;">{{resume_etude}}</p>
        </div>

        <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em;">✨ Nouveautés de la plateforme</p>
        <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 18px 20px; margin: 0 0 28px; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">{{nouveaute}}</p>
        </div>

        <div style="text-align: center; margin: 0 0 22px;">
          <a href="https://www.osteo-upgrade.fr/elearning/revue-litterature" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #4169F6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Lire la revue complète</a>
        </div>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">À le mois prochain,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$,
  'La Revue OsteoUpgrade - {{mois}}. Etude du mois : {{titre_etude}} - {{resume_etude}}. Nouveautes : {{nouveaute}}. Lire : https://www.osteo-upgrade.fr/elearning/revue-litterature'
) ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, subject=EXCLUDED.subject, description=EXCLUDED.description,
  html=EXCLUDED.html, text=EXCLUDED.text, updated_at=NOW();
