-- Migration: derniers résidus de prix dans les emails -> offre unique 49,99€/mois

-- Relance J+30 : retirer les lignes redondantes/obsolètes ("ou 49,99 €/mois", "(24,90 €/mois · -29%)")
UPDATE public.mail_templates SET html = REPLACE(
  html, '<p style="margin: 3px 0 0; font-size: 11px; color: #8b5cf6;">ou 49,99 €/mois</p>', ''
) WHERE id = 'f3333333-3333-3333-3333-333333333333';
UPDATE public.mail_templates SET html = REPLACE(
  html, '<p style="margin: 2px 0 0; font-size: 10px; color: #a78bfa;">(24,90 €/mois · -29%)</p>', ''
) WHERE id = 'f3333333-3333-3333-3333-333333333333';

-- Toute mention résiduelle "24,90 €/mois" (CTA, onboarding…) -> "49,99 €/mois"
UPDATE public.mail_templates
SET html = REPLACE(REPLACE(html, 'dès 24,90 €/mois', '49,99 €/mois'), '24,90 €/mois', '49,99 €/mois'),
    updated_at = NOW()
WHERE html LIKE '%24,90%';
