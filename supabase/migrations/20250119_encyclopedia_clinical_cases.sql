-- Migration pour le système de Cas Pratiques Cliniques
-- Créé le: 2025-01-19

-- =====================================================
-- Table principale des cas pratiques
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  patient_context TEXT NOT NULL, -- "Patient de 35 ans, sportif, présente..."
  initial_complaint TEXT NOT NULL, -- Motif de consultation
  difficulty TEXT CHECK (difficulty IN ('débutant', 'intermédiaire', 'avancé')),
  category TEXT, -- 'traumatologie', 'rachis', 'membre supérieur', etc.
  estimated_duration_minutes INTEGER,
  xp_reward INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clinical_cases_category ON clinical_cases(category);
CREATE INDEX IF NOT EXISTS idx_clinical_cases_difficulty ON clinical_cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_clinical_cases_active ON clinical_cases(is_active);

-- =====================================================
-- Étapes du cas pratique (déroulé séquentiel)
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('observation', 'question', 'test', 'decision', 'information')),
  content TEXT NOT NULL, -- Contenu de l'étape (description, question posée, etc.)
  hint TEXT, -- Indice optionnel pour aider l'utilisateur
  points INTEGER DEFAULT 1, -- Points attribués si bonne réponse
  requires_answer BOOLEAN DEFAULT true, -- Cette étape nécessite-t-elle une réponse ?
  image_url TEXT, -- URL d'une image (radio, photo clinique, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, step_number)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_case_steps_case ON clinical_case_steps(case_id);
CREATE INDEX IF NOT EXISTS idx_case_steps_order ON clinical_case_steps(case_id, step_number);

-- =====================================================
-- Options de réponse pour chaque étape
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_step_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES clinical_case_steps(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  feedback TEXT, -- Feedback spécifique affiché après sélection
  leads_to_step_number INTEGER, -- Pour scénarios branchés (optionnel)
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_case_options_step ON clinical_case_step_options(step_id);
CREATE INDEX IF NOT EXISTS idx_case_options_order ON clinical_case_step_options(step_id, order_index);

-- =====================================================
-- Progression utilisateur dans les cas pratiques
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step_number INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, user_id)
);

-- Index pour récupérer les cas en cours d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_case_progress_user ON clinical_case_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_case_progress_case ON clinical_case_progress(case_id);
CREATE INDEX IF NOT EXISTS idx_case_progress_active ON clinical_case_progress(user_id, completed);

-- =====================================================
-- Réponses utilisateur pour chaque étape
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES clinical_case_progress(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES clinical_case_steps(id) ON DELETE CASCADE,
  selected_option_ids UUID[], -- Array pour supporter choix multiples
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  feedback_shown TEXT, -- Feedback qui a été affiché
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(progress_id, step_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_case_answers_progress ON clinical_case_user_answers(progress_id);
CREATE INDEX IF NOT EXISTS idx_case_answers_step ON clinical_case_user_answers(step_id);

-- =====================================================
-- Notes personnelles de l'utilisateur sur un cas
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_case_notes_user ON clinical_case_notes(user_id);

-- =====================================================
-- Statistiques des cas pratiques
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_case_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  average_duration_minutes INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_case_stats_case ON clinical_case_statistics(case_id);

-- =====================================================
-- Triggers pour updated_at
-- =====================================================
CREATE TRIGGER update_clinical_cases_updated_at BEFORE UPDATE ON clinical_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_steps_updated_at BEFORE UPDATE ON clinical_case_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON clinical_case_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Fonction pour mettre à jour last_activity_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_case_progress_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clinical_case_progress
    SET last_activity_at = NOW()
    WHERE id = NEW.progress_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour l'activité quand une réponse est enregistrée
CREATE TRIGGER update_activity_on_answer
    AFTER INSERT ON clinical_case_user_answers
    FOR EACH ROW EXECUTE FUNCTION update_case_progress_activity();

-- =====================================================
-- Fonction pour mettre à jour les statistiques
-- =====================================================
CREATE OR REPLACE FUNCTION update_clinical_case_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO clinical_case_statistics (
        case_id,
        total_attempts,
        total_completions,
        average_score,
        average_duration_minutes
    )
    SELECT
        NEW.case_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE completed = true),
        AVG(score) FILTER (WHERE completed = true),
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) FILTER (WHERE completed = true)
    FROM clinical_case_progress
    WHERE case_id = NEW.case_id
    ON CONFLICT (case_id) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        total_completions = EXCLUDED.total_completions,
        average_score = EXCLUDED.average_score,
        average_duration_minutes = EXCLUDED.average_duration_minutes,
        last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques
CREATE TRIGGER update_case_stats_on_progress
    AFTER INSERT OR UPDATE ON clinical_case_progress
    FOR EACH ROW EXECUTE FUNCTION update_clinical_case_statistics();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_step_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_statistics ENABLE ROW LEVEL SECURITY;

-- Policies pour clinical_cases
CREATE POLICY "Cas pratiques visibles par tous" ON clinical_cases
    FOR SELECT USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "Admins peuvent créer cas pratiques" ON clinical_cases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent modifier cas pratiques" ON clinical_cases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent supprimer cas pratiques" ON clinical_cases
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour clinical_case_steps
CREATE POLICY "Étapes visibles si cas actif" ON clinical_case_steps
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clinical_cases WHERE id = case_id AND is_active = true)
    );

CREATE POLICY "Admins peuvent gérer étapes" ON clinical_case_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour clinical_case_step_options
CREATE POLICY "Options visibles si cas actif" ON clinical_case_step_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinical_case_steps cs
            JOIN clinical_cases cc ON cs.case_id = cc.id
            WHERE cs.id = step_id AND cc.is_active = true
        )
    );

CREATE POLICY "Admins peuvent gérer options" ON clinical_case_step_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour clinical_case_progress
CREATE POLICY "Utilisateurs voient leur progression" ON clinical_case_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leur progression" ON clinical_case_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur progression" ON clinical_case_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour clinical_case_user_answers
CREATE POLICY "Utilisateurs voient leurs réponses" ON clinical_case_user_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinical_case_progress
            WHERE id = progress_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Utilisateurs peuvent enregistrer leurs réponses" ON clinical_case_user_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clinical_case_progress
            WHERE id = progress_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Utilisateurs peuvent modifier leurs réponses" ON clinical_case_user_answers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clinical_case_progress
            WHERE id = progress_id AND user_id = auth.uid()
        )
    );

-- Policies pour clinical_case_notes
CREATE POLICY "Utilisateurs voient leurs notes" ON clinical_case_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs notes" ON clinical_case_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs notes" ON clinical_case_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs notes" ON clinical_case_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour clinical_case_statistics
CREATE POLICY "Statistiques visibles par tous" ON clinical_case_statistics
    FOR SELECT USING (true);

-- =====================================================
-- Commentaires pour documentation
-- =====================================================
COMMENT ON TABLE clinical_cases IS 'Cas pratiques cliniques pour l''apprentissage interactif';
COMMENT ON TABLE clinical_case_steps IS 'Étapes séquentielles d''un cas pratique';
COMMENT ON TABLE clinical_case_step_options IS 'Options de réponse pour chaque étape';
COMMENT ON TABLE clinical_case_progress IS 'Progression des utilisateurs dans les cas pratiques';
COMMENT ON TABLE clinical_case_user_answers IS 'Réponses des utilisateurs à chaque étape';
COMMENT ON TABLE clinical_case_notes IS 'Notes personnelles des utilisateurs sur les cas';
COMMENT ON TABLE clinical_case_statistics IS 'Statistiques agrégées par cas pratique';
