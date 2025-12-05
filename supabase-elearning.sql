-- Tables principales pour le module e-learning
create table if not exists public.elearning_formations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  level text not null check (level in ('silver', 'gold', 'admin')),
  description text
);

create table if not exists public.elearning_chapters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  formation_id uuid not null references public.elearning_formations(id) on delete cascade,
  title text not null,
  order_index integer default 1
);

create table if not exists public.elearning_subparts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  chapter_id uuid not null references public.elearning_chapters(id) on delete cascade,
  title text not null,
  vimeo_url text not null,
  description_html text,
  order_index integer default 1
);

create table if not exists public.elearning_subpart_progress (
  id uuid primary key default gen_random_uuid(),
  subpart_id uuid not null references public.elearning_subparts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz default now(),
  unique (subpart_id, user_id)
);

-- Indexes pour de meilleures performances
create index if not exists idx_elearning_chapters_formation on public.elearning_chapters(formation_id);
create index if not exists idx_elearning_subparts_chapter on public.elearning_subparts(chapter_id);
create index if not exists idx_elearning_progress_user on public.elearning_subpart_progress(user_id);

alter table public.elearning_formations enable row level security;
alter table public.elearning_chapters enable row level security;
alter table public.elearning_subparts enable row level security;
alter table public.elearning_subpart_progress enable row level security;

-- Lecture pour les membres éligibles (premium Silver, premium Gold, admin)
drop policy if exists "formations_select" on public.elearning_formations;
create policy "formations_select" on public.elearning_formations
  for select using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (level = 'silver' and p.role in ('premium_silver', 'premium_gold', 'admin')) or
          (level = 'gold' and p.role in ('premium_gold', 'admin')) or
          (level = 'admin' and p.role = 'admin')
        )
    )
  );

drop policy if exists "chapters_select" on public.elearning_chapters;
create policy "chapters_select" on public.elearning_chapters
  for select using (
    exists (
      select 1
      from public.elearning_formations f
      join public.profiles p on p.id = auth.uid()
      where f.id = formation_id
        and (
          (f.level = 'silver' and p.role in ('premium_silver', 'premium_gold', 'admin')) or
          (f.level = 'gold' and p.role in ('premium_gold', 'admin')) or
          (f.level = 'admin' and p.role = 'admin')
        )
    )
  );

drop policy if exists "subparts_select" on public.elearning_subparts;
create policy "subparts_select" on public.elearning_subparts
  for select using (
    exists (
      select 1
      from public.elearning_chapters c
      join public.elearning_formations f on f.id = c.formation_id
      join public.profiles p on p.id = auth.uid()
      where c.id = chapter_id
        and (
          (f.level = 'silver' and p.role in ('premium_silver', 'premium_gold', 'admin')) or
          (f.level = 'gold' and p.role in ('premium_gold', 'admin')) or
          (f.level = 'admin' and p.role = 'admin')
        )
    )
  );
drop policy if exists "progress_select" on public.elearning_subpart_progress;
create policy "progress_select" on public.elearning_subpart_progress
  for select using (
    auth.uid() = user_id or exists (
      select 1
      from public.elearning_subparts s
      join public.elearning_chapters c on c.id = s.chapter_id
      join public.elearning_formations f on f.id = c.formation_id
      join public.profiles p on p.id = auth.uid()
      where s.id = subpart_id
        and p.role = 'admin'
    )
  );

-- Ecriture réservée aux administrateurs (basés sur le profil)
drop policy if exists "formations_admin_write" on public.elearning_formations;
create policy "formations_admin_write" on public.elearning_formations
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )) with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "chapters_admin_write" on public.elearning_chapters;
create policy "chapters_admin_write" on public.elearning_chapters
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )) with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "subparts_admin_write" on public.elearning_subparts;
create policy "subparts_admin_write" on public.elearning_subparts
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )) with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Progression : chaque abonné gère sa propre progression, les admins peuvent gérer les écritures
drop policy if exists "progress_self_write" on public.elearning_subpart_progress;
create policy "progress_self_write" on public.elearning_subpart_progress
  for insert
  with check (
    auth.uid() = user_id and exists (
      select 1
      from public.elearning_subparts s
      join public.elearning_chapters c on c.id = s.chapter_id
      join public.elearning_formations f on f.id = c.formation_id
      join public.profiles p on p.id = auth.uid()
      where s.id = subpart_id
        and (
          (f.level = 'silver' and p.role in ('premium_silver', 'premium_gold', 'admin')) or
          (f.level = 'gold' and p.role in ('premium_gold', 'admin')) or
          (f.level = 'admin' and p.role = 'admin')
        )
    )
  );

drop policy if exists "progress_self_delete" on public.elearning_subpart_progress;
create policy "progress_self_delete" on public.elearning_subpart_progress
  for delete using (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
