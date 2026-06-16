-- Migration: Nouvelle tarification (49,99€/mois, offre unique) + parrainage "1 mois offert"
-- Objectif : mettre à jour les templates d'emails (table mail_templates) pour refléter
--   * la nouvelle offre unique à 49,99€/mois, sans engagement, prélevée chaque mois
--   * le nouveau parrainage : 1 mois offert pour le parrain ET le filleul (plus de commission 10%)
-- Note : le template "Confirmation - Premium" utilise déjà la variable {{prix}}, alimentée
--        dynamiquement par le webhook Stripe (désormais "49,99€"), donc aucun prix codé en dur
--        n'y est touché.

-- 1. Parrainage : remplacer la mention "10% de commission" par "1 mois offert"
UPDATE mail_templates SET html = REPLACE(
  html,
  'Partagez ce code et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel parrainé ! 🎁',
  'Partagez ce code : à chaque parrainage validé, vous et votre filleul recevez chacun <strong>1 mois offert</strong> ! 🎁'
) WHERE html LIKE '%10% de commission%';

UPDATE mail_templates SET html = REPLACE(
  html,
  'partagez votre code unique et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel souscrit grâce à vous',
  'partagez votre code unique : vous et votre filleul recevez chacun <strong>1 mois offert</strong> à chaque parrainage validé'
) WHERE html LIKE '%10% de commission%';

UPDATE mail_templates SET html = REPLACE(
  html,
  'Partagez votre code unique à vos collègues et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel souscrit grâce à vous. Sans limite !',
  'Partagez votre code unique à vos collègues : <strong>1 mois offert</strong> pour vous et votre filleul à chaque parrainage validé. Sans limite !'
) WHERE html LIKE '%10% de commission%';

UPDATE mail_templates SET html = REPLACE(
  html,
  'Partagez-le et gagnez <strong>10% de commission</strong> sur chaque abonnement annuel parrainé. 10 filleuls = votre abonnement remboursé ! 🎁',
  'Partagez-le : à chaque parrainage validé, vous et votre filleul recevez chacun <strong>1 mois offert</strong>. Parrainages illimités et cumulables ! 🎁'
) WHERE html LIKE '%10% de commission%';

-- Catch-all pour toute mention résiduelle
UPDATE mail_templates SET html = REPLACE(html, '10% de commission', '1 mois offert')
  WHERE html LIKE '%10% de commission%';

-- 2. Prix : remplacer les anciens montants codés en dur par l'offre unique 49,99€/mois
UPDATE mail_templates SET html = REPLACE(html, 'Premium Gold à 499 €/an', 'Premium à 49,99 €/mois')
  WHERE html LIKE '%499 €/an%';

UPDATE mail_templates SET html = REPLACE(html, '29 €/mois', '49,99 €/mois')
  WHERE html LIKE '%29 €/mois%';

UPDATE mail_templates SET html = REPLACE(html, 'ou 240 €/an', 'sans engagement')
  WHERE html LIKE '%240 €/an%';

UPDATE mail_templates SET html = REPLACE(html, '(20 €/mois · -17%)', '(prélevé chaque mois)')
  WHERE html LIKE '%20 €/mois%';

UPDATE mail_templates SET html = REPLACE(html, 'à partir de 20 €/mois', 'à 49,99 €/mois')
  WHERE html LIKE '%20 €/mois%';

-- 3. Anciens libellés génériques de prix éventuels
UPDATE mail_templates SET html = REPLACE(html, '35 €/mois', '49,99 €/mois') WHERE html LIKE '%35 €/mois%';
UPDATE mail_templates SET html = REPLACE(html, '35€/mois', '49,99€/mois')   WHERE html LIKE '%35€/mois%';
UPDATE mail_templates SET html = REPLACE(html, '299 €/an', '49,99 €/mois')   WHERE html LIKE '%299 €/an%';
UPDATE mail_templates SET html = REPLACE(html, '299€/an', '49,99€/mois')     WHERE html LIKE '%299€/an%';

UPDATE mail_templates SET updated_at = NOW()
  WHERE html LIKE '%49,99%' OR html LIKE '%1 mois offert%';
