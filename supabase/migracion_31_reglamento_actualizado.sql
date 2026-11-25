-- Migración 31: el Reglamento del calendario se pone al día con cómo funciona ahora la web.
--  * Sección nueva "🕒 Cómo se reclama un horario en la web" (hora de inicio y fin, máximo 2 horas, sin superponer,
--    tipos de actividad, quién puede editar o borrar).
--  * Prioridad de las actividades con los nombres nuevos de los tipos.
--  * Capacitaciones de especialización: cómo marcarlas en el calendario.
--  * Formato para el calendario: con hora de inicio y de fin.
--  Las normas de 30 minutos entre actividades y de no reclamar 2 horarios seguidos quedan escritas, sin que la web las exija.

update public.reglamento set orden = orden + 1 where orden >= 2;

insert into public.reglamento (orden, bloqueado, datos)
select 2, false, jsonb_build_object('titulo', '🕒 Cómo se reclama un horario en la web', 'texto',
'Toda actividad programada se carga en el Calendario de la web, además de avisarla por Discord.
• Horario: cada actividad lleva hora de inicio y hora de finalización.
• Duración máxima: 2 horas por actividad.
• Horario ocupado: no se puede reclamar un horario que se superpone con otra actividad ya programada; la web avisa cuál lo ocupa.
• Tipos de actividad: Entrenamiento 21, Entrenamiento BU, Rol de PJ, Mini rol, Capacitación élite (se puede marcar Asalto, Apoyo o Recon), Try Blackout Unit, Reunión y Misión.
• Cambios: una actividad la puede editar o borrar quien la cargó, quienes la programan o un Comandante en adelante.
• Actividades terminadas: dejan de verse en el calendario cuando llega su hora de finalización.')
where not exists (select 1 from public.reglamento where datos->>'titulo' = '🕒 Cómo se reclama un horario en la web');

update public.reglamento set datos = jsonb_set(datos, '{texto}', to_jsonb(replace(datos->>'texto',
  'Orden de prioridad: MiniRol → Rol PJ → Entrenamiento → Capacitación.',
  'Orden de prioridad: Mini rol → Rol de PJ → Entrenamiento (21 o BU) → Capacitación élite.')))
 where id = 3;

update public.reglamento set datos = jsonb_set(datos, '{texto}', to_jsonb((datos->>'texto') || '
• En el calendario: si la capacitación es de una sola especialización, marcala (Asalto, Apoyo o Recon); si incluye 2 o 3, dejala sin especificar.'))
 where id = 5 and position('En el calendario:' in datos->>'texto') = 0;

update public.reglamento set datos = jsonb_set(datos, '{texto}', to_jsonb(replace(replace(datos->>'texto',
  '[Nombre][Hora]<Categoría>', '[Nombre][Hora de inicio a hora de fin]<Categoría>'),
  '[MRL Bacara][18:00hs-🇦🇷 (UTC-3)]<Asedio><Defensa>', '[MRL Bacara][18:00 a 20:00hs-🇦🇷 (UTC-3)]<Asedio><Defensa>')
  || '
Usá el mismo horario que cargaste en el Calendario de la web.'))
 where id = 8 and position('mismo horario que cargaste' in datos->>'texto') = 0;
