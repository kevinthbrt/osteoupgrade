-- Migration: Emails de notification de parrainage -> "1 mois offert"
-- Remplace l'ancien contenu basé sur la commission 10% ({{commission}}, {{subscription_amount}}…)
-- par le nouveau message "1 mois offert" pour le parrain et le filleul.

-- Sujets d'étape d'automation (priment sur le subject du template)
UPDATE public.mail_automation_steps
SET subject = '🎉 Nouveau filleul ! Votre prochain mois est offert 🎁'
WHERE template_slug = 'e7777777-7777-7777-7777-777777777777';

UPDATE public.mail_automation_steps
SET subject = '🎁 Merci ! Votre prochain mois est offert'
WHERE template_slug = 'e8888888-8888-8888-8888-888888888888';

-- Template PARRAIN (e7777777)
UPDATE public.mail_templates SET
  subject = '🎉 Nouveau filleul ! Votre prochain mois est offert 🎁',
  description = 'Notification au parrain : un filleul s''est abonné, 1 mois offert',
  updated_at = NOW(),
  html = $$<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);padding:32px 28px;text-align:center;">
        <p style="margin:0;font-size:40px;">🎁</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">Bravo, un nouveau filleul !</h1>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Bonjour {{full_name}},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;"><strong>{{referred_name}}</strong> vient de s'abonner à OsteoUpgrade Premium grâce à votre code de parrainage. Merci de faire grandir la communauté !</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
          <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#b45309;font-weight:700;">Votre récompense</p>
          <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#b45309;">1 mois offert</p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#92400e;">Le crédit est déjà appliqué sur votre compte : il sera automatiquement déduit de votre prochaine échéance mensuelle. Votre filleul bénéficie lui aussi d'un mois offert.</p>
        </div>
        <div style="text-align:center;margin:24px 0 8px;">
          <a href="https://www.osteo-upgrade.fr/settings/referrals" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Voir mes parrainages</a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Continuez à partager votre code : chaque parrainage validé vous offre un mois supplémentaire, sans limite.</p>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin:16px 0 0;">OsteoUpgrade — notification automatique</p>
  </div>
</body>
</html>$$
WHERE id = 'e7777777-7777-7777-7777-777777777777';

-- Template FILLEUL (e8888888)
UPDATE public.mail_templates SET
  subject = '🎁 Merci ! Votre prochain mois est offert',
  description = 'Notification au filleul : 1 mois offert grâce au parrainage',
  updated_at = NOW(),
  html = $$<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);padding:32px 28px;text-align:center;">
        <p style="margin:0;font-size:40px;">🎁</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">Bienvenue dans Premium !</h1>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Bonjour {{full_name}},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Merci d'avoir rejoint OsteoUpgrade Premium avec un code de parrainage. En guise de bienvenue, nous vous offrons un mois !</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
          <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#b45309;font-weight:700;">Votre cadeau</p>
          <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#b45309;">1 mois offert</p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#92400e;">Un crédit a été appliqué sur votre compte : il sera automatiquement déduit de votre prochaine facture mensuelle.</p>
        </div>
        <div style="text-align:center;margin:24px 0 8px;">
          <a href="https://www.osteo-upgrade.fr/dashboard" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Accéder à mon espace</a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">À votre tour : partagez votre propre code de parrainage et offrez (en gagnant) un mois à chaque collègue parrainé.</p>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin:16px 0 0;">OsteoUpgrade — notification automatique</p>
  </div>
</body>
</html>$$
WHERE id = 'e8888888-8888-8888-8888-888888888888';
