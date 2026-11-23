-- Migración 20:
--  * La tabla tropas no tenía permisos para las cuentas (las políticas existían, pero faltaba el GRANT).
--  * Rango de la web: automático (según el rango in-game) o fijado a mano por Rango Scope (rango_manual).
--  * Rango Scope puede borrar cuentas.

grant select, insert, update, delete on public.tropas to authenticated;

alter table public.perfiles add column if not exists rango_manual boolean not null default false;
update public.perfiles set rango_manual = true where rango >= 8;

create or replace function public.perfil_rango_automatico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.rango >= 8 then new.rango_manual := true; end if;   -- Rango Scope siempre es manual
  if new.miembro_id is not null and new.estado = 'aprobada' and not new.rango_manual then
    select rango_web(grado, elite) into new.rango from miembros where id = new.miembro_id;
  end if;
  return new;
end $$;

create or replace function public.miembro_sincronizar_cuenta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.grado is distinct from old.grado or new.elite is distinct from old.elite then
    update perfiles set rango = rango_web(new.grado, new.elite)
     where miembro_id = new.id and estado = 'aprobada' and not rango_manual;
  end if;
  return new;
end $$;

-- Al aprobar una cuenta el rango arranca automático
create or replace function public.aprobar_cuenta_reset_manual() returns trigger
language plpgsql as $$
begin
  if old.estado is distinct from 'aprobada' and new.estado = 'aprobada' and new.rango < 8 then new.rango_manual := false; end if;
  return new;
end $$;
drop trigger if exists aa_aprobar_cuenta_reset_manual on public.perfiles;
create trigger aa_aprobar_cuenta_reset_manual before update on public.perfiles
  for each row execute function public.aprobar_cuenta_reset_manual();

-- Borrar una cuenta (solo Rango Scope). El miembro de la legión no se borra: queda sin cuenta.
create or replace function public.borrar_cuenta(p_perfil uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not es_admin() then raise exception 'No tenés permiso para hacer esto.'; end if;
  if p_perfil = auth.uid() then raise exception 'No podés borrar tu propia cuenta.'; end if;
  if (select rango from perfiles where id = p_perfil) >= 8
     and (select count(*) from perfiles where rango >= 8 and estado = 'aprobada') <= 1 then
    raise exception 'Tiene que quedar al menos una cuenta con Rango Scope.';
  end if;
  delete from auth.users where id = p_perfil;   -- el perfil se borra en cascada
end $$;
revoke all on function public.borrar_cuenta(uuid) from public, anon;
grant execute on function public.borrar_cuenta(uuid) to authenticated;
