-- Retrait du programme école (cf. docs/PRICING_ANNUEL.md, section 4).
--
-- Il faisait doublon avec les lots de codes partenaires (/admin/partners),
-- qui savent désormais viser l'annuel, le mensuel et chaque offre, et dont
-- Stripe arrête seul la remise au terme de sa durée.
--
-- À APPLIQUER APRÈS le déploiement du code qui ne lit plus ces tables : le
-- code précédent les interroge à chaque passage sur « Mon abonnement ».
-- Elles ne contiennent qu'une école de test.

DROP TABLE IF EXISTS public.partner_program_members;
DROP TABLE IF EXISTS public.partner_programs;
