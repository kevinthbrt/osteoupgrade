-- Tables pour le système de Quiz

CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  theme text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['facile'::text, 'moyen'::text, 'difficile'::text])),
  duration_minutes integer NOT NULL DEFAULT 10,
  question_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_text text NOT NULL,
  options text[] NOT NULL,
  correct_option_index integer NOT NULL,
  explanation text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_taken_seconds integer,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Tables pour les Cas Cliniques

CREATE TABLE public.clinical_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  region text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['débutant'::text, 'intermédiaire'::text, 'avancé'::text])),
  duration_minutes integer NOT NULL DEFAULT 15,
  patient_profile text NOT NULL,
  objectives text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_cases_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.case_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  user_id uuid NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  score integer DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT case_progress_pkey PRIMARY KEY (id),
  CONSTRAINT case_progress_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.clinical_cases(id),
  CONSTRAINT case_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Index pour améliorer les performances

CREATE INDEX idx_quizzes_theme ON public.quizzes(theme);
CREATE INDEX idx_quizzes_difficulty ON public.quizzes(difficulty);
CREATE INDEX idx_quizzes_is_active ON public.quizzes(is_active);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_clinical_cases_region ON public.clinical_cases(region);
CREATE INDEX idx_clinical_cases_difficulty ON public.clinical_cases(difficulty);
CREATE INDEX idx_clinical_cases_is_active ON public.clinical_cases(is_active);
CREATE INDEX idx_case_progress_user_id ON public.case_progress(user_id);
CREATE INDEX idx_case_progress_case_id ON public.case_progress(case_id);

-- RLS Policies

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_progress ENABLE ROW LEVEL SECURITY;

-- Policies pour quizzes (lecture publique, création admin)
CREATE POLICY "Quizzes are viewable by everyone" ON public.quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update quizzes" ON public.quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour quiz_questions (lecture publique via quiz, création admin)
CREATE POLICY "Quiz questions are viewable by everyone" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_questions.quiz_id AND is_active = true
    )
  );

CREATE POLICY "Admins can insert quiz questions" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update quiz questions" ON public.quiz_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour quiz_attempts (utilisateurs peuvent voir et créer leurs propres tentatives)
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour clinical_cases (lecture publique, création admin)
CREATE POLICY "Clinical cases are viewable by everyone" ON public.clinical_cases
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert clinical cases" ON public.clinical_cases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update clinical cases" ON public.clinical_cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour case_progress (utilisateurs peuvent voir et gérer leur propre progression)
CREATE POLICY "Users can view their own case progress" ON public.case_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case progress" ON public.case_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own case progress" ON public.case_progress
  FOR UPDATE USING (auth.uid() = user_id);
