-- Emails manquants : jusqu'ici ni l'usage d'un code partenaire (ex: IFCOPS
-- -10%/1an) ni l'attribution du statut Membre Fondateur ne déclenchaient de
-- confirmation par email à l'utilisateur. On ajoute les deux templates et
-- automatisations correspondantes, sur le même modèle que les autres emails
-- transactionnels (essai gratuit, parrainage...).

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'e4444444-4444-4444-4444-444444444444',
  'Confirmation - Code partenaire appliqué',
  'Votre réduction partenaire {{partner_name}} est activée 🎓',
  'Email envoyé quand un utilisateur souscrit avec un code de réduction partenaire (ex: IFCOPS)',
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
              <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Votre réduction partenaire est activée !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Merci d&apos;avoir suivi une formation avec <strong>{{partner_name}}</strong> ! Votre code de réduction partenaire a bien été appliqué à votre abonnement Premium.</p>

              <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 0 0 24px; border-radius: 8px;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #065f46;">🎁 Votre avantage</p>
                <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                  <li style="margin-bottom: 8px;"><strong>-{{percent_off}}%</strong> sur votre abonnement Premium</li>
                  <li>Pendant <strong>{{duration_months}} mois</strong>, puis retour automatique au tarif normal</li>
                </ul>
              </div>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #6b7280;">Aucune action nécessaire de votre part : la réduction est déjà appliquée sur vos prochaines factures.</p>

              <div style="text-align: center; margin: 0 0 8px;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">Voir mon abonnement</a>
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
  'Bonjour {{full_name}}, votre code de réduction partenaire {{partner_name}} est activé : -{{percent_off}}% pendant {{duration_months}} mois sur votre abonnement Premium. https://www.osteo-upgrade.fr/settings/subscription'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'e5555555-5555-5555-5555-555555555555',
  'Confirmation - Membre Fondateur activé',
  'Vous êtes désormais Membre Fondateur 🌟',
  'Email envoyé quand un admin attribue le statut Membre Fondateur à un compte',
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
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🌟</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Vous êtes Membre Fondateur !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Nous vous avons attribué le statut <strong>Membre Fondateur</strong> sur OsteoUpgrade × MyOsteoflow. Merci pour votre confiance !</p>

              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; padding: 20px; margin: 0 0 24px; border-radius: 8px;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #92400e;">🎁 Votre avantage exclusif</p>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li style="margin-bottom: 8px;"><strong>-50% à vie</strong> sur l&apos;abonnement Premium</li>
                  <li><strong>299,94€/an</strong> au lieu de 599,88€, facturé annuellement</li>
                </ul>
              </div>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #6b7280;">Rendez-vous dans votre espace abonnement pour activer l&apos;offre Fondateur quand vous le souhaitez.</p>

              <div style="text-align: center; margin: 0 0 8px;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">Activer l&apos;offre Fondateur</a>
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
  'Bonjour {{full_name}}, vous êtes désormais Membre Fondateur : -50% à vie sur l''abonnement Premium (299,94€/an au lieu de 599,88€). Activez l''offre depuis votre espace abonnement : https://www.osteo-upgrade.fr/settings/subscription'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automations (id, name, description, trigger_event, active, display_order)
VALUES
  ('c8888888-8888-8888-8888-888888888888', 'Confirmation - Code partenaire appliqué', 'Envoyé quand un utilisateur souscrit avec un code de réduction partenaire (ex: IFCOPS)', 'Code partenaire utilisé', true, (select coalesce(max(display_order),0)+1 from mail_automations)),
  ('c9999999-9999-9999-9999-999999999999', 'Confirmation - Membre Fondateur activé', 'Envoyé quand un admin attribue le statut Membre Fondateur à un compte', 'Membre fondateur activé', true, (select coalesce(max(display_order),0)+2 from mail_automations))
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES
  ('c8888888-8888-8888-8888-888888888888', 1, 0, 'Votre réduction partenaire {{partner_name}} est activée 🎓', 'e4444444-4444-4444-4444-444444444444', '{}'),
  ('c9999999-9999-9999-9999-999999999999', 1, 0, 'Vous êtes désormais Membre Fondateur 🌟', 'e5555555-5555-5555-5555-555555555555', '{}')
ON CONFLICT DO NOTHING;
