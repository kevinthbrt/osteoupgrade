-- =============================================================================
-- Migration : email de bienvenue "Membre Fondateur"
-- Date : 2026-07-01
-- =============================================================================
-- Déclenché depuis app/api/admin/toggle-founding-member/route.ts quand un admin
-- active is_founding_member sur un profil (false -> true). Annonce le tarif
-- préférentiel : -50% à vie, facturation annuelle (299,94€/an au lieu de 599,88€/an).
-- =============================================================================

INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Bienvenue Membre Fondateur',
  '🌟 Vous êtes Membre Fondateur — votre tarif à -50% à vie',
  'Email envoyé quand un admin attribue le statut Membre Fondateur (badge is_founding_member)',
  $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">🌟</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Vous êtes Membre Fondateur</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Merci de faire partie des premiers soutiens d'OsteoUpgrade.</p>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">En reconnaissance de votre confiance, vous bénéficiez désormais du statut <strong>Membre Fondateur</strong> : un tarif préférentiel sur l'abonnement Premium, garanti <strong>à vie</strong>.</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px 22px; margin: 0 0 26px; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-size: 14px; color: #92400e; line-height: 1.6;"><strong>-50% à vie sur l'abonnement Premium</strong></p>
          <p style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">299,94 €<span style="font-size: 14px; font-weight: 400;">/an</span> <span style="font-size: 13px; font-weight: 400; color: #b45309;">au lieu de 599,88 €/an</span></p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #92400e; line-height: 1.6;">Cette offre est facturée annuellement (et non mensuellement) et reste valable tant que votre abonnement Fondateur est actif.</p>
        </div>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Activer mon tarif Fondateur</a>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">Une question ? Écrivez-nous à <a href="mailto:contact@osteo-upgrade.fr" style="color: #d97706;">contact@osteo-upgrade.fr</a>.</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Merci encore pour votre confiance,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$,
  'Bonjour {{full_name}}, vous etes desormais Membre Fondateur OsteoUpgrade : -50% a vie sur l abonnement Premium, soit 299,94 EUR/an (facturation annuelle) au lieu de 599,88 EUR/an. Activez votre tarif : https://www.osteo-upgrade.fr/settings/subscription'
) ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, subject=EXCLUDED.subject, description=EXCLUDED.description,
  html=EXCLUDED.html, text=EXCLUDED.text, updated_at=NOW();

INSERT INTO mail_automations (id, name, description, trigger_event, active)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  'Bienvenue - Membre Fondateur',
  'Annonce du tarif -50% à vie (facturation annuelle) quand un admin attribue le badge Membre Fondateur',
  'Statut Fondateur activé',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT 'c5555555-5555-5555-5555-555555555555', 1, 0,
       '🌟 Vous êtes Membre Fondateur — votre tarif à -50% à vie',
       'fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM mail_automation_steps
  WHERE automation_id='c5555555-5555-5555-5555-555555555555'
    AND template_slug='fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
