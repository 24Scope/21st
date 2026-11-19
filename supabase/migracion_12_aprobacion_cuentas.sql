-- Migración 12: las cuentas nuevas quedan pendientes hasta que un administrador las aprueba.
-- Mientras no esté aprobada, la cuenta solo puede ver su propio perfil: no ve ni edita nada más.

alter table perfiles add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente', 'aprobada', 'rechazada'));
alter table perfiles add column if not exists aprobado_por uuid references perfiles(id) on delete set null;
alter table perfiles add column if not exists aprobado_en timestamptz;

-- Las cuentas que ya existían quedan aprobadas.
update perfiles set estado = 'aprobada', aprobado_en = coalesce(aprobado_en, now()) where estado = 'pendiente';

create or replace function public.cuenta_aprobada() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select estado = 'aprobada' from perfiles where id = auth.uid()), false);
$$;
grant execute on function public.cuenta_aprobada() to authenticated;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rango >= 2 and estado = 'aprobada' from perfiles where id = auth.uid()), false);
$$;

create or replace function public.es_comandante() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles p join miembros m on m.id = p.miembro_id
    where p.id = auth.uid() and p.estado = 'aprobada' and m.categoria = 'comandantes'
  );
$$;

create or replace function public.puede_editar() returns boolean
language sql stable security definer set search_path = public as $$
  select public.cuenta_aprobada() and (
    public.es_admin()
    or coalesce((select (valor)::text = 'true' from ajustes where clave = 'modo_abierto'), false)
  );
$$;

-- La primera cuenta (si la base está vacía) queda aprobada y como Administrador; el resto, pendiente.
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_primera boolean := not exists (select 1 from perfiles);
begin
  insert into perfiles (id, nombre, email, rango, estado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when v_primera then 2 else 1 end,
    case when v_primera then 'aprobada' else 'pendiente' end
  );
  return new;
end $$;

-- Reglas restrictivas: se suman a las existentes y exigen cuenta aprobada en todas las tablas.
do $$
declare t text;
begin
  foreach t in array array['ajustes','miembros','registros','eventos','reglamento','actividades',
                           'tipos_actividad','tipos_actividad_efectos','inactividades','foro_temas','foro_comentarios'] loop
    execute format('drop policy if exists "solo_aprobadas" on public.%I', t);
    execute format('create policy "solo_aprobadas" on public.%I as restrictive for all to authenticated
                    using (public.cuenta_aprobada()) with check (public.cuenta_aprobada())', t);
  end loop;
end $$;

-- Perfiles: una cuenta pendiente solo ve el suyo.
drop policy if exists "solo_aprobadas" on public.perfiles;
create policy "solo_aprobadas" on public.perfiles as restrictive for select to authenticated
  using (public.cuenta_aprobada() or id = auth.uid());

-- Registrar actividad (función con permisos propios): exige cuenta aprobada.
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.registrar_actividad(text,date,text,text,text,bigint[])'::regprocedure) into v_def;
  if position('estado = ''aprobada''' in v_def) = 0 then
    v_def := replace(v_def, 'select miembro_id into v_autor from perfiles where id = auth.uid();',
                            'select miembro_id into v_autor from perfiles where id = auth.uid() and estado = ''aprobada'';');
    execute v_def;
  end if;
end $$;

alter publication supabase_realtime add table perfiles;
