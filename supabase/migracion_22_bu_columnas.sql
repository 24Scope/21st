-- Migración 22: planilla de BU.
--  * "Misiones 21st" y "Misiones BU" se unifican en una sola columna "Misiones" (se suman los valores).
--  * Registrar actividad completa la BU: Misión → Misiones; Entrenamiento BU → entrenador (quien lo registra) y
--    participante (el acompañante); Try BU → organizador y ayudas (como ya estaba).
--  * Solo suma en la BU a quienes figuran en la planilla de BU de ese mes (o la última cargada antes).

-- ---------- Misiones unificadas
insert into registros (categoria, anio, mes, periodo, miembro_id, columna, valor)
select 'bu', anio, mes, periodo, miembro_id, 'misiones', sum(valor::numeric)::text
  from registros
 where categoria = 'bu' and columna in ('mis_21', 'mis_bu') and valor ~ '^-?[0-9]+(\.[0-9]+)?$'
 group by anio, mes, periodo, miembro_id
having sum(valor::numeric) <> 0
on conflict (categoria, anio, mes, periodo, miembro_id, columna) do update
  set valor = (coalesce(nullif(registros.valor, '')::numeric, 0) + excluded.valor::numeric)::text;
delete from registros where categoria = 'bu' and columna in ('mis_21', 'mis_bu');

-- ---------- ¿Figura en la BU ese mes? (su planilla o, si todavía no se cargó, la última anterior)
create or replace function public.en_plantel_bu(p_miembro bigint, p_anio int, p_mes int) returns boolean
language sql stable security definer set search_path = public as $$
  with ult as (
    select anio, mes from registros
     where categoria = 'bu' and columna = '_plantel' and valor is not null and (anio * 100 + mes) <= p_anio * 100 + p_mes
     order by anio desc, mes desc limit 1)
  select exists (select 1 from registros r join ult on r.anio = ult.anio and r.mes = ult.mes
                  where r.categoria = 'bu' and r.columna = '_plantel' and r.valor is not null and r.miembro_id = p_miembro);
$$;

-- ---------- Tipos de actividad y en qué columna de la BU suman
insert into tipos_actividad (id, nombre, orden, activo) values ('mision', 'Misión', 9, true)
  on conflict (id) do update set activo = true, nombre = excluded.nombre;
delete from tipos_actividad_efectos where registro = 'bu' and tipo in ('mis_21', 'mis_bu', 'ent_bu', 'mision');
insert into tipos_actividad_efectos (tipo, registro, columna, rol) values
  ('mision', 'bu', 'misiones',    'todos'),
  ('ent_bu', 'bu', 'ent_bu_ent',  'autor'),
  ('ent_bu', 'bu', 'ent_bu_part', 'acompanante');

-- ---------- registrar_actividad: la BU solo suma a quienes están en la planilla de BU
do $$
declare d text := pg_get_functiondef('public.registrar_actividad(text,date,text,text,text,bigint[],text)'::regprocedure);
begin
  if position('when ''bu'' then true' in d) = 0 then raise exception 'No se encontró la condición de la BU en registrar_actividad'; end if;
  execute replace(d, 'when ''bu'' then true',
    'when ''bu'' then en_plantel_bu(m.id, extract(year from p_fecha)::int, extract(month from p_fecha)::int)');
end $$;
