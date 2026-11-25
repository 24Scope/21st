-- Migración 25: en el Calendario, editar o borrar una actividad programada solo lo puede hacer
-- quien la cargó, quien figura entre los que la programan, o un Comandante en adelante (rango web 6+).
-- Crear sigue igual (puede_editar).

create or replace function public.puede_editar_evento(p_creado_por uuid, p_organizadores bigint[]) returns boolean
language sql stable security definer set search_path = public as $$
  select public.puede_editar() and coalesce((
    select p.rango >= 6 or p_creado_por = p.id or (p.miembro_id is not null and p.miembro_id = any(coalesce(p_organizadores, '{}')))
      from perfiles p where p.id = auth.uid()), false);
$$;
grant execute on function public.puede_editar_evento(uuid, bigint[]) to authenticated;

drop policy if exists modificar on public.eventos;
create policy modificar on public.eventos for update to authenticated
  using (puede_editar_evento(creado_por, organizadores))
  with check ((select puede_editar()));
drop policy if exists borrar on public.eventos;
create policy borrar on public.eventos for delete to authenticated
  using (puede_editar_evento(creado_por, organizadores));
