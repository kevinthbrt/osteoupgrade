-- Ajout d'un PDF téléchargeable aux sous-parties (sous-chapitres) e-learning
-- pdf_url : URL du PDF stocké via Vercel Blob
-- pdf_name : nom original du fichier pour un libellé de téléchargement plus lisible

alter table if exists public.elearning_subparts
  add column if not exists pdf_url text;

alter table if exists public.elearning_subparts
  add column if not exists pdf_name text;

comment on column public.elearning_subparts.pdf_url is 'URL du PDF téléchargeable de la sous-partie (stocké via Vercel Blob)';
comment on column public.elearning_subparts.pdf_name is 'Nom original du fichier PDF pour l''affichage du lien de téléchargement';
