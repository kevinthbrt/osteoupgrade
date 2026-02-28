-- Mise à jour de la contrainte de région pour practice_videos
-- Ajout de 'bassin' et 'pied_cheville' (fusion pied + cheville)

ALTER TABLE public.practice_videos
DROP CONSTRAINT IF EXISTS practice_videos_region_check;

ALTER TABLE public.practice_videos
ADD CONSTRAINT practice_videos_region_check
CHECK (region = ANY (ARRAY[
  'cervical'::text,
  'thoracique'::text,
  'lombaire'::text,
  'epaule'::text,
  'coude'::text,
  'poignet'::text,
  'bassin'::text,
  'hanche'::text,
  'genou'::text,
  'pied_cheville'::text,
  -- anciennes valeurs conservées pour compatibilité avec d'autres tables
  'cheville'::text,
  'pied'::text,
  'atm'::text,
  'crane'::text,
  'sacro-iliaque'::text,
  'cotes'::text,
  'main'::text,
  'neurologique'::text,
  'vasculaire'::text,
  'systemique'::text
]));
