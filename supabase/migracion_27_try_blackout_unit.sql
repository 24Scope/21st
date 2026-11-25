-- Migración 27: en el Calendario, "Try de subdivisión" pasa a llamarse "Try Blackout Unit".
-- (El tipo nuevo "Entrenamiento BU" no necesita cambios en la base.)
update public.eventos set tipo = 'Try Blackout Unit' where tipo = 'Try de subdivisión';
