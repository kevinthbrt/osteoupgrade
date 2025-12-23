-- Create quiz tables for e-learning subparts

-- Table for quizzes
CREATE TABLE IF NOT EXISTS public.elearning_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subpart_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 100, -- Percentage required to pass (100 = all correct)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elearning_quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_quizzes_subpart_id_fkey FOREIGN KEY (subpart_id)
    REFERENCES public.elearning_subparts(id) ON DELETE CASCADE
);

-- Table for quiz questions
CREATE TABLE IF NOT EXISTS public.elearning_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'multiple_answer')),
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  explanation text, -- Explanation shown after answering
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elearning_quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id)
    REFERENCES public.elearning_quizzes(id) ON DELETE CASCADE
);

-- Table for quiz answers (options)
CREATE TABLE IF NOT EXISTS public.elearning_quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elearning_quiz_answers_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_quiz_answers_question_id_fkey FOREIGN KEY (question_id)
    REFERENCES public.elearning_quiz_questions(id) ON DELETE CASCADE
);

-- Table for user quiz attempts and results
CREATE TABLE IF NOT EXISTS public.elearning_quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer NOT NULL, -- Percentage score (0-100)
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  answers_data jsonb NOT NULL DEFAULT '{}', -- Store user's answers
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT elearning_quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id)
    REFERENCES public.elearning_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT elearning_quiz_attempts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_elearning_quizzes_subpart_id ON public.elearning_quizzes(subpart_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_questions_quiz_id ON public.elearning_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_answers_question_id ON public.elearning_quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_elearning_quiz_attempts_quiz_user ON public.elearning_quiz_attempts(quiz_id, user_id);

-- Enable Row Level Security
ALTER TABLE public.elearning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elearning_quizzes
CREATE POLICY "Premium users can view active quizzes"
  ON public.elearning_quizzes FOR SELECT
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage quizzes"
  ON public.elearning_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for elearning_quiz_questions
CREATE POLICY "Premium users can view questions"
  ON public.elearning_quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
    )
  );

CREATE POLICY "Admins can manage questions"
  ON public.elearning_quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for elearning_quiz_answers
CREATE POLICY "Premium users can view answers"
  ON public.elearning_quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
    )
  );

CREATE POLICY "Admins can manage answers"
  ON public.elearning_quiz_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for elearning_quiz_attempts
CREATE POLICY "Users can view their own attempts"
  ON public.elearning_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts"
  ON public.elearning_quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON public.elearning_quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.elearning_quizzes IS 'Quizzes associated with e-learning subparts';
COMMENT ON TABLE public.elearning_quiz_questions IS 'Questions for each quiz';
COMMENT ON TABLE public.elearning_quiz_answers IS 'Possible answers for quiz questions';
COMMENT ON TABLE public.elearning_quiz_attempts IS 'User quiz attempts and scores';
