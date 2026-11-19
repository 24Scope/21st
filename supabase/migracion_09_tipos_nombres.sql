-- Migración 09: nombres nuevos de tipos de actividad y tipos que ya no se pueden registrar.
-- Los tipos desactivados siguen existiendo (las actividades viejas mantienen su nombre y sus columnas en las tablas),
-- pero no aparecen en "Registrar actividad" y registrar_actividad los rechaza.
update tipos_actividad set nombre = 'Capacitación élite' where id = 'ent_esp';
update tipos_actividad set nombre = 'Organización Try BU' where id = 'try_bu';
update tipos_actividad set activo = false where id in ('mis_21', 'mis_bu', 'cap_sombra', 'mis_elite');
