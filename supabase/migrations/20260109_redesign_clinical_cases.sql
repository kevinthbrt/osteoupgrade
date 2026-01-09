-- ============================================
-- REDESIGN COMPLET DU MODULE CAS CLINIQUES
-- Migration du 2026-01-09
-- ============================================
-- Ce script transforme l'ancien système de cas cliniques
-- en un système inspiré de l'e-learning avec chapitres, modules et quiz

-- ============================================
-- ÉTAPE 1: SUPPRESSION DES ANCIENNES TABLES
-- ============================================

DROP TABLE IF EXISTS public.case_user_answers CASCADE;
DROP TABLE IF EXISTS public.case_step_choices CASCADE;
DROP TABLE IF EXISTS public.case_steps CASCADE;
DROP TABLE IF EXISTS public.case_progress CASCADE;
DROP TABLE IF EXISTS public.clinical_cases CASCADE;

-- ============================================
-- ÉTAPE 2: CRÉATION DES NOUVELLES TABLES
-- ============================================

-- 1. Table principale des cas cliniques (équivalent de elearning_formations)
CREATE TABLE public.clinical_cases_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  region text NOT NULL CHECK (region = ANY (ARRAY[
    'cervical', 'atm', 'crane', 'thoracique', 'lombaire',
    'sacro-iliaque', 'cotes', 'epaule', 'coude', 'poignet',
    'main', 'hanche', 'genou', 'cheville', 'pied',
    'neurologique', 'vasculaire', 'systemique'
  ]::text[])),
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['débutant', 'intermédiaire', 'avancé']::text[])),
  duration_minutes integer DEFAULT 30,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_free_access boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_cases_v2_pkey PRIMARY KEY (id)
);

-- 2. Chapitres des cas cliniques (équivalent de elearning_chapters)
CREATE TABLE public.clinical_case_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.clinical_cases_v2(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_chapters_pkey PRIMARY KEY (id)
);

-- 3. Modules/Sous-parties (équivalent de elearning_subparts)
-- Contient vidéos, photos, et contenu pédagogique
CREATE TABLE public.clinical_case_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.clinical_case_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['video', 'image', 'text', 'mixed']::text[])),
  vimeo_url text,
  image_url text,
  description_html text,
  order_index integer NOT NULL DEFAULT 1,
  duration_minutes integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_modules_pkey PRIMARY KEY (id)
);

-- 4. Quiz associés aux modules
CREATE TABLE public.clinical_case_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.clinical_case_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 70,
  is_active boolean NOT NULL DEFAULT true,
  allow_retry boolean DEFAULT true,
  max_attempts integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_quizzes_pkey PRIMARY KEY (id)
);

-- 5. Questions des quiz
CREATE TABLE public.clinical_case_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.clinical_case_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type = ANY (ARRAY[
    'multiple_choice',
    'true_false',
    'multiple_answer'
  ]::text[])),
  image_url text,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  explanation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_quiz_questions_pkey PRIMARY KEY (id)
);

-- 6. Réponses des questions
CREATE TABLE public.clinical_case_quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.clinical_case_quiz_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_quiz_answers_pkey PRIMARY KEY (id)
);

-- 7. Tentatives de quiz par les utilisateurs
CREATE TABLE public.clinical_case_quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.clinical_case_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  answers_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT clinical_case_quiz_attempts_pkey PRIMARY KEY (id)
);

-- 8. Progression des modules par utilisateur
CREATE TABLE public.clinical_case_module_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.clinical_case_modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_module_progress_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_case_module_progress_unique UNIQUE (module_id, user_id)
);

-- 9. Progression globale des cas cliniques par utilisateur
CREATE TABLE public.clinical_case_progress_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.clinical_cases_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  total_score integer NOT NULL DEFAULT 0,
  completion_percentage integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  last_accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_case_progress_v2_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_case_progress_v2_unique UNIQUE (case_id, user_id)
);

-- ============================================
-- ÉTAPE 3: INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_clinical_cases_v2_region ON public.clinical_cases_v2(region);
CREATE INDEX idx_clinical_cases_v2_difficulty ON public.clinical_cases_v2(difficulty);
CREATE INDEX idx_clinical_cases_v2_active ON public.clinical_cases_v2(is_active);
CREATE INDEX idx_clinical_cases_v2_free_access ON public.clinical_cases_v2(is_free_access);

CREATE INDEX idx_clinical_case_chapters_case_id ON public.clinical_case_chapters(case_id);
CREATE INDEX idx_clinical_case_chapters_order ON public.clinical_case_chapters(order_index);

CREATE INDEX idx_clinical_case_modules_chapter_id ON public.clinical_case_modules(chapter_id);
CREATE INDEX idx_clinical_case_modules_order ON public.clinical_case_modules(order_index);
CREATE INDEX idx_clinical_case_modules_content_type ON public.clinical_case_modules(content_type);

CREATE INDEX idx_clinical_case_quizzes_module_id ON public.clinical_case_quizzes(module_id);
CREATE INDEX idx_clinical_case_quizzes_active ON public.clinical_case_quizzes(is_active);

CREATE INDEX idx_clinical_case_quiz_questions_quiz_id ON public.clinical_case_quiz_questions(quiz_id);
CREATE INDEX idx_clinical_case_quiz_questions_order ON public.clinical_case_quiz_questions(order_index);

CREATE INDEX idx_clinical_case_quiz_answers_question_id ON public.clinical_case_quiz_answers(question_id);
CREATE INDEX idx_clinical_case_quiz_answers_order ON public.clinical_case_quiz_answers(order_index);

CREATE INDEX idx_clinical_case_quiz_attempts_user_id ON public.clinical_case_quiz_attempts(user_id);
CREATE INDEX idx_clinical_case_quiz_attempts_quiz_id ON public.clinical_case_quiz_attempts(quiz_id);

CREATE INDEX idx_clinical_case_module_progress_user_id ON public.clinical_case_module_progress(user_id);
CREATE INDEX idx_clinical_case_module_progress_module_id ON public.clinical_case_module_progress(module_id);

CREATE INDEX idx_clinical_case_progress_v2_user_id ON public.clinical_case_progress_v2(user_id);
CREATE INDEX idx_clinical_case_progress_v2_case_id ON public.clinical_case_progress_v2(case_id);

-- ============================================
-- ÉTAPE 4: COMMENTAIRES POUR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.clinical_cases_v2 IS 'Nouveau module de cas cliniques inspiré du système e-learning';
COMMENT ON TABLE public.clinical_case_chapters IS 'Chapitres organisationnels des cas cliniques';
COMMENT ON TABLE public.clinical_case_modules IS 'Modules de contenu (vidéo, image, texte) des cas cliniques';
COMMENT ON TABLE public.clinical_case_quizzes IS 'Quiz évaluatifs associés aux modules';
COMMENT ON TABLE public.clinical_case_quiz_questions IS 'Questions des quiz avec différents types (choix multiple, vrai/faux, etc.)';
COMMENT ON TABLE public.clinical_case_quiz_answers IS 'Réponses possibles pour chaque question de quiz';
COMMENT ON TABLE public.clinical_case_quiz_attempts IS 'Historique des tentatives de quiz par utilisateur';
COMMENT ON TABLE public.clinical_case_module_progress IS 'Suivi de la progression par module';
COMMENT ON TABLE public.clinical_case_progress_v2 IS 'Suivi global de progression par cas clinique';

-- ============================================
-- ÉTAPE 5: PERMISSIONS RLS (Row Level Security)
-- ============================================

-- Enable RLS sur toutes les tables
ALTER TABLE public.clinical_cases_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_progress_v2 ENABLE ROW LEVEL SECURITY;

-- Policies pour clinical_cases_v2
CREATE POLICY "Public read access for active cases" ON public.clinical_cases_v2
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage cases" ON public.clinical_cases_v2
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour chapters (lecture publique si le cas est actif)
CREATE POLICY "Public read access for chapters" ON public.clinical_case_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clinical_cases_v2
      WHERE clinical_cases_v2.id = clinical_case_chapters.case_id
      AND clinical_cases_v2.is_active = true
    )
  );

CREATE POLICY "Admins can manage chapters" ON public.clinical_case_chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour modules
CREATE POLICY "Public read access for modules" ON public.clinical_case_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clinical_case_chapters
      JOIN public.clinical_cases_v2 ON clinical_cases_v2.id = clinical_case_chapters.case_id
      WHERE clinical_case_chapters.id = clinical_case_modules.chapter_id
      AND clinical_cases_v2.is_active = true
    )
  );

CREATE POLICY "Admins can manage modules" ON public.clinical_case_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour quizzes
CREATE POLICY "Public read access for quizzes" ON public.clinical_case_quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON public.clinical_case_quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour questions
CREATE POLICY "Public read access for questions" ON public.clinical_case_quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clinical_case_quizzes
      WHERE clinical_case_quizzes.id = clinical_case_quiz_questions.quiz_id
      AND clinical_case_quizzes.is_active = true
    )
  );

CREATE POLICY "Admins can manage questions" ON public.clinical_case_quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour answers
CREATE POLICY "Public read access for answers" ON public.clinical_case_quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clinical_case_quiz_questions
      JOIN public.clinical_case_quizzes ON clinical_case_quizzes.id = clinical_case_quiz_questions.quiz_id
      WHERE clinical_case_quiz_questions.id = clinical_case_quiz_answers.question_id
      AND clinical_case_quizzes.is_active = true
    )
  );

CREATE POLICY "Admins can manage answers" ON public.clinical_case_quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour quiz attempts (utilisateurs peuvent voir leurs propres tentatives)
CREATE POLICY "Users can view own attempts" ON public.clinical_case_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts" ON public.clinical_case_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.clinical_case_quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour module progress
CREATE POLICY "Users can view own progress" ON public.clinical_case_module_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON public.clinical_case_module_progress
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour case progress
CREATE POLICY "Users can view own case progress" ON public.clinical_case_progress_v2
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own case progress" ON public.clinical_case_progress_v2
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION TERMINÉE
-- ============================================
