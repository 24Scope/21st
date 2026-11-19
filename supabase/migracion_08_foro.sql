-- Migración 08: Foro de administración. Solo las cuentas con rango Administrador pueden verlo y escribir.

create table if not exists foro_temas (
  id         bigserial primary key,
  titulo     text not null check (length(trim(titulo)) between 1 and 120),
  texto      text not null default '' check (length(texto) <= 5000),
  autor      uuid not null default auth.uid() references perfiles(id) on delete cascade,
  fijado     boolean not null default false,
  creado_en  timestamptz not null default now(),
  editado_en timestamptz,
  ultima_actividad timestamptz not null default now()
);

create table if not exists foro_comentarios (
  id         bigserial primary key,
  tema_id    bigint not null references foro_temas(id) on delete cascade,
  texto      text not null check (length(trim(texto)) between 1 and 5000),
  autor      uuid not null default auth.uid() references perfiles(id) on delete cascade,
  creado_en  timestamptz not null default now(),
  editado_en timestamptz
);
create index if not exists foro_comentarios_tema on foro_comentarios(tema_id, creado_en);

alter table foro_temas enable row level security;
alter table foro_comentarios enable row level security;

-- Ver: solo administradores. Escribir: solo administradores y a su nombre.
-- Editar: solo el autor (los temas, además, cualquier admin puede fijarlos). Borrar: cualquier administrador.
create policy foro_temas_ver    on foro_temas for select to authenticated using (es_admin());
create policy foro_temas_crear  on foro_temas for insert to authenticated with check (es_admin() and autor = auth.uid());
create policy foro_temas_editar on foro_temas for update to authenticated using (es_admin()) with check (es_admin());
create policy foro_temas_borrar on foro_temas for delete to authenticated using (es_admin());

create policy foro_com_ver    on foro_comentarios for select to authenticated using (es_admin());
create policy foro_com_crear  on foro_comentarios for insert to authenticated with check (es_admin() and autor = auth.uid());
create policy foro_com_editar on foro_comentarios for update to authenticated using (es_admin() and autor = auth.uid()) with check (es_admin() and autor = auth.uid());
create policy foro_com_borrar on foro_comentarios for delete to authenticated using (es_admin());

grant select, insert, update, delete on foro_temas, foro_comentarios to authenticated;
grant usage, select on sequence foro_temas_id_seq, foro_comentarios_id_seq to authenticated;

-- Un tema solo lo puede editar (título/texto) su autor; los demás admins solo pueden fijarlo o desfijarlo.
create or replace function foro_proteger_tema() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.titulo is distinct from old.titulo or new.texto is distinct from old.texto) then
    if old.autor is distinct from auth.uid() then raise exception 'Solo quien escribió el tema puede editarlo.'; end if;
    new.editado_en := now();
  end if;
  new.autor := old.autor; new.creado_en := old.creado_en;
  return new;
end $$;
drop trigger if exists foro_proteger_tema on foro_temas;
create trigger foro_proteger_tema before update on foro_temas for each row execute function foro_proteger_tema();

-- Cada comentario nuevo sube el tema arriba de la lista
create or replace function foro_tocar_tema() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update foro_temas set ultima_actividad = now() where id = new.tema_id;
  return new;
end $$;
drop trigger if exists foro_tocar_tema on foro_comentarios;
create trigger foro_tocar_tema after insert on foro_comentarios for each row execute function foro_tocar_tema();

alter publication supabase_realtime add table foro_temas, foro_comentarios;
