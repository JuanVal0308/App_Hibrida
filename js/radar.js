/**
 * Radar de zonas: sustituye al mapa GPS. Sin coordenadas ni red: agrupa los
 * arriendos del ciclo activo por barrio y los revela al "escanear" la zona.
 */
import { irA } from './router.js';
import { mostrarAviso } from './ui.js';
import {
  listarArriendos,
  idsAtrapados,
  idsVisiblesEnMapa,
  atraparArriendo,
  puedeAtrapar,
  estadoJuego,
  obtenerArriendo,
  obtenerArriendoEnMapa,
  formatearCuentaRotacion,
  iniciarRotacionTimer,
  verificarRotacionPendiente,
} from './juego.js';

let seleccionId = null;
let filtroTipo = 'todos';
let filtroZona = '';
let escaneoEnCurso = null;
let hudTick = null;
const zonasEscaneadas = new Set();

/** Nivel de radar (mejora "Radar extendido"): acorta el tiempo de escaneo. */
function nivelRadar() {
  return estadoJuego().radio || 1;
}

function duracionEscaneoMs() {
  return Math.max(500, 1200 - (nivelRadar() - 1) * 150);
}

function actualizarHud() {
  const juego = estadoJuego();
  const hud = document.getElementById('hud-puntos');
  if (!hud) return;
  const cuenta = formatearCuentaRotacion();
  hud.textContent = `${juego.puntos} pts · rota ${cuenta} · radar nv.${nivelRadar()}`;
}

function arriendosFiltrados() {
  return listarArriendos().filter((a) => filtroTipo === 'todos' || a.tipo === filtroTipo);
}

function agruparPorZona(lista) {
  const zonas = new Map();
  lista.forEach((a) => {
    if (!zonas.has(a.barrio)) zonas.set(a.barrio, []);
    zonas.get(a.barrio).push(a);
  });
  return zonas;
}

function zonasFiltradas() {
  const zonas = agruparPorZona(arriendosFiltrados());
  const termino = filtroZona.trim().toLowerCase();
  if (!termino) return zonas;
  const filtradas = new Map();
  zonas.forEach((items, barrio) => {
    if (barrio.toLowerCase().includes(termino)) filtradas.set(barrio, items);
  });
  return filtradas;
}

function colorRareza(rareza) {
  if (rareza === 'epico') return '#1e8449';
  if (rareza === 'raro') return '#8656c4';
  return '#3e6ea3';
}

function renderZonas() {
  const cont = document.getElementById('radar-zonas');
  if (!cont) return;

  const zonas = zonasFiltradas();
  const atrapados = idsAtrapados();

  if (!zonas.size) {
    cont.innerHTML = '<p class="radar-vacio small muted">No hay zonas con señales activas ahora mismo.</p>';
    return;
  }

  cont.innerHTML = [...zonas.entries()]
    .map(([barrio, items]) => {
      const escaneada = zonasEscaneadas.has(barrio);
      const escaneando = escaneoEnCurso === barrio;

      if (!escaneada) {
        return `
          <article class="zona-card ${escaneando ? 'escaneando' : ''}" data-zona="${barrio}">
            <div class="zona-cabecera">
              <span class="zona-nombre">${barrio}</span>
              <span class="zona-badge">${items.length} señal${items.length === 1 ? '' : 'es'}</span>
            </div>
            <div class="zona-radar-visual" aria-hidden="true">
              <span class="zona-radar-anillo"></span>
              <span class="zona-radar-anillo"></span>
              <span class="zona-radar-punto"></span>
            </div>
            <button type="button" class="btn-outline btn-animar btn-escanear" data-escanear="${barrio}" ${escaneando ? 'disabled' : ''}>
              ${escaneando ? 'Escaneando…' : 'Escanear zona'}
            </button>
          </article>`;
      }

      const pendientes = items.filter((a) => !atrapados.has(a.id)).length;

      return `
        <article class="zona-card escaneada">
          <div class="zona-cabecera">
            <span class="zona-nombre">${barrio}</span>
            <span class="zona-badge">${pendientes}/${items.length} disponibles</span>
          </div>
          <div class="zona-items">
            ${items
              .map((a) => {
                const atrapado = atrapados.has(a.id);
                return `
                <button type="button" class="zona-item animate__animated animate__zoomIn ${atrapado ? 'atrapado' : ''}" data-id="${a.id}">
                  <span class="zona-item-dot" style="background:${colorRareza(a.rareza)}"></span>
                  <span class="zona-item-info">
                    <span class="zona-item-titulo">${a.titulo}</span>
                    <span class="zona-item-meta">${a.tipo} · +${a.puntos} pts</span>
                  </span>
                  ${atrapado ? '<span class="zona-item-check">✓</span>' : ''}
                </button>`;
              })
              .join('')}
          </div>
        </article>`;
    })
    .join('');

  cont.querySelectorAll('[data-escanear]').forEach((btn) => {
    btn.addEventListener('click', () => escanearZona(btn.getAttribute('data-escanear')));
  });

  cont.querySelectorAll('.zona-item').forEach((el) => {
    el.addEventListener('click', () => mostrarPreview(el.getAttribute('data-id')));
  });
}

function escanearZona(barrio) {
  if (!barrio || zonasEscaneadas.has(barrio) || escaneoEnCurso) return;
  escaneoEnCurso = barrio;
  renderZonas();

  setTimeout(() => {
    zonasEscaneadas.add(barrio);
    escaneoEnCurso = null;
    renderZonas();
  }, duracionEscaneoMs());
}

function fotoPrincipal(arriendo) {
  const fotos = arriendo.fotos || [];
  return fotos[0] || '/fotos/apto-salon.svg';
}

function mostrarPreview(id) {
  const a = obtenerArriendoEnMapa(id);
  const sheet = document.getElementById('preview-sheet');
  if (!a || !sheet) return;

  if (!idsVisiblesEnMapa().has(id)) {
    ocultarPreview();
    mostrarAviso('Esta señal ya no está activa en el radar.', 'info');
    renderZonas();
    return;
  }

  seleccionId = id;

  const thumb = document.getElementById('preview-thumb');
  const src = fotoPrincipal(obtenerArriendo(id) || a);
  thumb.innerHTML = `<img src="${src}" alt="${a.titulo}" width="56" height="56" onerror="this.src='/fotos/apto-salon.svg'" />`;

  document.getElementById('preview-titulo').textContent = a.titulo;
  document.getElementById('preview-meta').textContent =
    `${a.barrio} · ${a.habitaciones} hab · ${a.banos} baños · ${a.metros} m²`;
  document.getElementById('preview-precio').textContent = a.precioTexto;

  const desc = document.getElementById('preview-desc');
  if (desc) desc.textContent = a.descripcion || '';

  const atrapados = idsAtrapados();
  const btn = document.getElementById('btn-atrapar');
  if (atrapados.has(id)) {
    btn.textContent = 'Ya atrapado';
    btn.disabled = true;
  } else {
    btn.textContent = `Atrapar (+${a.puntos})`;
    btn.disabled = false;
  }

  sheet.classList.remove('oculto');
  sheet.classList.add('animate__animated', 'animate__slideInUp');
}

function ocultarPreview() {
  const sheet = document.getElementById('preview-sheet');
  if (sheet) sheet.classList.add('oculto');
  seleccionId = null;
}

function flashCaptura() {
  const flash = document.getElementById('captura-flash');
  if (!flash) return;
  const texto = flash.querySelector('.captura-texto');
  flash.hidden = false;
  texto.classList.add('animate__bounceIn');
  setTimeout(() => {
    flash.hidden = true;
    texto.classList.remove('animate__bounceIn');
  }, 900);
}

function ejecutarAtrapar() {
  if (!seleccionId) return;

  const chequeo = puedeAtrapar(seleccionId);
  if (!chequeo.ok) {
    mostrarAviso(chequeo.motivo, 'error');
    if (chequeo.motivo.includes('Inventario')) irA('tienda');
    return;
  }

  const res = atraparArriendo(seleccionId);
  if (!res.ok) {
    mostrarAviso(res.motivo, 'error');
    return;
  }

  flashCaptura();
  mostrarAviso(`¡Atrapado! +${res.puntosGanados} pts`, 'success');
  actualizarHud();
  renderZonas();
  mostrarPreview(seleccionId);
  Promise.all([
    import('./inventario.js').then((m) => m.pintarInventario()),
    import('./perfil.js').then((m) => m.pintarPerfil()),
    import('./tienda.js').then((m) => m.pintarTienda()),
  ]);
}

function alRotarSpawns(res) {
  if (seleccionId && res?.quitados?.includes(seleccionId)) {
    ocultarPreview();
  }

  if (res?.quitados?.length || res?.agregados?.length) {
    // Las señales cambiaron: hay que volver a escanear las zonas.
    zonasEscaneadas.clear();
    const n = res?.agregados?.length || 0;
    if (n) {
      mostrarAviso(`Rotación del radar: ${n} señal${n > 1 ? 'es' : ''} nueva${n > 1 ? 's' : ''} detectada${n > 1 ? 's' : ''}.`, 'info');
    }
  }

  actualizarHud();
  renderZonas();
}

function iniciarHudTick() {
  if (hudTick) clearInterval(hudTick);
  hudTick = setInterval(actualizarHud, 30000);
}

export function abrirDetalleDesdeRadar(id) {
  const idUsar = id || seleccionId;
  if (!idUsar) return;
  window.__detalleId = idUsar;
  window.__detalleOrigen = 'radar';
  import('./detalle.js').then(({ pintarDetalle }) => {
    pintarDetalle(idUsar);
    irA('detalle');
  });
}

export function iniciarRadar() {
  actualizarHud();
  iniciarHudTick();
  iniciarRotacionTimer(alRotarSpawns);

  document.getElementById('tipo-chips')?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#tipo-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filtroTipo = chip.getAttribute('data-tipo') || 'todos';
    renderZonas();
  });

  document.getElementById('buscar-barrio')?.addEventListener('input', (ev) => {
    filtroZona = ev.target.value;
    renderZonas();
  });

  document.getElementById('btn-atrapar')?.addEventListener('click', ejecutarAtrapar);
  document.getElementById('btn-ver-detalle')?.addEventListener('click', () => abrirDetalleDesdeRadar());

  document.getElementById('btn-detalle-atrapar')?.addEventListener('click', () => {
    seleccionId = window.__detalleId;
    ejecutarAtrapar();
  });
}

export function refrescarRadar() {
  const rotacion = verificarRotacionPendiente();
  if (rotacion) {
    alRotarSpawns(rotacion);
    return;
  }
  actualizarHud();
  renderZonas();
}
