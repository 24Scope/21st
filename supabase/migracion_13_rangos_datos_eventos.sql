-- Migración 13:
--  * Rangos de la web: 0 Pendiente, 1 Invitado, 2 Élite, 3 Sub-Oficial, 4 Oficial, 5 Capitán, 6 Comandante,
--    7 Mariscal, 8 Rango Scope (administración). Los administradores (antes 2) pasan a 8.
--  * Cuentas nuevas: primero completan sus datos in-game (estado 'datos') y después quedan pendientes de aprobación.
--  * Calendario: quiénes programaron cada evento.

-- ---------- Rangos
update perfiles set rango = 8 where rango = 2;
update perfiles set rango = 0 where estado <> 'aprobada';

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rango >= 8 and estado = 'aprobada' from perfiles where id = auth.uid()), false);
$$;

-- ---------- Datos que declara quien se registra
alter table perfiles drop constraint if exists perfiles_estado_check;
alter table perfiles add constraint perfiles_estado_check check (estado in ('datos', 'pendiente', 'aprobada', 'rechazada'));
alter table perfiles alter column estado set default 'datos';
alter table perfiles alter column rango set default 0;
alter table perfiles add column if not exists decl_grado   text;
alter table perfiles add column if not exists decl_clon    text;
alter table perfiles add column if not exists decl_jedi    text;
alter table perfiles add column if not exists decl_discord text;

create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_primera boolean := not exists (select 1 from perfiles);
begin
  insert into perfiles (id, nombre, email, rango, estado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when v_primera then 8 else 0 end,
    case when v_primera then 'aprobada' else 'datos' end
  );
  return new;
end $$;

-- La cuenta nueva completa sus datos una vez; con eso pasa a "pendiente de aprobación".
create or replace function public.completar_datos_cuenta(p_grado text, p_clon text, p_jedi text, p_discord text)
returns perfiles language plpgsql security definer set search_path = public as $$
declare v perfiles;
begin
  select * into v from perfiles where id = auth.uid() for update;
  if not found then raise exception 'No hay sesión iniciada.'; end if;
  if v.estado not in ('datos', 'pendiente') then raise exception 'Tu cuenta ya fue revisada por un administrador.'; end if;
  if coalesce(trim(p_grado), '') = '' then raise exception 'Elegí tu rango in-game.'; end if;
  if length(trim(coalesce(p_clon, ''))) not between 2 and 60 then raise exception 'Escribí tu nombre de clon (2 a 60 caracteres).'; end if;
  if length(trim(coalesce(p_jedi, ''))) > 60 then raise exception 'El nombre Jedi es demasiado largo.'; end if;
  if trim(coalesce(p_discord, '')) !~ '^[0-9]{17,20}$' then raise exception 'La Discord ID tiene que ser el número de 17 a 20 cifras.'; end if;
  update perfiles set decl_grado = trim(p_grado), decl_clon = trim(p_clon), decl_jedi = nullif(trim(p_jedi), ''),
                      decl_discord = trim(p_discord), estado = 'pendiente'
   where id = auth.uid() returning * into v;
  return v;
end $$;
revoke all on function public.completar_datos_cuenta(text, text, text, text) from public, anon;
grant execute on function public.completar_datos_cuenta(text, text, text, text) to authenticated;

-- ---------- Calendario: organizadores
alter table eventos add column if not exists organizadores bigint[] not null default '{}';
