-- Migración 26: tipos de actividad del Calendario.
--  Entrenamiento → Entrenamiento 21 · Rol PJ → Rol de PJ · Minirol → Mini rol · Capacitación → Capacitación élite
--  Try → Try de subdivisión · Reunión queda igual · nuevo: Misión · se saca Evento especial (no había ninguno).
--  La Capacitación élite puede marcar su especialidad (asalto, apoyo o recon); no es otro tipo de actividad.

update public.eventos set tipo = case tipo
    when 'Entrenamiento'   then 'Entrenamiento 21'
    when 'Rol PJ'          then 'Rol de PJ'
    when 'Minirol'         then 'Mini rol'
    when 'Capacitación'    then 'Capacitación élite'
    when 'Try'             then 'Try de subdivisión'
    else tipo end
 where tipo in ('Entrenamiento', 'Rol PJ', 'Minirol', 'Capacitación', 'Try');

alter table public.eventos add column if not exists especialidad text
  check (especialidad in ('asalto', 'apoyo', 'recon'));
