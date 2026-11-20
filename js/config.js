/* =====================================================================
   CONFIGURACIÓN — Base de Datos 21
   Este es el único archivo que necesitás tocar para personalizar el sitio.
   ===================================================================== */

/* 1) CONEXIÓN A SUPABASE
   Supabase > Project Settings > API. Copiá "Project URL" y la clave "anon public".
   (La clave anon es pública por diseño; la seguridad la dan las reglas del schema.sql)
   Si los dejás vacíos, el sitio funciona en MODO DEMO: los datos quedan solo en tu navegador. */
const SUPABASE_URL = 'https://qshmdysaoulypgbeckcz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzaG1keXNhb3VseXBnYmVja2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5NjM5OTMsImV4cCI6MjExMDUzOTk5M30.JqHT2Q3bIFr6lfUPGEeBejvfvIjYN4wf39gbfdL2Lsk';

/* 2) NOMBRE DEL SITIO */
const NOMBRE_SITIO = 'Base de Datos 21';

/* 3) RANGOS DE CUENTA */
const RANGOS = {
  0: 'Pendiente de aprobación',
  1: 'Invitado',
  2: 'Élite',
  3: 'Sub-Oficial',
  4: 'Oficial',
  5: 'Capitán',
  6: 'Comandante',
  7: 'Mariscal',
  8: 'Rango Scope',
};
/* Rango de cuenta que administra el panel (Usuarios y rangos, Foro, aprobar cuentas). Los rangos 1 a 7 por ahora tienen los mismos permisos. */
const RANGO_ADMIN = 8;

/* 4) RANGOS DE LA LEGIÓN, de MENOR a MAYOR. Las tablas se ordenan con esta lista. */
const RANGOS_LEGION = ['SDO', 'SDO2', 'SDO1', 'CBO', 'CBO2', 'CBO1', 'CBOM',
                       'SGT', 'SGT2', 'SGT1', 'SGTM', 'STTE', 'TTE', 'TTE2', 'TTE1',
                       'CPT', 'CPT1', 'CPTM', 'CMD', 'CMD1', 'CMDM', 'CMD B', 'MRL'];
/* true = el rango más alto arriba (MRL primero). false = el más bajo arriba. */
const RANGO_MAYOR_PRIMERO = true;
/* Categoría de cada rango (se completa sola al elegir el rango en el formulario) */
const CATEGORIA_POR_RANGO = {
  soldados:     ['SDO', 'SDO2', 'SDO1'],
  cabos:        ['CBO', 'CBO2', 'CBO1', 'CBOM'],
  suboficiales: ['SGT', 'SGT2', 'SGT1', 'SGTM'],
  oficiales:    ['STTE', 'TTE', 'TTE2', 'TTE1', 'CPT', 'CPT1', 'CPTM'],
  comandantes:  ['CMD', 'CMD1', 'CMDM', 'CMD B', 'MRL'],
};

/* ÉLITES (abreviatura: nombre completo). '' = no es élite */
const ELITES = {
  RNE: 'Reconocimiento Élite',
  ASE: 'Asalto Élite',
  APE: 'Apoyo Élite',
  ARC: 'ARC',
};

/* NOMBRES ICÓNICOS disponibles (desplegable). Cada uno lo puede tener un solo miembro. */
const ICONICOS = [
  'Bacara', 'Blackout', 'Keller', 'Jet', 'Levet', 'Ki Adi Mundi', 'Yarael Poof', 'Mark', 'Pluto',
  'Etal', 'RaceTrack', 'Mustang', 'Spark', 'Ridge', 'Finn', 'Contrail', 'Sixseed', 'Stance',
];

/* Categorías de los MIEMBROS (en este orden se listan).
   oculta: true = no aparece en "Miembros de la legión" (salvo tildando "Mostrar tropas"). */
const CATEGORIAS_MIEMBRO = {
  comandantes:  { titulo: 'Comandantes' },
  oficiales:    { titulo: 'Oficiales' },
  suboficiales: { titulo: 'Suboficiales' },
  cabos:        { titulo: 'Cabos',    oculta: true },
  soldados:     { titulo: 'Soldados', oculta: true },
};

/* 5) REGISTROS DE ACTIVIDAD
   Columnas:
   - tipo 'numero' o 'texto': se cargan a mano. "clave" es el identificador interno: NO lo cambies
     después de cargar datos (la columna aparecería vacía). El "nombre" sí lo podés cambiar.
   - tipo 'calculada': se calcula sola con "calc" (v('clave') = valor numérico de otra columna).
   - opciones: lista de valores sugeridos para columnas de texto.
   Registro:
   - incluye: categorías de miembros que aparecen. filtro: condición extra (ej. ser élite).
   - fijas: datos del miembro que se muestran como columna fija.
   - periodo: { dias, inicio } para registros que no son mensuales (Soldados, Cabos). */
const requisito = (total, ascenso, minimo) =>
  total >= ascenso ? '✅ Cumple' : total >= minimo ? '🟨 Mínimo' : '❌ No cumple';
/* Comandantes en adelante no necesitan cumplir mínimos, salvo que sean ARC. */
const exentoMinimos = m => {
  if (!m || m.elite === 'ARC') return false;
  const g = String(m.grado || '').replace(/\s/g, '').toUpperCase();
  return g ? CATEGORIA_POR_RANGO.comandantes.some(x => x.replace(/\s/g, '').toUpperCase() === g) : m.categoria === 'comandantes';
};

const CATEGORIAS = {
  oficiales: {
    titulo: 'Oficiales y Comandantes',
    incluye: ['comandantes', 'oficiales'],
    columnas: [
      { clave: 'ents_21',  nombre: 'Ents 21st',            tipo: 'numero' },
      { clave: 'ents_esp', nombre: 'Cap. élite',           tipo: 'numero' },
      { clave: 'ents_bu',  nombre: 'Ents BU',              tipo: 'numero' },
      { clave: 'roles_pj', nombre: 'Rol PJ',               tipo: 'numero' },
      { clave: 'minirol',  nombre: 'Minirol',              tipo: 'numero' },
      { clave: 'try_bu',   nombre: 'Org. Try BU',          tipo: 'numero' },
      { clave: 'try_esp',  nombre: 'Try especialización',  tipo: 'numero' },
      { clave: 'try_21',   nombre: 'Try 21st',             tipo: 'numero' },
      { clave: 'act_total', nombre: 'Act. total', tipo: 'calculada', numerica: true,
        calc: v => v('ents_21') + v('ents_esp') + v('ents_bu') + v('roles_pj') + v('minirol') + v('try_bu') },
      { clave: 'requisitos', nombre: 'Requisitos', tipo: 'calculada', calc: (v, t, m) => exentoMinimos(m) ? '⚪ Exento' : requisito(t('act_total'), 7, 3) },
      { clave: 'aclaraciones', nombre: 'Inactividades', tipo: 'texto' },
    ],
  },
  suboficiales: {
    titulo: 'Suboficiales',
    incluye: ['suboficiales'],
    columnas: [
      { clave: 'ents_21',  nombre: 'Ents 21st',           tipo: 'numero' },
      { clave: 'ents_esp', nombre: 'Cap. élite',          tipo: 'numero' },
      { clave: 'ents_bu',  nombre: 'Ents BU',             tipo: 'numero' },
      { clave: 'roles_pj', nombre: 'Roles PJ',            tipo: 'numero' },
      { clave: 'minirol',  nombre: 'Miniroles',           tipo: 'numero' },
      { clave: 'try_esp',  nombre: 'Try especialización', tipo: 'numero' },
      { clave: 'try_21',   nombre: 'Try legión',          tipo: 'numero' },
      { clave: 'act_total', nombre: 'Act. total', tipo: 'calculada', numerica: true,
        calc: v => v('ents_21') + v('ents_esp') + v('ents_bu') + v('roles_pj') + v('minirol') },
      { clave: 'requisitos', nombre: 'Requisitos', tipo: 'calculada', calc: (v, t, m) => exentoMinimos(m) ? '⚪ Exento' : requisito(t('act_total'), 7, 3) },
      { clave: 'aclaraciones', nombre: 'Inactividades', tipo: 'texto' },
    ],
  },
  elites: {
    titulo: 'Élites',
    incluye: ['comandantes', 'oficiales', 'suboficiales', 'cabos', 'soldados'],
    filtro: m => ['ARC', 'RNE', 'ASE', 'APE'].includes(m.elite),
    ordenarPor: 'elite',
    // Una tabla chica por especialización, de izquierda a derecha.
    // "valores" en orden: dentro de cada tabla salen primero los del primer valor (los ARC van arriba en Reconocimientos).
    // "columna": en vez del rango, cada fila muestra este dato (ARC, RNE, ASE, APE).
    secciones: { campo: 'elite', columna: 'Especialización', lista: [
      { valores: ['ARC', 'RNE'], titulo: 'Reconocimientos Élites' },
      { valores: ['ASE'],        titulo: 'Asaltos Élites' },
      { valores: ['APE'],        titulo: 'Apoyos Élites' },
    ] },
    columnas: [
      { clave: 'n_cap',       nombre: 'N° cap.',        tipo: 'numero' },
      { clave: 'n_trys',      nombre: 'N° trys',        tipo: 'numero' },
      { clave: 'inactividad', nombre: 'Inactividades',  tipo: 'texto' },
    ],
  },
  bu: {
    titulo: 'BU',
    incluye: ['comandantes', 'oficiales', 'suboficiales', 'cabos', 'soldados'],
    fijas: [{ campo: 'fecha_ingreso', nombre: 'Fecha ingreso', tipo: 'fecha' }],
    columnas: [
      { clave: 'mis_21',      nombre: 'Misiones 21st',             tipo: 'numero' },
      { clave: 'mis_bu',      nombre: 'Misiones BU',               tipo: 'numero' },
      { clave: 'ent_bu_ent',  nombre: 'Ent. BU entrenador',        tipo: 'numero' },
      { clave: 'ent_bu_part', nombre: 'Ent. BU participante',      tipo: 'numero' },
      { clave: 'cap_ent',     nombre: 'Cap. sombra entrenador',    tipo: 'numero' },
      { clave: 'cap_part',    nombre: 'Cap. sombra participante',  tipo: 'numero' },
      { clave: 'try_ayuda',   nombre: 'Try BU ayudas',             tipo: 'numero' },
      { clave: 'try_org',     nombre: 'Try BU organizador',        tipo: 'numero' },
      { clave: 'total', nombre: 'Total', tipo: 'calculada', numerica: true,
        calc: v => v('mis_21') + v('mis_bu') + v('ent_bu_ent') + v('ent_bu_part') + v('cap_ent') + v('cap_part') + v('try_ayuda') + v('try_org') },
      { clave: 'act_check', nombre: 'Act. check',   tipo: 'texto', opciones: ['SI', 'NO', 'N/A'] },
      { clave: 'estado',    nombre: 'Estado',       tipo: 'texto', opciones: ['ACTIVO', 'INACTIVO'] },
      { clave: 'decision',  nombre: 'Decisión (CMD+)', tipo: 'texto' },
    ],
  },
  soldados: {
    titulo: 'Soldados',
    incluye: ['soldados'],
    periodo: { dias: 7, inicio: '2026-11-08' },
    fijas: [{ campo: 'fecha_rango', nombre: 'Último ascenso', tipo: 'fecha' }],
    columnas: [
      { clave: 'lider',     nombre: 'Líder',          tipo: 'numero' },
      { clave: 'sublider',  nombre: 'Sub-líder',      tipo: 'numero' },
      { clave: 'total_lid', nombre: 'Total liderazgos', tipo: 'calculada', numerica: true, calc: v => v('lider') + v('sublider') },
      { clave: 'misiones',  nombre: 'Misiones',       tipo: 'numero' },
      { clave: 'ents',      nombre: 'Entrenamientos', tipo: 'numero' },
      { clave: 'roles_pj',  nombre: 'Roles de PJ',    tipo: 'numero' },
      { clave: 'caps',      nombre: 'Capacitaciones', tipo: 'numero' },
      { clave: 'total_act', nombre: 'Total actividad', tipo: 'calculada', numerica: true,
        calc: v => v('misiones') + v('ents') + v('roles_pj') + v('caps') },
      { clave: 'ascenso', nombre: 'Ascenso (≥2 act.)', tipo: 'calculada',
        calc: (v, t) => t('total_act') >= 2 ? '✅ Apto' : '❌ No apto' },
      { clave: 'obs', nombre: 'Obs. / conducta', tipo: 'texto' },
    ],
  },
  cabos: {
    titulo: 'Cabos',
    incluye: ['cabos'],
    periodo: { dias: 14, inicio: '2026-11-01' },
    fijas: [{ campo: 'fecha_rango', nombre: 'Último ascenso', tipo: 'fecha' }],
    columnas: [
      { clave: 'lider',     nombre: 'Líder',          tipo: 'numero' },
      { clave: 'sublider',  nombre: 'Sub-líder',      tipo: 'numero' },
      { clave: 'total_lid', nombre: 'Total liderazgos', tipo: 'calculada', numerica: true, calc: v => v('lider') + v('sublider') },
      { clave: 'misiones',  nombre: 'Misiones',       tipo: 'numero' },
      { clave: 'ents',      nombre: 'Entrenamientos', tipo: 'numero' },
      { clave: 'roles_pj',  nombre: 'Roles de PJ',    tipo: 'numero' },
      { clave: 'caps',      nombre: 'Capacitaciones', tipo: 'numero' },
      { clave: 'total_act', nombre: 'Total actividad', tipo: 'calculada', numerica: true,
        calc: v => v('misiones') + v('ents') + v('roles_pj') + v('caps') },
      { clave: 'ascenso', nombre: 'Ascenso (≥3 act. y ≥2 lid.)', tipo: 'calculada',
        calc: (v, t) => t('total_act') >= 3 && t('total_lid') >= 2 ? '✅ Apto' : '❌ No apto' },
      { clave: 'obs', nombre: 'Obs. / conducta', tipo: 'texto' },
    ],
  },
};

/* 6) TIPOS DE EVENTO DEL CALENDARIO (nombre y color) */
const TIPOS_EVENTO = [
  { nombre: 'Entrenamiento',   color: '#3b82f6' },
  { nombre: 'Rol PJ',          color: '#a855f7' },
  { nombre: 'Minirol',         color: '#ec4899' },
  { nombre: 'Capacitación',    color: '#14b8a6' },
  { nombre: 'Try',             color: '#f59e0b' },
  { nombre: 'Reunión',         color: '#10b981' },
  { nombre: 'Evento especial', color: '#ef4444' },
];

/* 7) SECCIONES DEL MENÚ Y RANGO MÍNIMO PARA VERLAS
   De momento todo está en 1 (cualquier cuenta ve todo).
   Más adelante podés subir un número a 2 para que solo lo vean administradores. */
const SECCIONES = [
  { id: 'inicio',       titulo: 'Inicio',                            icono: '▦', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'calendario',   titulo: 'Calendario',                        icono: '▤', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'reglamento',   titulo: 'Reglamento del calendario',         icono: '§', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'actividad',    titulo: 'Registrar actividad',               icono: '✚', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'inactividad',  titulo: 'Informar inactividad',              icono: '☾', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'foro',         titulo: 'Reporte de bugs',                   icono: '✎', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'perfil',       titulo: 'Mi perfil',                         icono: '◉', grupo: 'Principal',    rangoMinimo: 1 },
  { id: 'suboficiales', titulo: 'Actividad Suboficiales',            icono: '◆', grupo: 'Oficialidad',  rangoMinimo: 1 },
  { id: 'elites',       titulo: 'Actividad Élites',                  icono: '▲', grupo: 'Oficialidad',  rangoMinimo: 1 },
  { id: 'bu',           titulo: 'Actividad BU',                      icono: '⬢', grupo: 'Oficialidad',  rangoMinimo: 1 },
  { id: 'soldados',     titulo: 'Actividad Soldados (7 días)',       icono: '•', grupo: 'Oficialidad',  rangoMinimo: 1 },
  { id: 'cabos',        titulo: 'Actividad Cabos (14 días)',         icono: '●', grupo: 'Oficialidad',  rangoMinimo: 1 },
  { id: 'miembros',     titulo: 'Miembros de la legión',             icono: '☰', grupo: 'Comandancia',  rangoMinimo: 1 },
  { id: 'oficiales',    titulo: 'Actividad Oficiales y Comandantes', icono: '★', grupo: 'Comandancia',  rangoMinimo: 1 },
  { id: 'usuarios',     titulo: 'Usuarios y rangos',                 icono: '⚙', grupo: 'Comandancia',  rangoMinimo: 8 },
];
