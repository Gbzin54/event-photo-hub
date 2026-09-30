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

drop policy if exists "Users manage their event face profile" on public.face_profiles;
create policy "Users manage their event face profile"
on public.face_profiles
for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.user_id = auth.uid()
  )
);

drop policy if exists "Public can read matched photo faces in public events" on public.photo_faces;
create policy "Public can read matched photo faces in public events"
on public.photo_faces
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.photos p
    join public.events e on e.id = p.event_id
    where p.id = photo_id and e.is_public = true
  )
);

drop policy if exists "Event owners can tag photo faces" on public.photo_faces;
create policy "Event owners can tag photo faces"
on public.photo_faces
for insert
to authenticated
with check (
  exists (
    select 1
    from public.photos p
    join public.events e on e.id = p.event_id
    where p.id = photo_id and e.user_id = auth.uid()
  )
);

create or replace function public.match_event_face(
  p_event_id uuid,
  p_embedding extensions.vector(128),
  p_threshold double precision default 0.32
)
returns table (
  user_id uuid,
  distance double precision
)
language sql
stable
security definer
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

revoke all on function public.match_event_face(uuid, extensions.vector(128), double precision) from public;
grant execute on function public.match_event_face(uuid, extensions.vector(128), double precision) to anon, authenticated;

create or replace function public.tag_photo_face(
  p_photo_id uuid,
  p_user_id uuid,
  p_distance double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.photos p
    join public.events e on e.id = p.event_id
    where p.id = p_photo_id and e.user_id = auth.uid()
  ) then
    raise exception 'not allowed';
  end if;

  insert into public.photo_faces(photo_id, user_id, distance)
  values (p_photo_id, p_user_id, p_distance)
  on conflict (photo_id, user_id)
  do update set distance = excluded.distance;
end;
$$;

revoke all on function public.tag_photo_face(uuid, uuid, double precision) from public;
grant execute on function public.tag_photo_face(uuid, uuid, double precision) to authenticated;
