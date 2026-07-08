-- Durcissement sécurité : ces fonctions SECURITY DEFINER acceptent un email en
-- paramètre (p_email) sans vérifier auth.uid(), car elles sont conçues pour être
-- appelées uniquement par le proxy serveur /api/osteoflow/* (qui dérive l'email
-- d'une session vérifiée). Elles étaient exécutables via la clé anon publique,
-- ce qui permettait à n'importe qui d'appeler l'API REST Supabase directement
-- pour lire/modifier la progression ou les résultats de quiz de n'importe quel
-- email, en contournant entièrement le serveur. Les routes appelantes utilisent
-- désormais le client service_role ; seul ce rôle a besoin d'exécuter ces RPC.
REVOKE EXECUTE ON FUNCTION public.mark_subpart_complete_for_email(TEXT, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.mark_subpart_incomplete_for_email(TEXT, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt_for_email(TEXT, UUID, INT, INT, INT, BOOLEAN, JSONB) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_formation_full(TEXT, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_formation_progress_full(TEXT, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_all_formations_with_progress(TEXT) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.mark_subpart_complete_for_email(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_subpart_incomplete_for_email(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt_for_email(TEXT, UUID, INT, INT, INT, BOOLEAN, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_formation_full(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_formation_progress_full(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_formations_with_progress(TEXT) TO service_role;
