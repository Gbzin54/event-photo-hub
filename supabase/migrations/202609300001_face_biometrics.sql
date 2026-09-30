create extension if not exists vector with schema extensions;

create table if not exists public.face_profiles (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  embedding extensions.vector(128) not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.photo_faces (
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  distance double precision not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create index if not exists face_profiles_embedding_hnsw
  on public.face_profiles using hnsw (embedding vector_cosine_ops);

alter table public.face_profiles enable row level security;
alter table public.photo_faces enable row level security;

create policy "Users manage own face profile"
on public.face_profiles for all to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid() and exists (
    select 1 from public.events e
    where e.id = event_id and e.user_id = auth.uid()
  )
);

create policy "Public reads faces for public events"
on public.photo_faces for select to anon, authenticated
using (exists (
  select 1 from public.photos p
  join public.events e on e.id = p.event_id
  where p.id = photo_id and e.is_public = true
));

create or replace function public.match_event_face(
  p_event_id uuid,
  p_embedding extensions.vector(128),
  p_threshold double precision default 0.32
)
returns table(user_id uuid, distance double precision)
language sql stable security definer
set search_path = public, extensions
as $$
  select fp.user_id, (fp.embedding <=> p_embedding) as distance
  from public.face_profiles fp
  join public.events e on e.id = fp.event_id
  where fp.event_id = p_event_id
    and e.is_public = true
    and (fp.embedding <=> p_embedding) <= p_threshold
  order by fp.embedding <=> p_embedding
  limit 1;
$$;

grant execute on function public.match_event_face(uuid, extensions.vector(128), double precision)
to anon, authenticated;