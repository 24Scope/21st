-- Migración 11: avisos de inactividad.
-- Cada cuenta vinculada a un miembro informa su propia inactividad (tipo, motivo, desde/hasta y el link del aviso en Discord).
-- La ven todos (aparece en las tablas de actividad). Quien la cargó o un comandante la puede cancelar; los admins, borrar.

create table if not exists inactividades (
  id           bigserial primary key,
  miembro_id   bigint not null references miembros(id) on delete cascade,
  autor_perfil uuid not null default auth.uid() references perfiles(id) on delete cascade,
  tipo         text not null check (tipo in ('total', 'parcial')),
  motivo       text not null check (length(trim(motivo)) between 5 and 1000),
  link         text not null check (link ~* '^https://([a-z]+[.])?(discord[.]com|discordapp[.]com)/'),
  desde        date not null,
  hasta        date not null,
  creado_en    timestamptz not null default now(),
  cancelada    boolean not null default false,
  cancelada_en timestamptz,
  check (hasta >= desde),
  check (hasta - desde <= 120)
);
create index if not exists inactividades_miembro on inactividades(miembro_id, desde desc);

alter table inactividades enable row level security;

-- Todos los usuarios ven los avisos: se muestran en las tablas de actividad para saber quién declaró inactividad.
create policy inact_ver on inactividades for select to authenticated using (true);
create policy inact_crear on inactividades for insert to authenticated
  with check (autor_perfil = auth.uid()
              and miembro_id = (select miembro_id from perfiles where id = auth.uid())
              and desde >= current_date - 7);
create policy inact_editar on inactividades for update to authenticated
  using (autor_perfil = auth.uid() or es_admin() or es_comandante())
  with check (autor_perfil = auth.uid() or es_admin() or es_comandante());
create policy inact_borrar on inactividades for delete to authenticated using (es_admin());

grant select, insert, update, delete on inactividades to authenticated;
grant usage, select on sequence inactividades_id_seq to authenticated;

-- Al editar solo se puede cancelar; el resto de los datos queda fijo.
create or replace function inact_proteger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.miembro_id := old.miembro_id; new.autor_perfil := old.autor_perfil; new.tipo := old.tipo;
  new.motivo := old.motivo; new.link := old.link; new.desde := old.desde; new.creado_en := old.creado_en;
  if new.cancelada and not old.cancelada then
    new.cancelada_en := now();
    -- al cancelar una inactividad en curso, termina hoy
    if old.desde <= current_date and old.hasta >= current_date then new.hasta := current_date; else new.hasta := old.hasta; end if;
  else
    new.hasta := old.hasta; new.cancelada_en := old.cancelada_en; new.cancelada := old.cancelada;
  end if;
  return new;
end $$;
drop trigger if exists inact_proteger on inactividades;
create trigger inact_proteger before update on inactividades for each row execute function inact_proteger();

alter publication supabase_realtime add table inactividades;
