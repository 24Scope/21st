-- Migración 30: horarios del Calendario.
--  * Una actividad dura como máximo 2 horas.
--  * No se puede reclamar un horario que se superpone con otra actividad ya programada.
--  Se controla solo cuando se crea una actividad o se le cambia la fecha o el horario.

-- Rango horario de una actividad. Si la hora de fin es menor que la de inicio, termina al día siguiente.
-- Las viejas sin hora de fin se toman como de 2 horas.
create or replace function public.rango_evento(p_fecha date, p_hora text, p_hora_fin text) returns tsrange
language sql immutable as $$
  select case when coalesce(p_hora, '') !~ '^\d{1,2}:\d{2}' then null else
    tsrange(p_fecha + substring(p_hora from '^\d{1,2}:\d{2}')::time,
            case when coalesce(p_hora_fin, '') ~ '^\d{1,2}:\d{2}$' then
                   p_fecha + p_hora_fin::time
                   + case when p_hora_fin::time <= substring(p_hora from '^\d{1,2}:\d{2}')::time then interval '1 day' else interval '0' end
                 else p_fecha + substring(p_hora from '^\d{1,2}:\d{2}')::time + interval '2 hours' end, '[)') end;
$$;

create or replace function public.eventos_horario_valido() returns trigger
language plpgsql security definer set search_path = public as $$
declare r tsrange; otro eventos;
begin
  if tg_op = 'UPDATE' and new.fecha = old.fecha and coalesce(new.hora, '') = coalesce(old.hora, '')
     and coalesce(new.hora_fin, '') = coalesce(old.hora_fin, '') then return new; end if;
  r := rango_evento(new.fecha, new.hora, new.hora_fin);
  if r is null then return new; end if;
  if upper(r) - lower(r) > interval '2 hours' then
    raise exception 'Una actividad puede durar como máximo 2 horas.';
  end if;
  perform pg_advisory_xact_lock(hashtext('eventos_horario'));   -- dos reclamos al mismo tiempo no pasan los dos
  select * into otro from eventos e
   where e.id is distinct from new.id and rango_evento(e.fecha, e.hora, e.hora_fin) && r
   order by e.fecha, e.hora limit 1;
  if otro.id is not null then
    raise exception 'Ese horario ya está reclamado por "%" (% de % a %).', otro.titulo,
      to_char(otro.fecha, 'DD/MM'), otro.hora, coalesce(otro.hora_fin, '?');
  end if;
  return new;
end $$;

drop trigger if exists eventos_horario_valido on public.eventos;
create trigger eventos_horario_valido before insert or update on public.eventos
  for each row execute function public.eventos_horario_valido();
