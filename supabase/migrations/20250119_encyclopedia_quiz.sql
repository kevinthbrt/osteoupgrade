-- Migration pour le système de Quiz de l'Encyclopédie Ostéopathique
-- Créé le: 2025-01-19

-- =====================================================
-- Table principale des quiz
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'HVLA', 'mobilisation', 'anatomie', 'diagnostic', etc.
  difficulty TEXT CHECK (difficulty IN ('débutant', 'intermédiaire', 'avancé')),
  duration_minutes INTEGER,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  xp_reward INTEGER DEFAULT 10, -- XP gagnés en cas de réussite
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_category ON quiz(category);
CREATE INDEX IF NOT EXISTS idx_quiz_difficulty ON quiz(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_active ON quiz(is_active);

-- =====================================================
-- Questions de quiz
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false')),
  explanation TEXT, -- Explication affichée après la réponse
  points INTEGER DEFAULT 1 CHECK (points > 0),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);

-- =====================================================
-- Options de réponse pour chaque question
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_order ON quiz_question_options(question_id, order_index);

-- =====================================================
-- Tentatives de quiz par utilisateur
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  passed BOOLEAN,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER
);

-- Index pour les statistiques utilisateur
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(completed_at);

-- =====================================================
-- Réponses de l'utilisateur pour chaque question
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_ids UUID[], -- Array pour supporter les questions à choix multiples
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_user_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON quiz_user_answers(question_id);

-- =====================================================
-- Statistiques globales des quiz
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  average_time_seconds INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quiz_stats_quiz ON quiz_statistics(quiz_id);

-- =====================================================
-- Fonction pour mettre à jour updated_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_quiz_updated_at BEFORE UPDATE ON quiz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Fonction pour mettre à jour les statistiques du quiz
-- =====================================================
CREATE OR REPLACE FUNCTION update_quiz_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO quiz_statistics (quiz_id, total_attempts, total_completions, average_score, average_time_seconds)
    SELECT
        NEW.quiz_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
        AVG(score) FILTER (WHERE completed_at IS NOT NULL),
        AVG(time_spent_seconds) FILTER (WHERE completed_at IS NOT NULL)
    FROM quiz_attempts
    WHERE quiz_id = NEW.quiz_id
    ON CONFLICT (quiz_id) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        total_completions = EXCLUDED.total_completions,
        average_score = EXCLUDED.average_score,
        average_time_seconds = EXCLUDED.average_time_seconds,
        last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques après chaque tentative
CREATE TRIGGER update_quiz_stats_on_attempt
    AFTER INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION update_quiz_statistics();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_statistics ENABLE ROW LEVEL SECURITY;

-- Policies pour quiz (lecture publique, écriture admin)
CREATE POLICY "Quiz sont visibles par tous" ON quiz
    FOR SELECT USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "Admins peuvent créer des quiz" ON quiz
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent modifier leurs quiz" ON quiz
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins peuvent supprimer leurs quiz" ON quiz
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour quiz_questions
CREATE POLICY "Questions visibles si quiz actif" ON quiz_questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM quiz WHERE id = quiz_id AND is_active = true)
    );

CREATE POLICY "Admins peuvent gérer questions" ON quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour quiz_question_options
CREATE POLICY "Options visibles si quiz actif" ON quiz_question_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_questions qq
            JOIN quiz q ON qq.quiz_id = q.id
            WHERE qq.id = question_id AND q.is_active = true
        )
    );

CREATE POLICY "Admins peuvent gérer options" ON quiz_question_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies pour quiz_attempts
CREATE POLICY "Utilisateurs voient leurs tentatives" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer tentatives" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs tentatives" ON quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour quiz_user_answers
CREATE POLICY "Utilisateurs voient leurs réponses" ON quiz_user_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts
            WHERE id = attempt_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Utilisateurs peuvent enregistrer réponses" ON quiz_user_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quiz_attempts
            WHERE id = attempt_id AND user_id = auth.uid()
        )
    );

-- Policies pour quiz_statistics (lecture seule publique)
CREATE POLICY "Statistiques visibles par tous" ON quiz_statistics
    FOR SELECT USING (true);

-- =====================================================
-- Commentaires pour documentation
-- =====================================================
COMMENT ON TABLE quiz IS 'Table principale stockant les quiz de l''encyclopédie';
COMMENT ON TABLE quiz_questions IS 'Questions associées à chaque quiz';
COMMENT ON TABLE quiz_question_options IS 'Options de réponse pour chaque question';
COMMENT ON TABLE quiz_attempts IS 'Tentatives de quiz par les utilisateurs';
COMMENT ON TABLE quiz_user_answers IS 'Réponses des utilisateurs pour chaque question';
COMMENT ON TABLE quiz_statistics IS 'Statistiques agrégées par quiz';
