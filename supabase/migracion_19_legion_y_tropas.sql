-- Migración 19: la Legión (miembros) queda solo con élites y de Sargento para arriba.
--  * Soldados y cabos sin élite pasan a la tabla "tropas" (solo para planillas: Actividad BU, Ascensos de tropas, etc.).
--    Comparten la numeración de ids con miembros, así el historial de registros sigue apuntando a la misma persona
--    y, cuando una tropa sube a la Legión, se mueve con el mismo id y conserva todo su historial.
--  * El rango de la web sale solo del rango in-game (Rango Scope es el único que se asigna a mano).
--  * Aprobar una cuenta crea o pasa a la Legión al miembro y lo vincula, todo en un paso.
--  * Un miembro dado de baja (inactivo) no puede entrar al panel.

-- ---------- Rango web según el rango in-game
create or replace function public.categoria_de_grado(p_grado text) returns text
language sql immutable as $$
  select case
    when g in ('SDO', 'SDO2', 'SDO1') then 'soldados'
    when g in ('CBO', 'CBO2', 'CBO1', 'CBOM') then 'cabos'
    when g in ('SGT', 'SGT2', 'SGT1', 'SGTM') then 'suboficiales'
    when g in ('STTE', 'TTE', 'TTE2', 'TTE1', 'CPT', 'CPT1', 'CPTM') then 'oficiales'
    when g in ('CMD', 'CMD1', 'CMDM', 'CMDB', 'MRL') then 'comandantes'
  end from (select upper(regexp_replace(coalesce(p_grado, ''), '[°º\s]', '', 'g')) g) x;
$$;

create or replace function public.es_elite(p_elite text) returns boolean
language sql immutable as $$ select coalesce(p_elite, '') in ('RNE', 'ASE', 'APE', 'ARC'); $$;

-- ¿Corresponde a la Legión? (Sargento para arriba, o élite)
create or replace function public.es_de_legion(p_grado text, p_elite text) returns boolean
language sql immutable as $$
  select coalesce(public.categoria_de_grado(p_grado) in ('suboficiales', 'oficiales', 'comandantes'), false) or public.es_elite(p_elite);
$$;

create or replace function public.rango_web(p_grado text, p_elite text) returns integer
language sql immutable as $$
  select case
    when g = 'MRL' then 7
    when public.categoria_de_grado(g) = 'comandantes' then 6
    when g like 'CPT%' then 5
    when public.categoria_de_grado(g) = 'oficiales' then 4
    when public.categoria_de_grado(g) = 'suboficiales' then 3
    when public.es_elite(p_elite) then 2
    else 1
  end from (select upper(regexp_replace(coalesce(p_grado, ''), '[°º\s]', '', 'g')) g) x;
$$;

-- ---------- Tabla de tropas (misma estructura que miembros, misma numeración)
create table if not exists public.tropas (like public.miembros including defaults including constraints);
alter table public.tropas alter column id set default nextval(pg_get_serial_sequence('public.miembros', 'id'));
alter table public.tropas add primary key (id);
do $$ begin execute format('grant usage on sequence %s to authenticated', pg_get_serial_sequence('public.miembros', 'id')); end $$;

alter table public.tropas enable row level security;
create policy "leer"      on public.tropas for select to authenticated using (true);
create policy "insertar"  on public.tropas for insert to authenticated with check (public.puede_editar());
create policy "modificar" on public.tropas for update to authenticated using (public.puede_editar()) with check (public.puede_editar());
create policy "borrar"    on public.tropas for delete to authenticated using (public.puede_editar());
create policy "solo_aprobadas" on public.tropas as restrictive for all to authenticated using (public.cuenta_aprobada()) with check (public.cuenta_aprobada());
alter publication supabase_realtime add table public.tropas;

-- ---------- Registros: pueden ser de un miembro o de una tropa
alter table public.registros drop constraint if exists registros_miembro_id_fkey;

create or replace function public.registros_persona_existe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from miembros where id = new.miembro_id) and not exists (select 1 from tropas where id = new.miembro_id) then
    raise exception 'No existe ese miembro ni esa tropa (id %).', new.miembro_id;
  end if;
  return new;
end $$;
drop trigger if exists registros_persona_existe on public.registros;
create trigger registros_persona_existe before insert or update of miembro_id on public.registros
  for each row execute function public.registros_persona_existe();

-- Al borrar a alguien se borran sus registros, salvo que siga existiendo en la otra tabla (pasó de tropa a Legión o al revés)
create or replace function public.borrar_registros_persona() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from miembros where id = old.id) and not exists (select 1 from tropas where id = old.id) then
    delete from registros where miembro_id = old.id;
  end if;
  return old;
end $$;
drop trigger if exists borrar_registros_persona on public.miembros;
create trigger borrar_registros_persona after delete on public.miembros for each row execute function public.borrar_registros_persona();
drop trigger if exists borrar_registros_persona on public.tropas;
create trigger borrar_registros_persona after delete on public.tropas for each row execute function public.borrar_registros_persona();

-- ---------- Se mueven a tropas los soldados y cabos sin élite
insert into public.tropas select * from public.miembros where not public.es_de_legion(grado, elite);
update public.perfiles set miembro_id = null where miembro_id in (select id from public.tropas);
delete from public.miembros where id in (select id from public.tropas);

-- ---------- Rango web automático
-- Las cuentas vinculadas toman el rango de su miembro. Rango Scope (8) se mantiene si se lo dio un administrador.
create or replace function public.perfil_rango_automatico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.miembro_id is not null and new.estado = 'aprobada' and new.rango <> 8 then
    select rango_web(grado, elite) into new.rango from miembros where id = new.miembro_id;
  end if;
  return new;
end $$;
drop trigger if exists perfil_rango_automatico on public.perfiles;
create trigger perfil_rango_automatico before insert or update on public.perfiles
  for each row execute function public.perfil_rango_automatico();

-- Si cambia el rango in-game o la élite, cambia el rango de la web
create or replace function public.miembro_sincronizar_cuenta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.grado is distinct from old.grado or new.elite is distinct from old.elite then
    update perfiles set rango = rango_web(new.grado, new.elite)
     where miembro_id = new.id and estado = 'aprobada' and rango <> 8;
  end if;
  return new;
end $$;
drop trigger if exists miembro_sincronizar_cuenta on public.miembros;
create trigger miembro_sincronizar_cuenta after update on public.miembros
  for each row execute function public.miembro_sincronizar_cuenta();

update public.perfiles set rango = rango where miembro_id is not null;   -- recalcula las cuentas ya vinculadas

-- ---------- Baja: un miembro inactivo no entra al panel (salvo Rango Scope, para no quedar afuera)
create or replace function public.cuenta_de_baja() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.rango < 8 and m.activo = false from perfiles p join miembros m on m.id = p.miembro_id where p.id = auth.uid()), false);
$$;
grant execute on function public.cuenta_de_baja() to authenticated;

create or replace function public.cuenta_aprobada() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select estado = 'aprobada' from perfiles where id = auth.uid()), false) and not public.cuenta_de_baja();
$$;

-- ---------- Aprobar una cuenta: en un paso crea (o pasa de tropa a Legión) al miembro, lo vincula y le da su rango
-- p_miembro: null = miembro nuevo con los datos que declaró; id de un miembro o de una tropa.
create or replace function public.aprobar_cuenta(p_perfil uuid, p_miembro bigint, p_grado text, p_elite text)
returns perfiles language plpgsql security definer set search_path = public as $$
declare v perfiles; v_id bigint; v_grado text := upper(trim(coalesce(p_grado, ''))); v_elite text := coalesce(nullif(trim(p_elite), ''), '');
begin
  if not es_admin() then raise exception 'No tenés permiso para hacer esto.'; end if;
  select * into v from perfiles where id = p_perfil for update;
  if not found then raise exception 'No existe esa cuenta.'; end if;
  if v.estado <> 'pendiente' then raise exception 'Esa cuenta no está pendiente de aprobación.'; end if;
  if categoria_de_grado(v_grado) is null then raise exception 'Elegí el rango en la legión.'; end if;
  if v_elite <> '' and not es_elite(v_elite) then raise exception 'Élite no válida.'; end if;

  if p_miembro is null then
    if coalesce(trim(v.decl_clon), '') = '' then raise exception 'La cuenta no declaró su nombre de clon.'; end if;
    insert into miembros (nombre, grado, categoria, nombre_jedi, discord_id, elite, activo)
    values (trim(v.decl_clon), v_grado, categoria_de_grado(v_grado), coalesce(v.decl_jedi, ''), coalesce(v.decl_discord, ''), v_elite, true)
    returning id into v_id;
  elsif exists (select 1 from tropas where id = p_miembro) then
    insert into miembros overriding system value select * from tropas where id = p_miembro;
    delete from tropas where id = p_miembro;
    v_id := p_miembro;
  elsif exists (select 1 from miembros where id = p_miembro) then
    v_id := p_miembro;
  else
    raise exception 'No existe ese miembro.';
  end if;

  if exists (select 1 from perfiles where miembro_id = v_id and id <> p_perfil) then
    raise exception 'Ese miembro ya está vinculado a otra cuenta.';
  end if;

  update miembros set grado = v_grado, categoria = categoria_de_grado(v_grado), activo = true,
         elite = case when v_elite <> '' then v_elite else elite end,
         discord_id  = case when coalesce(discord_id, '') = ''  then coalesce(v.decl_discord, '') else discord_id end,
         nombre_jedi = case when coalesce(nombre_jedi, '') = '' then coalesce(v.decl_jedi, '')    else nombre_jedi end
   where id = v_id;
  if not exists (select 1 from miembros where id = v_id and es_de_legion(grado, elite)) then
    raise exception 'Solo se aprueban cuentas de élites o de Sargento para arriba.';
  end if;

  update perfiles set estado = 'aprobada', miembro_id = v_id, rango = 1, aprobado_por = auth.uid(), aprobado_en = now()
   where id = p_perfil returning * into v;
  return v;
end $$;
revoke all on function public.aprobar_cuenta(uuid, bigint, text, text) from public, anon;
grant execute on function public.aprobar_cuenta(uuid, bigint, text, text) to authenticated;
