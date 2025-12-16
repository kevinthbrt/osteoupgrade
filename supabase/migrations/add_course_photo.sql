-- Ajout du champ photo_url pour les formations e-learning
-- Cette colonne stockera l'URL de la photo illustrative de la formation (via Vercel Blob)

alter table if exists public.elearning_formations
  add column if not exists photo_url text;

comment on column public.elearning_formations.photo_url is 'URL de la photo illustrative de la formation (stockée via Vercel Blob)';
