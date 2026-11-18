/* =====================================================================
   Base de Datos 21 — interfaz
   ===================================================================== */

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const estado = {
  perfil: null,
  ajustes: {},
  seccion: 'inicio',
  anio: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  cal: { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 },
  limpiezas: [],
};

/* ------------------------------------------------------------ utilidades */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fechaISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esAdmin = () => (estado.perfil?.rango ?? 0) >= 2;
const puedeEditar = () => esAdmin() || estado.ajustes.modo_abierto === true;
const nombreRango = r => RANGOS[r] || `Rango ${r}`;
const colorTipo = t => (TIPOS_EVENTO.find(x => x.nombre === t) || { color: '#64748b' }).color;
const numero = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const formatoNum = n => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');

function aviso(texto, tipo = '') {
  const el = document.createElement('div');
  el.className = 'aviso ' + tipo;
  el.textContent = texto;
  $('#avisos').appendChild(el);
  setTimeout(() => el.remove(), tipo === 'error' ? 5000 : 2600);
}
const fallo = e => { console.error(e); aviso(e.message || String(e), 'error'); };

function abrirModal(titulo, html, alMontar) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-cuerpo').innerHTML = html;
  $('#modal-fondo').hidden = false;
  alMontar && alMontar($('#modal-cuerpo'));
  const primero = $('#modal-cuerpo input, #modal-cuerpo select, #modal-cuerpo textarea');
  primero && primero.focus();
}
function cerrarModal() { $('#modal-fondo').hidden = true; $('#modal-cuerpo').innerHTML = ''; }

function confirmar(titulo, mensaje, textoBoton = 'Confirmar') {
  return new Promise(resolver => {
    abrirModal(titulo, `<p style="margin:0 0 18px;line-height:1.5">${esc(mensaje)}</p>
      <div class="modal-pie"><button class="btn" data-no>Cancelar</button><button class="btn primario" data-si>${esc(textoBoton)}</button></div>`,
      c => {
        $('[data-no]', c).onclick = () => { cerrarModal(); resolver(false); };
        $('[data-si]', c).onclick = () => { cerrarModal(); resolver(true); };
      });
  });
}

function descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿' + contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const celdaCSV = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/* ------------------------------------------------------------ acceso */
let modoAcceso = 'entrar';

function mostrarAcceso() {
  $('#app').hidden = true;
  $('#pantalla-acceso').hidden = false;
}

function iniciarAcceso() {
  $$('.pestana').forEach(b => b.onclick = () => {
    modoAcceso = b.dataset.modo;
    $$('.pestana').forEach(x => x.classList.toggle('activa', x === b));
    $$('[data-solo="registrar"]').forEach(x => x.hidden = modoAcceso !== 'registrar');
    $('#btn-acceso').textContent = modoAcceso === 'registrar' ? 'Crear cuenta' : 'Entrar';
    $('[name=pass]').autocomplete = modoAcceso === 'registrar' ? 'new-password' : 'current-password';
    $('#acceso-error').hidden = true; $('#acceso-info').hidden = true;
  });

  $('#form-acceso').onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target, btn = $('#btn-acceso');
    const email = f.email.value.trim(), pass = f.pass.value, nombre = f.nombre.value.trim();
    $('#acceso-error').hidden = true; $('#acceso-info').hidden = true;
    if (modoAcceso === 'registrar' && !nombre) return mostrarErrorAcceso('Poné tu nombre.');
    btn.disabled = true;
    try {
      const perfil = modoAcceso === 'registrar' ? await api.registrar(email, pass, nombre) : await api.entrar(email, pass);
      if (!perfil) {
        $('#acceso-info').textContent = 'Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión.';
        $('#acceso-info').hidden = false;
      } else {
        f.reset();
        await entrarApp(perfil);
      }
    } catch (e) { mostrarErrorAcceso(e.message); }
    finally { btn.disabled = false; }
  };
}
function mostrarErrorAcceso(m) { $('#acceso-error').textContent = m; $('#acceso-error').hidden = false; }

/* ------------------------------------------------------------ app */
async function entrarApp(perfil) {
  estado.perfil = perfil;
  try { estado.ajustes = await api.obtenerAjustes(); } catch (e) { fallo(e); }
  $('#pantalla-acceso').hidden = true;
  $('#app').hidden = false;
  $('#usuario-nombre').textContent = perfil.nombre;
  $('#usuario-rango').textContent = nombreRango(perfil.rango);
  $('#usuario-avatar').textContent = (perfil.nombre || '?').trim().charAt(0).toUpperCase();
  pintarChipPermiso();
  pintarMenu();
  navegar();
}

function pintarChipPermiso() {
  const chip = $('#chip-permiso');
  chip.textContent = puedeEditar() ? 'Puede editar' : 'Solo lectura';
  chip.className = 'chip' + (puedeEditar() ? ' ok' : '');
}

function seccionesVisibles() {
  return SECCIONES.filter(s => estado.perfil.rango >= s.rangoMinimo);
}

function pintarMenu() {
  let html = '', grupo = null;
  for (const s of seccionesVisibles()) {
    if (s.grupo !== grupo) { grupo = s.grupo; if (grupo) html += `<div class="menu-grupo">${esc(grupo)}</div>`; }
    html += `<a class="menu-item" href="#/${s.id}" data-id="${s.id}"><span class="menu-icono">${s.icono}</span>${esc(s.titulo)}</a>`;
  }
  $('#menu').innerHTML = html;
}

function navegar() {
  if (!estado.perfil) return;
  const id = (location.hash.replace(/^#\/?/, '') || 'inicio').split('?')[0];
  const sec = seccionesVisibles().find(s => s.id === id) || seccionesVisibles()[0];
  estado.seccion = sec.id;
  estado.limpiezas.forEach(f => { try { f(); } catch {} });
  estado.limpiezas = [];
  $$('.menu-item').forEach(a => a.classList.toggle('activo', a.dataset.id === sec.id));
  $('#titulo-seccion').textContent = sec.titulo;
  document.title = `${sec.titulo} · ${NOMBRE_SITIO}`;
  $('#app').classList.remove('menu-abierto');
  const cont = $('#contenido');
  cont.innerHTML = '<div class="vacio">Cargando…</div>';
  cont.scrollTop = 0;

  const vistas = { inicio: vistaInicio, reglamento: vistaReglamento, calendario: vistaCalendario, miembros: vistaMiembros, usuarios: vistaUsuarios };
  const vista = CATEGORIAS[sec.id] ? () => vistaRegistro(sec.id) : vistas[sec.id];
  Promise.resolve(vista(cont)).catch(e => { cont.innerHTML = `<div class="vacio">No se pudo cargar: ${esc(e.message)}</div>`; fallo(e); });
}

/* ============================================================ INICIO */
async function vistaInicio(cont) {
  const hoy = new Date();
  const [miembros, eventos, regs] = await Promise.all([
    api.listarMiembros(),
    api.listarEventos(fechaISO(hoy), fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30))),
    api.listarRegistrosAnio(hoy.getFullYear()),
  ]);
  const mesActual = hoy.getMonth() + 1;

  const tarjetas = Object.entries(CATEGORIAS).map(([clave, cat]) => {
    const cant = miembros.filter(m => cat.incluye.includes(m.categoria) && m.activo).length;
    const numericas = new Set(cat.columnas.filter(c => c.tipo === 'numero').map(c => c.clave));
    const total = regs.filter(r => r.categoria === clave && r.mes === mesActual && numericas.has(r.columna))
      .reduce((s, r) => s + numero(r.valor), 0);
    return `<div class="tarjeta tarjeta-link" data-ir="${clave}">
      <div class="dato-grande">${cant}</div>
      <div class="dato-etiqueta">${esc(cat.titulo)} activos</div>
      <div class="dato-etiqueta" style="margin-top:10px">${formatoNum(total)} actividades en ${MESES[mesActual - 1].toLowerCase()}</div>
    </div>`;
  }).join('');

  const listaEventos = eventos.length ? `<ul class="lista-simple">${eventos.slice(0, 8).map(e => {
    const d = new Date(e.fecha + 'T00:00:00');
    return `<li><span class="punto" style="background:${colorTipo(e.tipo)}"></span>
      <div style="flex:1;min-width:0"><strong>${esc(e.titulo)}</strong><div class="dato-etiqueta">${esc(e.tipo || 'Evento')}</div></div>
      <span class="dato-etiqueta">${DIAS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}${e.hora ? ' · ' + esc(e.hora) : ''}</span></li>`;
  }).join('')}</ul>` : '<div class="vacio">No hay eventos en los próximos 30 días.</div>';

  cont.innerHTML = `
    <p style="margin:0 0 20px;color:var(--texto-2)">Hola, <strong style="color:var(--texto)">${esc(estado.perfil.nombre)}</strong>. Elegí una sección del menú o un acceso rápido.</p>
    <div class="rejilla">${tarjetas}</div>
    <div class="rejilla" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:16px">
      <div class="tarjeta"><h3>Próximos eventos</h3>${listaEventos}</div>
      <div class="tarjeta"><h3>Accesos rápidos</h3><ul class="lista-simple">
        <li><a class="menu-item" style="color:var(--texto)" href="#/calendario"><span class="menu-icono">▤</span>Calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/reglamento"><span class="menu-icono">§</span>Reglamento del calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/miembros"><span class="menu-icono">☰</span>Miembros de la legión (${miembros.length})</a></li>
      </ul></div>
    </div>`;
  $$('[data-ir]', cont).forEach(t => t.onclick = () => location.hash = '#/' + t.dataset.ir);
}

/* ============================================================ REGISTROS (hoja mensual) */
async function vistaRegistro(cat) {
  const cont = $('#contenido');
  const config = CATEGORIAS[cat];
  const hoja = { cat, config, miembros: [], filas: [], celdas: new Map(), sel: { f: 0, c: 0 }, editando: null };

  cont.innerHTML = `
    <div class="herramientas">
      <div class="selector-anio"><button data-anio="-1" aria-label="Año anterior">‹</button><span id="txt-anio"></span><button data-anio="1" aria-label="Año siguiente">›</button></div>
      <span class="espacio"></span>
      <button class="btn chico" id="btn-bloq-celda" title="Bloquear o desbloquear la celda seleccionada (Ctrl+B)">🔒 Bloquear celda</button>
      <button class="btn chico" id="btn-bloq-mes">Bloquear mes</button>
      <button class="btn chico" id="btn-desbloq-mes">Desbloquear mes</button>
      <button class="btn chico" id="btn-csv">Exportar CSV</button>
    </div>
    <div class="meses" id="meses">${MESES.map((m, i) => `<button class="mes" data-mes="${i + 1}">${m}</button>`).join('')}</div>
    <div class="barra-formula"><div class="ref" id="f-ref">—</div><div class="fx">fx</div><div class="val" id="f-val"></div><div class="estado-guardado" id="f-estado"></div></div>
    <div class="hoja-contenedor" id="hoja-cont" tabindex="0"></div>
    <p class="ayuda">Clic para seleccionar · <kbd>Doble clic</kbd> o empezá a escribir para editar · <kbd>Enter</kbd> guarda y baja · <kbd>Tab</kbd> guarda y avanza · <kbd>Supr</kbd> borra · <kbd>Esc</kbd> cancela · <kbd>Ctrl</kbd>+<kbd>B</kbd> bloquea/desbloquea.
    Los miembros salen de <a href="#/miembros">Miembros de la legión</a> (categoría ${config.incluye.map(c => esc(CATEGORIAS_MIEMBRO[c] || c)).join(' y ')}).</p>`;

  const editable = puedeEditar();
  ['#btn-bloq-celda', '#btn-bloq-mes', '#btn-desbloq-mes'].forEach(s => { $(s).hidden = !editable; });

  const clave = (mid, col) => `${mid}|${col}`;
  const celdaDe = (f, c) => hoja.celdas.get(clave(hoja.filas[f].id, config.columnas[c].clave));

  async function cargar() {
    $('#txt-anio').textContent = estado.anio;
    $$('.mes', cont).forEach(b => b.classList.toggle('activo', +b.dataset.mes === estado.mes));
    $('#hoja-cont').innerHTML = '<div class="vacio">Cargando…</div>';
    const [miembros, regs] = await Promise.all([api.listarMiembros(), api.listarRegistros(cat, estado.anio, estado.mes)]);
    hoja.celdas = new Map(regs.map(r => [clave(r.miembro_id, r.columna), r]));
    const conDatos = new Set(regs.filter(r => r.valor !== null && r.valor !== '').map(r => r.miembro_id));
    hoja.filas = miembros.filter(m => config.incluye.includes(m.categoria) && (m.activo || conDatos.has(m.id)))
      .sort((a, b) => config.incluye.indexOf(a.categoria) - config.incluye.indexOf(b.categoria) || a.nombre.localeCompare(b.nombre));
    hoja.sel = { f: Math.min(hoja.sel.f, Math.max(hoja.filas.length - 1, 0)), c: Math.min(hoja.sel.c, config.columnas.length - 1) };
    pintar();
  }

  function pintar() {
    const hc = $('#hoja-cont');
    if (!hoja.filas.length) {
      hc.innerHTML = `<div class="vacio">No hay miembros en <strong>${esc(config.titulo)}</strong>.<br><br>
        <a class="btn" href="#/miembros">Agregar miembros</a></div>`;
      actualizarFormula(); return;
    }
    const cols = config.columnas;
    let html = `<table class="hoja"><thead><tr>
      <th class="fijo col-n">#</th><th class="fijo col-nombre">Miembro</th><th>Grado</th>
      ${cols.map(c => `<th class="${c.tipo === 'numero' ? 'num' : ''}">${esc(c.nombre)}</th>`).join('')}
      <th class="num">Total</th></tr></thead><tbody>`;
    hoja.filas.forEach((m, f) => {
      html += `<tr class="${m.activo ? '' : 'inactivo'}"><td class="fijo col-n">${f + 1}</td>
        <td class="fijo col-nombre" title="Dato fijo">${esc(m.nombre)}</td><td class="col-grado">${esc(m.grado)}</td>`;
      cols.forEach((c, ci) => { html += `<td data-f="${f}" data-c="${ci}"></td>`; });
      html += `<td class="total num" data-total="${f}"></td></tr>`;
    });
    html += `</tbody><tfoot><tr><td class="fijo col-n"></td><td class="fijo col-nombre">Total</td><td></td>
      ${cols.map((c, ci) => `<td class="num" data-tcol="${ci}"></td>`).join('')}<td class="num" data-tgen></td></tr></tfoot></table>`;
    hc.innerHTML = html;
    hoja.filas.forEach((_, f) => cols.forEach((_, c) => pintarCelda(f, c)));
    pintarTotales();
    marcarSeleccion();
  }

  function tdDe(f, c) { return $(`td[data-f="${f}"][data-c="${c}"]`, $('#hoja-cont')); }

  function pintarCelda(f, c) {
    const td = tdDe(f, c); if (!td) return;
    const col = config.columnas[c], r = celdaDe(f, c);
    td.className = 'celda ' + (col.tipo === 'numero' ? 'num' : 'texto') + (r?.bloqueado ? ' bloqueada' : '') + (editable ? '' : ' solo-lectura');
    td.textContent = r?.valor ?? '';
    td.title = r?.bloqueado ? 'Celda bloqueada' : '';
  }

  function pintarTotales() {
    const cols = config.columnas;
    let general = 0;
    hoja.filas.forEach((m, f) => {
      let t = 0;
      cols.forEach((c, ci) => { if (c.tipo === 'numero') t += numero(celdaDe(f, ci)?.valor); });
      general += t;
      const td = $(`[data-total="${f}"]`); if (td) td.textContent = formatoNum(t);
    });
    cols.forEach((c, ci) => {
      const td = $(`[data-tcol="${ci}"]`); if (!td) return;
      td.textContent = c.tipo === 'numero' ? formatoNum(hoja.filas.reduce((s, _, f) => s + numero(celdaDe(f, ci)?.valor), 0)) : '';
    });
    const tg = $('[data-tgen]'); if (tg) tg.textContent = formatoNum(general);
  }

  function marcarSeleccion() {
    $$('td.celda.sel', $('#hoja-cont')).forEach(td => td.classList.remove('sel'));
    const td = tdDe(hoja.sel.f, hoja.sel.c);
    if (td) { td.classList.add('sel'); mostrarCelda(td); }
    actualizarFormula();
  }

  // Desplaza la hoja para que la celda quede visible sin quedar tapada por las columnas/filas fijas
  function mostrarCelda(td) {
    const hc = $('#hoja-cont'), tabla = $('table', hc);
    const colNombre = $('thead .col-nombre', tabla), anchoFijo = colNombre.offsetLeft + colNombre.offsetWidth;
    const altoCab = $('thead', tabla).offsetHeight, altoPie = $('tfoot', tabla).offsetHeight;
    const izq = td.offsetLeft, der = izq + td.offsetWidth, arr = td.offsetTop, aba = arr + td.offsetHeight;
    if (hoja.sel.c === 0) hc.scrollLeft = 0;
    else if (izq - anchoFijo < hc.scrollLeft) hc.scrollLeft = izq - anchoFijo;
    else if (der > hc.scrollLeft + hc.clientWidth) hc.scrollLeft = der - hc.clientWidth;
    if (arr - altoCab < hc.scrollTop) hc.scrollTop = arr - altoCab;
    else if (aba + altoPie > hc.scrollTop + hc.clientHeight) hc.scrollTop = aba + altoPie - hc.clientHeight;
  }

  function actualizarFormula() {
    const btn = $('#btn-bloq-celda');
    if (!hoja.filas.length) { $('#f-ref').textContent = '—'; $('#f-val').textContent = ''; btn.disabled = true; return; }
    const m = hoja.filas[hoja.sel.f], col = config.columnas[hoja.sel.c], r = celdaDe(hoja.sel.f, hoja.sel.c);
    $('#f-ref').textContent = `${m.nombre} · ${col.nombre} · ${MESES[estado.mes - 1]}`;
    $('#f-val').textContent = (r?.bloqueado ? '🔒 ' : '') + (r?.valor ?? '');
    btn.disabled = false;
    btn.textContent = r?.bloqueado ? '🔓 Desbloquear celda' : '🔒 Bloquear celda';
  }

  function estadoGuardado(t) { $('#f-estado').textContent = t; }

  async function guardar(lista) {
    estadoGuardado('Guardando…');
    try {
      const res = await api.guardarCeldas(lista);
      for (const r of res) hoja.celdas.set(clave(r.miembro_id, r.columna), r);
      estadoGuardado('Guardado ✓');
      return true;
    } catch (e) { estadoGuardado('Error'); fallo(e); return false; }
  }

  function base(f, c) {
    const r = celdaDe(f, c);
    return { categoria: cat, anio: estado.anio, mes: estado.mes, miembro_id: hoja.filas[f].id,
      columna: config.columnas[c].clave, valor: r?.valor ?? null, bloqueado: !!r?.bloqueado };
  }

  function empezarEdicion(f, c, textoInicial) {
    if (!editable) return aviso('Tu cuenta es de solo lectura.');
    const r = celdaDe(f, c);
    if (r?.bloqueado) return aviso('Esta celda está bloqueada. Desbloqueala para modificarla.');
    const td = tdDe(f, c); if (!td) return;
    const col = config.columnas[c];
    hoja.editando = { f, c };
    td.classList.add('editando');
    td.innerHTML = `<input type="text" inputmode="${col.tipo === 'numero' ? 'decimal' : 'text'}">`;
    const inp = $('input', td);
    inp.value = textoInicial ?? (r?.valor ?? '');
    inp.focus();
    if (textoInicial == null) inp.select();
    let terminado = false;
    const terminar = (guardarCambios, mover) => {
      if (terminado) return; terminado = true;
      hoja.editando = null;
      const nuevo = inp.value.trim();
      const anterior = r?.valor ?? '';
      if (guardarCambios && nuevo !== anterior) {
        if (col.tipo === 'numero' && nuevo !== '' && isNaN(Number(nuevo.replace(',', '.')))) {
          aviso(`"${col.nombre}" solo acepta números.`, 'error');
        } else {
          // Se muestra al instante y se guarda en segundo plano; si falla, se revierte
          const valor = nuevo === '' ? null : (col.tipo === 'numero' ? nuevo.replace(',', '.') : nuevo);
          const k = clave(hoja.filas[f].id, col.clave), previo = hoja.celdas.get(k);
          const anio = estado.anio, mes = estado.mes;
          hoja.celdas.set(k, { ...(previo || {}), ...base(f, c), valor });
          guardar([{ ...base(f, c) }]).then(ok => {
            if (ok || anio !== estado.anio || mes !== estado.mes) return;
            previo ? hoja.celdas.set(k, previo) : hoja.celdas.delete(k);
            pintarCelda(f, c); pintarTotales(); actualizarFormula();
          });
        }
      }
      pintarCelda(f, c); pintarTotales();
      if (mover) moverSel(mover[0], mover[1]); else marcarSeleccion();
      $('#hoja-cont').focus({ preventScroll: true });
    };
    inp.onkeydown = ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); terminar(true, [1, 0]); }
      else if (ev.key === 'Tab') { ev.preventDefault(); terminar(true, [0, ev.shiftKey ? -1 : 1]); }
      else if (ev.key === 'Escape') { ev.preventDefault(); terminar(false); }
      ev.stopPropagation();
    };
    inp.onblur = () => terminar(true);
  }

  function moverSel(df, dc) {
    const nf = hoja.sel.f + df, nc = hoja.sel.c + dc;
    hoja.sel.f = Math.max(0, Math.min(hoja.filas.length - 1, nf));
    hoja.sel.c = Math.max(0, Math.min(config.columnas.length - 1, nc));
    marcarSeleccion();
  }

  async function alternarBloqueoCelda() {
    if (!editable || !hoja.filas.length) return;
    const { f, c } = hoja.sel, r = celdaDe(f, c);
    if (await guardar([{ ...base(f, c), bloqueado: !r?.bloqueado }])) { pintarCelda(f, c); actualizarFormula(); }
  }

  async function bloquearMes(bloq) {
    if (!hoja.filas.length) return;
    const ok = await confirmar(bloq ? 'Bloquear mes' : 'Desbloquear mes',
      bloq ? `Se van a bloquear todas las celdas de ${MESES[estado.mes - 1]} ${estado.anio} en ${config.titulo}. Nadie podrá modificarlas hasta desbloquearlas.`
           : `Se van a desbloquear todas las celdas de ${MESES[estado.mes - 1]} ${estado.anio} en ${config.titulo}.`,
      bloq ? 'Bloquear' : 'Desbloquear');
    if (!ok) return;
    const lista = [];
    hoja.filas.forEach((_, f) => config.columnas.forEach((_, c) => {
      const r = celdaDe(f, c);
      if (bloq || r?.bloqueado) lista.push({ ...base(f, c), bloqueado: bloq });
    }));
    if (lista.length && await guardar(lista)) { pintar(); aviso(bloq ? 'Mes bloqueado.' : 'Mes desbloqueado.'); }
  }

  function exportarCSV() {
    const cols = config.columnas;
    const filas = [['Miembro', 'Grado', ...cols.map(c => c.nombre), 'Total']];
    hoja.filas.forEach((m, f) => {
      let t = 0;
      const vals = cols.map((c, ci) => { const v = celdaDe(f, ci)?.valor ?? ''; if (c.tipo === 'numero') t += numero(v); return v; });
      filas.push([m.nombre, m.grado, ...vals, formatoNum(t)]);
    });
    descargar(`${cat}_${estado.anio}_${pad(estado.mes)}_${MESES[estado.mes - 1]}.csv`, filas.map(f => f.map(celdaCSV).join(';')).join('\r\n'));
  }

  /* eventos */
  $$('[data-anio]', cont).forEach(b => b.onclick = () => { estado.anio += +b.dataset.anio; cargar().catch(fallo); });
  $('#meses').onclick = ev => { const b = ev.target.closest('.mes'); if (b) { estado.mes = +b.dataset.mes; cargar().catch(fallo); } };
  $('#btn-bloq-celda').onclick = alternarBloqueoCelda;
  $('#btn-bloq-mes').onclick = () => bloquearMes(true);
  $('#btn-desbloq-mes').onclick = () => bloquearMes(false);
  $('#btn-csv').onclick = exportarCSV;

  const hc = $('#hoja-cont');
  hc.onclick = ev => {
    const td = ev.target.closest('td[data-f]'); if (!td || hoja.editando) return;
    hoja.sel = { f: +td.dataset.f, c: +td.dataset.c }; marcarSeleccion(); hc.focus({ preventScroll: true });
  };
  hc.ondblclick = ev => { const td = ev.target.closest('td[data-f]'); if (td) empezarEdicion(+td.dataset.f, +td.dataset.c); };
  hc.onkeydown = async ev => {
    if (hoja.editando || !hoja.filas.length) return;
    const { f, c } = hoja.sel;
    const mov = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
    if (mov) { ev.preventDefault(); moverSel(...mov); }
    else if (ev.key === 'Tab') { ev.preventDefault(); moverSel(0, ev.shiftKey ? -1 : 1); }
    else if (ev.key === 'Enter' || ev.key === 'F2') { ev.preventDefault(); empezarEdicion(f, c); }
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'b') { ev.preventDefault(); alternarBloqueoCelda(); }
    else if ((ev.key === 'Delete' || ev.key === 'Backspace') && editable) {
      ev.preventDefault();
      const r = celdaDe(f, c);
      if (r?.bloqueado) return aviso('Esta celda está bloqueada.');
      if (r?.valor != null && await guardar([{ ...base(f, c), valor: null }])) { pintarCelda(f, c); pintarTotales(); actualizarFormula(); }
    }
    else if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); empezarEdicion(f, c, ev.key); }
  };

  // Cambios de otras personas en tiempo real
  let espera;
  estado.limpiezas.push(api.suscribir('registros', p => {
    const n = p?.new || p?.old;
    if (n && n.categoria && (n.categoria !== cat || n.anio !== estado.anio || n.mes !== estado.mes)) return;
    clearTimeout(espera);
    espera = setTimeout(() => { if (!hoja.editando) cargar().catch(fallo); }, 400);
  }));

  await cargar();
  hc.focus({ preventScroll: true });
}

/* ============================================================ MIEMBROS */
const ORDEN_CAT = Object.keys(CATEGORIAS_MIEMBRO);
const BASE_STEAM = 76561197960265728n;

// STEAM_0:X:Y  ->  SteamID64
function steamA64(id) {
  const m = /^STEAM_[0-5]:([01]):(\d+)$/i.exec(String(id || '').trim());
  return m ? String(BASE_STEAM + BigInt(m[2]) * 2n + BigInt(m[1])) : '';
}
// SteamID64  ->  STEAM_0:X:Y
function steamDesde64(s) {
  const t = String(s || '').trim();
  if (!/^7656119\d{10}$/.test(t)) return '';
  const v = BigInt(t) - BASE_STEAM;
  return `STEAM_0:${v % 2n}:${v / 2n}`;
}

// Tiempo transcurrido desde una fecha (AAAA-MM-DD), en lenguaje natural
function antiguedad(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha + 'T00:00:00'), h = new Date();
  h.setHours(0, 0, 0, 0);
  if (d > h) return 'desde el ' + d.toLocaleDateString('es-AR');
  let meses = (h.getFullYear() - d.getFullYear()) * 12 + h.getMonth() - d.getMonth();
  if (h.getDate() < d.getDate()) meses--;
  const ref = new Date(d); ref.setMonth(ref.getMonth() + meses);
  const dias = Math.round((h - ref) / 864e5);
  const anios = Math.floor(meses / 12); meses %= 12;
  const u = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  if (anios) return u(anios, 'año', 'años') + (meses ? ', ' + u(meses, 'mes', 'meses') : '');
  if (meses) return u(meses, 'mes', 'meses') + (dias ? ', ' + u(dias, 'día', 'días') : '');
  return dias ? u(dias, 'día', 'días') : 'hoy';
}

const tieneIconico = m => !!m.nombre_iconico && m.nombre_iconico.trim().toLowerCase() !== 'no';
const ordenarMiembros = lista => lista.sort((a, b) =>
  ORDEN_CAT.indexOf(a.categoria) - ORDEN_CAT.indexOf(b.categoria) || a.nombre.localeCompare(b.nombre));

async function vistaMiembros(cont) {
  let miembros = ordenarMiembros(await api.listarMiembros());
  const filtro = { texto: '', cat: '' };
  const editable = puedeEditar();
  const opcionesCat = Object.entries(CATEGORIAS_MIEMBRO).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('');
  const nCols = editable ? 11 : 10;

  cont.innerHTML = `
    <div class="rejilla" id="resumen-miembros" style="margin-bottom:18px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>
    <div class="herramientas">
      <input class="entrada" id="buscar" placeholder="Buscar nombre, rango, N° clon, SteamID, job…" style="max-width:320px">
      <select class="entrada" id="filtro-cat" style="max-width:220px"><option value="">Todas las categorías</option>${opcionesCat}</select>
      <span class="espacio"></span>
      <button class="btn chico" id="btn-csv-miembros">Exportar CSV</button>
      ${editable ? '<button class="btn primario" id="btn-nuevo">+ Agregar miembro</button>' : ''}
    </div>
    <div class="envoltorio-tabla"><table class="datos tabla-miembros"><thead><tr>
      <th>Rango</th><th>Nombre clon</th><th>N° clon</th><th>Nombre Jedi</th><th>Nombre icónico</th>
      <th>Categoría</th><th>Job habitual</th><th>SteamID</th><th>Antigüedad en el rango</th><th>Estado</th>${editable ? '<th></th>' : ''}
    </tr></thead><tbody id="cuerpo-miembros"></tbody></table></div>
    <p class="ayuda">Clic en un SteamID para copiarlo · el SteamID64 abre el perfil de Steam.</p>`;

  function filaHTML(m) {
    const ant = antiguedad(m.fecha_rango);
    return `<tr class="${m.activo ? '' : 'fila-inactiva'}">
      <td><strong>${esc(m.grado) || '—'}</strong></td>
      <td><strong>${esc(m.nombre)}</strong>${m.notas ? ` <span class="nota" title="${esc(m.notas)}">ⓘ</span>` : ''}</td>
      <td class="mono">${esc(m.numero_clon) || '—'}</td>
      <td>${esc(m.nombre_jedi) || '<span class="tenue">—</span>'}</td>
      <td>${tieneIconico(m) ? `<span class="etiqueta admin">${esc(m.nombre_iconico)}</span>` : '<span class="tenue">No</span>'}</td>
      <td>${esc(CATEGORIAS_MIEMBRO[m.categoria] || m.categoria)}</td>
      <td>${esc(m.job) || '—'}</td>
      <td class="steam">${m.steam_id ? `<button class="copiar mono" data-copiar="${esc(m.steam_id)}" title="Copiar">${esc(m.steam_id)}</button>` : '<span class="tenue">—</span>'}
        ${m.steam_id64 ? `<a class="sub mono" href="https://steamcommunity.com/profiles/${esc(m.steam_id64)}" target="_blank" rel="noopener noreferrer">${esc(m.steam_id64)}</a>` : ''}</td>
      <td>${ant ? `${esc(ant)}<span class="sub">desde ${new Date(m.fecha_rango + 'T00:00:00').toLocaleDateString('es-AR')}</span>` : '<span class="tenue">Sin fecha</span>'}</td>
      <td><span class="etiqueta ${m.activo ? 'admin' : ''}">${m.activo ? 'Activo' : 'Inactivo'}</span></td>
      ${editable ? `<td class="acciones"><button class="btn chico" data-editar="${m.id}">Editar</button>
        <button class="btn chico peligro" data-borrar="${m.id}">Borrar</button></td>` : ''}
    </tr>`;
  }

  function filtrados() {
    const t = filtro.texto.trim().toLowerCase();
    return miembros.filter(m => (!filtro.cat || m.categoria === filtro.cat) && (!t ||
      [m.nombre, m.grado, m.numero_clon, m.nombre_jedi, m.nombre_iconico, m.job, m.steam_id, m.steam_id64]
        .some(v => String(v || '').toLowerCase().includes(t))));
  }

  function pintar() {
    $('#resumen-miembros').innerHTML = Object.entries(CATEGORIAS_MIEMBRO).map(([k, t]) =>
      `<div class="tarjeta tarjeta-link" data-cat="${k}"><div class="dato-grande">${miembros.filter(m => m.categoria === k && m.activo).length}</div>
       <div class="dato-etiqueta">${esc(t)}</div></div>`).join('');
    const lista = filtrados();
    if (!lista.length) {
      $('#cuerpo-miembros').innerHTML = `<tr><td colspan="${nCols}" class="vacio">${miembros.length ? 'Ningún miembro coincide con el filtro.' : 'Todavía no hay miembros cargados.'}</td></tr>`;
      return;
    }
    let html = '';
    for (const cat of ORDEN_CAT) {
      const grupo = lista.filter(m => m.categoria === cat);
      if (!grupo.length) continue;
      html += `<tr class="fila-grupo"><td colspan="${nCols}">${esc(CATEGORIAS_MIEMBRO[cat])} <span>${grupo.length}</span></td></tr>`;
      html += grupo.map(filaHTML).join('');
    }
    const otros = lista.filter(m => !ORDEN_CAT.includes(m.categoria));
    if (otros.length) html += `<tr class="fila-grupo"><td colspan="${nCols}">Sin categoría <span>${otros.length}</span></td></tr>` + otros.map(filaHTML).join('');
    $('#cuerpo-miembros').innerHTML = html;
  }

  function formulario(m = { nombre: '', categoria: filtro.cat || 'suboficiales', grado: '', numero_clon: '', nombre_jedi: '',
    nombre_iconico: 'No', steam_id: '', steam_id64: '', job: '', fecha_rango: '', notas: '', activo: true }) {
    abrirModal(m.id ? `Editar · ${m.grado || ''} ${m.nombre}` : 'Agregar miembro', `
      <form id="form-miembro">
        <div class="fila-campos">
          <label class="campo"><span>Rango</span><input name="grado" maxlength="30" value="${esc(m.grado)}" placeholder="Ej: SGT, TTE°1, MRL"></label>
          <label class="campo"><span>Nombre clon *</span><input name="nombre" required maxlength="60" value="${esc(m.nombre)}"></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>N° de clon</span><input name="numero_clon" maxlength="10" inputmode="numeric" value="${esc(m.numero_clon)}"></label>
          <label class="campo"><span>Categoría</span><select name="categoria">${opcionesCat}</select></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>Nombre Jedi</span><input name="nombre_jedi" maxlength="60" value="${esc(m.nombre_jedi)}" placeholder="Vacío si no tiene"></label>
          <label class="campo"><span>Nombre icónico</span><input name="nombre_iconico" maxlength="60" value="${esc(tieneIconico(m) ? m.nombre_iconico : '')}" placeholder="No"></label>
        </div>
        <label class="campo"><span>Job habitual</span><input name="job" maxlength="80" value="${esc(m.job)}" placeholder="Ej: BU Reconocimiento"></label>
        <div class="fila-campos">
          <label class="campo"><span>SteamID</span><input name="steam_id" maxlength="40" class="mono" value="${esc(m.steam_id)}" placeholder="STEAM_0:0:123456"></label>
          <label class="campo"><span>SteamID64</span><input name="steam_id64" maxlength="20" class="mono" value="${esc(m.steam_id64)}" placeholder="7656119…"></label>
        </div>
        <p class="ayuda" id="aviso-steam" style="margin:-6px 0 12px">Completá uno de los dos y el otro se calcula solo.</p>
        <label class="campo"><span>En el rango actual desde</span><input name="fecha_rango" type="date" value="${esc(m.fecha_rango || '')}"></label>
        <label class="campo"><span>Notas</span><textarea name="notas" maxlength="500">${esc(m.notas)}</textarea></label>
        <label class="interruptor" style="margin-bottom:16px"><input type="checkbox" name="activo" ${m.activo ? 'checked' : ''}>
          <span>Activo<br><small style="color:var(--texto-3)">Los inactivos no aparecen en las tablas, salvo en los meses donde tengan datos.</small></span></label>
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button></div>
      </form>`, c => {
      const f = $('#form-miembro', c);
      f.categoria.value = m.categoria;
      $('[data-cancelar]', c).onclick = cerrarModal;
      f.steam_id.oninput = () => { const v = steamA64(f.steam_id.value); if (v) f.steam_id64.value = v; };
      f.steam_id64.oninput = () => { const v = steamDesde64(f.steam_id64.value); if (v) f.steam_id.value = v; };
      f.onsubmit = async ev => {
        ev.preventDefault();
        const sid = f.steam_id.value.trim(), s64 = f.steam_id64.value.trim();
        if (sid && s64 && steamA64(sid) && steamA64(sid) !== s64) {
          $('#aviso-steam', c).innerHTML = `<span style="color:var(--peligro)">El SteamID y el SteamID64 no coinciden. Para ${esc(sid)} el correcto es ${steamA64(sid)}.</span>`;
          return;
        }
        const repetido = sid && miembros.find(x => x.id !== m.id && x.steam_id === sid);
        if (repetido && !await confirmar('SteamID repetido', `${repetido.grado} ${repetido.nombre} ya tiene ese SteamID. ¿Guardar igual?`, 'Guardar igual')) return formulario(m);
        try {
          const g = await api.guardarMiembro({ ...(m.id ? { id: m.id } : {}),
            nombre: f.nombre.value.trim(), grado: f.grado.value.trim(), categoria: f.categoria.value,
            numero_clon: f.numero_clon.value.trim(), nombre_jedi: f.nombre_jedi.value.trim(),
            nombre_iconico: f.nombre_iconico.value.trim() || 'No', job: f.job.value.trim(),
            steam_id: sid, steam_id64: s64, fecha_rango: f.fecha_rango.value || null,
            notas: f.notas.value.trim(), activo: f.activo.checked });
          miembros = ordenarMiembros(m.id ? miembros.map(x => x.id === g.id ? g : x) : [...miembros, g]);
          cerrarModal(); pintar(); aviso('Miembro guardado.');
        } catch (e) { fallo(e); }
      };
    });
  }

  function exportarCSV() {
    const enc = ['Rango', 'Nombre clon', 'N° clon', 'Nombre Jedi', 'Nombre icónico', 'Categoría', 'Job habitual',
      'SteamID', 'SteamID64', 'En el rango desde', 'Antigüedad en el rango', 'Estado', 'Notas'];
    const filas = filtrados().map(m => [m.grado, m.nombre, m.numero_clon, m.nombre_jedi, tieneIconico(m) ? m.nombre_iconico : 'No',
      CATEGORIAS_MIEMBRO[m.categoria] || m.categoria, m.job, m.steam_id, m.steam_id64, m.fecha_rango || '',
      antiguedad(m.fecha_rango), m.activo ? 'Activo' : 'Inactivo', m.notas]);
    // El ="..." evita que Excel convierta el SteamID64 en notación científica
    descargar('miembros_legion.csv', [enc, ...filas].map(r => r.map((v, i) => i === 8 && v ? `="${v}"` : celdaCSV(v)).join(';')).join('\r\n'));
  }

  $('#buscar').oninput = e => { filtro.texto = e.target.value; pintar(); };
  $('#filtro-cat').onchange = e => { filtro.cat = e.target.value; pintar(); };
  $('#resumen-miembros').onclick = ev => {
    const t = ev.target.closest('[data-cat]'); if (!t) return;
    filtro.cat = filtro.cat === t.dataset.cat ? '' : t.dataset.cat; $('#filtro-cat').value = filtro.cat; pintar();
  };
  $('#btn-csv-miembros').onclick = exportarCSV;
  if (editable) $('#btn-nuevo').onclick = () => formulario();
  $('#cuerpo-miembros').onclick = async ev => {
    const cp = ev.target.closest('[data-copiar]');
    if (cp) {
      try { await navigator.clipboard.writeText(cp.dataset.copiar); aviso('SteamID copiado.'); } catch { aviso('No se pudo copiar.', 'error'); }
      return;
    }
    const ed = ev.target.closest('[data-editar]'), bo = ev.target.closest('[data-borrar]');
    if (ed) formulario(miembros.find(m => m.id == ed.dataset.editar));
    if (bo) {
      const m = miembros.find(x => x.id == bo.dataset.borrar);
      if (!await confirmar('Borrar miembro', `¿Borrar a ${m.grado} ${m.nombre}? También se borran TODOS sus registros de actividad. Si solo dejó la legión, mejor marcalo como inactivo.`, 'Borrar')) return;
      try { await api.borrarMiembro(m.id); miembros = miembros.filter(x => x.id !== m.id); pintar(); aviso('Miembro borrado.'); } catch (e) { fallo(e); }
    }
  };
  estado.limpiezas.push(api.suscribir('miembros', async () => {
    if (!$('#modal-fondo').hidden) return;
    try { miembros = ordenarMiembros(await api.listarMiembros()); pintar(); } catch {}
  }));
  pintar();
}

/* ============================================================ CALENDARIO */
async function vistaCalendario(cont) {
  const editable = puedeEditar();
  cont.innerHTML = `
    <div class="cal-cabecera">
      <button class="btn chico" data-mov="-1" aria-label="Mes anterior">‹</button>
      <h2 id="cal-titulo"></h2>
      <button class="btn chico" data-mov="1" aria-label="Mes siguiente">›</button>
      <button class="btn chico" id="cal-hoy">Hoy</button>
      <span class="espacio" style="flex:1"></span>
      ${editable ? '<button class="btn primario" id="cal-nuevo">+ Nuevo evento</button>' : ''}
    </div>
    <div class="cal" id="cal"></div>
    <div class="leyenda">${TIPOS_EVENTO.map(t => `<span><i class="punto" style="background:${t.color}"></i>${esc(t.nombre)}</span>`).join('')}</div>`;

  let eventos = [];

  async function cargar() {
    const { anio, mes } = estado.cal;
    $('#cal-titulo').textContent = `${MESES[mes - 1]} ${anio}`;
    const primero = new Date(anio, mes - 1, 1);
    const inicio = new Date(anio, mes - 1, 1 - ((primero.getDay() + 6) % 7));
    const dias = Array.from({ length: 42 }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
    eventos = await api.listarEventos(fechaISO(dias[0]), fechaISO(dias[41]));
    const hoy = fechaISO(new Date());
    $('#cal').innerHTML = DIAS.map(d => `<div class="cal-dia-nombre">${d}</div>`).join('') + dias.map(d => {
      const iso = fechaISO(d);
      const evs = eventos.filter(e => e.fecha === iso);
      return `<div class="cal-dia ${d.getMonth() !== mes - 1 ? 'fuera' : ''} ${iso === hoy ? 'hoy' : ''} ${editable ? 'puede' : ''}" data-fecha="${iso}">
        <span class="cal-num">${d.getDate()}</span>
        ${evs.map(e => `<button class="cal-evento" style="background:${colorTipo(e.tipo)}" data-evento="${e.id}" title="${esc((e.hora ? e.hora + ' · ' : '') + e.titulo)}">${e.hora ? esc(e.hora) + ' ' : ''}${esc(e.titulo)}</button>`).join('')}
      </div>`;
    }).join('');
  }

  function formulario(e) {
    const soloVer = !editable;
    const opciones = TIPOS_EVENTO.map(t => `<option ${t.nombre === e.tipo ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('');
    abrirModal(soloVer ? e.titulo : (e.id ? 'Editar evento' : 'Nuevo evento'), soloVer ? `
      <p class="dato-etiqueta" style="margin:0 0 6px"><i class="punto" style="display:inline-block;background:${colorTipo(e.tipo)}"></i> ${esc(e.tipo)}</p>
      <p style="margin:0 0 12px"><strong>${esc(new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</strong>${e.hora ? ' · ' + esc(e.hora) : ''}</p>
      <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 16px">${esc(e.descripcion) || '<span style="color:var(--texto-3)">Sin descripción.</span>'}</p>
      <div class="modal-pie"><button class="btn" data-cancelar>Cerrar</button></div>` : `
      <form id="form-evento">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="100" value="${esc(e.titulo)}"></label>
        <div class="fila-campos">
          <label class="campo"><span>Fecha</span><input name="fecha" type="date" required value="${esc(e.fecha)}"></label>
          <label class="campo"><span>Hora</span><input name="hora" type="time" value="${esc(e.hora)}"></label>
        </div>
        <label class="campo"><span>Tipo</span><select name="tipo">${opciones}</select></label>
        <label class="campo"><span>Descripción</span><textarea name="descripcion" maxlength="1000">${esc(e.descripcion)}</textarea></label>
        <div class="modal-pie">
          ${e.id ? '<button type="button" class="btn peligro izq" data-borrar>Borrar</button>' : ''}
          <button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button>
        </div>
      </form>`, c => {
      $('[data-cancelar]', c).onclick = cerrarModal;
      if (soloVer) return;
      $('#form-evento', c).onsubmit = async ev => {
        ev.preventDefault(); const f = ev.target;
        try {
          await api.guardarEvento({ ...(e.id ? { id: e.id } : {}), titulo: f.titulo.value.trim(), fecha: f.fecha.value,
            hora: f.hora.value, tipo: f.tipo.value, descripcion: f.descripcion.value.trim() });
          cerrarModal(); aviso('Evento guardado.'); await cargar();
        } catch (er) { fallo(er); }
      };
      const b = $('[data-borrar]', c);
      if (b) b.onclick = async () => {
        if (!await confirmar('Borrar evento', `¿Borrar "${e.titulo}"?`, 'Borrar')) return;
        try { await api.borrarEvento(e.id); aviso('Evento borrado.'); await cargar(); } catch (er) { fallo(er); }
      };
    });
  }

  const nuevo = fecha => ({ titulo: '', fecha, hora: '', tipo: TIPOS_EVENTO[0]?.nombre || '', descripcion: '' });
  $$('[data-mov]', cont).forEach(b => b.onclick = () => {
    const d = new Date(estado.cal.anio, estado.cal.mes - 1 + +b.dataset.mov, 1);
    estado.cal = { anio: d.getFullYear(), mes: d.getMonth() + 1 }; cargar().catch(fallo);
  });
  $('#cal-hoy').onclick = () => { const d = new Date(); estado.cal = { anio: d.getFullYear(), mes: d.getMonth() + 1 }; cargar().catch(fallo); };
  if (editable) $('#cal-nuevo').onclick = () => formulario(nuevo(fechaISO(new Date())));
  $('#cal').onclick = ev => {
    const be = ev.target.closest('[data-evento]');
    if (be) return formulario(eventos.find(e => e.id == be.dataset.evento));
    const dia = ev.target.closest('[data-fecha]');
    if (dia && editable) formulario(nuevo(dia.dataset.fecha));
  };
  estado.limpiezas.push(api.suscribir('eventos', () => { if ($('#modal-fondo').hidden) cargar().catch(() => {}); }));
  await cargar();
}

/* ============================================================ REGLAMENTO */
async function vistaReglamento(cont) {
  let filas = await api.listarReglamento();
  const editable = puedeEditar();
  const cols = COLUMNAS_REGLAMENTO;

  cont.innerHTML = `
    <div class="herramientas">
      <p style="margin:0;color:var(--texto-2)">Normas y horarios de las actividades. Las filas bloqueadas 🔒 no se pueden modificar hasta desbloquearlas.</p>
      <span class="espacio"></span>
      <button class="btn chico" id="btn-csv-reg">Exportar CSV</button>
      ${editable ? '<button class="btn primario" id="btn-fila">+ Agregar fila</button>' : ''}
    </div>
    <div class="envoltorio-tabla"><table class="datos"><thead><tr>
      ${cols.map(c => `<th>${esc(c.nombre)}</th>`).join('')}${editable ? '<th></th>' : ''}
    </tr></thead><tbody id="cuerpo-reg"></tbody></table></div>`;

  function pintar() {
    $('#cuerpo-reg').innerHTML = filas.length ? filas.map(f => {
      const bloq = f.bloqueado || !editable;
      return `<tr class="${f.bloqueado ? 'bloqueada' : ''}" data-id="${f.id}">
        ${cols.map(c => `<td class="editable"><textarea rows="1" data-col="${c.clave}" ${bloq ? 'readonly' : ''}>${esc(f.datos?.[c.clave])}</textarea></td>`).join('')}
        ${editable ? `<td class="acciones"><button class="btn chico" data-bloq title="${f.bloqueado ? 'Desbloquear' : 'Bloquear'} fila">${f.bloqueado ? '🔓' : '🔒'}</button>
          <button class="btn chico peligro" data-borrar ${f.bloqueado ? 'disabled' : ''}>Borrar</button></td>` : ''}
      </tr>`;
    }).join('') : `<tr><td colspan="${cols.length + 1}" class="vacio">Todavía no hay filas en el reglamento.</td></tr>`;
    $$('#cuerpo-reg textarea').forEach(ajustarAlto);
  }
  function ajustarAlto(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

  const filaDe = el => filas.find(f => f.id == el.closest('tr').dataset.id);
  const cuerpo = $('#cuerpo-reg');
  cuerpo.addEventListener('input', ev => { if (ev.target.tagName === 'TEXTAREA') ajustarAlto(ev.target); });
  cuerpo.addEventListener('change', async ev => {
    if (ev.target.tagName !== 'TEXTAREA') return;
    const f = filaDe(ev.target);
    const datos = { ...f.datos, [ev.target.dataset.col]: ev.target.value.trim() };
    try { const g = await api.guardarFilaReglamento({ id: f.id, datos }); Object.assign(f, g); aviso('Guardado.'); } catch (e) { fallo(e); }
  });
  cuerpo.addEventListener('click', async ev => {
    const bq = ev.target.closest('[data-bloq]'), bo = ev.target.closest('[data-borrar]');
    if (bq) {
      const f = filaDe(bq);
      try { Object.assign(f, await api.guardarFilaReglamento({ id: f.id, bloqueado: !f.bloqueado })); pintar(); } catch (e) { fallo(e); }
    }
    if (bo) {
      const f = filaDe(bo);
      if (!await confirmar('Borrar fila', '¿Borrar esta fila del reglamento?', 'Borrar')) return;
      try { await api.borrarFilaReglamento(f.id); filas = filas.filter(x => x.id !== f.id); pintar(); } catch (e) { fallo(e); }
    }
  });
  if (editable) $('#btn-fila').onclick = async () => {
    try {
      const n = await api.guardarFilaReglamento({ orden: (filas.at(-1)?.orden || 0) + 1, datos: {}, bloqueado: false });
      filas.push(n); pintar();
      $(`tr[data-id="${n.id}"] textarea`).focus();
    } catch (e) { fallo(e); }
  };
  $('#btn-csv-reg').onclick = () => descargar('reglamento_calendario.csv',
    [cols.map(c => c.nombre), ...filas.map(f => cols.map(c => f.datos?.[c.clave] ?? ''))].map(r => r.map(celdaCSV).join(';')).join('\r\n'));
  estado.limpiezas.push(api.suscribir('reglamento', async () => {
    if (document.activeElement?.closest?.('#cuerpo-reg')) return;
    try { filas = await api.listarReglamento(); pintar(); } catch {}
  }));
  pintar();
}

/* ============================================================ USUARIOS */
async function vistaUsuarios(cont) {
  if (!esAdmin()) { cont.innerHTML = '<div class="vacio">Solo los administradores pueden ver esta sección.</div>'; return; }
  let perfiles = await api.listarPerfiles();
  estado.ajustes = await api.obtenerAjustes();

  cont.innerHTML = `
    <div class="tarjeta" style="margin-bottom:18px">
      <label class="interruptor"><input type="checkbox" id="modo-abierto" ${estado.ajustes.modo_abierto === true ? 'checked' : ''}>
        <span><strong>Modo abierto</strong><br><span style="color:var(--texto-2)">Mientras esté activo, cualquier cuenta registrada puede editar tablas, miembros, calendario y reglamento.
        Desactivalo cuando quieras que solo los Administradores editen (los Usuarios quedan en solo lectura).</span></span></label>
    </div>
    <div class="envoltorio-tabla"><table class="datos"><thead><tr><th>Nombre</th><th>Email</th><th>Rango</th><th>Registrado</th></tr></thead>
    <tbody id="cuerpo-usuarios"></tbody></table></div>
    <p class="ayuda">Los rangos nuevos se agregan en <code>js/config.js</code> (RANGOS). Cada sección del menú tiene un "rangoMinimo" para limitar quién la ve.</p>`;

  const opciones = r => Object.entries(RANGOS).map(([n, t]) => `<option value="${n}" ${+n === r ? 'selected' : ''}>${n} · ${esc(t)}</option>`).join('');
  function pintar() {
    $('#cuerpo-usuarios').innerHTML = perfiles.map(p => `<tr>
      <td><strong>${esc(p.nombre)}</strong>${p.id === estado.perfil.id ? ' <span class="etiqueta">vos</span>' : ''}</td>
      <td style="color:var(--texto-2)">${esc(p.email)}</td>
      <td><select class="entrada" style="height:32px;max-width:200px" data-id="${p.id}">${opciones(p.rango)}</select></td>
      <td style="color:var(--texto-2)">${p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-AR') : ''}</td></tr>`).join('');
  }

  $('#cuerpo-usuarios').onchange = async ev => {
    const sel = ev.target; const p = perfiles.find(x => String(x.id) === sel.dataset.id); const nuevo = +sel.value;
    const admins = perfiles.filter(x => x.rango >= 2).length;
    if (p.rango >= 2 && nuevo < 2 && admins <= 1) { aviso('Tiene que quedar al menos un Administrador.', 'error'); sel.value = p.rango; return; }
    if (p.id === estado.perfil.id && nuevo < 2 && !await confirmar('Quitarte el rango', 'Vas a dejar de ser Administrador y perderás acceso a esta sección.', 'Continuar')) { sel.value = p.rango; return; }
    try {
      await api.cambiarRango(p.id, nuevo); p.rango = nuevo; aviso(`${p.nombre}: ${nombreRango(nuevo)}.`);
      if (p.id === estado.perfil.id) { estado.perfil.rango = nuevo; entrarApp(estado.perfil); }
    } catch (e) { fallo(e); sel.value = p.rango; }
  };
  $('#modo-abierto').onchange = async ev => {
    try { await api.guardarAjuste('modo_abierto', ev.target.checked); estado.ajustes.modo_abierto = ev.target.checked; pintarChipPermiso(); aviso('Ajuste guardado.'); }
    catch (e) { fallo(e); ev.target.checked = !ev.target.checked; }
  };
  pintar();
}

/* ------------------------------------------------------------ arranque */
async function arrancar() {
  $$('[data-nombre-sitio]').forEach(e => e.textContent = NOMBRE_SITIO);
  $$('[data-demo]').forEach(e => e.hidden = !MODO_DEMO);
  iniciarAcceso();
  $('#btn-salir').onclick = async () => { await api.salir(); estado.perfil = null; location.hash = ''; mostrarAcceso(); };
  $('#btn-menu').onclick = () => $('#app').classList.toggle('menu-abierto');
  $('#cortina').onclick = () => $('#app').classList.remove('menu-abierto');
  $('#modal-cerrar').onclick = cerrarModal;
  $('#modal-fondo').onclick = ev => { if (ev.target.id === 'modal-fondo') cerrarModal(); };
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal-fondo').hidden) cerrarModal(); });
  window.addEventListener('hashchange', navegar);

  try {
    const perfil = await api.sesionActual();
    perfil ? await entrarApp(perfil) : mostrarAcceso();
  } catch (e) { fallo(e); mostrarAcceso(); }
}

arrancar();
