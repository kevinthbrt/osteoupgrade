-- Migration: Gamification System
-- Description: Complete gamification system with achievements, badges, and user stats
-- Author: Claude
-- Date: 2025-01-12

-- ============================================================================
-- TABLE: achievements
-- Description: Définit tous les achievements disponibles dans le système
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name (e.g., 'Sparkles', 'Flame', 'Trophy')
  category TEXT NOT NULL CHECK (category IN ('session', 'streak', 'completion', 'milestone', 'special')),
  unlock_condition JSONB NOT NULL, -- {type: 'session_count', value: 20}
  points INTEGER DEFAULT 0,
  gradient_from TEXT DEFAULT 'from-sky-400',
  gradient_to TEXT DEFAULT 'to-blue-500',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================================================
-- TABLE: user_gamification_stats
-- Description: Stocke toutes les statistiques de gamification par utilisateur
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Niveaux et XP
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,

  -- Séries (streaks)
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_active_date DATE,

  -- Sessions
  total_sessions INTEGER DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,

  -- Stats hebdomadaires (réinitialisées chaque semaine)
  week_sessions INTEGER DEFAULT 0,
  week_tests INTEGER DEFAULT 0,
  week_reset_date DATE DEFAULT CURRENT_DATE,

  -- Taux de complétion
  completion_rate INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_slug ON public.achievements(slug);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;

-- Achievements: tout le monde peut lire, seuls les admins peuvent modifier
CREATE POLICY "Achievements sont visibles par tous" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les achievements" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Achievements: les utilisateurs peuvent voir leurs propres achievements
CREATE POLICY "Users peuvent voir leurs propres achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Système peut créer des user achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- User Gamification Stats: les utilisateurs peuvent voir leurs propres stats
CREATE POLICY "Users peuvent voir leurs propres stats" ON public.user_gamification_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Système peut gérer les stats" ON public.user_gamification_stats
  FOR ALL USING (true);

-- ============================================================================
-- FUNCTION: update_user_gamification_stats
-- Description: Met à jour les stats de gamification d'un utilisateur
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_gamification_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_total_tests INTEGER;
  v_completion_rate INTEGER;
  v_week_sessions INTEGER;
  v_current_streak INTEGER;
  v_best_streak INTEGER;
  v_last_active_date DATE;
  v_session_dates DATE[];
  v_unique_dates DATE[];
  v_current_date DATE;
  v_streak INTEGER;
  v_week_start DATE;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Calculer les statistiques à partir de user_sessions
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true),
    COALESCE(SUM(COALESCE((responses->>'tests_count')::INTEGER, 0)), 0)
  INTO v_total_sessions, v_completed_sessions, v_total_tests
  FROM public.user_sessions
  WHERE user_id = v_user_id;

  -- Calculer le taux de complétion
  IF v_total_sessions > 0 THEN
    v_completion_rate := ROUND((v_completed_sessions::NUMERIC / v_total_sessions::NUMERIC) * 100);
  ELSE
    v_completion_rate := 0;
  END IF;

  -- Calculer les sessions de la semaine
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  SELECT COUNT(*)
  INTO v_week_sessions
  FROM public.user_sessions
  WHERE user_id = v_user_id
    AND created_at >= v_week_start;

  -- Calculer la série (streak)
  SELECT ARRAY_AGG(DISTINCT DATE(created_at) ORDER BY DATE(created_at) DESC)
  INTO v_session_dates
  FROM public.user_sessions
  WHERE user_id = v_user_id;

  v_current_streak := 0;
  v_best_streak := 0;
  v_current_date := CURRENT_DATE;

  IF v_session_dates IS NOT NULL THEN
    FOREACH v_last_active_date IN ARRAY v_session_dates
    LOOP
      IF v_current_date - v_last_active_date <= v_current_streak + 1 THEN
        v_current_streak := v_current_streak + 1;
        v_current_date := v_last_active_date;
        IF v_current_streak > v_best_streak THEN
          v_best_streak := v_current_streak;
        END IF;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Calculer le niveau (1 niveau tous les 10 sessions)
  -- XP = total_sessions * 100 (100 XP par session)

  -- Insérer ou mettre à jour les stats
  INSERT INTO public.user_gamification_stats (
    user_id,
    level,
    total_xp,
    current_streak,
    best_streak,
    last_active_date,
    total_sessions,
    total_tests,
    completed_sessions,
    week_sessions,
    completion_rate,
    week_reset_date,
    updated_at
  ) VALUES (
    v_user_id,
    FLOOR(v_total_sessions / 10) + 1,
    v_total_sessions * 100,
    v_current_streak,
    v_best_streak,
    (SELECT MAX(DATE(created_at)) FROM public.user_sessions WHERE user_id = v_user_id),
    v_total_sessions,
    v_total_tests,
    v_completed_sessions,
    v_week_sessions,
    v_completion_rate,
    v_week_start,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    level = EXCLUDED.level,
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    best_streak = GREATEST(user_gamification_stats.best_streak, EXCLUDED.best_streak),
    last_active_date = EXCLUDED.last_active_date,
    total_sessions = EXCLUDED.total_sessions,
    total_tests = EXCLUDED.total_tests,
    completed_sessions = EXCLUDED.completed_sessions,
    week_sessions = EXCLUDED.week_sessions,
    completion_rate = EXCLUDED.completion_rate,
    week_reset_date = EXCLUDED.week_reset_date,
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

      -- Vérifier la condition de déblocage
      CASE v_achievement.unlock_condition->>'type'
        WHEN 'session_count' THEN
          IF v_stats.total_sessions >= (v_achievement.unlock_condition->>'value')::INTEGER THEN
            v_should_unlock := true;
          END IF;
        WHEN 'streak' THEN
          IF v_stats.current_streak >= (v_achievement.unlock_condition->>'value')::INTEGER THEN
            v_should_unlock := true;
          END IF;
        WHEN 'completion_rate' THEN
          IF v_stats.completion_rate >= (v_achievement.unlock_condition->>'value')::INTEGER THEN
            v_should_unlock := true;
          END IF;
        WHEN 'level' THEN
          IF v_stats.level >= (v_achievement.unlock_condition->>'value')::INTEGER THEN
            v_should_unlock := true;
          END IF;
        WHEN 'test_count' THEN
          IF v_stats.total_tests >= (v_achievement.unlock_condition->>'value')::INTEGER THEN
            v_should_unlock := true;
          END IF;
      END CASE;

      -- Débloquer l'achievement si la condition est remplie
      IF v_should_unlock THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at, notified)
        VALUES (v_user_id, v_achievement.id, NOW(), false);

        -- Ajouter les points de l'achievement à l'XP
        UPDATE public.user_gamification_stats
        SET total_xp = total_xp + v_achievement.points,
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

-- Trigger pour mettre à jour les stats quand une session est créée/modifiée
DROP TRIGGER IF EXISTS trigger_update_gamification_stats ON public.user_sessions;
CREATE TRIGGER trigger_update_gamification_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification_stats();

-- Trigger pour vérifier les achievements après mise à jour des stats
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.user_gamification_stats;
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT OR UPDATE ON public.user_gamification_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_unlock_achievements();

-- ============================================================================
-- SEED DATA: Achievements initiaux
-- ============================================================================

-- Supprimer les achievements existants si on refait la migration
-- TRUNCATE public.achievements CASCADE;

INSERT INTO public.achievements (slug, name, description, icon, category, unlock_condition, points, gradient_from, gradient_to, display_order) VALUES
  -- Session achievements
  ('first_steps', 'Premiers pas', 'Complétez votre première session', 'Sparkles', 'session', '{"type": "session_count", "value": 1}', 100, 'from-sky-400', 'to-blue-500', 1),
  ('beginner', 'Débutant', 'Complétez 5 sessions', 'Target', 'session', '{"type": "session_count", "value": 5}', 200, 'from-blue-400', 'to-indigo-500', 2),
  ('intermediate', 'Intermédiaire', 'Complétez 10 sessions', 'TrendingUp', 'session', '{"type": "session_count", "value": 10}', 300, 'from-indigo-400', 'to-purple-500', 3),
  ('expert', 'Expert', 'Complétez 20 sessions', 'Trophy', 'milestone', '{"type": "session_count", "value": 20}', 500, 'from-purple-400', 'to-indigo-500', 4),
  ('master', 'Maître', 'Complétez 50 sessions', 'Crown', 'milestone', '{"type": "session_count", "value": 50}', 1000, 'from-yellow-400', 'to-amber-500', 5),
  ('legend', 'Légende', 'Complétez 100 sessions', 'Award', 'milestone', '{"type": "session_count", "value": 100}', 2000, 'from-amber-400', 'to-orange-500', 6),

  -- Streak achievements
  ('on_fire_3', 'En feu !', '3 jours consécutifs', 'Flame', 'streak', '{"type": "streak", "value": 3}', 150, 'from-orange-400', 'to-amber-500', 10),
  ('on_fire_7', 'Semaine parfaite', '7 jours consécutifs', 'Zap', 'streak', '{"type": "streak", "value": 7}', 350, 'from-amber-400', 'to-yellow-500', 11),
  ('on_fire_14', 'Deux semaines !', '14 jours consécutifs', 'Flame', 'streak', '{"type": "streak", "value": 14}', 700, 'from-yellow-400', 'to-orange-500', 12),
  ('on_fire_30', 'Un mois complet !', '30 jours consécutifs', 'Star', 'streak', '{"type": "streak", "value": 30}', 1500, 'from-orange-400', 'to-red-500', 13),

  -- Completion achievements
  ('perfectionist', 'Perfectionniste', '80% de taux de complétion', 'Star', 'completion', '{"type": "completion_rate", "value": 80}', 400, 'from-emerald-400', 'to-green-500', 20),
  ('flawless', 'Impeccable', '95% de taux de complétion', 'CheckCircle2', 'completion', '{"type": "completion_rate", "value": 95}', 800, 'from-green-400', 'to-emerald-500', 21),

  -- Test achievements
  ('test_first', 'Premier test', '1 test réalisé', 'TestTube', 'session', '{"type": "test_count", "value": 1}', 50, 'from-cyan-300', 'to-cyan-400', 30),
  ('test_10', 'Découvreur', '10 tests réalisés', 'TestTube', 'session', '{"type": "test_count", "value": 10}', 100, 'from-cyan-400', 'to-blue-400', 31),
  ('test_30', 'Explorateur', '30 tests réalisés', 'TestTube', 'session', '{"type": "test_count", "value": 30}', 200, 'from-blue-400', 'to-blue-500', 32),
  ('test_50', 'Testeur confirmé', '50 tests réalisés', 'Clipboard', 'session', '{"type": "test_count", "value": 50}', 300, 'from-blue-500', 'to-indigo-500', 33),
  ('test_70', 'Expert testeur', '70 tests réalisés', 'Clipboard', 'session', '{"type": "test_count", "value": 70}', 400, 'from-indigo-400', 'to-indigo-500', 34),
  ('test_100', 'Centurion', '100 tests réalisés', 'Award', 'milestone', '{"type": "test_count", "value": 100}', 600, 'from-indigo-500', 'to-purple-500', 35),
  ('test_150', 'Maître des tests', '150 tests réalisés', 'Trophy', 'milestone', '{"type": "test_count", "value": 150}', 900, 'from-purple-400', 'to-purple-600', 36),
  ('test_200', 'Légende des tests', '200 tests réalisés', 'Crown', 'milestone', '{"type": "test_count", "value": 200}', 1200, 'from-purple-500', 'to-pink-500', 37),

  -- Level achievements
  ('level_5', 'Niveau 5', 'Atteignez le niveau 5', 'TrendingUp', 'milestone', '{"type": "level", "value": 5}', 500, 'from-violet-400', 'to-purple-500', 40),
  ('level_10', 'Niveau 10', 'Atteignez le niveau 10', 'Award', 'milestone', '{"type": "level", "value": 10}', 1000, 'from-purple-400', 'to-pink-500', 41)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FUNCTION: Initialiser les stats pour les utilisateurs existants
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_existing_users_gamification()
RETURNS void AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM public.user_sessions
  LOOP
    -- Créer une fausse mise à jour pour déclencher le recalcul
    UPDATE public.user_sessions
    SET updated_at = updated_at
    WHERE user_id = v_user.user_id
    LIMIT 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter l'initialisation (commenté par défaut, à exécuter manuellement si nécessaire)
-- SELECT public.initialize_existing_users_gamification();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.achievements IS 'Définit tous les achievements disponibles dans le système de gamification';
COMMENT ON TABLE public.user_achievements IS 'Stocke les achievements débloqués par chaque utilisateur';
COMMENT ON TABLE public.user_gamification_stats IS 'Statistiques de gamification par utilisateur (niveaux, XP, streaks, etc.)';
COMMENT ON FUNCTION public.update_user_gamification_stats IS 'Met à jour automatiquement les statistiques de gamification quand une session est créée/modifiée';
COMMENT ON FUNCTION public.check_and_unlock_achievements IS 'Vérifie et débloque automatiquement les achievements selon les conditions';
