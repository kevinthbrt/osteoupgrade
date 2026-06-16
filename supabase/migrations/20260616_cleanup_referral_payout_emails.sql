-- Migration: nettoyage final des emails liés à l'ancien tarif et au système RIB
--  1) Corriger les blocs prix (35€/mois + 299€/an) -> offre unique 49,99€/mois
--     dans les emails de bienvenue et de relance.
--  2) Supprimer les automations + templates devenus orphelins du système de
--     versement de commissions (RIB) : "Demande de paiement parrainage" et
--     "Paiement parrainage effectué".

-- 1a) Email "Bienvenue - Inscription" (bloc prix sur une ligne)
UPDATE public.mail_templates SET html = REPLACE(
  html,
  '35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span> <span style="font-size:14px;color:#6b7280;font-weight:400;">ou</span> 299 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/an</span>',
  '49,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>'
) WHERE id = 'e1111111-1111-1111-1111-111111111111';

-- 1b) Emails de relance (bloc prix sur 2 colonnes Mensuel/Annuel) : retirer la colonne Annuel
UPDATE public.mail_templates SET html = regexp_replace(
  html,
  '<td width="4%"></td>.*?</td>\s*</tr>',
  '</tr>',
  ''
) WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

-- ... puis corriger le prix mensuel restant
UPDATE public.mail_templates SET html = REPLACE(
  html,
  '>35 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>',
  '>49,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>'
) WHERE id IN ('f1111111-1111-1111-1111-111111111111','f2222222-2222-2222-2222-222222222222');

-- 1c) Neutraliser tout sous-titre "Soit 24,90 €/mois · 3 mois offerts" résiduel
UPDATE public.mail_templates SET html = REPLACE(REPLACE(html, ' · 3 mois offerts', ''), 'Soit 24,90 €/mois', 'Sans engagement · prélevé chaque mois')
  WHERE html LIKE '%24,90 €/mois%';

-- 2) Supprimer les automations + templates orphelins du système RIB
DELETE FROM public.mail_automation_enrollments
  WHERE automation_id IN ('a4444444-4444-4444-4444-444444444444','a5555555-5555-5555-5555-555555555555');
DELETE FROM public.mail_automation_steps
  WHERE automation_id IN ('a4444444-4444-4444-4444-444444444444','a5555555-5555-5555-5555-555555555555');
DELETE FROM public.mail_automations
  WHERE id IN ('a4444444-4444-4444-4444-444444444444','a5555555-5555-5555-5555-555555555555');
DELETE FROM public.mail_templates
  WHERE id IN ('e9999999-9999-9999-9999-999999999999','eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
