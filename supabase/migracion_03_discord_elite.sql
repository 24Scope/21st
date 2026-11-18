-- =====================================================================
--  MIGRACIÓN 03 — Discord ID, Élite y rangos con formato oficial
--  (Job habitual deja de mostrarse en la página; la columna "job" se conserva en la base)
-- =====================================================================

alter table public.miembros add column if not exists discord_id text default '';
alter table public.miembros add column if not exists elite      text default '';  -- '' = No | ASE | APE | RNE

-- Rangos al formato oficial: "SGT°2" -> "SGT2", "TTE 1°" -> "TTE1", etc.
update public.miembros
set grado = upper(replace(replace(grado, '°', ''), ' ', ''))
where upper(replace(replace(grado, '°', ''), ' ', '')) in
  ('SGT','SGT2','SGT1','SGTM','STTE','TTE','TTE2','TTE1','CPT','CPT1','CPTM','CMD','CMD1','CMDM','MRL')
  and grado <> upper(replace(replace(grado, '°', ''), ' ', ''));
