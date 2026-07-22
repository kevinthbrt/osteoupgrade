-- Email manquant : l'usage d'un code partenaire (ex: IFCOPS -10%/1an) ne
-- déclenchait aucune confirmation par email à l'utilisateur.
--
-- L'ID du template est daaaaaaa-... : la série e1111111...e9999999 est déjà
-- entièrement occupée en prod (e4444444 = "Rappel - Renouvellement imminent"
-- notamment), et un INSERT ON CONFLICT DO NOTHING sur un ID pris échoue en
-- silence, laissant l'étape d'automatisation pointer vers le mauvais template.
--
-- Note : le statut Membre Fondateur avait déjà son automatisation dédiée
-- ("Bienvenue - Membre Fondateur", trigger_event 'Statut Fondateur activé',
-- appliquée directement en base le 2026-07-01, jamais versionnée dans un
-- fichier de migration) — il ne manquait que l'appel à ce trigger depuis
-- /api/admin/toggle-founding-member, corrigé séparément. Pas besoin de
-- recréer un template ici, ça aurait fait doublon.

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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

INSERT INTO mail_automations (id, name, description, trigger_event, active, display_order)
VALUES
  ('c8888888-8888-8888-8888-888888888888', 'Confirmation - Code partenaire appliqué', 'Envoyé quand un utilisateur souscrit avec un code de réduction partenaire (ex: IFCOPS)', 'Code partenaire utilisé', true, (select coalesce(max(display_order),0)+1 from mail_automations))
ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
VALUES
  ('c8888888-8888-8888-8888-888888888888', 1, 0, 'Votre réduction partenaire {{partner_name}} est activée 🎓', 'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}')
ON CONFLICT DO NOTHING;
