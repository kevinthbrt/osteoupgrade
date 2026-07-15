-- Templates et automatisations pour les emails d'essai gratuit MyOsteoflow.
-- Ces lignes avaient été insérées directement en base lors du développement
-- (via l'assistant de migration) mais jamais versionnées dans un fichier de
-- migration — reproduites ici pour la reproductibilité de l'environnement.

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'e3333333-3333-3333-3333-333333333333',
  'Confirmation - Essai gratuit MyOsteoflow',
  'Votre essai gratuit MyOsteoflow a démarré 🎁',
  'Email envoyé au démarrage d''un essai gratuit de 7 jours (MyOsteoflow uniquement, avant conversion Premium)',
  $html$<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Votre essai gratuit a démarré !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Vous avez démarré votre essai gratuit de <strong>7 jours</strong> sur <strong>MyOsteoflow</strong>, le logiciel de gestion de cabinet. Vous pouvez dès maintenant l&apos;installer et gérer vos patients, consultations et dossiers.</p>

              <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 0 0 24px; border-radius: 8px;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #065f46;">📋 Votre essai en un coup d&apos;œil</p>
                <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                  <li style="margin-bottom: 8px;">Accès à <strong>MyOsteoflow</strong> jusqu&apos;au <strong>{{date_fin_essai}}</strong></li>
                  <li style="margin-bottom: 8px;">Aucun prélèvement pendant l&apos;essai</li>
                  <li>Passé cette date, votre carte sera débitée de <strong>49,99€</strong> pour le premier mois d&apos;abonnement Premium, <strong>sauf annulation avant la fin de l&apos;essai</strong></li>
                </ul>
              </div>

              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">⚠️ <strong>Important :</strong> pendant l&apos;essai, seul MyOsteoflow est débloqué. Le reste d&apos;OsteoUpgrade (cours e-learning, OsteoFlash, tests orthopédiques complets, topographies, module pratique, revue de littérature) reste verrouillé et se débloquera automatiquement à la conversion de votre essai en abonnement Premium.</p>
              </div>

              <div style="background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); border: 2px solid #4169F6; padding: 26px; margin: 0 0 30px; border-radius: 12px;">
                <p style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #1e3a8a;">💻 Installez MyOsteoflow sur votre ordinateur</p>
                <div style="text-align: center;">
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac-arm64" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Apple Silicon)</a>
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Intel)</a>
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=windows" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Windows</a>
                </div>
              </div>

              <div style="text-align: center; margin: 0 0 8px;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: #ffffff; border: 2px solid #10b981; color: #065f46; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0 4px 10px;">Gérer mon essai</a>
              </div>

              <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Excellente pratique,<br><strong style="color: #1f2937;">L&apos;équipe OsteoUpgrade × MyOsteoflow</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$,
  'Bonjour {{full_name}}, votre essai gratuit MyOsteoflow de 7 jours a démarré, jusqu''au {{date_fin_essai}}. Seul MyOsteoflow est débloqué pendant l''essai. Passé cette date, 49,99€/mois sauf annulation. https://www.osteo-upgrade.fr/settings/subscription'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'e9999999-9999-9999-9999-999999999999',
  'Notification - Essai gratuit annulé',
  'Votre essai gratuit MyOsteoflow a été annulé',
  'Email envoyé quand un essai gratuit se termine sans conversion en abonnement payant (annulation manuelle ou premier prélèvement refusé)',
  $html$<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Votre essai gratuit a pris fin</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Votre essai gratuit de 7 jours sur <strong>MyOsteoflow</strong> s&apos;est terminé sans conversion en abonnement Premium. <strong>Aucun prélèvement n&apos;a été effectué</strong> (ou votre moyen de paiement a été refusé lors de la tentative de premier prélèvement).</p>

              <div style="background-color: #f3f4f6; border: 2px solid #9ca3af; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Ce qui change pour vous :</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">❌ Vous n&apos;avez plus accès à MyOsteoflow</li>
                  <li style="margin-bottom: 8px;">✅ Votre compte OsteoUpgrade reste actif avec les fonctionnalités gratuites</li>
                  <li>✅ Vos données et historique sont conservés</li>
                </ul>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #1e40af;">💙 Envie de continuer ?</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e3a8a;">Vous pouvez souscrire à l&apos;abonnement Premium à tout moment depuis votre espace personnel pour retrouver MyOsteoflow et débloquer tout OsteoUpgrade.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Découvrir Premium</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Merci pour votre confiance,<br><strong style="color: #1f2937;">L&apos;équipe OsteoUpgrade</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$,
  'Bonjour {{full_name}}, votre essai gratuit MyOsteoflow a pris fin sans conversion en abonnement Premium. Aucun prélèvement n''a été effectué. Vous pouvez souscrire à tout moment : https://www.osteo-upgrade.fr/settings/subscription'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automations (id, name, description, trigger_event, active, display_order)
VALUES
  ('c6666666-6666-6666-6666-666666666666', 'Confirmation - Essai gratuit démarré', 'Envoyé au démarrage d''un essai gratuit MyOsteoflow (avant conversion Premium)', 'Essai gratuit démarré', true, (select coalesce(max(display_order),0)+1 from mail_automations)),
  ('c7777777-7777-7777-7777-777777777777', 'Notification - Essai gratuit annulé', 'Envoyé quand un essai gratuit se termine sans conversion en abonnement payant', 'Essai gratuit annulé', true, (select coalesce(max(display_order),0)+2 from mail_automations))
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES
  ('c6666666-6666-6666-6666-666666666666', 1, 0, 'Votre essai gratuit MyOsteoflow a démarré 🎁', 'e3333333-3333-3333-3333-333333333333', '{}'),
  ('c7777777-7777-7777-7777-777777777777', 1, 0, 'Votre essai gratuit MyOsteoflow a été annulé', 'e9999999-9999-9999-9999-999999999999', '{}')
ON CONFLICT DO NOTHING;
