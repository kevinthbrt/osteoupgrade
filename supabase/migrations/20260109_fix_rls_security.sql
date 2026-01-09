-- ============================================
-- FIX RLS SECURITY ISSUES
-- Migration du 2026-01-09
-- ============================================

-- ============================================
-- ÉTAPE 1: SUPPRIMER LES ANCIENNES TABLES CLINICAL_CASES
-- ============================================

-- Ces tables sont obsolètes depuis la refonte des cas cliniques
DROP TABLE IF EXISTS public.case_user_answers CASCADE;
DROP TABLE IF EXISTS public.case_step_choices CASCADE;
DROP TABLE IF EXISTS public.case_steps CASCADE;
DROP TABLE IF EXISTS public.case_progress CASCADE;
DROP TABLE IF EXISTS public.clinical_cases CASCADE;

-- ============================================
-- ÉTAPE 2: ACTIVER RLS SUR LES TABLES CLINICAL_CASES_V2
-- ============================================

-- Enable RLS
ALTER TABLE public.clinical_cases_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_progress_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for active cases" ON public.clinical_cases_v2;
DROP POLICY IF EXISTS "Admins can manage cases" ON public.clinical_cases_v2;
DROP POLICY IF EXISTS "Public read access for chapters" ON public.clinical_case_chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.clinical_case_chapters;
DROP POLICY IF EXISTS "Public read access for modules" ON public.clinical_case_modules;
DROP POLICY IF EXISTS "Admins can manage modules" ON public.clinical_case_modules;
DROP POLICY IF EXISTS "Public read access for quizzes" ON public.clinical_case_quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.clinical_case_quizzes;
DROP POLICY IF EXISTS "Public read access for questions" ON public.clinical_case_quiz_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.clinical_case_quiz_questions;
DROP POLICY IF EXISTS "Public read access for answers" ON public.clinical_case_quiz_answers;
DROP POLICY IF EXISTS "Admins can manage answers" ON public.clinical_case_quiz_answers;
DROP POLICY IF EXISTS "Users can view own attempts" ON public.clinical_case_quiz_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON public.clinical_case_quiz_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON public.clinical_case_quiz_attempts;
DROP POLICY IF EXISTS "Users can view own progress" ON public.clinical_case_module_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.clinical_case_module_progress;
DROP POLICY IF EXISTS "Users can view own case progress" ON public.clinical_case_progress_v2;
DROP POLICY IF EXISTS "Users can manage own case progress" ON public.clinical_case_progress_v2;

-- Create new policies
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

CREATE POLICY "Users can view own attempts" ON public.clinical_case_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts" ON public.clinical_case_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.clinical_case_quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON public.clinical_case_module_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON public.clinical_case_module_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own case progress" ON public.clinical_case_progress_v2
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own case progress" ON public.clinical_case_progress_v2
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 3: ACTIVER RLS SUR PRACTICE_VIDEOS
-- ============================================

ALTER TABLE public.practice_videos ENABLE ROW LEVEL SECURITY;

-- Keep existing policy and add admin policy
CREATE POLICY "Admins can manage practice videos" ON public.practice_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- ÉTAPE 4: ACTIVER RLS SUR LES AUTRES TABLES
-- ============================================

-- Rehab exercises
ALTER TABLE public.rehab_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rehab exercises" ON public.rehab_exercises
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage rehab exercises" ON public.rehab_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pathology tests
ALTER TABLE public.pathology_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pathology tests" ON public.pathology_tests
  FOR SELECT USING (true);

CREATE POLICY "Admins manage pathology tests" ON public.pathology_tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pathology clusters
ALTER TABLE public.pathology_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pathology clusters" ON public.pathology_clusters
  FOR SELECT USING (true);

CREATE POLICY "Admins manage pathology clusters" ON public.pathology_clusters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail templates (admin only)
ALTER TABLE public.mail_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mail templates" ON public.mail_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail contacts (admin only)
ALTER TABLE public.mail_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mail contacts" ON public.mail_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail segments (admin only)
ALTER TABLE public.mail_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mail segments" ON public.mail_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail segment members (admin only)
ALTER TABLE public.mail_segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage segment members" ON public.mail_segment_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail campaigns (admin only)
ALTER TABLE public.mail_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.mail_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail campaign messages (admin only)
ALTER TABLE public.mail_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaign messages" ON public.mail_campaign_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail automations (admin only)
ALTER TABLE public.mail_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automations" ON public.mail_automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail automation steps (admin only)
ALTER TABLE public.mail_automation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation steps" ON public.mail_automation_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail automation enrollments (admin only)
ALTER TABLE public.mail_automation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage enrollments" ON public.mail_automation_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Mail events (admin only)
ALTER TABLE public.mail_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view mail events" ON public.mail_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Referral codes (users can view own, admins manage all)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage referral codes" ON public.referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Referral transactions (users can view own, admins manage all)
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.referral_transactions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Admins manage transactions" ON public.referral_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Referral payouts (users can view own, admins manage all)
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payouts" ON public.referral_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage payouts" ON public.referral_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- MIGRATION TERMINÉE
-- ============================================
