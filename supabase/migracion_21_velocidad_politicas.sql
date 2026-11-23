-- Migración 21: velocidad. Las políticas llamaban a cuenta_aprobada(), es_admin(), etc. una vez POR FILA.
-- Envueltas en (select ...) Postgres las calcula una sola vez por consulta.
do $$
declare r record; q text; c text; s text;
begin
  for r in select schemaname, tablename, policyname, qual, with_check from pg_policies where schemaname = 'public' loop
    q := regexp_replace(coalesce(r.qual, ''), '(?<!select )\m(cuenta_aprobada|es_admin|es_comandante|puede_editar)\(\)', '(select \1())', 'g');
    q := regexp_replace(q, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'g');
    c := regexp_replace(coalesce(r.with_check, ''), '(?<!select )\m(cuenta_aprobada|es_admin|es_comandante|puede_editar)\(\)', '(select \1())', 'g');
    c := regexp_replace(c, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'g');
    if q is not distinct from coalesce(r.qual, '') and c is not distinct from coalesce(r.with_check, '') then continue; end if;
    s := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then s := s || format(' using (%s)', q); end if;
    if r.with_check is not null then s := s || format(' with check (%s)', c); end if;
    execute s;
  end loop;
end $$;
