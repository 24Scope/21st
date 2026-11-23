-- Migración 17: orden manual de los miembros dentro de cada rango.
-- Rango Scope (es_admin) puede arrastrar nombres en el modo de orden; todas las listas ordenan por
-- rango, después por este número y después por nombre.

alter table miembros add column if not exists orden integer;

-- Recibe [{ "id": 1, "orden": 10 }, ...] y actualiza todo junto. Solo Rango Scope.
create or replace function ordenar_miembros(p_orden jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then
    raise exception 'Solo Rango Scope puede cambiar el orden.';
  end if;
  update miembros m set orden = (x->>'orden')::int
  from jsonb_array_elements(p_orden) x
  where m.id = (x->>'id')::bigint;
end $$;

revoke all on function ordenar_miembros(jsonb) from public;
grant execute on function ordenar_miembros(jsonb) to authenticated;
