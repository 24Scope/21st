-- Migración 23:
--  * Registrar actividad: "Misión" deja de estar (las misiones entran por Ascensos de tropas).
--    Try BU: quien la registra y su co-organizador suman como organizadores; además se marcan ayudantes
--    (Sargento en adelante) que suman en "Try BU ayudas". Entrenamiento BU: el co-entrenador también suma como entrenador.
--  * Ascensos de tropas: al verificar una revisión, las misiones y los entrenamientos BU suman en la planilla de BU
--    (misiones / Ent. BU participante) a quienes están en la BU. Los nombres dudosos quedan en bu_pendientes.
--    Si la revisión vuelve a "sin verificar" o se borra, se descuenta lo que había sumado.

-- ---------- Tipos y efectos
update tipos_actividad set activo = false where id = 'mision';
delete from tipos_actividad_efectos where registro = 'bu' and tipo in ('try_bu', 'ent_bu');
insert into tipos_actividad_efectos (tipo, registro, columna, rol) values
  ('try_bu', 'bu', 'try_org',    'todos'),
  ('try_bu', 'bu', 'try_ayuda',  'ayudante'),
  ('ent_bu', 'bu', 'ent_bu_ent', 'todos');

alter table actividades add column if not exists ayudantes bigint[] not null default '{}';

-- ---------- registrar_actividad con ayudantes
drop function if exists public.registrar_actividad(text, date, text, text, text, bigint[], text);
create or replace function public.registrar_actividad(p_tipo text, p_fecha date, p_hora text, p_link text, p_notas text,
                                                      p_acompanantes bigint[], p_especializacion text default null,
                                                      p_ayudantes bigint[] default '{}')
returns actividades language plpgsql security definer set search_path = public as $$
declare v_autor bigint; v_yo miembros; v_part bigint[]; v_ayud bigint[]; v_efectos jsonb; v_fila actividades; v_max int; v_malos text; v_esp text;
begin
  select miembro_id into v_autor from perfiles where id = auth.uid() and estado = 'aprobada';
  if v_autor is null then raise exception 'Tu cuenta no está vinculada a un miembro de la legión. Pedile a un administrador que la vincule.'; end if;
  select * into v_yo from miembros where id = v_autor;
  if not exists (select 1 from tipos_actividad where id = p_tipo and activo) then raise exception 'Tipo de actividad inválido.'; end if;
  if p_fecha is null or p_fecha > current_date + 1 then raise exception 'La fecha no puede ser futura.'; end if;
  if p_fecha < current_date - 120 then raise exception 'La fecha es demasiado antigua (más de 120 días).'; end if;
  if coalesce(p_link, '') !~* '^https://([a-z]+\.)?(discord\.com|discordapp\.com)/' then
    raise exception 'El link tiene que ser un enlace de Discord (https://discord.com/...).';
  end if;

  if p_tipo in ('try_21', 'try_esp') and cardinality(coalesce(p_acompanantes, '{}')) > 0 then
    raise exception 'En una try no se puede marcar a nadie más.';
  end if;

  if p_tipo = 'try_esp' then
    v_esp := upper(trim(coalesce(p_especializacion, '')));
    if v_esp not in ('ASE', 'APE', 'RNE') then raise exception 'Elegí de qué especialización fue la try (asalto, apoyo o reconocimiento).'; end if;
    if v_yo.categoria <> 'comandantes' and coalesce(v_yo.elite, '') <> ''
       and v_esp <> (case when v_yo.elite = 'ARC' then 'RNE' else v_yo.elite end) then
      raise exception 'Solo podés registrar trys de tu especialización.';
    end if;
  end if;

  select string_agg(coalesce(m.grado || ' ' || m.nombre, '#' || a.id::text), ', ') into v_malos
  from unnest(coalesce(p_acompanantes, '{}')) a(id) left join miembros m on m.id = a.id
  where m.id is null or not m.activo
     or not (m.categoria in ('comandantes', 'oficiales', 'suboficiales') or coalesce(m.elite, '') <> '');
  if v_malos is not null then raise exception 'No se puede marcar a: %. Solo miembros activos de Sargento en adelante o élites.', v_malos; end if;

  select array_agg(id order by id) into v_part from (
    select v_autor as id union select unnest(coalesce(p_acompanantes, '{}'))
  ) t;

  v_max := case when p_tipo = 'ent_esp' then 3 else 2 end;
  if array_length(v_part, 1) > v_max then
    raise exception 'Esta actividad admite como máximo % participantes (contándote a vos).', v_max;
  end if;

  if p_tipo = 'ent_esp' then
    select string_agg(m.grado || ' ' || m.nombre, ', ') into v_malos
    from miembros m where m.id = any(v_part) and coalesce(m.elite, '') = '';
    if v_malos is not null then raise exception 'En una Capacitación élite todos tienen que ser élites. No lo son: %.', v_malos; end if;
  end if;

  -- Ayudantes (solo en Try BU): Sargento en adelante, activos, que no sean ya organizadores
  select coalesce(array_agg(distinct a.id order by a.id), '{}') into v_ayud
    from unnest(coalesce(p_ayudantes, '{}')) a(id) where not (a.id = any(v_part));
  if cardinality(v_ayud) > 0 then
    if p_tipo <> 'try_bu' then raise exception 'Solo en una Try BU se marcan ayudantes.'; end if;
    if cardinality(v_ayud) > 15 then raise exception 'Demasiados ayudantes (máximo 15).'; end if;
    select string_agg(coalesce(m.grado || ' ' || m.nombre, '#' || a.id::text), ', ') into v_malos
      from unnest(v_ayud) a(id) left join miembros m on m.id = a.id
     where m.id is null or not m.activo or m.categoria not in ('comandantes', 'oficiales', 'suboficiales');
    if v_malos is not null then raise exception 'Como ayudantes solo se marca a oficiales y suboficiales activos. No se puede: %.', v_malos; end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'categoria', e.registro, 'anio', extract(year from p_fecha)::int, 'mes', extract(month from p_fecha)::int,
      'periodo', '', 'miembro_id', m.id, 'columna', e.columna)), '[]')
  into v_efectos
  from miembros m join tipos_actividad_efectos e on e.tipo = p_tipo
  where ((m.id = any(v_part)
          and (e.rol = 'todos' or (e.rol = 'autor' and m.id = v_autor) or (e.rol = 'acompanante' and m.id <> v_autor)))
      or (m.id = any(v_ayud) and e.rol = 'ayudante'))
    and case e.registro
          when 'oficiales' then m.categoria in ('comandantes', 'oficiales')
          when 'suboficiales' then m.categoria = 'suboficiales'
          when 'elites' then coalesce(m.elite, '') <> ''
          when 'bu' then en_plantel_bu(m.id, extract(year from p_fecha)::int, extract(month from p_fecha)::int)
          else false end;
  perform aplicar_efectos(v_efectos, 1);
  insert into actividades (tipo, fecha, hora, link, notas, autor_perfil, autor_miembro, participantes, ayudantes, efectos, especializacion)
  values (p_tipo, p_fecha, coalesce(p_hora, ''), trim(p_link), coalesce(p_notas, ''), auth.uid(), v_autor, v_part, v_ayud, v_efectos, v_esp)
  returning * into v_fila;
  return v_fila;
exception
  when unique_violation then raise exception 'Ese link de informe ya fue cargado en otra actividad.';
end $$;
revoke all on function public.registrar_actividad(text, date, text, text, text, bigint[], text, bigint[]) from public, anon;
grant execute on function public.registrar_actividad(text, date, text, text, text, bigint[], text, bigint[]) to authenticated;

-- ---------- Ascensos → BU
alter table ascensos_revisiones add column if not exists efectos_bu jsonb;   -- lo que sumó en la BU (null = todavía nada)

create table if not exists bu_pendientes (
  id           bigserial primary key,
  revision_id  bigint not null references ascensos_revisiones(id) on delete cascade,
  informe      text not null default '',
  link         text not null default '',
  columna      text not null check (columna in ('misiones', 'ent_bu_part')),
  anio         int not null,
  mes          int not null check (mes between 1 and 12),
  linea        text not null default '',
  nombre       text not null default '',
  grado        text not null default '',
  alias        text not null default '',
  candidatos   bigint[] not null default '{}',
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'asignado', 'descartado')),
  miembro_id   bigint,
  resuelto_por uuid references perfiles(id) on delete set null,
  resuelto_en  timestamptz,
  creado_en    timestamptz not null default now()
);
create index if not exists bu_pendientes_estado on bu_pendientes(estado);
alter table bu_pendientes enable row level security;
create policy bu_pend_ver on bu_pendientes for select to authenticated using (true);
create policy solo_aprobadas on bu_pendientes as restrictive for all to authenticated
  using ((select public.cuenta_aprobada())) with check ((select public.cuenta_aprobada()));
grant select on bu_pendientes to authenticated;
alter publication supabase_realtime add table bu_pendientes;

-- Proteger revisiones: deja que las funciones del sistema anoten efectos_bu en una verificada,
-- y al volver a "sin verificar" descuenta lo sumado en la BU.
create or replace function asc_proteger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.estado = 'verificada' and not es_admin() and coalesce(current_setting('bd21.sistema', true), '') <> '1' then
    raise exception 'Esta revisión ya está verificada: no se puede modificar.';
  end if;
  new.creado_por := old.creado_por; new.creado_en := old.creado_en;
  if coalesce(current_setting('bd21.sistema', true), '') <> '1' then
    new.actualizado_por := auth.uid(); new.actualizado_en := now();
  end if;
  if new.estado = 'verificada' and old.estado = 'borrador' then
    new.verificado_por := auth.uid(); new.verificado_en := now();
  elsif new.estado = 'borrador' then
    new.verificado_por := null; new.verificado_en := null;
  else
    new.verificado_por := old.verificado_por; new.verificado_en := old.verificado_en;
  end if;
  if old.estado = 'verificada' and new.estado = 'borrador' then
    if old.efectos_bu is not null then perform aplicar_efectos(old.efectos_bu, -1); end if;
    new.efectos_bu := null;
    delete from bu_pendientes where revision_id = old.id;
  end if;
  return new;
end $$;

create or replace function asc_al_borrar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.efectos_bu is not null then perform aplicar_efectos(old.efectos_bu, -1); end if;
  return old;
end $$;
drop trigger if exists asc_al_borrar on ascensos_revisiones;
create trigger asc_al_borrar before delete on ascensos_revisiones for each row execute function asc_al_borrar();

-- Suma en la BU lo que sale de una revisión verificada (una sola vez). p_efectos: [{miembro_id, anio, mes, columna}]
create or replace function public.aplicar_bu_revision(p_revision bigint, p_efectos jsonb, p_pendientes jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v ascensos_revisiones; v_ef jsonb;
begin
  if not cuenta_aprobada() then raise exception 'No tenés permiso para hacer esto.'; end if;
  select * into v from ascensos_revisiones where id = p_revision for update;
  if not found then raise exception 'No existe esa revisión.'; end if;
  if v.estado <> 'verificada' then raise exception 'La revisión todavía no está verificada.'; end if;
  if v.efectos_bu is not null then return 0; end if;

  select coalesce(jsonb_agg(distinct jsonb_build_object('categoria', 'bu', 'anio', (e->>'anio')::int, 'mes', (e->>'mes')::int,
           'periodo', '', 'miembro_id', (e->>'miembro_id')::bigint, 'columna', e->>'columna')), '[]')
    into v_ef
    from jsonb_array_elements(coalesce(p_efectos, '[]')) e
   where e->>'columna' in ('misiones', 'ent_bu_part')
     and en_plantel_bu((e->>'miembro_id')::bigint, (e->>'anio')::int, (e->>'mes')::int);
  perform aplicar_efectos(v_ef, 1);

  perform set_config('bd21.sistema', '1', true);
  update ascensos_revisiones set efectos_bu = v_ef where id = p_revision;
  perform set_config('bd21.sistema', '', true);

  insert into bu_pendientes (revision_id, informe, link, columna, anio, mes, linea, nombre, grado, alias, candidatos)
  select p_revision, left(coalesce(x->>'informe', ''), 200), left(coalesce(x->>'link', ''), 300), x->>'columna',
         (x->>'anio')::int, (x->>'mes')::int, left(coalesce(x->>'linea', ''), 200), left(coalesce(x->>'nombre', ''), 80),
         left(coalesce(x->>'grado', ''), 10), left(coalesce(x->>'alias', ''), 80),
         coalesce((select array_agg(c::bigint) from jsonb_array_elements_text(x->'candidatos') c), '{}')
    from jsonb_array_elements(coalesce(p_pendientes, '[]')) x
   where x->>'columna' in ('misiones', 'ent_bu_part');
  return jsonb_array_length(v_ef);
end $$;
revoke all on function public.aplicar_bu_revision(bigint, jsonb, jsonb) from public, anon;
grant execute on function public.aplicar_bu_revision(bigint, jsonb, jsonb) to authenticated;

-- Resolver un dato confuso: asignarlo a alguien (suma +1) o descartarlo (p_miembro null)
create or replace function public.resolver_pendiente_bu(p_id bigint, p_miembro bigint) returns void
language plpgsql security definer set search_path = public as $$
declare p bu_pendientes; v_ef jsonb;
begin
  if not puede_editar() then raise exception 'No tenés permiso para hacer esto.'; end if;
  select * into p from bu_pendientes where id = p_id for update;
  if not found then raise exception 'Ese dato ya no existe.'; end if;
  if p.estado <> 'pendiente' then raise exception 'Ese dato ya fue resuelto.'; end if;
  if p_miembro is not null then
    if not exists (select 1 from miembros where id = p_miembro) and not exists (select 1 from tropas where id = p_miembro) then
      raise exception 'No existe esa persona.';
    end if;
    v_ef := jsonb_build_array(jsonb_build_object('categoria', 'bu', 'anio', p.anio, 'mes', p.mes, 'periodo', '',
                                                 'miembro_id', p_miembro, 'columna', p.columna));
    perform aplicar_efectos(v_ef, 1);
    perform set_config('bd21.sistema', '1', true);
    update ascensos_revisiones set efectos_bu = coalesce(efectos_bu, '[]') || v_ef where id = p.revision_id;
    perform set_config('bd21.sistema', '', true);
  end if;
  update bu_pendientes set estado = case when p_miembro is null then 'descartado' else 'asignado' end,
         miembro_id = p_miembro, resuelto_por = auth.uid(), resuelto_en = now()
   where id = p_id;
end $$;
revoke all on function public.resolver_pendiente_bu(bigint, bigint) from public, anon;
grant execute on function public.resolver_pendiente_bu(bigint, bigint) to authenticated;
