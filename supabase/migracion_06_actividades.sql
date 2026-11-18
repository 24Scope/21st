-- =====================================================================
--  MIGRACIÓN 06 — Registro de actividades desde la página
--  - Cada cuenta se vincula a un miembro de la legión (perfiles.miembro_id)
--  - Cada actividad cargada suma +1 en las tablas que correspondan a cada participante
--  - Anular una actividad descuenta exactamente lo que había sumado
--  Todo el cálculo lo hace la base de datos (funciones registrar_actividad / anular_actividad).
-- =====================================================================

-- 1) Vínculo cuenta ↔ miembro (un miembro solo puede estar vinculado a una cuenta)
alter table public.perfiles add column if not exists miembro_id bigint references public.miembros(id) on delete set null;
create unique index if not exists perfiles_miembro_unico on public.perfiles (miembro_id) where miembro_id is not null;

-- 2) Tipos de actividad y en qué columna suma cada uno
--    rol: 'todos' = a cada participante · 'autor' = solo a quien la carga · 'acompanante' = solo a los demás
create table if not exists public.tipos_actividad (
  id          text primary key,
  nombre      text not null,
  orden       int  not null default 0,
  activo      boolean not null default true
);
create table if not exists public.tipos_actividad_efectos (
  tipo      text not null references public.tipos_actividad(id) on delete cascade,
  registro  text not null,   -- oficiales | suboficiales | elites | bu
  columna   text not null,
  rol       text not null default 'todos',
  primary key (tipo, registro, columna, rol)
);

insert into public.tipos_actividad (id, nombre, orden) values
  ('ent_21',   'Entrenamiento 21st',                     1),
  ('ent_esp',  'Entrenamiento de especialización / élite', 2),
  ('ent_bu',   'Entrenamiento BU',                       3),
  ('rol_pj',   'Rol de PJ',                              4),
  ('minirol',  'Minirol',                                5),
  ('try_bu',   'Try BU',                                 6),
  ('try_esp',  'Try de especialización',                 7),
  ('try_21',   'Try 21st',                               8),
  ('mis_21',   'Misión 21st',                            9),
  ('mis_bu',   'Misión BU',                             10),
  ('cap_sombra','Capacitación sombra (BU)',             11),
  ('mis_elite','Misión élite',                          12)
on conflict (id) do update set nombre = excluded.nombre, orden = excluded.orden;

insert into public.tipos_actividad_efectos (tipo, registro, columna, rol) values
  ('ent_21',  'oficiales',    'ents_21',   'todos'), ('ent_21',  'suboficiales', 'ents_21',  'todos'),
  ('ent_esp', 'oficiales',    'ents_esp',  'todos'), ('ent_esp', 'suboficiales', 'ents_esp', 'todos'),
  ('ent_esp', 'elites',       'n_cap',     'todos'),
  ('ent_bu',  'oficiales',    'ents_bu',   'todos'), ('ent_bu',  'suboficiales', 'ents_bu',  'todos'),
  ('ent_bu',  'bu',           'ent_bu_ent','todos'),
  ('rol_pj',  'oficiales',    'roles_pj',  'todos'), ('rol_pj',  'suboficiales', 'roles_pj', 'todos'),
  ('minirol', 'oficiales',    'minirol',   'todos'), ('minirol', 'suboficiales', 'minirol',  'todos'),
  ('try_bu',  'oficiales',    'try_bu',    'todos'),
  ('try_bu',  'bu',           'try_org',   'autor'), ('try_bu',  'bu',           'try_ayuda','acompanante'),
  ('try_esp', 'oficiales',    'try_esp',   'todos'), ('try_esp', 'suboficiales', 'try_esp',  'todos'),
  ('try_esp', 'elites',       'n_trys',    'todos'),
  ('try_21',  'oficiales',    'try_21',    'todos'), ('try_21',  'suboficiales', 'try_21',   'todos'),
  ('mis_21',  'bu',           'mis_21',    'todos'),
  ('mis_bu',  'bu',           'mis_bu',    'todos'),
  ('cap_sombra','bu',         'cap_ent',   'todos'),
  ('mis_elite','elites',      'misiones',  'todos')
on conflict do nothing;

-- 3) Actividades cargadas
create table if not exists public.actividades (
  id             bigint generated always as identity primary key,
  tipo           text not null references public.tipos_actividad(id),
  fecha          date not null,
  hora           text not null default '',
  link           text not null,
  notas          text not null default '',
  autor_perfil   uuid references auth.users(id) on delete set null,
  autor_miembro  bigint references public.miembros(id) on delete set null,
  participantes  bigint[] not null default '{}',
  efectos        jsonb not null default '[]',   -- lo que se sumó, para poder anularlo exacto
  anulada        boolean not null default false,
  anulada_por    uuid references auth.users(id) on delete set null,
  anulada_en     timestamptz,
  creado_en      timestamptz not null default now()
);
create unique index if not exists actividades_link_unico on public.actividades (link) where not anulada;
create index if not exists actividades_fecha_idx on public.actividades (fecha desc);

-- 4) Suma/resta en registros
create or replace function public.aplicar_efectos(p_efectos jsonb, p_signo int) returns void
language plpgsql security definer set search_path = public as $$
declare e jsonb;
begin
  for e in select * from jsonb_array_elements(p_efectos) loop
    insert into registros (categoria, anio, mes, periodo, miembro_id, columna, valor)
    values (e->>'categoria', (e->>'anio')::int, (e->>'mes')::int, coalesce(e->>'periodo', ''), (e->>'miembro_id')::bigint,
            e->>'columna', case when p_signo > 0 then p_signo::text else null end)
    on conflict (categoria, anio, mes, periodo, miembro_id, columna) do update
      set valor = nullif((
        case when registros.valor ~ '^-?[0-9]+(\.[0-9]+)?$' then registros.valor::numeric else 0 end + p_signo
      )::text, '0');
  end loop;
end $$;
revoke all on function public.aplicar_efectos(jsonb, int) from public, anon, authenticated;

-- 5) Registrar una actividad
create or replace function public.registrar_actividad(
  p_tipo text, p_fecha date, p_hora text, p_link text, p_notas text, p_acompanantes bigint[]
) returns public.actividades
language plpgsql security definer set search_path = public as $$
declare
  v_autor bigint;
  v_part  bigint[];
  v_efectos jsonb;
  v_fila actividades;
begin
  select miembro_id into v_autor from perfiles where id = auth.uid();
  if v_autor is null then raise exception 'Tu cuenta no está vinculada a un miembro de la legión. Pedile a un administrador que la vincule.'; end if;
  if not exists (select 1 from tipos_actividad where id = p_tipo and activo) then raise exception 'Tipo de actividad inválido.'; end if;
  if p_fecha is null or p_fecha > current_date + 1 then raise exception 'La fecha no puede ser futura.'; end if;
  if p_fecha < current_date - 120 then raise exception 'La fecha es demasiado antigua (más de 120 días).'; end if;
  if coalesce(p_link, '') !~* '^https://([a-z]+\.)?(discord\.com|discordapp\.com)/' then
    raise exception 'El link tiene que ser un enlace de Discord (https://discord.com/...).';
  end if;

  -- participantes: el autor + acompañantes válidos (SGT en adelante, activos), sin repetir
  select array_agg(id order by id) into v_part from (
    select v_autor as id
    union
    select m.id from miembros m
    where m.id = any(coalesce(p_acompanantes, '{}')) and m.activo
      and m.categoria in ('comandantes', 'oficiales', 'suboficiales')
  ) t;

  -- efectos según el tipo y la categoría / élite de cada participante
  select coalesce(jsonb_agg(jsonb_build_object(
      'categoria', e.registro, 'anio', extract(year from p_fecha)::int, 'mes', extract(month from p_fecha)::int,
      'periodo', '', 'miembro_id', m.id, 'columna', e.columna)), '[]')
  into v_efectos
  from miembros m
  join tipos_actividad_efectos e on e.tipo = p_tipo
  where m.id = any(v_part)
    and (e.rol = 'todos' or (e.rol = 'autor' and m.id = v_autor) or (e.rol = 'acompanante' and m.id <> v_autor))
    and case e.registro
          when 'oficiales'    then m.categoria in ('comandantes', 'oficiales')
          when 'suboficiales' then m.categoria = 'suboficiales'
          when 'elites'       then coalesce(m.elite, '') <> ''
          when 'bu'           then true
          else false end;

  perform aplicar_efectos(v_efectos, 1);

  insert into actividades (tipo, fecha, hora, link, notas, autor_perfil, autor_miembro, participantes, efectos)
  values (p_tipo, p_fecha, coalesce(p_hora, ''), trim(p_link), coalesce(p_notas, ''), auth.uid(), v_autor, v_part, v_efectos)
  returning * into v_fila;
  return v_fila;
exception
  when unique_violation then raise exception 'Ese link de informe ya fue cargado en otra actividad.';
end $$;

-- 6) Anular (admin o quien la cargó): descuenta lo que se había sumado
create or replace function public.anular_actividad(p_id bigint) returns public.actividades
language plpgsql security definer set search_path = public as $$
declare v_fila actividades;
begin
  select * into v_fila from actividades where id = p_id for update;
  if not found then raise exception 'La actividad no existe.'; end if;
  if v_fila.anulada then raise exception 'La actividad ya estaba anulada.'; end if;
  if not (es_admin() or v_fila.autor_perfil = auth.uid()) then raise exception 'Solo un administrador o quien la cargó puede anularla.'; end if;
  perform aplicar_efectos(v_fila.efectos, -1);
  update actividades set anulada = true, anulada_por = auth.uid(), anulada_en = now() where id = p_id returning * into v_fila;
  return v_fila;
end $$;

grant execute on function public.registrar_actividad(text, date, text, text, text, bigint[]) to authenticated;
grant execute on function public.anular_actividad(bigint) to authenticated;

-- 7) Seguridad: se leen con sesión; solo se escriben a través de las funciones
alter table public.tipos_actividad         enable row level security;
alter table public.tipos_actividad_efectos enable row level security;
alter table public.actividades             enable row level security;
drop policy if exists "leer" on public.tipos_actividad;
drop policy if exists "leer" on public.tipos_actividad_efectos;
drop policy if exists "leer" on public.actividades;
create policy "leer" on public.tipos_actividad         for select to authenticated using (true);
create policy "leer" on public.tipos_actividad_efectos for select to authenticated using (true);
create policy "leer" on public.actividades             for select to authenticated using (true);
grant select on public.tipos_actividad, public.tipos_actividad_efectos, public.actividades to authenticated;

do $$ begin
  begin execute 'alter publication supabase_realtime add table public.actividades'; exception when duplicate_object then null; end;
end $$;
