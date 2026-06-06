-- =============================================================================
-- Migration : ordre d'affichage logique des automatisations
-- Date : 2026-06-06
-- =============================================================================
-- Ajoute une colonne display_order et la renseigne selon l'ordre du cycle de vie
-- (inscription → onboarding → premium → renouvellement → paiement → expiration → parrainage).
-- L'API /api/automations trie désormais par display_order.
-- =============================================================================

ALTER TABLE mail_automations
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 1000;

-- Cycle de vie utilisateur
UPDATE mail_automations SET display_order = 10  WHERE id = 'b1111111-1111-1111-1111-111111111111'; -- Bienvenue - Inscription
UPDATE mail_automations SET display_order = 20  WHERE id = 'b2222222-2222-2222-2222-222222222222'; -- Relance/onboarding gratuit (J+1 → J+30)
UPDATE mail_automations SET display_order = 30  WHERE id = 'c1111111-1111-1111-1111-111111111111'; -- Confirmation Premium (+ MyOsteoflow J+7 / J+21)
UPDATE mail_automations SET display_order = 40  WHERE id = 'c3333333-3333-3333-3333-333333333333'; -- Rappel renouvellement imminent
UPDATE mail_automations SET display_order = 50  WHERE id = 'c2222222-2222-2222-2222-222222222222'; -- Renouvellement effectué
UPDATE mail_automations SET display_order = 60  WHERE id = 'c4444444-4444-4444-4444-444444444444'; -- Paiement échoué
UPDATE mail_automations SET display_order = 70  WHERE id = 'a6666666-6666-6666-6666-666666666666'; -- Abonnement expiré

-- Parrainage (groupés en fin)
UPDATE mail_automations SET display_order = 80  WHERE id = 'a2222222-2222-2222-2222-222222222222'; -- Nouveau parrainage - Parrain
UPDATE mail_automations SET display_order = 90  WHERE id = 'a3333333-3333-3333-3333-333333333333'; -- Bonus parrainage - Filleul
UPDATE mail_automations SET display_order = 100 WHERE id = 'a4444444-4444-4444-4444-444444444444'; -- Demande de paiement parrainage
UPDATE mail_automations SET display_order = 110 WHERE id = 'a5555555-5555-5555-5555-555555555555'; -- Paiement parrainage effectué
