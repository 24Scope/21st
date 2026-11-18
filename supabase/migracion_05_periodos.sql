-- =====================================================================
--  MIGRACIÓN 05 — Registros por período (Soldados 7 días, Cabos 14 días)
--  y fecha de ingreso de los miembros
-- =====================================================================

-- periodo = fecha de inicio del período (AAAA-MM-DD). En los registros mensuales queda vacío.
alter table public.registros add column if not exists periodo text not null default '';

alter table public.registros drop constraint if exists registros_categoria_anio_mes_miembro_id_columna_key;
alter table public.registros drop constraint if exists registros_celda_unica;
alter table public.registros add constraint registros_celda_unica
  unique (categoria, anio, mes, periodo, miembro_id, columna);

drop index if exists public.registros_mes_idx;
create index if not exists registros_mes_idx on public.registros (categoria, anio, mes, periodo);

alter table public.miembros add column if not exists fecha_ingreso date;
