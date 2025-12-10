-- Ajouter le champ metadata à mail_automation_enrollments pour stocker les variables personnalisées
ALTER TABLE mail_automation_enrollments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Créer un index sur le champ metadata pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_mail_automation_enrollments_metadata
ON mail_automation_enrollments USING gin(metadata);

-- Commentaire explicatif
COMMENT ON COLUMN mail_automation_enrollments.metadata IS 'Métadonnées personnalisées pour le remplacement des variables dans les templates d''email (ex: {{nom}}, {{prix}}, {{date_fact}})';
