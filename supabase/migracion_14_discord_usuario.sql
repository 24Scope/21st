-- Migración 14: el "Discord ID" que se declara al registrarse es el usuario de Discord (texto, ej. agustinto), no el número.
create or replace function public.completar_datos_cuenta(p_grado text, p_clon text, p_jedi text, p_discord text)
returns perfiles language plpgsql security definer set search_path = public as $$
declare v perfiles; v_discord text := regexp_replace(trim(coalesce(p_discord, '')), '^@+', '');
begin
  select * into v from perfiles where id = auth.uid() for update;
  if not found then raise exception 'No hay sesión iniciada.'; end if;
  if v.estado not in ('datos', 'pendiente') then raise exception 'Tu cuenta ya fue revisada por un administrador.'; end if;
  if coalesce(trim(p_grado), '') = '' then raise exception 'Elegí tu rango in-game.'; end if;
  if length(trim(coalesce(p_clon, ''))) not between 2 and 60 then raise exception 'Escribí tu nombre de clon (2 a 60 caracteres).'; end if;
  if length(trim(coalesce(p_jedi, ''))) > 60 then raise exception 'El nombre Jedi es demasiado largo.'; end if;
  if length(v_discord) not between 2 and 40 then raise exception 'Escribí tu usuario de Discord (2 a 40 caracteres).'; end if;
  update perfiles set decl_grado = trim(p_grado), decl_clon = trim(p_clon), decl_jedi = nullif(trim(p_jedi), ''),
                      decl_discord = v_discord, estado = 'pendiente'
   where id = auth.uid() returning * into v;
  return v;
end $$;
