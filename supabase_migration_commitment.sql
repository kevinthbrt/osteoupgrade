-- ============================================
-- Migration Supabase : Système d'engagement
-- Date : 2025-12-08
-- Description : Ajout des colonnes pour gérer
--               les cycles d'engagement de 12 mois
-- ============================================

-- 1. Ajouter la colonne commitment_end_date
-- Stocke la date de fin du cycle d'engagement actuel
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS commitment_end_date TIMESTAMP WITH TIME ZONE;

-- 2. Ajouter la colonne commitment_cycle_number
-- Stocke le numéro du cycle en cours (1, 2, 3, etc.)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS commitment_cycle_number INTEGER DEFAULT 1;

-- 3. Ajouter la colonne commitment_renewal_notification_sent
-- Indique si l'email de notification 7 jours avant a été envoyé
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS commitment_renewal_notification_sent BOOLEAN DEFAULT false;

-- 4. Ajouter des commentaires pour documentation
COMMENT ON COLUMN profiles.commitment_end_date IS
'Date de fin de l''engagement minimum de 12 mois pour les abonnements mensuels. Utilisé pour déterminer si le client peut annuler.';

COMMENT ON COLUMN profiles.commitment_cycle_number IS
'Numéro du cycle d''engagement en cours (incrémenté à chaque renouvellement automatique de 12 mois). Commence à 1 lors de la souscription.';

COMMENT ON COLUMN profiles.commitment_renewal_notification_sent IS
'Indique si l''email d''avertissement de renouvellement a été envoyé (7 jours avant la fin du cycle). Remis à false à chaque nouveau cycle.';

-- 5. Créer un index sur commitment_end_date pour optimiser les requêtes du cron job
CREATE INDEX IF NOT EXISTS idx_profiles_commitment_end_date
ON profiles(commitment_end_date)
WHERE subscription_status = 'active';

-- 6. Créer un index composé pour les notifications de renouvellement
CREATE INDEX IF NOT EXISTS idx_profiles_renewal_check
ON profiles(commitment_end_date, commitment_renewal_notification_sent, subscription_status)
WHERE subscription_status = 'active' AND commitment_renewal_notification_sent = false;

-- ============================================
-- Vue de monitoring pour le suivi des engagements
-- ============================================

CREATE OR REPLACE VIEW renewal_monitoring AS
SELECT
  id,
  email,
  role,
  subscription_status,
  commitment_cycle_number,
  commitment_end_date,
  commitment_renewal_notification_sent,
  subscription_start_date,
  EXTRACT(DAY FROM (commitment_end_date - NOW())) AS days_until_renewal,
  CASE
    WHEN commitment_end_date IS NULL THEN '⚪ Pas d''engagement'
    WHEN commitment_end_date < NOW() THEN '⚠️ Cycle expiré'
    WHEN commitment_end_date <= NOW() + INTERVAL '7 days' AND NOT commitment_renewal_notification_sent THEN '📧 Notification à envoyer'
    WHEN commitment_end_date <= NOW() + INTERVAL '7 days' AND commitment_renewal_notification_sent THEN '✅ Notification envoyée'
    WHEN commitment_end_date <= NOW() + INTERVAL '30 days' THEN '⏰ Renouvellement proche'
    ELSE '⏳ En cours'
  END AS status
FROM profiles
WHERE role IN ('premium_silver', 'premium_gold')
  AND subscription_status = 'active'
ORDER BY commitment_end_date ASC NULLS LAST;

-- Ajouter un commentaire sur la vue
COMMENT ON VIEW renewal_monitoring IS
'Vue de monitoring pour suivre les engagements et les renouvellements. Utilisée pour le tableau de bord administrateur.';

-- ============================================
-- Fonction utilitaire pour mettre à jour les profils existants
-- ============================================

-- Cette fonction initialise commitment_end_date pour les abonnements actifs existants
-- qui n'ont pas encore cette information
CREATE OR REPLACE FUNCTION initialize_existing_commitments()
RETURNS TABLE (
  updated_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mettre à jour les profils premium actifs sans commitment_end_date
  UPDATE profiles
  SET
    commitment_end_date = subscription_start_date + INTERVAL '12 months',
    commitment_cycle_number = 1,
    commitment_renewal_notification_sent = false
  WHERE role IN ('premium_silver', 'premium_gold')
    AND subscription_status = 'active'
    AND commitment_end_date IS NULL
    AND subscription_start_date IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT
    v_count,
    format('✅ %s profil(s) initialisé(s) avec les dates d''engagement', v_count);
END;
$$ LANGUAGE plpgsql;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION initialize_existing_commitments() IS
'Initialise les colonnes d''engagement pour les abonnements premium actifs existants qui n''ont pas encore ces informations.';

-- ============================================
-- Instructions d'exécution
-- ============================================

-- 1. Exécuter cette migration dans l'éditeur SQL de Supabase
-- 2. Vérifier que les colonnes ont été créées :
--    SELECT column_name, data_type, column_default
--    FROM information_schema.columns
--    WHERE table_name = 'profiles'
--    AND column_name LIKE 'commitment%';

-- 3. (Optionnel) Initialiser les engagements pour les abonnements existants :
--    SELECT * FROM initialize_existing_commitments();

-- 4. Vérifier les données avec la vue de monitoring :
--    SELECT * FROM renewal_monitoring LIMIT 10;

-- ============================================
-- Rollback (si nécessaire)
-- ============================================

-- ⚠️ ATTENTION : Ces commandes suppriment les données !
-- Ne les exécutez que si vous devez annuler la migration

-- DROP VIEW IF EXISTS renewal_monitoring;
-- DROP FUNCTION IF EXISTS initialize_existing_commitments();
-- DROP INDEX IF EXISTS idx_profiles_renewal_check;
-- DROP INDEX IF EXISTS idx_profiles_commitment_end_date;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS commitment_renewal_notification_sent;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS commitment_cycle_number;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS commitment_end_date;
