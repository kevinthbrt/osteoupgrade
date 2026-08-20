-- Emails de changement d'offre.
--
-- Dernier angle mort du dispositif : un client qui changeait d'offre depuis le
-- portail Stripe voyait ses accès suivre et l'administrateur être notifié, mais
-- ne recevait lui-même que la facture Stripe. Rien ne lui disait ce qui venait
-- de s'ouvrir — ou de se fermer.
--
-- Trois séquences et non deux : `osteoflow` et `osteoupgrade` étant au même
-- prix, passer de l'une à l'autre n'est ni une évolution ni une réduction. Le
-- moteur ne sait que remplacer des variables, jamais brancher un contenu : il
-- faut donc une automatisation par cas. La phrase nommant précisément le
-- produit gagné ou perdu est calculée côté serveur (`describePlanChange`) et
-- transmise dans `detail` — sans elle, l'email ne pourrait rester que vague au
-- moment précis où le client veut savoir ce qui change.
--
-- Les trois corps partagent un gabarit unique, décliné par remplacement : les
-- dupliquer les ferait diverger dès la première retouche de mise en page.

WITH g(h) AS (VALUES ('<!DOCTYPE html>
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
            <td style="background: DEGRADE; padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">EMOJI</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TITRE</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">INTRO</p>
              <div style="background-color: FOND; border: 2px solid BORDURE; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: ENCRE;">Ce qui change</p>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: ENCRE;">{{detail}}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ENCRE;">Ancienne offre : <strong>{{ancienne_offre}}</strong></p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ENCRE;">Nouvelle offre : <strong>{{nouvelle_offre}}</strong> &mdash; {{prix}}</p>
                <p style="margin: 0; font-size: 14px; color: ENCRE;">Prochaine facturation : <strong>{{date_fact}}</strong></p>
              </div>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">CLOTURE</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="LIEN" style="display: inline-block; background: DEGRADE; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">BOUTON</a>
              </div>
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">&Agrave; bient&ocirc;t,<br><strong style="color: #1f2937;">L''&eacute;quipe OsteoUpgrade</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 OsteoUpgrade &times; MyOsteoflow. Tous droits r&eacute;serv&eacute;s.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'))
INSERT INTO mail_templates (id, name, subject, description, html)
SELECT 'd1000000-0000-4000-8000-000000000001'::uuid AS id, 'Changement d''offre - Évolution' AS name, 'Votre offre passe à {{nouvelle_offre}} 🎉' AS subject, 'Ajout d''un produit à l''offre (ex. MyOsteoFlow → Premium).' AS description, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(g.h, 'DEGRADE', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'), 'EMOJI', '🎉'), 'TITRE', 'Votre offre évolue'), 'INTRO', 'Votre changement d''offre est effectif : vous avez désormais accès à l''intégralité de l''offre <strong>{{nouvelle_offre}}</strong>. Rien à installer ni à réactiver, c''est déjà en place.'), 'FOND', '#fef3c7'), 'BORDURE', '#f59e0b'), 'ENCRE', '#92400e'), 'CLOTURE', 'Stripe a calculé le prorata : vous ne payez que la différence jusqu''à votre prochaine échéance, dont la date ne change pas.'), 'LIEN', 'https://www.osteo-upgrade.fr/dashboard'), 'BOUTON', 'Découvrir ce qui vient de s''ouvrir') AS html FROM g
UNION ALL
SELECT 'd2000000-0000-4000-8000-000000000001'::uuid AS id, 'Changement d''offre - Réduction' AS name, 'Votre offre est désormais {{nouvelle_offre}}' AS subject, 'Retrait d''un produit de l''offre (ex. Premium → OsteoUpgrade).' AS description, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(g.h, 'DEGRADE', 'linear-gradient(135deg, #64748b 0%, #475569 100%)'), 'EMOJI', '📋'), 'TITRE', 'Votre offre a été modifiée'), 'INTRO', 'Votre changement d''offre est bien pris en compte. Votre abonnement se poursuit sous l''offre <strong>{{nouvelle_offre}}</strong>.'), 'FOND', '#f1f5f9'), 'BORDURE', '#94a3b8'), 'ENCRE', '#334155'), 'CLOTURE', 'Vos données restent intactes : progression, historique et dossiers vous attendent si vous revenez à l''offre complète, à tout moment et sans frais de réactivation.'), 'LIEN', 'https://www.osteo-upgrade.fr/settings/subscription'), 'BOUTON', 'Voir mon abonnement') AS html FROM g
UNION ALL
SELECT 'd3000000-0000-4000-8000-000000000001'::uuid AS id, 'Changement d''offre - Échange' AS name, 'Votre offre est désormais {{nouvelle_offre}}' AS subject, 'Échange entre les deux offres à 29,99 € (MyOsteoFlow ↔ OsteoUpgrade).' AS description, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(g.h, 'DEGRADE', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'), 'EMOJI', '🔄'), 'TITRE', 'Votre offre a changé'), 'INTRO', 'Votre changement d''offre est effectif. Votre abonnement se poursuit sous l''offre <strong>{{nouvelle_offre}}</strong>.'), 'FOND', '#dbeafe'), 'BORDURE', '#60a5fa'), 'ENCRE', '#1e40af'), 'CLOTURE', 'Les données de votre offre précédente sont conservées : vous les retrouverez telles quelles si vous y revenez, ou en passant à l''offre Premium qui réunit les deux.'), 'LIEN', 'https://www.osteo-upgrade.fr/dashboard'), 'BOUTON', 'Accéder à ma nouvelle offre') AS html FROM g
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, subject = EXCLUDED.subject,
  description = EXCLUDED.description, html = EXCLUDED.html;

INSERT INTO mail_automations (id, name, description, trigger_event, active, stop_on_subscribe) VALUES
  ('d1000000-0000-4000-8000-000000000010', 'Changement d''offre - Évolution', 'Ajout d''un produit à l''offre (ex. MyOsteoFlow → Premium).', 'Offre augmentée', true, false),
  ('d2000000-0000-4000-8000-000000000010', 'Changement d''offre - Réduction', 'Retrait d''un produit de l''offre (ex. Premium → OsteoUpgrade).', 'Offre réduite', true, false),
  ('d3000000-0000-4000-8000-000000000010', 'Changement d''offre - Échange', 'Échange entre les deux offres à 29,99 € (MyOsteoFlow ↔ OsteoUpgrade).', 'Offre échangée', true, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event, active = EXCLUDED.active;

INSERT INTO mail_automation_steps (id, automation_id, step_order, wait_minutes, subject, template_slug) VALUES
  ('d1000000-0000-4000-8000-000000000020', 'd1000000-0000-4000-8000-000000000010', 1, 0, 'Votre offre passe à {{nouvelle_offre}} 🎉', 'd1000000-0000-4000-8000-000000000001'),
  ('d2000000-0000-4000-8000-000000000020', 'd2000000-0000-4000-8000-000000000010', 1, 0, 'Votre offre est désormais {{nouvelle_offre}}', 'd2000000-0000-4000-8000-000000000001'),
  ('d3000000-0000-4000-8000-000000000020', 'd3000000-0000-4000-8000-000000000010', 1, 0, 'Votre offre est désormais {{nouvelle_offre}}', 'd3000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  step_order = EXCLUDED.step_order, wait_minutes = EXCLUDED.wait_minutes,
  subject = EXCLUDED.subject, template_slug = EXCLUDED.template_slug;

-- Le confirmatif de renouvellement affirmait « l'accès complet à MyOsteoflow et
-- OsteoUpgrade » — faux pour les deux offres simples.
UPDATE mail_templates SET html = replace(
  html,
  'Vous continuez à bénéficier de l''accès complet à MyOsteoflow et OsteoUpgrade.',
  'Vous continuez à bénéficier de tout ce que comprend votre offre.'
) WHERE name = 'Confirmation - Renouvellement effectué';
