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
  1: 'Usuario',
  2: 'Administrador',
};

/* 4) COLUMNAS DE CADA REGISTRO DE ACTIVIDAD
   tipo: 'numero' (suma en el Total) o 'texto' (no suma).
   "clave" es el identificador interno: NO lo cambies después de cargar datos,
   o esa columna aparecerá vacía. El "nombre" sí lo podés cambiar cuando quieras. */
const COLUMNAS_BASE = [
  { clave: 'entrenamientos',     nombre: 'Entrenamientos',        tipo: 'numero' },
  { clave: 'roles_pj',           nombre: 'Roles de PJ',           tipo: 'numero' },
  { clave: 'try_subdivision',    nombre: 'Try de subdivisión',    tipo: 'numero' },
  { clave: 'mini_roles',         nombre: 'Mini roles',            tipo: 'numero' },
  { clave: 'try_especializacion',nombre: 'Try de especialización',tipo: 'numero' },
  { clave: 'observaciones',      nombre: 'Observaciones',         tipo: 'texto'  },
];

/* Categorías de los MIEMBROS (en este orden se listan) */
const CATEGORIAS_MIEMBRO = {
  comandantes:  'Comandantes',
  oficiales:    'Oficiales',
  suboficiales: 'Suboficiales',
  elites:       'Élites',
  tropas:       'Tropas',
};

/* Registros de actividad. "incluye" = qué categorías de miembros aparecen en esa tabla */
const CATEGORIAS = {
  suboficiales: { titulo: 'Suboficiales',            incluye: ['suboficiales'],             columnas: COLUMNAS_BASE },
  oficiales:    { titulo: 'Oficiales y Comandantes', incluye: ['comandantes', 'oficiales'], columnas: COLUMNAS_BASE },
  elites:       { titulo: 'Élites',                  incluye: ['elites'],                   columnas: COLUMNAS_BASE },
  tropas:       { titulo: 'Tropas',                  incluye: ['tropas'],                   columnas: COLUMNAS_BASE },
};

/* 5) COLUMNAS DEL REGLAMENTO DEL CALENDARIO */
const COLUMNAS_REGLAMENTO = [
  { clave: 'actividad',     nombre: 'Actividad' },
  { clave: 'dias',          nombre: 'Días' },
  { clave: 'horario',       nombre: 'Horario' },
  { clave: 'responsable',   nombre: 'Responsable' },
  { clave: 'requisitos',    nombre: 'Requisitos' },
  { clave: 'observaciones', nombre: 'Observaciones' },
];

/* 6) TIPOS DE EVENTO DEL CALENDARIO (nombre y color) */
const TIPOS_EVENTO = [
  { nombre: 'Entrenamiento',  color: '#3b82f6' },
  { nombre: 'Rol',            color: '#a855f7' },
  { nombre: 'Try',            color: '#f59e0b' },
  { nombre: 'Reunión',        color: '#10b981' },
  { nombre: 'Evento especial',color: '#ef4444' },
];

/* 7) SECCIONES DEL MENÚ Y RANGO MÍNIMO PARA VERLAS
   De momento todo está en 1 (cualquier cuenta ve todo).
   Más adelante podés subir un número a 2 para que solo lo vean administradores. */
const SECCIONES = [
  { id: 'inicio',       titulo: 'Inicio',                         icono: '▦', grupo: '',                       rangoMinimo: 1 },
  { id: 'suboficiales', titulo: 'Actividad Suboficiales',         icono: '◆', grupo: 'Registros de actividad', rangoMinimo: 1 },
  { id: 'oficiales',    titulo: 'Actividad Oficiales y Comandantes', icono: '★', grupo: 'Registros de actividad', rangoMinimo: 1 },
  { id: 'elites',       titulo: 'Actividad Élites',               icono: '▲', grupo: 'Registros de actividad', rangoMinimo: 1 },
  { id: 'tropas',       titulo: 'Actividad Tropas',               icono: '●', grupo: 'Registros de actividad', rangoMinimo: 1 },
  { id: 'reglamento',   titulo: 'Reglamento del calendario',      icono: '§', grupo: 'Calendario',             rangoMinimo: 1 },
  { id: 'calendario',   titulo: 'Calendario',                     icono: '▤', grupo: 'Calendario',             rangoMinimo: 1 },
  { id: 'miembros',     titulo: 'Miembros de la legión',          icono: '☰', grupo: 'Legión',                 rangoMinimo: 1 },
  { id: 'usuarios',     titulo: 'Usuarios y rangos',              icono: '⚙', grupo: 'Administración',         rangoMinimo: 2 },
];
