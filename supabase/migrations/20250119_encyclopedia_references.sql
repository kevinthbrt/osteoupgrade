-- Migration pour le système d'Interconnexions entre Modules
-- Créé le: 2025-01-19

-- =====================================================
-- Table pour gérer les références croisées entre modules
-- =====================================================
CREATE TABLE IF NOT EXISTS module_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (d'où vient la référence)
  source_module TEXT NOT NULL CHECK (source_module IN ('diagnostic', 'practice', 'course', 'quiz', 'case')),
  source_id UUID NOT NULL,

  -- Cible (vers quoi pointe la référence)
  target_module TEXT NOT NULL CHECK (target_module IN ('diagnostic', 'practice', 'course', 'quiz', 'case')),
  target_id UUID NOT NULL,

  -- Métadonnées de la référence
  reference_type TEXT CHECK (reference_type IN ('related', 'prerequisite', 'follow_up', 'practice', 'theory', 'assessment')),
  display_label TEXT, -- "Voir la technique associée", "Quiz de validation", etc.
  description TEXT, -- Description optionnelle de la relation

  order_index INTEGER DEFAULT 0, -- Pour ordonner l'affichage
  is_active BOOLEAN DEFAULT true,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_module_ref_source ON module_references(source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_module_ref_target ON module_references(target_module, target_id);
CREATE INDEX IF NOT EXISTS idx_module_ref_type ON module_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_module_ref_active ON module_references(is_active);

-- Index composite pour recherches bidirectionnelles
CREATE INDEX IF NOT EXISTS idx_module_ref_bidirectional ON module_references(source_module, source_id, target_module, target_id);

-- Contrainte d'unicité pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_module_ref_unique
ON module_references(source_module, source_id, target_module, target_id, reference_type)
WHERE is_active = true;

-- =====================================================
-- Vue pour faciliter les requêtes de références
-- =====================================================
CREATE OR REPLACE VIEW module_references_bidirectional AS
-- Références dans le sens normal
SELECT
  id,
  source_module,
  source_id,
  target_module,
  target_id,
  reference_type,
  display_label,
  description,
  order_index,
  'forward' as direction
FROM module_references
WHERE is_active = true

UNION ALL

-- Références dans le sens inverse (pour navigation bidirectionnelle)
SELECT
  id,
  target_module as source_module,
  target_id as source_id,
  source_module as target_module,
  source_id as target_id,
  CASE reference_type
    WHEN 'prerequisite' THEN 'follow_up'
    WHEN 'follow_up' THEN 'prerequisite'
    ELSE reference_type
  END as reference_type,
  CASE reference_type
    WHEN 'prerequisite' THEN 'Suite recommandée'
    WHEN 'follow_up' THEN 'Prérequis'
    ELSE display_label
  END as display_label,
  description,
  order_index,
  'backward' as direction
FROM module_references
WHERE is_active = true;

-- =====================================================
-- Table pour stocker les suggestions automatiques
-- =====================================================
CREATE TABLE IF NOT EXISTS module_reference_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_module TEXT NOT NULL,
  target_id UUID NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning TEXT, -- Pourquoi cette suggestion a été générée
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_suggestions_source ON module_reference_suggestions(source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_confidence ON module_reference_suggestions(confidence_score DESC);

-- =====================================================
-- Fonction pour obtenir toutes les références d'un module
-- =====================================================
CREATE OR REPLACE FUNCTION get_module_references(
  p_module TEXT,
  p_id UUID,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  reference_id UUID,
  target_module TEXT,
  target_id UUID,
  reference_type TEXT,
  display_label TEXT,
  description TEXT,
  direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.target_module,
    mr.target_id,
    mr.reference_type,
    mr.display_label,
    mr.description,
    mr.direction
  FROM module_references_bidirectional mr
  WHERE mr.source_module = p_module
    AND mr.source_id = p_id
    AND (p_reference_type IS NULL OR mr.reference_type = p_reference_type)
  ORDER BY mr.order_index, mr.created_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Fonction pour compter les références par type
-- =====================================================
CREATE OR REPLACE FUNCTION count_module_references(
  p_module TEXT,
  p_id UUID
)
RETURNS TABLE (
  reference_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.reference_type,
    COUNT(*)
  FROM module_references_bidirectional mr
  WHERE mr.source_module = p_module
    AND mr.source_id = p_id
  GROUP BY mr.reference_type;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger pour updated_at
-- =====================================================
CREATE TRIGGER update_module_references_updated_at BEFORE UPDATE ON module_references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE module_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_reference_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies pour module_references
CREATE POLICY "Références visibles par tous" ON module_references
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins peuvent créer références" ON module_references
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent modifier références" ON module_references
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent supprimer références" ON module_references
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour suggestions (visible par admins uniquement)
CREATE POLICY "Suggestions visibles par admins" ON module_reference_suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- Fonction helper pour créer une référence bidirectionnelle
-- =====================================================
CREATE OR REPLACE FUNCTION create_bidirectional_reference(
  p_source_module TEXT,
  p_source_id UUID,
  p_target_module TEXT,
  p_target_id UUID,
  p_reference_type TEXT,
  p_display_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_reference_id UUID;
BEGIN
  INSERT INTO module_references (
    source_module,
    source_id,
    target_module,
    target_id,
    reference_type,
    display_label,
    description,
    created_by
  ) VALUES (
    p_source_module,
    p_source_id,
    p_target_module,
    p_target_id,
    p_reference_type,
    p_display_label,
    p_description,
    auth.uid()
  )
  RETURNING id INTO v_reference_id;

  RETURN v_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Commentaires pour documentation
-- =====================================================
COMMENT ON TABLE module_references IS 'Table de références croisées entre tous les modules de l''encyclopédie';
COMMENT ON TABLE module_reference_suggestions IS 'Suggestions automatiques de liens entre contenus';
COMMENT ON VIEW module_references_bidirectional IS 'Vue bidirectionnelle des références pour navigation dans les deux sens';
COMMENT ON FUNCTION get_module_references IS 'Récupère toutes les références pour un module donné';
COMMENT ON FUNCTION count_module_references IS 'Compte les références par type pour un module';
COMMENT ON FUNCTION create_bidirectional_reference IS 'Helper pour créer une référence avec métadonnées';

-- =====================================================
-- Exemples de types de références
-- =====================================================
-- 'related': Contenu connexe général
-- 'prerequisite': Ce contenu est un prérequis pour le contenu cible
-- 'follow_up': Ce contenu suit naturellement le contenu source
-- 'practice': Lien vers application pratique d'une théorie
-- 'theory': Lien vers base théorique d'une pratique
-- 'assessment': Lien vers évaluation/quiz du contenu

-- Exemples d'utilisation:
-- Diagnostic "Tendinopathie coiffe" → Pratique "HVLA épaule" (type: practice)
-- Cours "Anatomie épaule" → Quiz "Test anatomie épaule" (type: assessment)
-- Quiz "Anatomie épaule" → Cas pratique "Épaule douloureuse" (type: follow_up)
-- Cas pratique → Diagnostic (type: related)
