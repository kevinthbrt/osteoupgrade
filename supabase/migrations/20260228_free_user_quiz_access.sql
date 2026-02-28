-- Allow free users to read quiz data for free-access formations.
-- Previously, the SELECT policies on elearning_quizzes, elearning_quiz_questions, and
-- elearning_quiz_answers only permitted premium/admin roles, which prevented quiz
-- gating from working for free users (quiz data came back empty, so quiz_passed was
-- always treated as true and chapters were never locked).

-- ── elearning_quizzes ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Premium users can view active quizzes" ON public.elearning_quizzes;

CREATE POLICY "Authenticated users can view active quizzes they have access to"
  ON public.elearning_quizzes FOR SELECT
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
    AND (
      -- Premium / admin: unrestricted access
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
      )
      OR
      -- Free users: only quizzes belonging to free-access formations
      EXISTS (
        SELECT 1
        FROM public.elearning_subparts  es
        JOIN public.elearning_chapters  ec ON ec.id = es.chapter_id
        JOIN public.elearning_formations ef ON ef.id = ec.formation_id
        WHERE es.id = elearning_quizzes.subpart_id
        AND ef.is_free_access = true
      )
    )
  );

-- ── elearning_quiz_questions ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Premium users can view questions" ON public.elearning_quiz_questions;

CREATE POLICY "Authenticated users can view questions they have access to"
  ON public.elearning_quiz_questions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.elearning_quizzes    eq
        JOIN public.elearning_subparts   es ON es.id = eq.subpart_id
        JOIN public.elearning_chapters   ec ON ec.id = es.chapter_id
        JOIN public.elearning_formations ef ON ef.id = ec.formation_id
        WHERE eq.id = elearning_quiz_questions.quiz_id
        AND ef.is_free_access = true
      )
    )
  );

-- ── elearning_quiz_answers ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Premium users can view answers" ON public.elearning_quiz_answers;

CREATE POLICY "Authenticated users can view answers they have access to"
  ON public.elearning_quiz_answers FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium_silver', 'premium_gold', 'admin')
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.elearning_quiz_questions eq_q
        JOIN public.elearning_quizzes        eq  ON eq.id  = eq_q.quiz_id
        JOIN public.elearning_subparts       es  ON es.id  = eq.subpart_id
        JOIN public.elearning_chapters       ec  ON ec.id  = es.chapter_id
        JOIN public.elearning_formations     ef  ON ef.id  = ec.formation_id
        WHERE eq_q.id = elearning_quiz_answers.question_id
        AND ef.is_free_access = true
      )
    )
  );
