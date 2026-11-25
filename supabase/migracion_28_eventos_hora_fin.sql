-- Migración 28: las actividades del Calendario guardan también la hora de finalización.
-- (Las que ya terminaron dejan de mostrarse en el calendario; no se borran de la base.)
alter table public.eventos add column if not exists hora_fin text check (hora_fin is null or hora_fin ~ '^\d{1,2}:\d{2}$');
