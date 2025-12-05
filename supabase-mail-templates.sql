-- Création de la table pour sauvegarder les templates d'emails administrables
create table if not exists public.mail_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  description text,
  html text not null,
  text text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists mail_templates_created_by_idx on public.mail_templates(created_by);
