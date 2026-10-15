-- Gabarits d'emails compatibles avec la facturation annuelle.
--
-- Appliquée en production le 15/10/2026. Idempotente : chaque remplacement
-- ne trouve plus rien à remplacer une fois passé.
--
-- - Upsell J+21 (MyOsteoFlow et OsteoUpgrade) : les tarifs annoncés
--   (« Vous payez aujourd'hui 29,99 €/mois ») étaient faux pour un abonné
--   annuel ; l'équivalent annuel est désormais cité à côté.
-- - Essai gratuit démarré : « débitée de {{prix}} pour le premier mois »
--   devient « débitée de {{prix}} », {{prix}} portant déjà « /mois » ou « /an ».
-- - Parrainage (parrain et filleul) : le crédit est déduit de la « prochaine
--   facture », plus de la « prochaine facture mensuelle ».
-- - Changement d'offre (trois gabarits) et pied des emails de parrainage :
--   suppression des tirets cadratins (règle de rédaction du projet).

UPDATE public.mail_templates t SET
  html = replace(replace(replace(replace(replace(replace(replace(replace(replace(t.html,
    'Vous payez aujourd&apos;hui <strong>29,99 €/mois</strong></p>', 'Vous payez aujourd&apos;hui <strong>29,99 €/mois</strong> (ou 299,99 €/an)</p>'),
    'L&apos;offre Premium est à 49,99 €/mois</p>', 'L&apos;offre Premium est à 49,99 €/mois (ou 499,99 €/an)</p>'),
    '<strong>20 € de plus</strong>', '<strong>20 € de plus par mois</strong> (200 € par an en formule annuelle)'),
    'séparément — <strong>', 'séparément : <strong>'),
    ' pour le premier mois d&apos;abonnement,', ','),
    'prochaine facture mensuelle', 'prochaine facture'),
    'prochaine échéance mensuelle', 'prochaine échéance'),
    '</strong> &mdash; {{prix}}', '</strong> ({{prix}})'),
    'OsteoUpgrade — notification automatique', 'OsteoUpgrade : notification automatique'),
  updated_at = now()
WHERE t.name IN (
  'MyOsteoFlow - Upsell OsteoUpgrade J+21',
  'OsteoUpgrade - Upsell MyOsteoFlow J+21',
  'Confirmation - Essai gratuit MyOsteoflow',
  'Parrainage - Bonus filleul',
  'Parrainage - Nouveau filleul',
  'Changement d''offre - Évolution',
  'Changement d''offre - Échange',
  'Changement d''offre - Réduction'
);

-- Upsell J+21 : tarifs propres à chaque abonné.
--
-- Les remplacements ci-dessus citaient le mensuel et l'annuel public, ce qui
-- restait faux pour un stagiaire d'école ou un membre fondateur. Le gabarit
-- reçoit désormais quatre variables, calculées par le webhook à la grille de
-- l'abonné (upsellVariablesFor, lib/offers.ts) et posées sur l'inscription à
-- la séquence. Les valeurs par défaut des étapes reprennent le tarif mensuel :
-- c'est ce que reçoit une inscription faite avant le déploiement du code.
UPDATE public.mail_templates t SET html =
  replace(replace(replace(replace(t.html,
    'Vous payez aujourd&apos;hui <strong>29,99 €/mois</strong> (ou 299,99 €/an)</p>', 'Vous payez aujourd&apos;hui <strong>{{upsell_prix_actuel}}</strong></p>'),
    'L&apos;offre Premium est à 49,99 €/mois (ou 499,99 €/an)</p>', 'L&apos;offre Premium est à {{upsell_prix_premium}}</p>'),
    'Soit <strong>20 € de plus par mois</strong> (200 € par an en formule annuelle) pour tout', 'Soit <strong>{{upsell_ecart}}</strong> pour tout'),
    ', au lieu de 29,99 € s&apos;il était pris séparément : <strong>10 €/mois d&apos;économie</strong>.</p>', ', au lieu de {{upsell_prix_seul}} s&apos;il était pris séparément.</p>'),
  updated_at = now()
WHERE t.id::text IN ('a2000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001');

UPDATE public.mail_automation_steps SET payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
  'upsell_prix_actuel', '29,99 €/mois',
  'upsell_prix_premium', '49,99 €/mois',
  'upsell_ecart', '20 € de plus par mois',
  'upsell_prix_seul', '29,99 €/mois')
WHERE template_slug IN ('a2000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001');
