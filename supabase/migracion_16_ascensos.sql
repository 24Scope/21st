-- Migración 16: revisiones de Ascensos de tropas.
-- Quien carga los informes guarda el recuento (estado 'borrador' = sin verificar). Cualquier cuenta aprobada puede
-- corregirlo (juntar nombres, borrar, editar). Al verificarlo queda fijo y pasa al historial; solo Rango Scope puede
-- tocar o borrar una revisión verificada.

create table if not exists ascensos_revisiones (
  id              bigserial primary key,
  titulo          text not null default '' check (length(titulo) <= 120),
  revision        text not null check (revision in ('soldados', 'tropa')),
  informes        jsonb not null default '[]',
  resultado       jsonb not null default '[]',
  estado          text not null default 'borrador' check (estado in ('borrador', 'verificada')),
  creado_por      uuid default auth.uid() references perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_por uuid references perfiles(id) on delete set null,
  actualizado_en  timestamptz not null default now(),
  verificado_por  uuid references perfiles(id) on delete set null,
  verificado_en   timestamptz
);
create index if not exists ascensos_revisiones_fecha on ascensos_revisiones(creado_en desc);

alter table ascensos_revisiones enable row level security;
create policy asc_ver     on ascensos_revisiones for select to authenticated using (true);
create policy asc_crear   on ascensos_revisiones for insert to authenticated with check (creado_por = auth.uid() and estado = 'borrador');
create policy asc_editar  on ascensos_revisiones for update to authenticated using (estado = 'borrador' or es_admin()) with check (true);
create policy asc_borrar  on ascensos_revisiones for delete to authenticated using ((estado = 'borrador' and creado_por = auth.uid()) or es_admin());
-- también exige cuenta aprobada, como el resto de las tablas
create policy solo_aprobadas on ascensos_revisiones as restrictive for all to authenticated
  using (public.cuenta_aprobada()) with check (public.cuenta_aprobada());

grant select, insert, update, delete on ascensos_revisiones to authenticated;
grant usage, select on sequence ascensos_revisiones_id_seq to authenticated;

create or replace function asc_proteger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.estado = 'verificada' and not es_admin() then raise exception 'Esta revisión ya está verificada: no se puede modificar.'; end if;
  new.creado_por := old.creado_por; new.creado_en := old.creado_en;
  new.actualizado_por := auth.uid(); new.actualizado_en := now();
  if new.estado = 'verificada' and old.estado = 'borrador' then
    new.verificado_por := auth.uid(); new.verificado_en := now();
  elsif new.estado = 'borrador' then
    new.verificado_por := null; new.verificado_en := null;
  else
    new.verificado_por := old.verificado_por; new.verificado_en := old.verificado_en;
  end if;
  return new;
end $$;
drop trigger if exists asc_proteger on ascensos_revisiones;
create trigger asc_proteger before update on ascensos_revisiones for each row execute function asc_proteger();

alter publication supabase_realtime add table ascensos_revisiones;
