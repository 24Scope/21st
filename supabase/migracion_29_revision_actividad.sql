-- Migración 29: Revisión de actividad (Comandancia).
--  * Marca de "ya revisado" por miembro y mes.
--  * Rechazar una actividad mal cargada (deja de sumar en las planillas, igual que anularla) con un motivo,
--    y poder restaurarla si se rechazó por error.
--  Lo pueden hacer los Comandantes en adelante y el Administrador Web.

create or replace function public.puede_revisar() returns boolean
language sql stable security definer set search_path = public as $$
  select public.cuenta_aprobada() and (public.es_admin() or public.es_comandante()
    or coalesce((select rango >= 6 from perfiles where id = auth.uid()), false));
$$;
grant execute on function public.puede_revisar() to authenticated;

-- ---------- Revisado
create table if not exists public.revisiones_actividad (
  miembro_id   bigint not null,
  anio         int not null,
  mes          int not null check (mes between 1 and 12),
  revisado_por uuid references public.perfiles(id) on delete set null,
  revisado_en  timestamptz not null default now(),
  primary key (miembro_id, anio, mes)
);
alter table public.revisiones_actividad enable row level security;
grant select on public.revisiones_actividad to authenticated;
drop policy if exists solo_aprobadas on public.revisiones_actividad;
create policy solo_aprobadas on public.revisiones_actividad as restrictive for all to authenticated
  using ((select cuenta_aprobada())) with check ((select cuenta_aprobada()));
drop policy if exists leer on public.revisiones_actividad;
create policy leer on public.revisiones_actividad for select to authenticated using (true);

create or replace function public.marcar_revisado(p_miembro bigint, p_anio int, p_mes int, p_revisado boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not puede_revisar() then raise exception 'Solo los Comandantes en adelante pueden marcar revisiones.'; end if;
  if p_revisado then
    insert into revisiones_actividad (miembro_id, anio, mes, revisado_por) values (p_miembro, p_anio, p_mes, auth.uid())
      on conflict (miembro_id, anio, mes) do update set revisado_por = excluded.revisado_por, revisado_en = now();
  else
    delete from revisiones_actividad where miembro_id = p_miembro and anio = p_anio and mes = p_mes;
  end if;
  return p_revisado;
end $$;
revoke all on function public.marcar_revisado(bigint, int, int, boolean) from public, anon;
grant execute on function public.marcar_revisado(bigint, int, int, boolean) to authenticated;

-- ---------- Rechazar / restaurar actividades
alter table public.actividades add column if not exists rechazada boolean not null default false;
alter table public.actividades add column if not exists rechazo_motivo text;

create or replace function public.rechazar_actividad(p_id bigint, p_motivo text) returns public.actividades
language plpgsql security definer set search_path = public as $$
declare v actividades;
begin
  if not puede_revisar() then raise exception 'Solo los Comandantes en adelante pueden rechazar actividades.'; end if;
  select * into v from actividades where id = p_id for update;
  if not found then raise exception 'La actividad no existe.'; end if;
  if v.anulada then raise exception 'La actividad ya estaba anulada o rechazada.'; end if;
  perform aplicar_efectos(v.efectos, -1);
  update actividades set anulada = true, anulada_por = auth.uid(), anulada_en = now(),
         rechazada = true, rechazo_motivo = nullif(trim(coalesce(p_motivo, '')), '')
   where id = p_id returning * into v;
  return v;
end $$;

create or replace function public.restaurar_actividad(p_id bigint) returns public.actividades
language plpgsql security definer set search_path = public as $$
declare v actividades;
begin
  if not puede_revisar() then raise exception 'Solo los Comandantes en adelante pueden restaurar actividades.'; end if;
  select * into v from actividades where id = p_id for update;
  if not found then raise exception 'La actividad no existe.'; end if;
  if not v.rechazada then raise exception 'Solo se pueden restaurar actividades rechazadas.'; end if;
  perform aplicar_efectos(v.efectos, 1);
  update actividades set anulada = false, anulada_por = null, anulada_en = null, rechazada = false, rechazo_motivo = null
   where id = p_id returning * into v;
  return v;
end $$;
revoke all on function public.rechazar_actividad(bigint, text) from public, anon;
revoke all on function public.restaurar_actividad(bigint) from public, anon;
grant execute on function public.rechazar_actividad(bigint, text) to authenticated;
grant execute on function public.restaurar_actividad(bigint) to authenticated;
