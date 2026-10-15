-- Offre étudiant : -50 % la première année sur les trois offres annuelles,
-- débloquée par un justificatif (diplôme, avis de situation INSEE) vérifié à
-- la main ensuite (cf. docs/OFFRE_ETUDIANT.md).
--
-- Une ligne par compte. Statuts :
--   pending   justificatif reçu, remise utilisable, vérification à faire ;
--   approved  justificatif validé ;
--   rejected  justificatif refusé : remise retirée, différence facturée si
--             la première année était déjà payée.
--
-- Le justificatif est supprimé du stockage dès la décision (document_path
-- repasse à NULL) : seule la décision est conservée.
--
-- Aucune politique RLS : seul le serveur (clé service-role) lit et écrit.
-- Les fichiers vivent dans un bucket privé, servis à l'admin par URL signée.

CREATE TABLE IF NOT EXISTS public.student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_path text,
  document_name text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  -- Renseignés au paiement : la remise a été posée sur cet abonnement.
  stripe_subscription_id text,
  discount_applied_at timestamptz,
  -- Décision de l'admin.
  decided_at timestamptz,
  decided_by uuid,
  rejection_reason text,
  -- Régularisation facturée au refus, en centimes (0 si refus pendant l'essai).
  regularisation_amount integer
);

CREATE INDEX IF NOT EXISTS idx_student_verifications_status
  ON public.student_verifications (status, submitted_at);

COMMENT ON TABLE public.student_verifications IS
  'Demandes de tarif étudiant (-50 % la première année sur l''annuel). Écrit uniquement par le serveur.';

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- Bucket privé des justificatifs : 10 Mo, PDF et images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents', 'student-documents', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;
-- Email « Justificatif étudiant refusé » (gabarit de référence : Onboarding gratuit - J+1).
INSERT INTO public.mail_templates (id, name, subject, description, html, text)
VALUES (
  'e7000000-0000-4000-8000-000000000001',
  'Notification - Justificatif étudiant refusé',
  'Votre justificatif étudiant n''a pas pu être validé',
  'Envoyé au refus d''un justificatif étudiant depuis /admin/etudiants. Variables : {{motif}}, {{consequence}}.',
  $html$<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 6px;">🎓</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Votre justificatif étudiant</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Nous n'avons pas pu le valider.</p>
      </td></tr>
      <tr><td style="padding: 40px;">
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Nous avons examiné le justificatif déposé pour bénéficier du tarif étudiant, et nous ne pouvons pas le valider.</p>
        <div style="padding: 16px 20px; background-color: #f5f3ff; border-radius: 8px; margin: 0 0 20px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.04em;">Motif</p>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">{{motif}}</p>
        </div>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">{{consequence}}</p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background-color: #7c3aed; background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Mon espace abonnement</a>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Une erreur ? Répondez simplement à cet email avec un justificatif à jour (carte étudiante, certificat de scolarité, diplôme ou avis de situation INSEE), nous le regarderons rapidement.</p>
        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">Bien à vous,<br><strong style="color: #1f2937;">L'équipe OsteoUpgrade × MyOsteoflow</strong></p>
      </td></tr>
      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>$html$,
  $text$Bonjour {{full_name}},

Nous avons examiné le justificatif déposé pour bénéficier du tarif étudiant, et nous ne pouvons pas le valider.

Motif : {{motif}}

{{consequence}}

Votre espace abonnement : https://www.osteo-upgrade.fr/settings/subscription

Une erreur ? Répondez simplement à cet email avec un justificatif à jour (carte étudiante, certificat de scolarité, diplôme ou avis de situation INSEE), nous le regarderons rapidement.

Bien à vous,
L'équipe OsteoUpgrade × MyOsteoflow$text$
)
ON CONFLICT (id) DO NOTHING;

WITH auto AS (
  INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
  SELECT 'Notification - Justificatif étudiant refusé',
         'Envoyé au refus d''un justificatif étudiant (/admin/etudiants).',
         'Justificatif étudiant refusé', true, false
  WHERE NOT EXISTS (SELECT 1 FROM public.mail_automations WHERE trigger_event = 'Justificatif étudiant refusé')
  RETURNING id
)
INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
SELECT id, 1, 0, 'Votre justificatif étudiant n''a pas pu être validé', 'e7000000-0000-4000-8000-000000000001', '{}'::jsonb
FROM auto;
