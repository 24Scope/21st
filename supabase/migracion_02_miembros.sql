-- =====================================================================
--  MIGRACIÓN 02 — Más datos en Miembros de la legión + carga inicial
--  Supabase > SQL Editor > New query > pegar todo > Run.
--  Se puede ejecutar más de una vez: no duplica miembros (compara SteamID).
-- =====================================================================

alter table public.miembros add column if not exists numero_clon    text default '';
alter table public.miembros add column if not exists nombre_jedi    text default '';
alter table public.miembros add column if not exists nombre_iconico text default 'No';
alter table public.miembros add column if not exists steam_id       text default '';
alter table public.miembros add column if not exists steam_id64     text default '';
alter table public.miembros add column if not exists job            text default '';
alter table public.miembros add column if not exists fecha_rango    date;

-- Los que eran "oficiales" siguen siéndolo; "comandantes" es una categoría nueva.

insert into public.miembros (nombre, categoria, grado, numero_clon, job, steam_id, steam_id64)
select v.nombre, v.categoria, v.grado, v.numero_clon, v.job, v.steam_id, v.steam_id64
from (values
  ('Scope', 'comandantes', 'MRL', '2408', 'BU Comandante', 'STEAM_0:0:164645742', '76561198289557212'),
  ('Markus', 'suboficiales', 'SGT°2', '4264', 'Bu Asalto', 'STEAM_0:1:546107725', '76561199052481179'),
  ('Búho', 'oficiales', 'TTE 2°', '2090', 'BU Reconocimiento', 'STEAM_0:1:67543518', '76561198095352765'),
  ('Kamikase', 'suboficiales', 'SGT', '6657', 'BU Asalto/Clon Comando', 'STEAM_0:0:797925340', '76561199556116408'),
  ('Oppenheimer', 'oficiales', 'TTE', '6666', 'Bu Recon', 'STEAM_0:0:196075865', '76561198352417458'),
  ('Nobunaga', 'oficiales', 'TTE°1', '9334', 'BU Reconocimiento', 'STEAM_0:1:527186242', '76561199014638213'),
  ('Toya', 'suboficiales', 'SGT', '4245', 'BU Reconocimiento', 'STEAM_0:1:617950502', '76561199196166733'),
  ('Lalo', 'suboficiales', 'SGT°2', '7007', 'BU Reconocimiento', 'STEAM_0:0:530651630', '76561199021568988'),
  ('Fault', 'suboficiales', 'SGT', '5013', 'BU Reconocimiento', 'STEAM_0:1:592100638', '76561199144467005'),
  ('Lyro', 'suboficiales', 'SGT', '1504', 'BU Apoyo', 'STEAM_0:0:131781584', '76561198223828896'),
  ('Wafle', 'suboficiales', 'SGTM', '6060', 'BU Asalto', 'STEAM_0:1:508546513', '76561198977358755'),
  ('Flagg', 'suboficiales', 'SGTM', '4044', 'Bu Asalto Clon Comando', 'STEAM_0:0:544181435', '76561199048628598'),
  ('Deltard', 'oficiales', 'CPTM', '2442', 'BU Asalto Clon Comando', 'STEAM_0:0:548398823', '76561199057063374'),
  ('Frodo', 'suboficiales', 'SGTM', '1999', 'Soldado de fuego', 'STEAM_0:1:555632649', '76561199071531027'),
  ('Dovah', 'comandantes', 'MRL', '2011', 'SF CMD', 'STEAM_0:0:85197535', '76561198130660798'),
  ('History', 'oficiales', 'TTE2', '2100', 'BU Apoyo', 'STEAM_0:1:239302159', '76561198438870047'),
  ('Jota', 'oficiales', 'TTE', '1771', 'BU AS', 'STEAM_0:1:425394335', '76561198811054399'),
  ('Valen', 'comandantes', 'CMD', '2015', 'BU CMD', 'STEAM_0:1:563260412', '76561199086786553'),
  ('Ian', 'suboficiales', 'SGT1', '1241', 'Bu Apoyo Clon Comando', 'STEAM_0:1:90912650', '76561198142091029'),
  ('Venom', 'suboficiales', 'SGTM', '8756', 'Bu Reconocimiento', 'STEAM_0:1:467791880', '76561198895849489'),
  ('Roxxaz', 'oficiales', 'TTE 1°', '4856', 'BU Apoyo', 'STEAM_0:0:140766562', '76561198241798852'),
  ('Reaper', 'comandantes', 'MRL', '66661', 'Bu Comandante', 'STEAM_0:1:203775088', '76561198367815905'),
  ('Valkorion', 'comandantes', 'CMD1', '6926', 'BU CMD', 'STEAM_0:0:99878356', '76561198160022440')
) as v(nombre, categoria, grado, numero_clon, job, steam_id, steam_id64)
where not exists (select 1 from public.miembros m where m.steam_id = v.steam_id);
