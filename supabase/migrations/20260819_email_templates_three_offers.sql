-- Phase 4 (partie lancement) du passage à 3 offres — cf. docs/PRICING_3_OFFRES.md.
--
-- Les champs de fusion des emails sont corrects depuis la phase 2
-- (describePlanPricing lit le catalogue Stripe), mais les CORPS de templates
-- contenaient encore « 49,99 € » écrit en dur. Un abonné MyOsteoFlow à
-- 29,99 € aurait reçu un email lui annonçant un prélèvement de 49,99 €.
--
-- Deux traitements distincts :
--   * emails transactionnels liés à un abonnement précis → champ {{prix}},
--     qui porte déjà le tarif réellement souscrit (offre Fondateur et
--     réduction partenaire comprises) ;
--   * emails marketing adressés à des comptes gratuits, qui ne sont liés à
--     aucune offre → mention des trois tarifs.

-- ── Transactionnel : le prix réel de l'offre souscrite ──────────────────

UPDATE public.mail_templates
SET html = replace(
      html,
      '<strong>49,99€</strong> pour le premier mois d&apos;abonnement Premium',
      '<strong>{{prix}}</strong> pour le premier mois d&apos;abonnement'
    )
WHERE id = 'e3333333-3333-3333-3333-333333333333';

-- ── Marketing : trois offres, plus une seule ────────────────────────────

-- Bienvenue à l'inscription : carte tarifaire unique → point d'entrée bas
UPDATE public.mail_templates
SET html = replace(
      html,
      '49,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>',
      'dès 29,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>'
    )
WHERE id = 'e1111111-1111-1111-1111-111111111111';

-- Onboarding gratuit J+1
UPDATE public.mail_templates
SET html = replace(
      html,
      'plan Premium</a> débloque tout (49,99 €/mois).',
      'nos offres</a> : MyOsteoFlow ou OsteoUpgrade à 29,99 €/mois, les deux réunis à 49,99 €/mois.'
    )
WHERE id = 'f5555555-5555-5555-5555-555555555555';

-- Relances J+7 et J+15 : même bloc tarifaire
UPDATE public.mail_templates
SET html = replace(
      html,
      '49,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>',
      'dès 29,99 €<span style="font-size: 14px; font-weight: 400; color: #6b7280;">/mois</span>'
    )
WHERE id IN (
  'f1111111-1111-1111-1111-111111111111',
  'f2222222-2222-2222-2222-222222222222'
);

-- Relance J+30 : encart tarifaire et bouton
UPDATE public.mail_templates
SET html = replace(
      replace(html, '>49,99 €/mois</p>', '>dès 29,99 €/mois</p>'),
      'Passer à Premium — 49,99 €/mois',
      'Découvrir les offres — dès 29,99 €/mois'
    )
WHERE id = 'f3333333-3333-3333-3333-333333333333';
