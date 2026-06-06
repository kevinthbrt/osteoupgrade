-- =============================================================================
-- Migration : refonte des emails automatisés — positionnement « 2 piliers »
-- Date : 2026-06-06
-- =============================================================================
-- Contexte : depuis la création des templates, l'offre a évolué. Le produit est
-- désormais UN abonnement réunissant DEUX outils :
--   • MyOsteoflow  : logiciel de cabinet (dictée IA, suivi J+7, compta, factures)
--   • OsteoUpgrade : base de connaissances clinique (tests, e-learning, vidéos…)
-- Tarifs de référence (landing) : 35 €/mois ou 299 €/an (≈ 24,90 €/mois, 3 mois offerts).
--
-- Cette migration :
--   1. Réécrit l'email de Bienvenue (e1111111) — 2 piliers, accès gratuit épaule
--   2. Réécrit la Confirmation Premium (e2222222) — ajoute le téléchargement MyOsteoflow
--   3. Crée un nouvel email + une 2ᵉ étape : rappel téléchargement MyOsteoflow à J+7
--   4. Met à jour les relances J+7 / J+15 / J+30 (prix + mention MyOsteoflow)
--   5. Corrige les pieds de page « © 2025 » → « © 2026 » et la signature
-- =============================================================================


-- =============================================================================
-- 1. EMAIL DE BIENVENUE (e1111111) — réécriture complète
-- =============================================================================
UPDATE mail_templates SET
  name = 'Bienvenue - Inscription',
  subject = 'Bienvenue sur OsteoUpgrade × MyOsteoflow 🎉',
  description = 'Email de bienvenue à la création du compte gratuit (positionnement 2 piliers)',
  updated_at = NOW(),
  html = $h$<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #4169F6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 44px; margin-bottom: 8px;">👋</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Bienvenue !</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Votre cabinet et votre clinique, au même endroit.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Merci d'avoir créé votre compte ! Un seul abonnement vous donne accès à <strong>deux outils complémentaires</strong>, pensés pour les ostéopathes, étiopathes &amp; chiropracteurs :</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td width="48%" style="padding: 18px; background: linear-gradient(135deg, #eff6ff, #e0e7ff); border-radius: 12px; vertical-align: top;">
                    <p style="margin: 0 0 6px; font-size: 15px; font-weight: 800; color: #1d4ed8;">💻 MyOsteoflow</p>
                    <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">Le logiciel de cabinet : dictée vocale IA, suivi patient automatisé, factures, compta &amp; statistiques.</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 18px; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 12px; vertical-align: top;">
                    <p style="margin: 0 0 6px; font-size: 15px; font-weight: 800; color: #6d28d9;">🎓 OsteoUpgrade</p>
                    <p style="margin: 0; font-size: 13px; color: #4c1d95; line-height: 1.6;">La base clinique : 200+ tests, e-learning, topographie, vidéos de techniques &amp; revue EBP mensuelle.</p>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f9fafb; border-left: 4px solid #4169F6; padding: 20px; margin: 0 0 28px; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 15px; font-weight: 600; color: #1f2937;">🎁 Votre accès gratuit (sans carte bancaire)</p>
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Le <strong>module épaule complet</strong> sur OsteoUpgrade : tests orthopédiques, cours e-learning, fiches topographies et pathologies — pour découvrir la plateforme dès maintenant.</p>
              </div>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">Pour débloquer <strong>toutes les régions anatomiques</strong> et le <strong>logiciel MyOsteoflow</strong>, passez à Premium :</p>
              <div style="text-align: center; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 24px; font-weight: 800; color: #1f2937;">35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span> <span style="font-size:14px;color:#6b7280;font-weight:400;">ou</span> 299 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span></p>
                <p style="margin: 6px 0 0; font-size: 13px; color: #7c3aed;">Soit 24,90 €/mois · 3 mois offerts · sans engagement</p>
              </div>

              <div style="text-align: center; margin: 0 0 8px;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0 4px 10px;">Découvrir Premium</a>
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: #ffffff; border: 2px solid #8b5cf6; color: #6d28d9; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0 4px 10px;">Explorer mon espace</a>
              </div>

              <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">À très vite,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
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
</html>$h$
WHERE id = 'e1111111-1111-1111-1111-111111111111';

-- Sujet réellement envoyé (porté par l'étape de l'automation)
UPDATE mail_automation_steps
SET subject = 'Bienvenue sur OsteoUpgrade × MyOsteoflow 🎉'
WHERE template_slug = 'e1111111-1111-1111-1111-111111111111';


-- =============================================================================
-- 2. CONFIRMATION PREMIUM (e2222222) — réécriture + téléchargement MyOsteoflow
-- =============================================================================
UPDATE mail_templates SET
  name = 'Confirmation - Premium',
  subject = 'Bienvenue dans Premium ! 🚀 Installez MyOsteoflow',
  description = 'Confirmation d''abonnement Premium avec téléchargement MyOsteoflow et code de parrainage',
  updated_at = NOW(),
  html = $h$<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #4169F6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenue dans Premium !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Votre abonnement <strong>Premium</strong> est actif. Vous avez désormais accès aux <strong>deux outils</strong> : le logiciel de cabinet <strong>MyOsteoflow</strong> et toute la base clinique <strong>OsteoUpgrade</strong>.</p>

              <div style="background-color: #f5f3ff; border: 2px solid #8b5cf6; padding: 20px; margin: 0 0 30px; border-radius: 8px;">
                <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #6d28d9;">📋 Récapitulatif de votre abonnement</p>
                <ul style="margin: 0; padding-left: 20px; color: #4c1d95;">
                  <li style="margin-bottom: 8px;">Formule : <strong>{{nom}}</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li>Prochaine facturation : <strong>{{date_fact}}</strong></li>
                </ul>
              </div>

              <!-- ÉTAPE 1 — Télécharger MyOsteoflow -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); border: 2px solid #4169F6; padding: 26px; margin: 0 0 24px; border-radius: 12px;">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;">Étape 1</p>
                <p style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #1e3a8a;">💻 Installez MyOsteoflow sur votre ordinateur</p>
                <p style="margin: 0 0 18px; font-size: 14px; color: #1e3a8a; line-height: 1.6;">Le logiciel de cabinet : dictée vocale par IA, suivi patient automatisé à J+7, facturation, comptabilité et statistiques. Connectez-vous avec votre compte — <strong>vos données restent 100% sur votre machine</strong>.</p>
                <div style="text-align: center;">
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac-arm64" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Apple Silicon)</a>
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Intel)</a>
                  <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=windows" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Windows</a>
                </div>
                <p style="margin: 12px 0 0; font-size: 12px; color: #3b82f6; text-align: center;">Retrouvez aussi les téléchargements dans votre <a href="https://www.osteo-upgrade.fr/dashboard" style="color: #1d4ed8;">espace</a>.</p>
              </div>

              <!-- ÉTAPE 2 — OsteoUpgrade -->
              <div style="background: #faf9ff; border: 2px solid #8b5cf6; padding: 26px; margin: 0 0 30px; border-radius: 12px;">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.05em;">Étape 2</p>
                <p style="margin: 0 0 14px; font-size: 18px; font-weight: 800; color: #4c1d95;">🎓 Explorez OsteoUpgrade — toutes régions débloquées</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="padding: 8px 12px; background-color: #f5f3ff; border-radius: 8px; font-size: 13px; color: #374151;">🔬 <strong>200+ tests orthopédiques</strong> — toutes régions, sensi/spéci, vidéos</td></tr>
                  <tr><td style="height: 6px;"></td></tr>
                  <tr><td style="padding: 8px 12px; background-color: #f5f3ff; border-radius: 8px; font-size: 13px; color: #374151;">🎓 <strong>Cours e-learning &amp; quiz</strong> + revue de littérature mensuelle</td></tr>
                  <tr><td style="height: 6px;"></td></tr>
                  <tr><td style="padding: 8px 12px; background-color: #f5f3ff; border-radius: 8px; font-size: 13px; color: #374151;">📍 <strong>Topographies &amp; fiches pathologies</strong> par région</td></tr>
                  <tr><td style="height: 6px;"></td></tr>
                  <tr><td style="padding: 8px 12px; background-color: #f5f3ff; border-radius: 8px; font-size: 13px; color: #374151;">🎬 <strong>150+ techniques en vidéo</strong> (HVLA, mobilisation, tissulaire)</td></tr>
                </table>
              </div>

              <!-- Parrainage -->
              <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 3px solid #8b5cf6; padding: 28px; margin: 0 0 30px; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px;">Votre code de parrainage</p>
                <p style="margin: 0 0 4px; font-size: 34px; font-weight: 900; color: #4c1d95; letter-spacing: 3px;">{{code_parrainage}}</p>
                <p style="margin: 14px 0 0; font-size: 14px; line-height: 1.6; color: #6d28d9;">Partagez-le et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel parrainé. 10 filleuls = votre abonnement remboursé ! 🎁</p>
              </div>

              <div style="text-align: center; margin: 0 0 8px;">
                <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0 4px 10px;">Mon espace parrainage</a>
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: #ffffff; border: 2px solid #8b5cf6; color: #6d28d9; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0 4px 10px;">Accéder à mon espace</a>
              </div>

              <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Excellente pratique,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
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
</html>$h$
WHERE id = 'e2222222-2222-2222-2222-222222222222';

UPDATE mail_automation_steps
SET subject = 'Bienvenue dans Premium ! 🚀 Installez MyOsteoflow'
WHERE template_slug = 'e2222222-2222-2222-2222-222222222222';


-- =============================================================================
-- 3. NOUVEL EMAIL : rappel téléchargement MyOsteoflow à J+7 après Premium
--    + 2ᵉ étape sur l'automation « Confirmation - Passage à Premium » (c1111111)
-- =============================================================================
INSERT INTO mail_templates (id, name, subject, description, html, text)
VALUES (
  'f4444444-4444-4444-4444-444444444444',
  'MyOsteoflow - Rappel téléchargement J+7',
  '📲 Avez-vous installé MyOsteoflow ?',
  'Relance envoyée 7 jours après le passage à Premium pour inciter à télécharger et prendre en main MyOsteoflow',
  $h$<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #4169F6 0%, #2563eb 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 44px; margin-bottom: 8px;">📲</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Avez-vous installé MyOsteoflow ?</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">Il y a une semaine, vous êtes passé Premium — merci ! Votre abonnement inclut <strong>MyOsteoflow</strong>, le logiciel qui fait tourner votre cabinet pendant que vous soignez. Si ce n'est pas encore fait, c'est le moment de l'installer 👇</p>

              <div style="background-color: #f9fafb; border-radius: 10px; padding: 22px; margin: 0 0 26px;">
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;"><span style="font-size:18px;">🎙️</span> <strong>Dictée vocale IA</strong> — parlez, l'IA structure le dossier (motif, anamnèse, antécédents).</p>
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;"><span style="font-size:18px;">📈</span> <strong>Suivi patient automatisé</strong> — un email envoyé seul 7 jours après la séance.</p>
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;"><span style="font-size:18px;">🧾</span> <strong>Factures &amp; comptabilité</strong> — PDF, paiements, exports prêts pour le comptable.</p>
                <p style="margin: 0; font-size: 15px; color: #374151;"><span style="font-size:18px;">🔒</span> <strong>100% local &amp; RGPD</strong> — vos données restent sur votre ordinateur.</p>
              </div>

              <div style="text-align: center; margin: 0 0 18px;">
                <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac-arm64" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Apple Silicon)</a>
                <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=mac" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Mac (Intel)</a>
                <a href="https://www.osteo-upgrade.fr/api/osteoflow/download?platform=windows" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 0 3px 8px;">Windows</a>
              </div>

              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">Une question pour démarrer ? Écrivez-nous à <a href="mailto:contact@osteo-upgrade.fr" style="color: #2563eb;">contact@osteo-upgrade.fr</a>.</p>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bonne prise en main,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
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
</html>$h$,
  'Bonjour {{full_name}}, il y a une semaine vous etes passe Premium. Votre abonnement inclut MyOsteoflow, le logiciel de cabinet (dictee vocale IA, suivi patient automatise, factures, comptabilite, 100% local). Telechargez-le depuis votre espace : https://www.osteo-upgrade.fr/dashboard'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  description = EXCLUDED.description,
  html = EXCLUDED.html,
  text = EXCLUDED.text,
  updated_at = NOW();

-- Ajouter l'étape J+7 (10080 minutes) à l'automation « Confirmation - Passage à Premium »
-- Le processor enverra l'étape 1 (confirmation) immédiatement, puis cette étape 2 ~7 jours après.
INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT 'c1111111-1111-1111-1111-111111111111', 2, 10080,
       '📲 Avez-vous installé MyOsteoflow ?',
       'f4444444-4444-4444-4444-444444444444', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM mail_automation_steps
  WHERE automation_id = 'c1111111-1111-1111-1111-111111111111'
    AND template_slug = 'f4444444-4444-4444-4444-444444444444'
);


-- =============================================================================
-- 4. RELANCES PREMIUM (utilisateurs gratuits) — prix + mention MyOsteoflow
-- =============================================================================

-- --- 4a. Prix : 29 €→35 €, 240 €→299 €, -17%→-29%, 20 €/2 mois→24,90 €/3 mois ---
-- (fragments identiques dans les templates J+7 et J+15)
UPDATE mail_templates SET html = REPLACE(html,
  '29 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>',
  '35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>')
WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

UPDATE mail_templates SET html = REPLACE(html,
  '240 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span>',
  '299 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span>')
WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

UPDATE mail_templates SET html = REPLACE(html, '>-17%</span>', '>-29%</span>')
WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

UPDATE mail_templates SET html = REPLACE(html,
  'Soit 20 €/mois · 2 mois offerts', 'Soit 24,90 €/mois · 3 mois offerts')
WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

-- --- 4b. Insérer un bloc MyOsteoflow juste avant la grille tarifaire (J+7 & J+15) ---
UPDATE mail_templates SET html = REPLACE(html,
  '<!-- Tarifs -->',
  $b$<!-- MyOsteoflow -->
              <div style="background: linear-gradient(135deg, #eff6ff, #e0e7ff); border: 2px solid #4169F6; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #1d4ed8;">💻 Premium inclut aussi MyOsteoflow</p>
                <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.6;">Le logiciel de cabinet : dictée vocale par IA, suivi patient automatisé à J+7, facturation, comptabilité et statistiques. Vos données restent 100% sur votre ordinateur.</p>
              </div>
              <!-- Tarifs -->$b$)
WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

-- --- 4c. J+30 : prix dans le tableau comparatif + mention MyOsteoflow dans l'intro ---
UPDATE mail_templates SET html = REPLACE(html, '>29 €/mois<', '>35 €/mois<')
WHERE id = 'f3333333-3333-3333-3333-333333333333';
UPDATE mail_templates SET html = REPLACE(html, 'ou 240 €/an', 'ou 299 €/an')
WHERE id = 'f3333333-3333-3333-3333-333333333333';
UPDATE mail_templates SET html = REPLACE(html, '(20 €/mois · -17%)', '(24,90 €/mois · -29%)')
WHERE id = 'f3333333-3333-3333-3333-333333333333';
UPDATE mail_templates SET html = REPLACE(html,
  'Passer à Premium — à partir de 20 €/mois',
  'Passer à Premium — à partir de 24,90 €/mois')
WHERE id = 'f3333333-3333-3333-3333-333333333333';
UPDATE mail_templates SET html = REPLACE(html,
  'Voici clairement ce que le plan Premium vous apporte :',
  'Et ce n''est qu''un pilier : <strong>Premium inclut aussi MyOsteoflow</strong>, le logiciel de cabinet (dictée vocale IA, suivi patient, factures, compta). Voici ce que Premium vous apporte :')
WHERE id = 'f3333333-3333-3333-3333-333333333333';


-- =============================================================================
-- 5. PIEDS DE PAGE & SIGNATURE — « © 2025 » → « © 2026 », marque unifiée
-- =============================================================================
UPDATE mail_templates
SET html = REPLACE(html,
  '© 2025 OsteoUpgrade. Tous droits réservés.',
  '© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.')
WHERE html LIKE '%© 2025 OsteoUpgrade. Tous droits réservés.%';

-- Mention « accès complet à OsteoUpgrade » → englober les deux outils (renouvellement)
UPDATE mail_templates SET html = REPLACE(html,
  'Vous continuez à bénéficier de l''accès complet à OsteoUpgrade.',
  'Vous continuez à bénéficier de l''accès complet à MyOsteoflow et OsteoUpgrade.')
WHERE id = 'e5555555-5555-5555-5555-555555555555';
