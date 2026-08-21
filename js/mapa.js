/**
 * Mapa de captura: pins, preview y atrapar.
 */
import { irA } from './router.js';
import { mostrarAviso } from './ui.js';
import {
  listarArriendos,
  idsAtrapados,
  atraparArriendo,
  puedeAtrapar,
  estadoJuego,
  obtenerArriendo,
} from './juego.js';
let seleccionId = null;
let filtroTipo = 'todos';
let filtroBarrio = '';

const PIN_SVG = `
<svg width="26" height="26" viewBox="0 0 24 24" fill="none">
  <path d="M12 22s7-7.58 7-12.5A7 7 0 1 0 5 9.5C5 14.42 12 22 12 22Z" fill="currentColor"/>
  <circle cx="12" cy="9.5" r="2.5" fill="#10151b"/>
</svg>`;

function actualizarHud() {
  const juego = estadoJuego();
  const hud = document.getElementById('hud-puntos');
  if (hud) hud.textContent = `${juego.puntos} pts · radio ${juego.radio}`;
  actualizarRadarVisual();
}

/** Distancia al marcador del jugador (centro del mapa ~50%, 50%). */
function distanciaAlJugador(arriendo) {
  const dx = (arriendo.left ?? 50) - 50;
  const dy = (arriendo.top ?? 50) - 50;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Radio 1 ≈ 35 unidades del mapa; cada nivel suma ~12.
 * Así la mejora "Radar extendido" revela más pins.
 */
export function radioMaximo() {
  const nivel = estadoJuego().radio || 1;
  return 35 + (nivel - 1) * 12;
}

/** Dibuja el anillo de alcance según el nivel de radar del jugador. */
function actualizarRadarVisual() {
  const anillo = document.getElementById('radar-anillo');
  if (!anillo) return;
  // radioMaximo está en % del mapa (0–100); el diámetro CSS usa el doble
  const diametro = Math.min(radioMaximo() * 2, 120);
  anillo.style.setProperty('--radar-diametro', `${diametro}%`);
}

function arriendosFiltrados() {
  const max = radioMaximo();
  return listarArriendos().filter((a) => {
    const tipoOk = filtroTipo === 'todos' || a.tipo === filtroTipo;
    const barrioOk =
      !filtroBarrio ||
      a.barrio.toLowerCase().includes(filtroBarrio) ||
      a.titulo.toLowerCase().includes(filtroBarrio);
    const enRadio = distanciaAlJugador(a) <= max;
    return tipoOk && barrioOk && enRadio;
  });
}

function renderPins() {
  const cont = document.getElementById('pins-container');
  if (!cont) return;

  const atrapados = idsAtrapados();
  const lista = arriendosFiltrados();

  cont.innerHTML = lista
    .map((a) => {
      const clases = ['pin', a.rareza === 'raro' ? 'raro' : '', a.rareza === 'epico' ? 'epico' : '', atrapados.has(a.id) ? 'atrapado' : '']
        .filter(Boolean)
        .join(' ');
      return `<button type="button" class="${clases}" style="top:${a.top}%;left:${a.left}%;" data-arriendo="${a.id}" aria-label="${a.titulo}">${PIN_SVG}</button>`;
    })
    .join('');

  cont.querySelectorAll('.pin').forEach((pin) => {
    pin.addEventListener('click', () => {
      pin.classList.add('animate__animated', 'animate__bounceIn');
      mostrarPreview(pin.getAttribute('data-arriendo'));
    });
  });
}

function mostrarPreview(id) {
  const a = obtenerArriendo(id);
  const sheet = document.getElementById('preview-sheet');
  if (!a || !sheet) return;

  seleccionId = id;
  document.getElementById('preview-titulo').textContent = a.titulo;
  document.getElementById('preview-meta').textContent = `${a.barrio} · ${a.rareza}`;
  document.getElementById('preview-precio').textContent = a.precioTexto;

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
  renderPins();
  mostrarPreview(seleccionId);
  Promise.all([
    import('./inventario.js').then((m) => m.pintarInventario()),
    import('./perfil.js').then((m) => m.pintarPerfil()),
    import('./tienda.js').then((m) => m.pintarTienda()),
  ]);
}

export function abrirDetalleDesdeMapa(id) {
  const idUsar = id || seleccionId;
  if (!idUsar) return;
  window.__detalleId = idUsar;
  window.__detalleOrigen = 'mapa';
  import('./detalle.js').then(({ pintarDetalle }) => {
    pintarDetalle(idUsar);
    irA('detalle');
  });
}

export function iniciarMapa() {
  actualizarHud();
  renderPins();

  document.getElementById('tipo-chips')?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#tipo-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filtroTipo = chip.getAttribute('data-tipo') || 'todos';
    renderPins();
  });

  document.getElementById('buscar-barrio')?.addEventListener('input', (ev) => {
    filtroBarrio = ev.target.value.trim().toLowerCase();
    renderPins();
  });

  document.getElementById('btn-atrapar')?.addEventListener('click', ejecutarAtrapar);
  document.getElementById('btn-ver-detalle')?.addEventListener('click', () => abrirDetalleDesdeMapa());

  document.getElementById('map-area')?.addEventListener('click', (ev) => {
    if (ev.target.closest('.pin') || ev.target.closest('#preview-sheet')) return;
    ocultarPreview();
  });

  document.getElementById('btn-detalle-atrapar')?.addEventListener('click', () => {
    seleccionId = window.__detalleId;
    ejecutarAtrapar();
  });
}

export function refrescarMapa() {
  actualizarHud();
  renderPins();
}
