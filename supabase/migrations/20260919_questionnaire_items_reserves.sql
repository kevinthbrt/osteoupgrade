-- Les items sont la partie sous licence, et ils étaient lisibles par tout
-- compte connecté : l'interface verrouillait la passation, la table non.
-- La fiche du questionnaire reste visible de tous, c'est elle qui donne envie
-- de s'abonner ; ce sont les items qui se réservent.
--
-- Fonction SECURITY DEFINER sur le modèle de public.is_admin(), pour la même
-- raison : une politique qui interroge `profiles` dépend des politiques de
-- `profiles`, et cette dépendance finit toujours par surprendre.

CREATE OR REPLACE FUNCTION public.a_acces_osteoupgrade()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
DECLARE
  v_ok boolean;
BEGIN
  SELECT (role = 'admin' OR plan IN ('osteoupgrade', 'bundle'))
    INTO v_ok
    FROM public.profiles
   WHERE id = auth.uid()
   LIMIT 1;

  RETURN COALESCE(v_ok, false);
END;
$function$;

DROP POLICY IF EXISTS questionnaire_items_lecture ON public.questionnaire_items;
CREATE POLICY questionnaire_items_lecture ON public.questionnaire_items
  FOR SELECT USING (
    public.a_acces_osteoupgrade()
    AND EXISTS (
      SELECT 1 FROM public.questionnaires q
       WHERE q.id = questionnaire_items.questionnaire_id
         AND (q.status = 'published' OR public.is_admin())
    )
  );

COMMENT ON FUNCTION public.a_acces_osteoupgrade() IS
  'Vrai si le compte courant a accès au contenu OsteoUpgrade, miroir SQL de hasOsteoupgrade() dans lib/entitlements.ts.';
