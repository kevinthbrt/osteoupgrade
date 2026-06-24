-- Durcissement sécurité : ces fonctions sont des triggers, jamais appelées via l'API
-- REST/RPC. On retire leur exposition publique (advisor anon_security_definer_function_executable).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_user_gamification_stats() FROM anon, authenticated, public;
