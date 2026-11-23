-- Migración 18: cada miembro elige qué modelo se muestra en su retrato (escalafón, perfil, menú).
-- null = automático (icónico > BU > GM). Lo cambia cada uno desde su perfil, solo para su propio miembro.

alter table miembros add column if not exists modelo text
  check (modelo is null or modelo in ('iconico', 'bu', 'gm'));

create or replace function elegir_modelo(p_modelo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_miembro bigint;
begin
  if not cuenta_aprobada() then raise exception 'Tu cuenta todavía no está aprobada.'; end if;
  select miembro_id into v_miembro from perfiles where id = auth.uid();
  if v_miembro is null then raise exception 'Tu cuenta no está vinculada a un miembro de la legión.'; end if;
  if p_modelo is not null and p_modelo not in ('iconico', 'bu', 'gm') then raise exception 'Modelo no válido.'; end if;
  update miembros set modelo = p_modelo where id = v_miembro;
end $$;

revoke all on function elegir_modelo(text) from public;
grant execute on function elegir_modelo(text) to authenticated;
