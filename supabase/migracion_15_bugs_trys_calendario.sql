-- Migración 15:
--  * El foro de administración pasa a ser "Reporte de bugs": lo leen y escriben todas las cuentas aprobadas.
--    Cada uno edita lo suyo; borrar: el autor o Rango Scope; fijar: solo Rango Scope.
--  * Registrar actividad: Try 21st y Try de especialización no admiten acompañantes; la Try de especialización
--    guarda de qué especialización fue (ASE/APE/RNE). Un élite que no es comandante solo puede elegir la suya.
--  * Calendario: no se pueden cargar eventos en una fecha/hora que ya pasó.

-- ---------- Reporte de bugs
drop policy if exists foro_temas_ver    on foro_temas;
drop policy if exists foro_temas_crear  on foro_temas;
drop policy if exists foro_temas_editar on foro_temas;
drop policy if exists foro_temas_borrar on foro_temas;
drop policy if exists foro_com_ver      on foro_comentarios;
drop policy if exists foro_com_crear    on foro_comentarios;
drop policy if exists foro_com_editar   on foro_comentarios;
drop policy if exists foro_com_borrar   on foro_comentarios;

create policy foro_temas_ver    on foro_temas for select to authenticated using (true);
create policy foro_temas_crear  on foro_temas for insert to authenticated with check (autor = auth.uid() and (fijado = false or es_admin()));
create policy foro_temas_editar on foro_temas for update to authenticated using (autor = auth.uid() or es_admin()) with check (autor = auth.uid() or es_admin());
create policy foro_temas_borrar on foro_temas for delete to authenticated using (autor = auth.uid() or es_admin());

create policy foro_com_ver    on foro_comentarios for select to authenticated using (true);
create policy foro_com_crear  on foro_comentarios for insert to authenticated with check (autor = auth.uid());
create policy foro_com_editar on foro_comentarios for update to authenticated using (autor = auth.uid()) with check (autor = auth.uid());
create policy foro_com_borrar on foro_comentarios for delete to authenticated using (autor = auth.uid() or es_admin());

create or replace function foro_proteger_tema() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.titulo is distinct from old.titulo or new.texto is distinct from old.texto) then
    if old.autor is distinct from auth.uid() then raise exception 'Solo quien escribió el tema puede editarlo.'; end if;
    new.editado_en := now();
  end if;
  if new.fijado is distinct from old.fijado and not es_admin() then raise exception 'Solo Rango Scope puede fijar temas.'; end if;
  new.autor := old.autor; new.creado_en := old.creado_en;
  return new;
end $$;

-- ---------- Registrar actividad
alter table actividades add column if not exists especializacion text check (especializacion in ('ASE', 'APE', 'RNE'));

drop function if exists public.registrar_actividad(text, date, text, text, text, bigint[]);
create or replace function public.registrar_actividad(p_tipo text, p_fecha date, p_hora text, p_link text, p_notas text,
                                                      p_acompanantes bigint[], p_especializacion text default null)
returns actividades language plpgsql security definer set search_path = public as $$
declare v_autor bigint; v_yo miembros; v_part bigint[]; v_efectos jsonb; v_fila actividades; v_max int; v_malos text; v_esp text;
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

  -- Las trys se registran solo a nombre de quien las hizo
  if p_tipo in ('try_21', 'try_esp') and cardinality(coalesce(p_acompanantes, '{}')) > 0 then
    raise exception 'En una try no se puede marcar a nadie más.';
  end if;

  -- Especialización de la try
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

  select coalesce(jsonb_agg(jsonb_build_object(
      'categoria', e.registro, 'anio', extract(year from p_fecha)::int, 'mes', extract(month from p_fecha)::int,
      'periodo', '', 'miembro_id', m.id, 'columna', e.columna)), '[]')
  into v_efectos
  from miembros m join tipos_actividad_efectos e on e.tipo = p_tipo
  where m.id = any(v_part)
    and (e.rol = 'todos' or (e.rol = 'autor' and m.id = v_autor) or (e.rol = 'acompanante' and m.id <> v_autor))
    and case e.registro
          when 'oficiales' then m.categoria in ('comandantes', 'oficiales')
          when 'suboficiales' then m.categoria = 'suboficiales'
          when 'elites' then coalesce(m.elite, '') <> ''
          when 'bu' then true else false end;
  perform aplicar_efectos(v_efectos, 1);
  insert into actividades (tipo, fecha, hora, link, notas, autor_perfil, autor_miembro, participantes, efectos, especializacion)
  values (p_tipo, p_fecha, coalesce(p_hora, ''), trim(p_link), coalesce(p_notas, ''), auth.uid(), v_autor, v_part, v_efectos, v_esp)
  returning * into v_fila;
  return v_fila;
exception
  when unique_violation then raise exception 'Ese link de informe ya fue cargado en otra actividad.';
end $$;
revoke all on function public.registrar_actividad(text, date, text, text, text, bigint[], text) from public, anon;
grant execute on function public.registrar_actividad(text, date, text, text, text, bigint[], text) to authenticated;

-- ---------- Calendario: nada en el pasado (hora de Argentina; 5 minutos de margen)
create or replace function eventos_no_pasado() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ahora timestamp := (now() at time zone 'America/Argentina/Buenos_Aires') - interval '5 minutes';
        v_cuando timestamp; v_m bigint;
begin
  -- Quien crea el evento siempre figura entre los que lo programan
  if tg_op = 'INSERT' then
    select miembro_id into v_m from perfiles where id = auth.uid();
    if v_m is not null and not (v_m = any(coalesce(new.organizadores, '{}'))) then new.organizadores := array_prepend(v_m, coalesce(new.organizadores, '{}')); end if;
  end if;
  if tg_op = 'UPDATE' and new.fecha = old.fecha and coalesce(new.hora, '') = coalesce(old.hora, '') then return new; end if;
  if coalesce(new.hora, '') ~ '^\d{1,2}:\d{2}' then v_cuando := new.fecha + substring(new.hora from '^\d{1,2}:\d{2}')::time;
  else v_cuando := new.fecha + time '23:59'; end if;
  if v_cuando < v_ahora then raise exception 'No se pueden programar eventos en una fecha u hora que ya pasó.'; end if;
  return new;
end $$;
drop trigger if exists eventos_no_pasado on eventos;
create trigger eventos_no_pasado before insert or update on eventos for each row execute function eventos_no_pasado();
