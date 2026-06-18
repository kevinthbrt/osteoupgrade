-- Fix: "case not found" (SQLSTATE 20000) lors de la complétion d'un cours OsteoFlow.
--
-- La fonction trigger check_and_unlock_achievements() évalue le type de chaque
-- achievement actif via un CASE sans clause ELSE. La migration
-- 20260607_osteoflash_certificates.sql a introduit un achievement actif de type
-- 'osteoflash_deck' qui n'est géré par aucun WHEN. Dès que le trigger boucle sur
-- cet achievement, PL/pgSQL lève "case not found", ce qui annule toute la
-- transaction d'écriture sur elearning_subpart_progress (via le trigger en
-- cascade update_user_gamification_stats -> user_gamification_stats ->
-- check_and_unlock_achievements). La complétion n'est donc jamais persistée
-- dans Supabase et n'est pas synchronisée avec OsteoUpgrade.
--
-- Correctif : ajouter une clause ELSE pour ignorer silencieusement tout type
-- d'achievement non reconnu (les achievements 'osteoflash_deck' sont débloqués
-- par le flux dédié app/api/flashcards/certificate/route.ts, pas par ce trigger).

CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
        ELSE
          -- Type d'achievement non géré par ce trigger (ex: 'osteoflash_deck',
          -- débloqué via le flux certificat). On l'ignore sans erreur.
          v_should_unlock := false;
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
$function$;
