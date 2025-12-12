-- Migration: Complete Multi-Module Gamification System
-- Description: Système de gamification complet avec connexions, e-learning, pratique et testing 3D
-- Author: Claude
-- Date: 2025-01-12

-- ============================================================================
-- TABLE: user_login_tracking
-- Description: Track user daily logins for streak calculation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

CREATE INDEX IF NOT EXISTS idx_user_login_tracking_user_date ON public.user_login_tracking(user_id, login_date DESC);

-- ============================================================================
-- TABLE: user_practice_progress
-- Description: Track practice videos viewed by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_practice_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  practice_video_id UUID NOT NULL REFERENCES public.practice_videos(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, practice_video_id)
);

CREATE INDEX IF NOT EXISTS idx_user_practice_progress_user ON public.user_practice_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_progress_video ON public.user_practice_progress(practice_video_id);

-- ============================================================================
-- TABLE: user_testing_progress
-- Description: Track orthopedic tests viewed/completed by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_testing_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.orthopedic_tests(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_user_testing_progress_user ON public.user_testing_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_testing_progress_test ON public.user_testing_progress(test_id);

-- ============================================================================
-- TABLE: achievements
-- Description: Définit tous les achievements disponibles dans le système
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  category TEXT NOT NULL CHECK (category IN ('login', 'elearning', 'practice', 'testing', 'streak', 'global', 'special')),
  unlock_condition JSONB NOT NULL,
  points INTEGER DEFAULT 0,
  gradient_from TEXT DEFAULT 'from-sky-400',
  gradient_to TEXT DEFAULT 'to-blue-500',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_slug ON public.achievements(slug);

-- ============================================================================
-- TABLE: user_achievements
-- Description: Stocke les achievements débloqués par chaque utilisateur
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- ============================================================================
-- TABLE: user_gamification_stats
-- Description: Statistiques globales de gamification par utilisateur
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Niveau et XP globaux
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,

  -- Streaks (connexions consécutives)
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_login_date DATE,

  -- Stats par module
  total_logins INTEGER DEFAULT 0,
  total_elearning_completed INTEGER DEFAULT 0,
  total_practice_viewed INTEGER DEFAULT 0,
  total_testing_viewed INTEGER DEFAULT 0,

  -- Stats hebdomadaires
  week_logins INTEGER DEFAULT 0,
  week_elearning INTEGER DEFAULT 0,
  week_practice INTEGER DEFAULT 0,
  week_testing INTEGER DEFAULT 0,
  week_reset_date DATE DEFAULT CURRENT_DATE,

  -- Progression par domaine (0-100%)
  elearning_progress INTEGER DEFAULT 0,
  practice_progress INTEGER DEFAULT 0,
  testing_progress INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_level ON public.user_gamification_stats(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_xp ON public.user_gamification_stats(total_xp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.user_login_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_practice_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_testing_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;

-- Login tracking
CREATE POLICY "Users can view their own logins" ON public.user_login_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logins" ON public.user_login_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Practice progress
CREATE POLICY "Users can view their own practice progress" ON public.user_practice_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice progress" ON public.user_practice_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice progress" ON public.user_practice_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Testing progress
CREATE POLICY "Users can view their own testing progress" ON public.user_testing_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own testing progress" ON public.user_testing_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testing progress" ON public.user_testing_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Achievements are visible to all" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify achievements" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- Gamification Stats
CREATE POLICY "Users can view their own stats" ON public.user_gamification_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage stats" ON public.user_gamification_stats
  FOR ALL USING (true);

-- ============================================================================
-- FUNCTION: update_user_gamification_stats
-- Description: Recalcule toutes les stats de gamification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_gamification_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;

  -- Stats globales
  v_total_logins INTEGER;
  v_total_elearning INTEGER;
  v_total_practice INTEGER;
  v_total_testing INTEGER;

  -- Stats hebdomadaires
  v_week_logins INTEGER;
  v_week_elearning INTEGER;
  v_week_practice INTEGER;
  v_week_testing INTEGER;
  v_week_start DATE;

  -- Streaks
  v_current_streak INTEGER;
  v_best_streak INTEGER;
  v_login_dates DATE[];
  v_last_login_date DATE;
  v_current_date DATE;

  -- Progression
  v_elearning_progress INTEGER;
  v_practice_progress INTEGER;
  v_testing_progress INTEGER;
  v_total_subparts INTEGER;
  v_completed_subparts INTEGER;
  v_total_practice_videos INTEGER;
  v_viewed_practice INTEGER;
  v_total_orthopedic_tests INTEGER;
  v_viewed_tests INTEGER;

  -- XP et niveau
  v_total_xp INTEGER;
  v_level INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_current_date := CURRENT_DATE;
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  -- ========================================================================
  -- 1. COMPTER LES CONNEXIONS
  -- ========================================================================
  SELECT COUNT(*), COUNT(*) FILTER (WHERE login_date >= v_week_start)
  INTO v_total_logins, v_week_logins
  FROM public.user_login_tracking
  WHERE user_id = v_user_id;

  -- Calculer les streaks de connexion
  SELECT ARRAY_AGG(DISTINCT login_date ORDER BY login_date DESC)
  INTO v_login_dates
  FROM public.user_login_tracking
  WHERE user_id = v_user_id;

  v_current_streak := 0;
  v_best_streak := 0;

  IF v_login_dates IS NOT NULL THEN
    FOREACH v_last_login_date IN ARRAY v_login_dates
    LOOP
      IF v_current_date - v_last_login_date <= v_current_streak THEN
        v_current_streak := v_current_streak + 1;
        v_current_date := v_last_login_date;
        IF v_current_streak > v_best_streak THEN
          v_best_streak := v_current_streak;
        END IF;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- ========================================================================
  -- 2. COMPTER E-LEARNING
  -- ========================================================================
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed_at >= v_week_start)
  INTO v_total_elearning, v_week_elearning
  FROM public.elearning_subpart_progress
  WHERE user_id = v_user_id;

  -- Calculer progression e-learning
  SELECT
    COUNT(DISTINCT es.id),
    COUNT(DISTINCT esp.subpart_id)
  INTO v_total_subparts, v_completed_subparts
  FROM public.elearning_subparts es
  LEFT JOIN public.elearning_subpart_progress esp
    ON esp.subpart_id = es.id AND esp.user_id = v_user_id;

  IF v_total_subparts > 0 THEN
    v_elearning_progress := ROUND((v_completed_subparts::NUMERIC / v_total_subparts::NUMERIC) * 100);
  ELSE
    v_elearning_progress := 0;
  END IF;

  -- ========================================================================
  -- 3. COMPTER PRATIQUE
  -- ========================================================================
  SELECT COUNT(*), COUNT(*) FILTER (WHERE viewed_at >= v_week_start)
  INTO v_total_practice, v_week_practice
  FROM public.user_practice_progress
  WHERE user_id = v_user_id;

  -- Calculer progression pratique
  SELECT
    COUNT(DISTINCT pv.id),
    COUNT(DISTINCT upp.practice_video_id)
  INTO v_total_practice_videos, v_viewed_practice
  FROM public.practice_videos pv
  LEFT JOIN public.user_practice_progress upp
    ON upp.practice_video_id = pv.id AND upp.user_id = v_user_id;

  IF v_total_practice_videos > 0 THEN
    v_practice_progress := ROUND((v_viewed_practice::NUMERIC / v_total_practice_videos::NUMERIC) * 100);
  ELSE
    v_practice_progress := 0;
  END IF;

  -- ========================================================================
  -- 4. COMPTER TESTING 3D
  -- ========================================================================
  SELECT COUNT(*), COUNT(*) FILTER (WHERE viewed_at >= v_week_start)
  INTO v_total_testing, v_week_testing
  FROM public.user_testing_progress
  WHERE user_id = v_user_id;

  -- Calculer progression testing
  SELECT
    COUNT(DISTINCT ot.id),
    COUNT(DISTINCT utp.test_id)
  INTO v_total_orthopedic_tests, v_viewed_tests
  FROM public.orthopedic_tests ot
  LEFT JOIN public.user_testing_progress utp
    ON utp.test_id = ot.id AND utp.user_id = v_user_id;

  IF v_total_orthopedic_tests > 0 THEN
    v_testing_progress := ROUND((v_viewed_tests::NUMERIC / v_total_orthopedic_tests::NUMERIC) * 100);
  ELSE
    v_testing_progress := 0;
  END IF;

  -- ========================================================================
  -- 5. CALCULER XP ET NIVEAU
  -- ========================================================================
  -- Système de points :
  -- - Connexion quotidienne : 10 XP
  -- - Subpart e-learning : 50 XP
  -- - Vidéo pratique : 30 XP
  -- - Test 3D : 40 XP

  v_total_xp := (v_total_logins * 10) +
                (v_total_elearning * 50) +
                (v_total_practice * 30) +
                (v_total_testing * 40);

  -- 1 niveau tous les 500 XP
  v_level := FLOOR(v_total_xp / 500) + 1;

  -- ========================================================================
  -- 6. INSÉRER OU METTRE À JOUR
  -- ========================================================================
  INSERT INTO public.user_gamification_stats (
    user_id,
    level,
    total_xp,
    current_streak,
    best_streak,
    last_login_date,
    total_logins,
    total_elearning_completed,
    total_practice_viewed,
    total_testing_viewed,
    week_logins,
    week_elearning,
    week_practice,
    week_testing,
    week_reset_date,
    elearning_progress,
    practice_progress,
    testing_progress,
    updated_at
  ) VALUES (
    v_user_id,
    v_level,
    v_total_xp,
    v_current_streak,
    v_best_streak,
    (SELECT MAX(login_date) FROM public.user_login_tracking WHERE user_id = v_user_id),
    v_total_logins,
    v_total_elearning,
    v_total_practice,
    v_total_testing,
    v_week_logins,
    v_week_elearning,
    v_week_practice,
    v_week_testing,
    v_week_start,
    v_elearning_progress,
    v_practice_progress,
    v_testing_progress,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    level = EXCLUDED.level,
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    best_streak = GREATEST(user_gamification_stats.best_streak, EXCLUDED.best_streak),
    last_login_date = EXCLUDED.last_login_date,
    total_logins = EXCLUDED.total_logins,
    total_elearning_completed = EXCLUDED.total_elearning_completed,
    total_practice_viewed = EXCLUDED.total_practice_viewed,
    total_testing_viewed = EXCLUDED.total_testing_viewed,
    week_logins = EXCLUDED.week_logins,
    week_elearning = EXCLUDED.week_elearning,
    week_practice = EXCLUDED.week_practice,
    week_testing = EXCLUDED.week_testing,
    week_reset_date = EXCLUDED.week_reset_date,
    elearning_progress = EXCLUDED.elearning_progress,
    practice_progress = EXCLUDED.practice_progress,
    testing_progress = EXCLUDED.testing_progress,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: check_and_unlock_achievements
-- Description: Vérifie et débloque automatiquement les achievements
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_achievement RECORD;
  v_stats RECORD;
  v_should_unlock BOOLEAN;
  v_condition_value INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Récupérer les stats de l'utilisateur
  SELECT * INTO v_stats
  FROM public.user_gamification_stats
  WHERE user_id = v_user_id;

  -- Vérifier chaque achievement actif
  FOR v_achievement IN
    SELECT * FROM public.achievements WHERE is_active = true
  LOOP
    -- Vérifier si l'achievement est déjà débloqué
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = v_user_id AND achievement_id = v_achievement.id
    ) THEN
      v_should_unlock := false;
      v_condition_value := (v_achievement.unlock_condition->>'value')::INTEGER;

      -- Vérifier la condition selon le type
      CASE v_achievement.unlock_condition->>'type'
        WHEN 'login_count' THEN
          IF v_stats.total_logins >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'elearning_count' THEN
          IF v_stats.total_elearning_completed >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'practice_count' THEN
          IF v_stats.total_practice_viewed >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'testing_count' THEN
          IF v_stats.total_testing_viewed >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'streak' THEN
          IF v_stats.current_streak >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'level' THEN
          IF v_stats.level >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'elearning_progress' THEN
          IF v_stats.elearning_progress >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'practice_progress' THEN
          IF v_stats.practice_progress >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
        WHEN 'testing_progress' THEN
          IF v_stats.testing_progress >= v_condition_value THEN
            v_should_unlock := true;
          END IF;
      END CASE;

      -- Débloquer l'achievement
      IF v_should_unlock THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at, notified)
        VALUES (v_user_id, v_achievement.id, NOW(), false);

        -- Ajouter les points de l'achievement à l'XP
        UPDATE public.user_gamification_stats
        SET total_xp = total_xp + v_achievement.points,
            level = FLOOR((total_xp + v_achievement.points) / 500) + 1,
            updated_at = NOW()
        WHERE user_id = v_user_id;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger sur connexions
DROP TRIGGER IF EXISTS trigger_update_stats_on_login ON public.user_login_tracking;
CREATE TRIGGER trigger_update_stats_on_login
  AFTER INSERT OR UPDATE OR DELETE ON public.user_login_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification_stats();

-- Trigger sur e-learning
DROP TRIGGER IF EXISTS trigger_update_stats_on_elearning ON public.elearning_subpart_progress;
CREATE TRIGGER trigger_update_stats_on_elearning
  AFTER INSERT OR UPDATE OR DELETE ON public.elearning_subpart_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification_stats();

-- Trigger sur pratique
DROP TRIGGER IF EXISTS trigger_update_stats_on_practice ON public.user_practice_progress;
CREATE TRIGGER trigger_update_stats_on_practice
  AFTER INSERT OR UPDATE OR DELETE ON public.user_practice_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification_stats();

-- Trigger sur testing
DROP TRIGGER IF EXISTS trigger_update_stats_on_testing ON public.user_testing_progress;
CREATE TRIGGER trigger_update_stats_on_testing
  AFTER INSERT OR UPDATE OR DELETE ON public.user_testing_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification_stats();

-- Trigger pour débloquer achievements
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.user_gamification_stats;
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT OR UPDATE ON public.user_gamification_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_unlock_achievements();

-- ============================================================================
-- SEED DATA: Achievements
-- ============================================================================

INSERT INTO public.achievements (slug, name, description, icon, category, unlock_condition, points, gradient_from, gradient_to, display_order) VALUES

  -- CONNEXIONS / LOGINS (10 XP chacune)
  ('first_login', 'Première visite', 'Première connexion à OsteoUpgrade', 'LogIn', 'login', '{"type": "login_count", "value": 1}', 50, 'from-sky-400', 'to-blue-500', 1),
  ('regular_7', 'Habitué', '7 jours de connexion', 'Calendar', 'login', '{"type": "login_count", "value": 7}', 100, 'from-blue-400', 'to-indigo-500', 2),
  ('regular_30', 'Fidèle', '30 jours de connexion', 'CalendarCheck', 'login', '{"type": "login_count", "value": 30}', 200, 'from-indigo-400', 'to-purple-500', 3),
  ('regular_100', 'Assidu', '100 jours de connexion', 'Crown', 'login', '{"type": "login_count", "value": 100}', 500, 'from-purple-400', 'to-pink-500', 4),

  -- STREAKS (jours consécutifs)
  ('streak_3', 'En feu !', '3 jours consécutifs', 'Flame', 'streak', '{"type": "streak", "value": 3}', 150, 'from-orange-400', 'to-red-500', 10),
  ('streak_7', 'Semaine parfaite', '7 jours consécutifs', 'Zap', 'streak', '{"type": "streak", "value": 7}', 300, 'from-red-400', 'to-rose-500', 11),
  ('streak_14', 'Deux semaines !', '14 jours consécutifs', 'Flame', 'streak', '{"type": "streak", "value": 14}', 600, 'from-rose-400', 'to-pink-500', 12),
  ('streak_30', 'Mois complet !', '30 jours consécutifs', 'Star', 'streak', '{"type": "streak", "value": 30}', 1200, 'from-pink-400', 'to-fuchsia-500', 13),

  -- E-LEARNING (50 XP chacun)
  ('elearning_1', 'Première leçon', 'Premier subpart complété', 'GraduationCap', 'elearning', '{"type": "elearning_count", "value": 1}', 50, 'from-emerald-400', 'to-green-500', 20),
  ('elearning_10', 'Apprenant', '10 leçons complétées', 'BookOpen', 'elearning', '{"type": "elearning_count", "value": 10}', 200, 'from-green-400', 'to-teal-500', 21),
  ('elearning_50', 'Studieux', '50 leçons complétées', 'Library', 'elearning', '{"type": "elearning_count", "value": 50}', 500, 'from-teal-400', 'to-cyan-500', 22),
  ('elearning_100', 'Érudit', '100 leçons complétées', 'Award', 'elearning', '{"type": "elearning_count", "value": 100}', 1000, 'from-cyan-400', 'to-sky-500', 23),
  ('elearning_50pct', 'À mi-chemin', '50% de l\'e-learning', 'TrendingUp', 'elearning', '{"type": "elearning_progress", "value": 50}', 400, 'from-lime-400', 'to-green-500', 24),
  ('elearning_100pct', 'Formation complète', '100% de l\'e-learning', 'Trophy', 'elearning', '{"type": "elearning_progress", "value": 100}', 2000, 'from-green-400', 'to-emerald-600', 25),

  -- PRATIQUE (30 XP chacune)
  ('practice_1', 'Première technique', 'Première vidéo de pratique vue', 'Dumbbell', 'practice', '{"type": "practice_count", "value": 1}', 50, 'from-amber-400', 'to-orange-500', 30),
  ('practice_10', 'Pratiquant', '10 techniques vues', 'Activity', 'practice', '{"type": "practice_count", "value": 10}', 200, 'from-orange-400', 'to-red-500', 31),
  ('practice_30', 'Technicien', '30 techniques vues', 'Target', 'practice', '{"type": "practice_count", "value": 30}', 400, 'from-red-400', 'to-rose-500', 32),
  ('practice_50', 'Expert pratique', '50 techniques vues', 'Award', 'practice', '{"type": "practice_count", "value": 50}', 800, 'from-rose-400', 'to-pink-500', 33),

  -- TESTING 3D (40 XP chacun)
  ('testing_1', 'Premier test 3D', 'Premier test orthopédique vu', 'TestTube', 'testing', '{"type": "testing_count", "value": 1}', 50, 'from-violet-400', 'to-purple-500', 40),
  ('testing_10', 'Testeur', '10 tests vus', 'Microscope', 'testing', '{"type": "testing_count", "value": 10}', 200, 'from-purple-400', 'to-indigo-500', 41),
  ('testing_30', 'Explorateur 3D', '30 tests vus', 'Scan', 'testing', '{"type": "testing_count", "value": 30}', 400, 'from-indigo-400', 'to-blue-500', 42),
  ('testing_50', 'Maître du testing', '50 tests vus', 'Award', 'testing', '{"type": "testing_count", "value": 50}', 800, 'from-blue-400', 'to-cyan-500', 43),

  -- NIVEAUX GLOBAUX
  ('level_5', 'Niveau 5', 'Atteignez le niveau 5', 'TrendingUp', 'global', '{"type": "level", "value": 5}', 500, 'from-yellow-400', 'to-amber-500', 50),
  ('level_10', 'Niveau 10', 'Atteignez le niveau 10', 'Zap', 'global', '{"type": "level", "value": 10}', 1000, 'from-amber-400', 'to-orange-500', 51),
  ('level_20', 'Niveau 20', 'Atteignez le niveau 20', 'Crown', 'global', '{"type": "level", "value": 20}', 2000, 'from-orange-400', 'to-red-600', 52),
  ('level_50', 'Niveau 50', 'Atteignez le niveau 50', 'Award', 'global', '{"type": "level", "value": 50}', 5000, 'from-red-400', 'to-rose-600', 53)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FUNCTION: Helper pour enregistrer une connexion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_user_login(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_login_tracking (user_id, login_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, login_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.user_login_tracking IS 'Track daily user logins for streak calculation';
COMMENT ON TABLE public.user_practice_progress IS 'Track practice videos viewed by users';
COMMENT ON TABLE public.user_testing_progress IS 'Track orthopedic tests viewed by users in Testing 3D';
COMMENT ON TABLE public.user_gamification_stats IS 'Global gamification stats: logins, e-learning, practice, testing';
COMMENT ON FUNCTION public.update_user_gamification_stats IS 'Recalcule toutes les stats de gamification depuis les 4 modules';
COMMENT ON FUNCTION public.check_and_unlock_achievements IS 'Vérifie et débloque automatiquement les achievements';
COMMENT ON FUNCTION public.record_user_login IS 'Helper function to record a daily login';
