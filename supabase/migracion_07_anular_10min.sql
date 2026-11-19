-- Migración 07: quien cargó una actividad puede anularla solo durante 10 minutos.
-- Después, solo la puede anular un comandante (cuenta vinculada a un miembro de categoría "comandantes") o un administrador.

create or replace function es_comandante() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles p join miembros m on m.id = p.miembro_id
    where p.id = auth.uid() and m.categoria = 'comandantes'
  );
$$;
grant execute on function es_comandante() to authenticated;

create or replace function anular_actividad(p_id bigint) returns actividades
language plpgsql security definer set search_path = public as $$
declare v_fila actividades;
begin
  select * into v_fila from actividades where id = p_id for update;
  if not found then raise exception 'La actividad no existe.'; end if;
  if v_fila.anulada then raise exception 'La actividad ya estaba anulada.'; end if;
  if not (es_admin() or es_comandante()) then
    if v_fila.autor_perfil is distinct from auth.uid() then
      raise exception 'Solo quien la cargó (en los primeros 10 minutos) o un comandante puede anularla.';
    end if;
    if now() - v_fila.creado_en > interval '10 minutes' then
      raise exception 'Pasaron más de 10 minutos desde que la cargaste. Pedile a un comandante que la anule.';
    end if;
  end if;
  perform aplicar_efectos(v_fila.efectos, -1);
  update actividades set anulada = true, anulada_por = auth.uid(), anulada_en = now() where id = p_id returning * into v_fila;
  return v_fila;
end $$;
