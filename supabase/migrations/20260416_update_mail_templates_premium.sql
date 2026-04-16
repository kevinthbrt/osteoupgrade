-- Migration: Mise à jour des templates mail pour le plan Premium unifié
-- Suppression de toutes les références Premium Silver / Premium Gold
-- Le plan unique s'appelle désormais "Premium"

-- ============================================================
-- 1. AUTOMATISATIONS
-- ============================================================

-- Supprimer étapes + enrollment + automation "Passage à Premium Gold"
DELETE FROM mail_automation_steps WHERE automation_id IN (
  SELECT id FROM mail_automations WHERE name = 'Passage à Premium Gold'
);
DELETE FROM mail_automation_enrollments WHERE automation_id IN (
  SELECT id FROM mail_automations WHERE name = 'Passage à Premium Gold'
);
DELETE FROM mail_automations WHERE name = 'Passage à Premium Gold';

-- Renommer l'automation Silver → Premium
UPDATE mail_automations
SET name = 'Confirmation - Passage à Premium',
    trigger_event = 'Passage à Premium'
WHERE name = 'Confirmation - Passage à Premium Silver';

-- Mettre à jour le sujet de l'étape de confirmation
UPDATE mail_automation_steps
SET subject = 'Bienvenue dans votre abonnement Premium ! 🚀'
WHERE template_slug = 'e2222222-2222-2222-2222-222222222222';

-- ============================================================
-- 2. TEMPLATE : Confirmation Premium (anciennement Silver)
-- ============================================================

UPDATE mail_templates SET
  name = 'Confirmation - Premium',
  subject = 'Bienvenue dans votre abonnement Premium ! 🚀',
  description = 'Email de confirmation pour un abonnement Premium',
  updated_at = NOW(),
  html = $$<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenue dans Premium !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Votre abonnement <strong>Premium</strong> est maintenant actif. Vous avez désormais accès à l'ensemble des ressources et outils d'OsteoUpgrade pour enrichir votre pratique clinique au quotidien.</p>

              <div style="background-color: #f5f3ff; border: 2px solid #8b5cf6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #6d28d9;">📋 Récapitulatif de votre abonnement</p>
                <ul style="margin: 0; padding-left: 20px; color: #4c1d95;">
                  <li style="margin-bottom: 8px;">Formule : <strong>{{nom}}</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li>Prochaine facturation : <strong>{{date_fact}}</strong></li>
                </ul>
              </div>

              <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 3px solid #8b5cf6; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px;">Votre code de parrainage</p>
                <p style="margin: 0 0 5px; font-size: 36px; font-weight: 900; color: #4c1d95; letter-spacing: 3px;">{{code_parrainage}}</p>
                <p style="margin: 15px 0 0; font-size: 14px; line-height: 1.6; color: #6d28d9;">Partagez ce code et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel parrainé ! 🎁</p>
              </div>

              <p style="margin: 0 0 15px; font-size: 15px; font-weight: 600; color: #1f2937;">Ce que vous pouvez maintenant utiliser :</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">🔬 <strong>Bibliothèque complète de tests orthopédiques</strong> — toutes régions</td></tr>
                <tr><td style="height: 6px;"></td></tr>
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">🎓 <strong>Cours e-learning</strong> en ostéopathie clinique</td></tr>
                <tr><td style="height: 6px;"></td></tr>
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">📍 <strong>Fiches topographies de douleur</strong> par région anatomique</td></tr>
                <tr><td style="height: 6px;"></td></tr>
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">🦴 <strong>Fiches pathologies</strong> détaillées par région</td></tr>
                <tr><td style="height: 6px;"></td></tr>
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">✉️ <strong>Outils de rédaction</strong> de mails et courriers professionnels</td></tr>
                <tr><td style="height: 6px;"></td></tr>
                <tr><td style="padding: 10px 14px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; color: #374151;">🎬 <strong>Vidéos de techniques manipulatives</strong></td></tr>
              </table>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin-right: 10px;">Mon espace parrainage</a>
                <a href="https://osteo-upgrade.fr/dashboard" style="display: inline-block; background: white; border: 2px solid #8b5cf6; color: #6d28d9; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 16px;">Accéder à la plateforme</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Excellente pratique,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$$
WHERE id = 'e2222222-2222-2222-2222-222222222222';

-- ============================================================
-- 3. Supprimer le template Confirmation - Premium Gold
-- ============================================================
DELETE FROM mail_templates WHERE id = 'e3333333-3333-3333-3333-333333333333';

-- ============================================================
-- 4. TEMPLATE : Parrainage - Bonus filleul (fix mention Gold)
-- ============================================================
UPDATE mail_templates SET
  updated_at = NOW(),
  html = REPLACE(
    html,
    '<li>Si vous devenez <strong>Premium Gold</strong>, vous pourrez aussi parrainer vos collègues et gagner encore plus !</li>',
    '<li>En tant que membre Premium, vous pouvez aussi parrainer vos collègues avec votre propre code !</li>'
  )
WHERE id = 'e8888888-8888-8888-8888-888888888888';

-- ============================================================
-- 5. TEMPLATE : Relance Premium - J+7 (remplacer bloc Gold par parrainage)
-- ============================================================
UPDATE mail_templates SET
  updated_at = NOW(),
  html = REPLACE(
    html,
    $$              <!-- Incitation Gold -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #92400e;">👑 Envie d'aller encore plus loin ?</p>
                <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">Le plan <strong>Premium Gold à 499 €/an</strong> inclut tout ce qui précède, plus l'accès à notre <strong>séminaire présentiel de 2 jours</strong> organisé une fois par an — une formation intensive pour transformer votre pratique.</p>
              </div>$$,
    $$              <!-- Parrainage -->
              <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #6d28d9;">🎁 Parrainez vos collègues</p>
                <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">Votre abonnement Premium inclut le programme de parrainage : partagez votre code unique et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel souscrit grâce à vous. Retrouvez votre code dans votre espace parrainage.</p>
              </div>$$
  )
WHERE id = 'f1111111-1111-1111-1111-111111111111';

-- ============================================================
-- 6. TEMPLATE : Relance Premium - J+15 (remplacer bloc séminaire Gold)
-- ============================================================
UPDATE mail_templates SET
  updated_at = NOW(),
  html = REPLACE(
    html,
    $$              <!-- Incitation Gold -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #92400e;">👑 Séminaire présentiel — réservé Premium Gold</p>
                <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">Une fois par an, nous organisons un <strong>séminaire de 2 jours en présentiel</strong> pour aller plus loin ensemble. L'accès est réservé aux membres <strong>Premium Gold à 499 €/an</strong>. Une occasion unique de formation intensive et d'échanges avec vos confrères.</p>
              </div>$$,
    $$              <!-- Parrainage -->
              <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #6d28d9;">🎁 Votre programme de parrainage</p>
                <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">Votre abonnement Premium inclut l'accès au programme de parrainage. Partagez votre code unique à vos collègues et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel souscrit grâce à vous. Sans limite !</p>
              </div>$$
  )
WHERE id = 'f2222222-2222-2222-2222-222222222222';

-- ============================================================
-- 7. TEMPLATE : Relance Premium - J+30 (tableau 2 colonnes, sans Gold)
-- ============================================================
UPDATE mail_templates SET
  updated_at = NOW(),
  html = $$<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">1 mois sur OsteoUpgrade 🎯</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Voici tout ce que vous pourriez débloquer</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Un mois avec OsteoUpgrade en compte gratuit — c'est l'aperçu de tous les modules pour <strong>la région épaule uniquement</strong>. Voici clairement ce que le plan Premium vous apporte :</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px; border-collapse: collapse;">
                <tr>
                  <td width="60%" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;"></td>
                  <td width="20%" style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Gratuit</td>
                  <td width="20%" style="padding: 10px 8px; text-align: center; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">Premium ⭐</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🔬 Tests orthopédiques</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 14px; color: #7c3aed; background-color: #f5f3ff; font-weight: 600; border-top: 1px solid #e9d5ff;">Toutes régions</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎓 E-learning</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">📍 Fiches topographies</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🦴 Fiches pathologies</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">✉️ Outils rédaction</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎬 Vidéos techniques</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule seulmt</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎁 Programme parrainage</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #d1d5db; border-top: 1px solid #f3f4f6;">✗</td>
                  <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
                </tr>
                <tr>
                  <td style="padding: 14px 8px; font-size: 13px; font-weight: 600; color: #6b7280; border-top: 2px solid #e5e7eb;">Tarif</td>
                  <td style="padding: 14px 8px; text-align: center; font-size: 13px; color: #6b7280; border-top: 2px solid #e5e7eb;">Gratuit</td>
                  <td style="padding: 14px 8px; text-align: center; background-color: #f5f3ff; border-radius: 0 0 8px 0; border-top: 2px solid #c4b5fd;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #7c3aed;">29 €/mois</p>
                    <p style="margin: 3px 0 0; font-size: 11px; color: #8b5cf6;">ou 240 €/an</p>
                    <p style="margin: 2px 0 0; font-size: 10px; color: #a78bfa;">(20 €/mois · -17%)</p>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 0 0 28px;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Passer à Premium — à partir de 20 €/mois</a>
              </div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">À très vite,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$$
WHERE id = 'f3333333-3333-3333-3333-333333333333';
