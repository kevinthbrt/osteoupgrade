-- Essai gratuit sans carte bancaire : nouvel anti-abus par poste MyOsteoFlow.
--
-- Contexte : exiger la carte pour démarrer l'essai servait de verrou anti-abus
-- (voir trial_card_fingerprints) mais faisait décrocher la quasi-totalité des
-- inscrits avant même d'avoir vu le produit. La carte n'est donc plus demandée
-- au démarrage de l'essai.
--
-- Le verrou est déplacé sur le device_id de MyOsteoFlow. C'est un bien meilleur
-- ancrage que la carte pour l'abus visé (recréer un compte chaque semaine pour
-- prolonger l'essai) : le device_id vit dans app_config, c'est-à-dire dans la
-- MÊME base SQLite locale que les dossiers patients. Obtenir un nouveau
-- device_id impose donc d'effacer sa base — soit de perdre exactement les
-- données que l'utilisateur cherchait à conserver en recréant un compte.
--
-- Enforcement : /api/osteoflow/auth (login de l'app desktop), seul point où
-- l'abus a une valeur. Les comptes premium/admin ne sont jamais concernés.

CREATE TABLE IF NOT EXISTS trial_device_claims (
  device_id  text PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_device_claims_user_id_idx
  ON trial_device_claims (user_id);

ALTER TABLE trial_device_claims ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accessible uniquement via la clé service_role
-- (route /api/osteoflow/auth).
