-- =====================================================================
--  BASE DE DATOS 21 — Esquema de Supabase
--  Pegá TODO este archivo en Supabase > SQL Editor > New query > Run.
--  Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERFILES (una fila por cuenta registrada)
--    rango 1 = Usuario, rango 2 = Administrador
-- ---------------------------------------------------------------------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default '',
  email      text,
  rango      int  not null default 1,
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. AJUSTES generales (ej: modo_abierto = todos pueden editar)
-- ---------------------------------------------------------------------
create table if not exists public.ajustes (
  clave  text primary key,
  valor  jsonb not null
);
insert into public.ajustes (clave, valor) values ('modo_abierto', 'true')
  on conflict (clave) do nothing;

-- ---------------------------------------------------------------------
-- 3. MIEMBROS DE LA LEGIÓN
--    categoria: suboficiales | oficiales | elites | tropas
-- ---------------------------------------------------------------------
create table if not exists public.miembros (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  categoria  text not null,
  grado      text default '',
  notas      text default '',
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. REGISTROS (cada celda de las tablas mensuales)
-- ---------------------------------------------------------------------
create table if not exists public.registros (
  id              bigint generated always as identity primary key,
  categoria       text   not null,
  anio            int    not null,
  mes             int    not null check (mes between 1 and 12),
  miembro_id      bigint not null references public.miembros(id) on delete cascade,
  columna         text   not null,
  valor           text,
  bloqueado       boolean not null default false,
  actualizado_por uuid references auth.users(id) on delete set null,
  actualizado_en  timestamptz not null default now(),
  unique (categoria, anio, mes, miembro_id, columna)
);
create index if not exists registros_mes_idx on public.registros (categoria, anio, mes);

-- ---------------------------------------------------------------------
-- 5. EVENTOS DEL CALENDARIO
-- ---------------------------------------------------------------------
create table if not exists public.eventos (
  id           bigint generated always as identity primary key,
  fecha        date not null,
  hora         text default '',
  titulo       text not null,
  tipo         text default '',
  descripcion  text default '',
  creado_por   uuid references auth.users(id) on delete set null,
  creado_en    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. REGLAMENTO DEL CALENDARIO (filas con columnas libres en "datos")
-- ---------------------------------------------------------------------
create table if not exists public.reglamento (
  id         bigint generated always as identity primary key,
  orden      int not null default 0,
  datos      jsonb not null default '{}'::jsonb,
  bloqueado  boolean not null default false,
  creado_en  timestamptz not null default now()
);

-- =====================================================================
--  FUNCIONES DE PERMISOS
-- =====================================================================
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rango >= 2 from perfiles where id = auth.uid()), false);
$$;

-- Puede editar: administradores, o cualquiera mientras "modo_abierto" esté activo
create or replace function public.puede_editar() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.es_admin()
    or coalesce((select (valor)::text = 'true' from ajustes where clave = 'modo_abierto'), false)
  );
$$;

-- Crear el perfil al registrarse. La PRIMERA cuenta queda como Administrador.
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, email, rango)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from perfiles) then 1 else 2 end
  );
  return new;
end $$;

drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.crear_perfil();

-- Una celda bloqueada no puede cambiar su valor (hay que desbloquearla primero)
create or replace function public.proteger_celda() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.bloqueado and new.bloqueado and new.valor is distinct from old.valor then
    raise exception 'La celda está bloqueada';
  end if;
  new.actualizado_en := now();
  new.actualizado_por := auth.uid();
  return new;
end $$;

drop trigger if exists proteger_celda on public.registros;
create trigger proteger_celda before insert or update on public.registros
  for each row execute function public.proteger_celda();

-- =====================================================================
--  SEGURIDAD (Row Level Security)
--  - Sin cuenta: no se ve nada.
--  - Con cuenta: se ve todo.
--  - Editar: según puede_editar(). Cambiar rangos/ajustes: solo admin.
-- =====================================================================
alter table public.perfiles   enable row level security;
alter table public.ajustes    enable row level security;
alter table public.miembros   enable row level security;
alter table public.registros  enable row level security;
alter table public.eventos    enable row level security;
alter table public.reglamento enable row level security;

do $$
declare t text;
begin
  foreach t in array array['perfiles','ajustes','miembros','registros','eventos','reglamento'] loop
    execute format('drop policy if exists "leer" on public.%I', t);
    execute format('create policy "leer" on public.%I for select to authenticated using (true)', t);
  end loop;

  foreach t in array array['miembros','registros','eventos','reglamento'] loop
    execute format('drop policy if exists "insertar" on public.%I', t);
    execute format('drop policy if exists "modificar" on public.%I', t);
    execute format('drop policy if exists "borrar" on public.%I', t);
    execute format('create policy "insertar" on public.%I for insert to authenticated with check (public.puede_editar())', t);
    execute format('create policy "modificar" on public.%I for update to authenticated using (public.puede_editar()) with check (public.puede_editar())', t);
    execute format('create policy "borrar" on public.%I for delete to authenticated using (public.puede_editar())', t);
  end loop;

  foreach t in array array['perfiles','ajustes'] loop
    execute format('drop policy if exists "admin_modifica" on public.%I', t);
    execute format('create policy "admin_modifica" on public.%I for update to authenticated using (public.es_admin()) with check (public.es_admin())', t);
  end loop;
end $$;

-- =====================================================================
--  PRIVILEGIOS (los proyectos nuevos de Supabase no los dan solos)
--  Solo las cuentas con sesión iniciada; las reglas de arriba deciden qué pueden hacer.
-- =====================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.es_admin(), public.puede_editar() to authenticated;

-- =====================================================================
--  TIEMPO REAL (ver los cambios de otros sin recargar)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['registros','miembros','eventos','reglamento'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
--  ÚTIL: hacer administrador a alguien a mano (cambiá el email)
--  update public.perfiles set rango = 2 where email = 'tu@email.com';
-- =====================================================================
