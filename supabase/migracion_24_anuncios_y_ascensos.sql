-- Migración 24:
--  * Anuncios: se ven en el Inicio y en su propia página (a la que solo se entra desde el Inicio).
--    Por ahora solo se leen; publicar queda para más adelante (de momento solo el Administrador Web desde la base).
--  * Cambio de rango desde Miembros de la legión:
--      - Comandantes (rango web 6): solo a quienes están por debajo de Comandante, y sin llevarlos a Comandante o más.
--      - Mariscales (7) y Administrador Web (8): a cualquiera.
--      - Nadie se cambia el rango a sí mismo (salvo el Administrador Web).

-- ---------- Anuncios
create table if not exists public.anuncios (
  id           bigint generated always as identity primary key,
  titulo       text not null check (length(titulo) between 1 and 120),
  cuerpo       text not null default '' check (length(cuerpo) <= 5000),
  autor_perfil uuid references public.perfiles(id) on delete set null,
  autor_nombre text not null default '',
  fijado       boolean not null default false,
  creado_en    timestamptz not null default now()
);
alter table public.anuncios enable row level security;
grant select, insert, update, delete on public.anuncios to authenticated;
drop policy if exists solo_aprobadas on public.anuncios;
create policy solo_aprobadas on public.anuncios as restrictive for all to authenticated
  using ((select cuenta_aprobada())) with check ((select cuenta_aprobada()));
drop policy if exists leer on public.anuncios;
create policy leer on public.anuncios for select to authenticated using (true);
drop policy if exists escribir on public.anuncios;
create policy escribir on public.anuncios for all to authenticated using ((select es_admin())) with check ((select es_admin()));

insert into public.anuncios (titulo, cuerpo, autor_nombre, fijado)
select '¡Bienvenidos al Panel de control 21st!',
'Este es el panel de gestión de la legión. En pocas palabras, esto es lo que podés hacer:

• Inicio: los anuncios, las próximas actividades y las últimas actividades registradas.
• Mi perfil: tus datos, tu modelo del escalafón y el resumen de tu actividad del mes.
• Escalafón militar: la cadena de mando de la legión, con la ficha de cada uno.
• Calendario: las actividades programadas.
• Registrar actividad: cargá entrenamientos, roles, trys y demás con el link del informe de Discord; se suman solas a las planillas.
• Informar inactividad: avisá cuándo no vas a poder estar.
• Reporte de bugs: si algo no funciona, contalo ahí.

Cualquier duda, consultá con la Comandancia.', 'Comandancia 21st', true
where not exists (select 1 from public.anuncios);

-- ---------- Cambio de rango
create or replace function public.cambiar_grado_miembro(p_miembro bigint, p_grado text) returns public.miembros
language plpgsql security definer set search_path = public as $$
declare
  yo perfiles; m miembros; g text := trim(coalesce(p_grado, '')); r miembros;
begin
  select * into yo from perfiles where id = auth.uid() and estado = 'aprobada';
  if yo.id is null or not cuenta_aprobada() then raise exception 'Tu cuenta no está habilitada.'; end if;
  if yo.rango < 6 then raise exception 'Solo los Comandantes en adelante pueden cambiar rangos.'; end if;
  select * into m from miembros where id = p_miembro for update;
  if m.id is null then raise exception 'Ese miembro no existe.'; end if;
  if categoria_de_grado(g) is null then raise exception 'Rango desconocido: %', g; end if;
  if not es_de_legion(g, m.elite) then
    raise exception 'Con ese rango dejaría de ser miembro de la legión (solo de Sargento en adelante, o élites).';
  end if;
  if m.id = yo.miembro_id and yo.rango < 8 then raise exception 'No podés cambiarte el rango a vos mismo.'; end if;
  if yo.rango < 7 and (categoria_de_grado(m.grado) = 'comandantes' or categoria_de_grado(g) = 'comandantes') then
    raise exception 'El rango de Comandante en adelante solo lo puede cambiar un Mariscal.';
  end if;
  if upper(regexp_replace(g, '\s', '', 'g')) = upper(regexp_replace(coalesce(m.grado, ''), '\s', '', 'g')) then return m; end if;
  update miembros set grado = g, categoria = categoria_de_grado(g), fecha_rango = current_date
   where id = m.id returning * into r;
  return r;
end $$;
revoke all on function public.cambiar_grado_miembro(bigint, text) from public, anon;
grant execute on function public.cambiar_grado_miembro(bigint, text) to authenticated;
