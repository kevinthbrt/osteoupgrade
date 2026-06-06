-- =============================================================================
-- Migration : relances alignées sur la landing (fonctionnalités réellement
--             utilisables) + mise en avant de MyOsteoflow
-- Date : 2026-06-06
-- =============================================================================
-- Source de vérité = landing page.
--   OsteoUpgrade (utilisable) : 200+ tests orthopédiques, topographie clinique,
--     e-learning + quiz, revue de littérature mensuelle, 150+ techniques vidéo.
--   On RETIRE « Fiches pathologies » et « Outils de rédaction » (pas accessibles).
--   MyOsteoflow mis en avant (dictée IA, suivi J+7, courriers IA, messagerie,
--     dossiers, factures & compta, objectifs/CA, stats, 100% local).
--
-- Réécrit : relances J+7 (f1), J+15 (f2), J+30 (f3)
-- Corrige : mention « pathologies » dans Bienvenue (e1) et Confirmation Premium (e2)
-- =============================================================================


-- =============================================================================
-- Correctifs ciblés Bienvenue (e1) et Confirmation Premium (e2)
-- =============================================================================
UPDATE mail_templates SET html = REPLACE(html,
  'tests orthopédiques, cours e-learning, fiches topographies et pathologies — pour découvrir la plateforme dès maintenant.',
  'tests orthopédiques, cours e-learning et fiches topographies — pour découvrir la plateforme dès maintenant.')
WHERE id = 'e1111111-1111-1111-1111-111111111111';

UPDATE mail_templates SET html = REPLACE(html,
  '📍 <strong>Topographies &amp; fiches pathologies</strong> par région',
  '📍 <strong>Topographie clinique</strong> par région')
WHERE id = 'e2222222-2222-2222-2222-222222222222';


-- =============================================================================
-- RELANCE J+7 (f1111111) — réécriture, MyOsteoflow en avant
-- =============================================================================
UPDATE mail_templates SET
  subject = '🚀 Premium : MyOsteoflow + toutes les régions OsteoUpgrade',
  updated_at = NOW(),
  html = $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #4169F6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;">7 jours déjà ✨</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 25px; font-weight: 700;">Voici ce que Premium débloque</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 26px; font-size: 16px; line-height: 1.6; color: #374151;">Vous avez découvert le module épaule. Premium, c'est <strong>un seul abonnement pour deux outils</strong> : le logiciel qui gère votre cabinet, et toute la base clinique débloquée.</p>

        <!-- MyOsteoflow (mis en avant) -->
        <div style="background: linear-gradient(135deg, #eff6ff, #e0e7ff); border: 2px solid #4169F6; border-radius: 12px; padding: 24px; margin-bottom: 18px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;">Pilier nº1 · Gérer</p>
          <p style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #1e3a8a;">💻 MyOsteoflow — votre cabinet, automatisé</p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #1e3a8a; line-height: 1.7;">🎙️ <strong>Dictée vocale par IA</strong> — le dossier se remplit pendant que vous parlez</p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #1e3a8a; line-height: 1.7;">📈 <strong>Suivi patient automatisé</strong> à J+7 · ✉️ <strong>courriers générés par IA</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #1e3a8a; line-height: 1.7;">🧾 <strong>Factures &amp; comptabilité</strong> · 📊 objectifs de CA &amp; statistiques</p>
          <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.7;">🔒 <strong>100% local &amp; RGPD</strong> — vos données restent sur votre ordinateur</p>
        </div>

        <!-- OsteoUpgrade -->
        <div style="background: #faf9ff; border: 2px solid #8b5cf6; border-radius: 12px; padding: 24px; margin-bottom: 26px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.05em;">Pilier nº2 · Progresser</p>
          <p style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #4c1d95;">🎓 OsteoUpgrade — toutes les régions</p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #4c1d95; line-height: 1.7;">🔬 <strong>200+ tests orthopédiques</strong> (sensi/spéci, vidéos) · 📍 <strong>topographie clinique</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #4c1d95; line-height: 1.7;">🎬 <strong>150+ techniques en vidéo</strong> (HVLA, mobilisation, tissulaire)</p>
          <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.7;">🎓 <strong>Cours e-learning &amp; quiz</strong> · 📚 <strong>revue de littérature mensuelle</strong></p>
        </div>

        <!-- Tarifs -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td width="48%" style="padding: 16px; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 10px; text-align: center; vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em;">Mensuel</p>
              <p style="margin: 0; font-size: 26px; font-weight: 800; color: #1f2937;">35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span></p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #7c3aed;">Sans engagement · annulable à tout moment</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 16px; background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius: 10px; text-align: center; vertical-align: top; border: 2px solid #8b5cf6;">
              <p style="margin: 0 0 2px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em;">Annuel ⭐ <span style="background:#8b5cf6;color:#fff;padding:1px 7px;border-radius:20px;font-size:11px;">-29%</span></p>
              <p style="margin: 0; font-size: 26px; font-weight: 800; color: #1f2937;">299 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span></p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #7c3aed;">Soit 24,90 €/mois · 3 mois offerts</p>
            </td>
          </tr>
        </table>

        <!-- Parrainage -->
        <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 10px; padding: 16px 20px; margin-bottom: 26px;">
          <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">🎁 <strong>Programme ambassadeur inclus</strong> : 10% de commission par filleul annuel — 10 filleuls = abonnement remboursé.</p>
        </div>

        <div style="text-align: center; margin: 0 0 16px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Passer à Premium</a>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">À très vite,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$
WHERE id = 'f1111111-1111-1111-1111-111111111111';

UPDATE mail_automation_steps SET subject = '🚀 Premium : MyOsteoflow + toutes les régions OsteoUpgrade'
WHERE template_slug = 'f1111111-1111-1111-1111-111111111111';


-- =============================================================================
-- RELANCE J+15 (f2222222) — réécriture, workflow MyOsteoflow
-- =============================================================================
UPDATE mail_templates SET
  subject = '💡 Comment les praticiens Premium gagnent du temps',
  updated_at = NOW(),
  html = $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #4169F6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;">15 jours ensemble 💜</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 25px; font-weight: 700;">Le cabinet qui tourne pendant que vous soignez</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Le cœur de Premium, c'est <strong>MyOsteoflow</strong> : le logiciel qui prend en charge l'administratif pour vous rendre du temps. Voici une journée type :</p>

        <div style="background-color: #f0f4ff; border-radius: 10px; padding: 22px; margin: 0 0 24px;">
          <p style="margin: 0 0 14px; font-size: 15px; color: #1e3a8a;"><span style="font-size:18px;">🎙️</span> <strong>Pendant la séance</strong> — vous dictez, l'IA structure le dossier (motif, anamnèse, antécédents). Les yeux sur le patient, pas sur le clavier.</p>
          <p style="margin: 0 0 14px; font-size: 15px; color: #1e3a8a;"><span style="font-size:18px;">📈</span> <strong>7 jours après</strong> — un email de suivi part tout seul pour mesurer l'évolution (douleur, mobilité, satisfaction).</p>
          <p style="margin: 0 0 14px; font-size: 15px; color: #1e3a8a;"><span style="font-size:18px;">✉️</span> <strong>Besoin d'un courrier</strong> — adressage à un confrère ou attestation, rédigés par l'IA en quelques secondes.</p>
          <p style="margin: 0; font-size: 15px; color: #1e3a8a;"><span style="font-size:18px;">📊</span> <strong>En fin de mois</strong> — factures, comptabilité et statistiques prêtes pour votre comptable.</p>
        </div>

        <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">Et côté clinique, <strong>OsteoUpgrade</strong> lève vos doutes sur toutes les régions : 200+ tests orthopédiques, topographie clinique, 150+ techniques en vidéo, cours &amp; quiz et la revue de littérature mensuelle.</p>

        <!-- Tarifs -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td width="48%" style="padding: 16px; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 10px; text-align: center; vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em;">Mensuel</p>
              <p style="margin: 0; font-size: 26px; font-weight: 800; color: #1f2937;">35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span></p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #7c3aed;">Sans engagement · annulable à tout moment</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 16px; background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius: 10px; text-align: center; vertical-align: top; border: 2px solid #8b5cf6;">
              <p style="margin: 0 0 2px; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em;">Annuel ⭐ <span style="background:#8b5cf6;color:#fff;padding:1px 7px;border-radius:20px;font-size:11px;">-29%</span></p>
              <p style="margin: 0; font-size: 26px; font-weight: 800; color: #1f2937;">299 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span></p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #7c3aed;">Soit 24,90 €/mois · 3 mois offerts</p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 0 0 10px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Je passe à Premium →</a>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">À très vite,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$
WHERE id = 'f2222222-2222-2222-2222-222222222222';

UPDATE mail_automation_steps SET subject = '💡 Comment les praticiens Premium gagnent du temps'
WHERE template_slug = 'f2222222-2222-2222-2222-222222222222';


-- =============================================================================
-- RELANCE J+30 (f3333333) — réécriture, comparatif Gratuit vs Premium (exact)
-- =============================================================================
UPDATE mail_templates SET
  subject = '👑 1 mois : ce que Premium change pour votre cabinet',
  updated_at = NOW(),
  html = $h$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background: linear-gradient(135deg, #4169F6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0 0 8px; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">1 mois ensemble 🎯</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 25px; font-weight: 700;">Gratuit vs Premium</h1>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">En gratuit, vous avez l'aperçu du <strong>module épaule</strong>. Premium ajoute le logiciel de cabinet <strong>MyOsteoflow</strong> et débloque <strong>toutes les régions</strong> :</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px; border-collapse: collapse;">
          <tr>
            <td width="60%" style="padding: 10px 8px;"></td>
            <td width="20%" style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Gratuit</td>
            <td width="20%" style="padding: 10px 8px; text-align: center; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">Premium ⭐</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">💻 MyOsteoflow (logiciel cabinet)</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #d1d5db; border-top: 1px solid #f3f4f6;">✗</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🔬 Tests orthopédiques</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 14px; color: #7c3aed; background-color: #f5f3ff; font-weight: 600; border-top: 1px solid #e9d5ff;">Toutes régions</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">📍 Topographie clinique</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 14px; color: #7c3aed; background-color: #f5f3ff; font-weight: 600; border-top: 1px solid #e9d5ff;">Toutes régions</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎓 E-learning &amp; quiz</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎬 Techniques en vidéo</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 14px; color: #7c3aed; background-color: #f5f3ff; font-weight: 600; border-top: 1px solid #e9d5ff;">150+</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">📚 Revue de littérature</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">Épaule</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 14px; color: #7c3aed; background-color: #f5f3ff; font-weight: 600; border-top: 1px solid #e9d5ff;">Toutes régions</td>
          </tr>
          <tr>
            <td style="padding: 9px 8px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6;">🎁 Programme ambassadeur</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #d1d5db; border-top: 1px solid #f3f4f6;">✗</td>
            <td style="padding: 9px 8px; text-align: center; font-size: 16px; color: #7c3aed; background-color: #f5f3ff; border-top: 1px solid #e9d5ff;">✓</td>
          </tr>
          <tr>
            <td style="padding: 14px 8px; font-size: 13px; font-weight: 600; color: #6b7280; border-top: 2px solid #e5e7eb;">Tarif</td>
            <td style="padding: 14px 8px; text-align: center; font-size: 13px; color: #6b7280; border-top: 2px solid #e5e7eb;">0 €</td>
            <td style="padding: 14px 8px; text-align: center; background-color: #f5f3ff; border-radius: 0 0 8px 0; border-top: 2px solid #c4b5fd;">
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #7c3aed;">35 €/mois</p>
              <p style="margin: 3px 0 0; font-size: 11px; color: #8b5cf6;">ou 299 €/an</p>
              <p style="margin: 2px 0 0; font-size: 10px; color: #a78bfa;">(24,90 €/mois · -29%)</p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 0 0 28px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Passer à Premium — dès 24,90 €/mois</a>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">À très vite,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$h$
WHERE id = 'f3333333-3333-3333-3333-333333333333';

UPDATE mail_automation_steps SET subject = '👑 1 mois : ce que Premium change pour votre cabinet'
WHERE template_slug = 'f3333333-3333-3333-3333-333333333333';
