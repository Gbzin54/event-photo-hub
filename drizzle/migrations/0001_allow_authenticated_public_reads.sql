-- Fotógrafos logados também devem conseguir abrir galerias públicas de outros
-- (antes, apenas o papel anônimo via nas políticas de leitura pública)
drop policy "Public read events" on public.events;
create policy "Public read events"
  on public.events for select to anon, authenticated using (is_public = true);

drop policy "Public read photos" on public.photos;
create policy "Public read photos"
  on public.photos for select to anon, authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.is_public)
  );