-- Migración 10: reglas de participantes al registrar una actividad.
-- - Se puede marcar a miembros de Sargento en adelante y también a élites de cualquier rango.
-- - Máximo 2 participantes en total (quien carga + 1), salvo Capacitación élite: hasta 3.
-- - En Capacitación élite todos los participantes (incluido quien carga) tienen que tener élite asignada.
create or replace function registrar_actividad(p_tipo text, p_fecha date, p_hora text, p_link text, p_notas text, p_acompanantes bigint[])
returns actividades language plpgsql security definer set search_path = public as $$
declare v_autor bigint; v_part bigint[]; v_efectos jsonb; v_fila actividades; v_max int; v_malos text;
begin
  select miembro_id into v_autor from perfiles where id = auth.uid();
  if v_autor is null then raise exception 'Tu cuenta no está vinculada a un miembro de la legión. Pedile a un administrador que la vincule.'; end if;
  if not exists (select 1 from tipos_actividad where id = p_tipo and activo) then raise exception 'Tipo de actividad inválido.'; end if;
  if p_fecha is null or p_fecha > current_date + 1 then raise exception 'La fecha no puede ser futura.'; end if;
  if p_fecha < current_date - 120 then raise exception 'La fecha es demasiado antigua (más de 120 días).'; end if;
  if coalesce(p_link, '') !~* '^https://([a-z]+\.)?(discord\.com|discordapp\.com)/' then
    raise exception 'El link tiene que ser un enlace de Discord (https://discord.com/...).';
  end if;

  -- Acompañantes: activos y (de Sargento en adelante o élites)
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
  insert into actividades (tipo, fecha, hora, link, notas, autor_perfil, autor_miembro, participantes, efectos)
  values (p_tipo, p_fecha, coalesce(p_hora, ''), trim(p_link), coalesce(p_notas, ''), auth.uid(), v_autor, v_part, v_efectos)
  returning * into v_fila;
  return v_fila;
exception
  when unique_violation then raise exception 'Ese link de informe ya fue cargado en otra actividad.';
end $$;
