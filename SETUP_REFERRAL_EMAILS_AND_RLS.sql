-- ==========================================
-- SETUP COMPLET : EMAILS PARRAINAGE + RLS POLICIES
-- ==========================================
-- À exécuter dans Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. TEMPLATES EMAIL PARRAINAGE
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

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 25px; margin: 30px 0; border-radius: 12px;">
                <p style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #92400e; text-align: center;">✨ L''exclusivité Gold ✨</p>
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #78350f;">Séminaire présentiel annuel (2 jours)</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">En tant qu''abonné Gold, vous êtes invité à notre séminaire annuel exclusif : <strong>2 jours d''immersion</strong> avec l''équipe OsteoUpgrade.</p>
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
  '<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Félicitations !</h1>
              <p style="margin: 10px 0 0; color: #d1fae5; font-size: 18px;">Vous avez parrainé un nouveau membre</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Excellente nouvelle ! <strong>{{referred_name}}</strong> vient de s''abonner à OsteoUpgrade en utilisant votre code de parrainage <strong>{{code_parrainage}}</strong> 🎊</p>

              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 3px solid #10b981; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Votre commission</p>
                <p style="margin: 0; font-size: 48px; font-weight: 900; color: #047857;">{{commission}}€</p>
                <p style="margin: 15px 0 0; font-size: 14px; color: #065f46;">Cette commission a été ajoutée à votre cagnotte ! 💰</p>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1e40af;">📊 Récapitulatif</p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                  <li style="margin-bottom: 8px;">Filleul : <strong>{{referred_name}}</strong></li>
                  <li style="margin-bottom: 8px;">Formule souscrite : <strong>{{subscription_type}}</strong></li>
                  <li style="margin-bottom: 8px;">Montant de l''abonnement : <strong>{{subscription_amount}}€</strong></li>
                  <li style="margin-bottom: 8px;">Votre commission (10%) : <strong>{{commission}}€</strong></li>
                  <li>Statut : <strong>Disponible dans votre cagnotte</strong></li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400e;">💡 Le saviez-vous ?</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #78350f;">Vous pouvez demander le versement de votre cagnotte dès que vous atteignez <strong>10€</strong> de commissions cumulées.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Voir ma cagnotte</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Merci de faire rayonner OsteoUpgrade ! 🙏<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade</strong></p>
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
  'Félicitations ! Vous avez parrainé un nouveau membre.',
  now(),
  now()
);

-- 3️⃣ Bonus parrainage - Pour le FILLEUL
INSERT INTO public.mail_templates (id, name, subject, description, html, text, created_at, updated_at)
VALUES (
  'e8888888-8888-8888-8888-888888888888',
  'Parrainage - Bonus filleul',
  '🎁 Vous avez reçu {{commission}}€ de bonus !',
  'Email envoyé au filleul qui a utilisé un code de parrainage',
  '<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 10px;">🎁</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Vous avez reçu un bonus !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Merci d''avoir utilisé le code de parrainage <strong>{{code_parrainage}}</strong> lors de votre inscription ! En remerciement, nous créditons également votre cagnotte 🎉</p>

              <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border: 3px solid #8b5cf6; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #5b21b6; text-transform: uppercase; letter-spacing: 1px;">Votre bonus de bienvenue</p>
                <p style="margin: 0; font-size: 48px; font-weight: 900; color: #6d28d9;">{{commission}}€</p>
                <p style="margin: 15px 0 0; font-size: 14px; color: #5b21b6;">Soit 10% de votre abonnement ! 💰</p>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #92400e;">✨ Comment ça fonctionne ?</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Vous recevez <strong>10% de commission</strong> sur votre propre abonnement</li>
                  <li style="margin-bottom: 8px;">Cette somme est créditée dans votre cagnotte personnelle</li>
                  <li style="margin-bottom: 8px;">Vous pouvez la récupérer dès que vous atteignez <strong>10€</strong></li>
                  <li>Si vous devenez <strong>Premium Gold</strong>, vous pourrez aussi parrainer vos collègues et gagner encore plus !</li>
                </ul>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #1e40af;">📊 Détails</p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Code utilisé : <strong>{{code_parrainage}}</strong></li>
                  <li style="margin-bottom: 8px;">Votre abonnement : <strong>{{subscription_type}} - {{subscription_amount}}€</strong></li>
                  <li>Bonus reçu : <strong>{{commission}}€</strong></li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Voir ma cagnotte</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bonne pratique ! 🚀<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade</strong></p>
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
  'Vous avez reçu un bonus de parrainage !',
  now(),
  now()
);

-- 4️⃣ Demande de paiement - Pour l'ADMIN
INSERT INTO public.mail_templates (id, name, subject, description, html, text, created_at, updated_at)
VALUES (
  'e9999999-9999-9999-9999-999999999999',
  'Admin - Demande de paiement parrainage',
  '💰 Nouvelle demande de paiement : {{user_name}} ({{amount}})',
  'Email envoyé à l''admin lors d''une demande de versement',
  '<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Nouvelle demande de paiement</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour Admin,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Un utilisateur vient de demander le versement de ses commissions de parrainage.</p>

              <div style="background-color: #fee2e2; border: 2px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #991b1b;">👤 Informations de l''utilisateur</p>
                <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
                  <li style="margin-bottom: 8px;">Nom : <strong>{{user_name}}</strong></li>
                  <li style="margin-bottom: 8px;">Email : <strong>{{user_email}}</strong></li>
                  <li style="margin-bottom: 8px;">Montant demandé : <strong>{{amount}}</strong></li>
                  <li style="margin-bottom: 8px;">Méthode : <strong>{{method}}</strong></li>
                  <li>ID de la demande : <code style="background: #fef2f2; padding: 2px 6px; border-radius: 4px;">{{payout_id}}</code></li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400e;">⚡ Action requise</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #78350f;">Connectez-vous au dashboard admin pour consulter le RIB et traiter cette demande.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/admin/referral-payouts" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Gérer les demandes</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Dashboard Admin<br><strong style="color: #1f2937;">OsteoUpgrade</strong></p>
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
  'Nouvelle demande de paiement de commissions de parrainage.',
  now(),
  now()
);

-- 5️⃣ Paiement effectué - Pour l'UTILISATEUR
INSERT INTO public.mail_templates (id, name, subject, description, html, text, created_at, updated_at)
VALUES (
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Parrainage - Paiement effectué',
  '✅ Votre paiement de {{amount}} a été effectué',
  'Confirmation de paiement envoyée à l''utilisateur',
  '<!DOCTYPE html>
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Paiement effectué !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonne nouvelle ! Votre demande de versement a été traitée avec succès. Le virement a été effectué sur votre compte bancaire 💸</p>

              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 3px solid #10b981; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Montant versé</p>
                <p style="margin: 0; font-size: 48px; font-weight: 900; color: #047857;">{{amount}}</p>
                <p style="margin: 15px 0 0; font-size: 14px; color: #065f46;">Versement effectué le <strong>{{date_paiement}}</strong></p>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1e40af;">📋 Détails du paiement</p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                  <li style="margin-bottom: 8px;">Montant : <strong>{{amount}}</strong></li>
                  <li style="margin-bottom: 8px;">Méthode : <strong>Virement bancaire</strong></li>
                  <li style="margin-bottom: 8px;">Date de traitement : <strong>{{date_paiement}}</strong></li>
                  <li>Délai de réception : <strong>2 à 5 jours ouvrés</strong></li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400e;">💡 Continuez à parrainer !</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #78350f;">Partagez votre code de parrainage pour continuer à gagner des commissions et développer notre communauté de praticiens d''excellence.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Voir mon espace ambassadeur</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Merci pour votre confiance ! 🙏<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade</strong></p>
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
  'Votre paiement de commissions a été effectué avec succès.',
  now(),
  now()
);

-- ==========================================
-- 2. AUTOMATIONS EMAIL
-- ==========================================

-- Automation 1 : Passage à Premium Gold (avec code de parrainage)
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

-- Automation 2 : Nouveau parrainage (pour le parrain)
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

-- Automation 4 : Demande de paiement (pour l'admin)
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

-- Automation 5 : Paiement effectué (pour l'utilisateur)
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
-- 3. RLS POLICIES (Row Level Security)
-- ==========================================

-- Enable RLS on all mail tables
ALTER TABLE public.mail_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES: mail_templates
-- ==========================================

-- Admin full access
CREATE POLICY "Admins can do everything on mail_templates"
ON public.mail_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can view templates
CREATE POLICY "Users can view mail_templates"
ON public.mail_templates
FOR SELECT
USING (true);

-- ==========================================
-- POLICIES: mail_automations
-- ==========================================

CREATE POLICY "Admins can manage automations"
ON public.mail_automations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_automation_steps
-- ==========================================

CREATE POLICY "Admins can manage automation steps"
ON public.mail_automation_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_automation_enrollments
-- ==========================================

CREATE POLICY "Admins can manage enrollments"
ON public.mail_automation_enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_campaigns
-- ==========================================

CREATE POLICY "Admins can manage campaigns"
ON public.mail_campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_campaign_messages
-- ==========================================

CREATE POLICY "Admins can view campaign messages"
ON public.mail_campaign_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_contacts
-- ==========================================

CREATE POLICY "Admins can manage contacts"
ON public.mail_contacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_segments
-- ==========================================

CREATE POLICY "Admins can manage segments"
ON public.mail_segments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_segment_members
-- ==========================================

CREATE POLICY "Admins can manage segment members"
ON public.mail_segment_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- POLICIES: mail_events
-- ==========================================

CREATE POLICY "Admins can view mail events"
ON public.mail_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- 4. NETTOYAGE - Tables probablement inutiles
-- ==========================================

-- ⚠️ ATTENTION : Commenté par sécurité
-- Décommenter uniquement si vous êtes SÛR que ces tables ne sont plus utilisées

/*
-- Ces tables semblent obsolètes ou inutilisées :

-- consultation_sessions_legacy : Remplacée par consultation_sessions_v2
-- DROP TABLE IF EXISTS public.consultation_sessions_legacy CASCADE;

-- anatomical_zones : Semble être une ancienne structure 3D non utilisée
-- DROP TABLE IF EXISTS public.anatomical_zones CASCADE;

-- test_categories : Vide et non utilisée (les tests utilisent directement 'category' en text)
-- DROP TABLE IF EXISTS public.test_categories CASCADE;

-- user_sessions : Structure générique jamais utilisée
-- DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- user_login_tracking : Doublon avec user_gamification_stats
-- DROP TABLE IF EXISTS public.user_login_tracking CASCADE;
*/

-- ==========================================
-- 5. VÉRIFICATION
-- ==========================================

-- Vérifier les templates créés
SELECT id, name, subject, description
FROM public.mail_templates
WHERE id IN (
  'e3333333-3333-3333-3333-333333333333',
  'e7777777-7777-7777-7777-777777777777',
  'e8888888-8888-8888-8888-888888888888',
  'e9999999-9999-9999-9999-999999999999',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ORDER BY name;

-- Vérifier les automations créées
SELECT a.id, a.name, a.trigger_event, a.active, COUNT(s.id) as steps_count
FROM public.mail_automations a
LEFT JOIN public.mail_automation_steps s ON s.automation_id = a.id
WHERE a.id LIKE 'a%'
GROUP BY a.id, a.name, a.trigger_event, a.active
ORDER BY a.name;

-- Vérifier les RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'mail_%'
ORDER BY tablename, policyname;
