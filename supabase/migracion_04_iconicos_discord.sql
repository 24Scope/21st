-- =====================================================================
--  MIGRACIÓN 04 — Nombres icónicos y Discord de los portadores
--  (ya aplicada en Supabase el 2026-11-18; queda como registro)
-- =====================================================================
update public.miembros m
set nombre_iconico = v.iconico, discord_id = v.discord
from (values
  ('Dovah', 'Bacara', 'ulti_gg'),
  ('Ketk', 'Blackout', 'facuvs'),
  ('Scope', 'Keller', 'agustinto'),
  ('Reaper', 'Jet', 'shosi'),
  ('Valen', 'Levet', 'Valen69.'),
  ('Búho', 'Ki Adi Mundi', 'thebroco'),
  ('Frodo', 'Yarael Poof', 'frodo771'),
  ('Lalo', 'Mark', 'tronex08'),
  ('Valkorion', 'Pluto', 'cydon_ashbore'),
  ('Roxxaz', 'Etal', 'roxxazpierce'),
  ('Fault', 'RaceTrack', 'elosco'),
  ('Lyro', 'Spark', 'lyrooh'),
  ('Deltard', 'Ridge', '.sweetbellic'),
  ('Jota', 'Finn', 'j.b1771'),
  ('Flagg', 'Stance', '4martin')
) as v(nombre, iconico, discord)
where m.nombre = v.nombre;

-- Un icónico solo puede tenerlo un miembro
create unique index if not exists miembros_iconico_unico
  on public.miembros (lower(nombre_iconico))
  where nombre_iconico is not null and nombre_iconico <> '' and lower(nombre_iconico) <> 'no';
