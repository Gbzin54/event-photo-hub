-- Perfis dos fotógrafos
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  studio_name text not null default 'Meu estúdio',
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Eventos fotográficos
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  event_date date,
  location text,
  description text,
  cover_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- Fotos enviadas
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index photos_event_idx on public.photos (event_id, created_at);
create index events_user_idx on public.events (user_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
GRANT SELECT, INSERT, DELETE ON public.photos TO authenticated;
GRANT SELECT ON public.photos TO anon;
GRANT ALL ON public.photos TO service_role;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.photos enable row level security;

-- Perfis: leitura pública (nome do estúdio aparece na galeria), dono escreve
create policy "Public read profiles"
  on public.profiles for select using (true);
create policy "Own profile insert"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Own profile update"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Eventos: dono controla tudo, visitantes leem apenas eventos públicos
create policy "Owner full events"
  on public.events for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public read events"
  on public.events for select to anon using (is_public = true);

-- Fotos: dono controla tudo, visitantes leem fotos de eventos públicos
create policy "Owner full photos"
  on public.photos for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public read photos"
  on public.photos for select to anon using (
    exists (select 1 from public.events e where e.id = event_id and e.is_public)
  );

-- Storage: upload apenas na própria pasta photos/<uid>/, leitura pública
create policy "Photographers upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Photographers update photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Photographers delete photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public read photo files"
  on storage.objects for select using (bucket_id = 'photos');