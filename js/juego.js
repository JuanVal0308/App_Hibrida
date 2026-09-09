/**
 * Lógica del juego: puntos, captura, rotación de spawns y estado del jugador.
 */
import { obtenerJuego, guardarJuego } from './auth.js';
import arriendosData from '../json/arriendos.json';
import mejorasData from '../json/mejoras.json';
import { obtenerZonasDescargadas } from './actualizar.js';

export const ROTACION_INTERVAL_MS = 20 * 60 * 1000;
const SPAWN_BASE = 8;
const SPAWN_CAMBIO_MIN = 2;
const SPAWN_CAMBIO_MAX = 3;

const MEDELLIN_BOUNDS = {
  latMin: 6.12,
  latMax: 6.32,
  lngMin: -75.65,
  lngMax: -75.53,
};

/** Catálogo completo (inventario, detalle, datos fijos + zonas descargadas). */
export function catalogoArriendos() {
  const zonasDescargadas = obtenerZonasDescargadas();
  const apartamentosExtra = [];
  
  Object.values(zonasDescargadas).forEach(zona => {
    if (zona.apartamentos && Array.isArray(zona.apartamentos)) {
      apartamentosExtra.push(...zona.apartamentos);
    }
  });
  
  return [...arriendosData, ...apartamentosExtra];
}

/** Arriendos visibles en el mapa con posición de spawn activa. */
export function listarArriendos() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  const rot = juego.rotacion;
  return rot.visibleIds
    .map((id) => {
      const base = catalogoArriendos().find((a) => a.id === id);
      if (!base) return null;
      const pos = rot.posiciones[id];
      if (pos) return { ...base, lat: pos.lat, lng: pos.lng };
      return base;
    })
    .filter(Boolean);
}

export function obtenerArriendo(id) {
  return catalogoArriendos().find((a) => a.id === id) || null;
}

/** Arriendo con coordenadas del spawn activo (mapa / captura). */
export function obtenerArriendoEnMapa(id) {
  return listarArriendos().find((a) => a.id === id) || obtenerArriendo(id);
}

export function idsVisiblesEnMapa() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  return new Set(juego.rotacion.visibleIds);
}

export function listarMejorasCatalogo() {
  return mejorasData;
}

export function estadoJuego() {
  return obtenerJuego();
}

export function idsAtrapados() {
  return new Set(estadoJuego().capturas.map((c) => c.id));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function spawnVisibleCount(juego) {
  const senalesExtra = (juego.mejorasCompradas || []).filter((id) => id === 'senales_extra').length * 2;
  return SPAWN_BASE + senalesExtra;
}

function shuffle(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Desplaza un pin 300–800 m alrededor de su barrio (clamp al valle). */
export function calcularPosicionSpawn(arriendo) {
  const distM = randomBetween(300, 800);
  const angulo = randomBetween(0, 2 * Math.PI);
  const dLat = (distM * Math.cos(angulo)) / 111320;
  const dLng = (distM * Math.sin(angulo)) / (111320 * Math.cos((arriendo.lat * Math.PI) / 180));
  const lat = Math.max(MEDELLIN_BOUNDS.latMin, Math.min(MEDELLIN_BOUNDS.latMax, arriendo.lat + dLat));
  const lng = Math.max(MEDELLIN_BOUNDS.lngMin, Math.min(MEDELLIN_BOUNDS.lngMax, arriendo.lng + dLng));
  return { lat, lng };
}

function seedRotacionInicial(juego) {
  const visibles = spawnVisibleCount(juego);
  const ids = shuffle(catalogoArriendos().map((a) => a.id)).slice(0, visibles);
  const posiciones = {};
  ids.forEach((id) => {
    const base = obtenerArriendo(id);
    if (base) posiciones[id] = calcularPosicionSpawn(base);
  });
  juego.rotacion = {
    visibleIds: ids,
    posiciones,
    zonasEscaneadas: [],
    nextAt: Date.now() + ROTACION_INTERVAL_MS,
  };
  guardarJuego(juego);
}

export function asegurarRotacion(juego = estadoJuego()) {
  if (!juego.rotacion?.visibleIds?.length) {
    seedRotacionInicial(juego);
    return juego.rotacion;
  }

  const catalogoIds = new Set(catalogoArriendos().map((a) => a.id));
  juego.rotacion.visibleIds = juego.rotacion.visibleIds.filter((id) => catalogoIds.has(id));
  juego.rotacion.posiciones = juego.rotacion.posiciones || {};
  if (!Array.isArray(juego.rotacion.zonasEscaneadas)) {
    juego.rotacion.zonasEscaneadas = [];
  }

  const visibles = new Set(juego.rotacion.visibleIds);
  const objetivo = spawnVisibleCount(juego);
  if (juego.rotacion.visibleIds.length < objetivo) {
    const faltantes = shuffle(
      catalogoArriendos()
        .filter((a) => !visibles.has(a.id))
        .map((a) => a.id)
    ).slice(0, objetivo - juego.rotacion.visibleIds.length);

    faltantes.forEach((id) => {
      juego.rotacion.visibleIds.push(id);
      const base = obtenerArriendo(id);
      if (base) juego.rotacion.posiciones[id] = calcularPosicionSpawn(base);
    });
    guardarJuego(juego);
  }

  juego.rotacion.visibleIds.forEach((id) => {
    if (!juego.rotacion.posiciones[id]) {
      const base = obtenerArriendo(id);
      if (base) juego.rotacion.posiciones[id] = calcularPosicionSpawn(base);
    }
  });

  if (!juego.rotacion.nextAt) {
    juego.rotacion.nextAt = Date.now() + ROTACION_INTERVAL_MS;
    guardarJuego(juego);
  }

  return juego.rotacion;
}

export function rotarSpawns() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  const atrapados = idsAtrapados();
  const rot = juego.rotacion;
  const visibles = [...rot.visibleIds];

  const removibles = visibles.filter((id) => !atrapados.has(id));
  const quitarCount = Math.min(randomInt(SPAWN_CAMBIO_MIN, SPAWN_CAMBIO_MAX), removibles.length);
  const aQuitar = shuffle(removibles).slice(0, quitarCount);
  const nuevosVisibles = visibles.filter((id) => !aQuitar.includes(id));

  const visiblesSet = new Set(nuevosVisibles);
  const disponibles = catalogoArriendos()
    .filter((a) => !visiblesSet.has(a.id))
    .map((a) => a.id);
  const agregarCount = Math.min(randomInt(SPAWN_CAMBIO_MIN, SPAWN_CAMBIO_MAX), disponibles.length);
  const aAgregar = shuffle(disponibles).slice(0, agregarCount);

  aQuitar.forEach((id) => {
    delete rot.posiciones[id];
  });

  aAgregar.forEach((id) => {
    nuevosVisibles.push(id);
    const base = obtenerArriendo(id);
    if (base) rot.posiciones[id] = calcularPosicionSpawn(base);
  });

  rot.visibleIds = nuevosVisibles;
  rot.zonasEscaneadas = [];
  rot.nextAt = Date.now() + ROTACION_INTERVAL_MS;
  guardarJuego(juego);

  return { quitados: aQuitar, agregados: aAgregar };
}

export function verificarRotacionPendiente() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  if (Date.now() >= juego.rotacion.nextAt) {
    return rotarSpawns();
  }
  return null;
}

export function msHastaRotacion() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  return Math.max(0, juego.rotacion.nextAt - Date.now());
}

export function formatearCuentaRotacion() {
  const totalSec = Math.floor(msHastaRotacion() / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

let timerRotacion = null;

export function iniciarRotacionTimer(onRotacion) {
  if (timerRotacion) clearInterval(timerRotacion);

  verificarRotacionPendiente();

  timerRotacion = setInterval(() => {
    const res = verificarRotacionPendiente();
    if (res && onRotacion) onRotacion(res);
  }, 30000);

  return timerRotacion;
}

export function detenerRotacionTimer() {
  if (timerRotacion) {
    clearInterval(timerRotacion);
    timerRotacion = null;
  }
}

export function forzarRotacion() {
  const res = rotarSpawns();
  return res;
}

export function obtenerZonasEscaneadas() {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  return new Set(juego.rotacion.zonasEscaneadas || []);
}

export function marcarZonaEscaneada(barrio) {
  const juego = estadoJuego();
  asegurarRotacion(juego);
  if (!juego.rotacion.zonasEscaneadas.includes(barrio)) {
    juego.rotacion.zonasEscaneadas.push(barrio);
    guardarJuego(juego);
  }
}

export function limpiarZonasEscaneadas() {
  const juego = estadoJuego();
  if (!juego.rotacion) return;
  juego.rotacion.zonasEscaneadas = [];
  guardarJuego(juego);
}

export function puedeAtrapar(id) {
  const juego = estadoJuego();
  if (!idsVisiblesEnMapa().has(id)) {
    return { ok: false, motivo: 'Esta señal ya no está activa en el radar.' };
  }
  if (juego.capturas.some((c) => c.id === id)) {
    return { ok: false, motivo: 'Ya atrapaste este arriendo.' };
  }
  if (juego.capturas.length >= juego.slots) {
    return { ok: false, motivo: 'Inventario lleno. Compra más slots en la tienda.' };
  }
  return { ok: true };
}

export function atraparArriendo(id) {
  const arriendo = obtenerArriendo(id);
  if (!arriendo) return { ok: false, motivo: 'Arriendo no encontrado.' };

  const chequeo = puedeAtrapar(id);
  if (!chequeo.ok) return chequeo;

  const juego = estadoJuego();
  const puntosGanados = arriendo.puntos + (juego.bonusCaptura || 0);

  const captura = {
    id: arriendo.id,
    titulo: arriendo.titulo,
    barrio: arriendo.barrio,
    tipo: arriendo.tipo,
    precioTexto: arriendo.precioTexto,
    rareza: arriendo.rareza,
    puntosGanados,
    atrapadoEn: Date.now(),
  };

  juego.capturas.push(captura);
  juego.puntos += puntosGanados;
  guardarJuego(juego);

  return { ok: true, captura, puntosGanados, juego };
}

function conteoMejora(juego, mejoraId) {
  return (juego.mejorasCompradas || []).filter((id) => id === mejoraId).length;
}

export function comprarMejora(mejoraId) {
  const mejora = mejorasData.find((m) => m.id === mejoraId);
  if (!mejora) return { ok: false, motivo: 'Mejora no encontrada.' };

  const juego = estadoJuego();
  const veces = conteoMejora(juego, mejoraId);

  if (mejora.unica && veces >= 1) {
    return { ok: false, motivo: 'Ya tienes esta mejora.' };
  }
  if (veces >= (mejora.maxCompras || 1)) {
    return { ok: false, motivo: 'Límite de compras alcanzado.' };
  }
  if (juego.puntos < mejora.costo) {
    return { ok: false, motivo: 'No tienes puntos suficientes.' };
  }

  juego.puntos -= mejora.costo;
  juego.mejorasCompradas = [...(juego.mejorasCompradas || []), mejoraId];

  if (mejora.efecto.slots) juego.slots += mejora.efecto.slots;
  if (mejora.efecto.radio) juego.radio += mejora.efecto.radio;
  if (mejora.efecto.bonusCaptura) {
    juego.bonusCaptura = (juego.bonusCaptura || 0) + mejora.efecto.bonusCaptura;
  }

  guardarJuego(juego);
  if (mejora.efecto.senales) {
    asegurarRotacion(juego);
  }
  return { ok: true, juego, mejora };
}

export function mejoraAgotada(mejoraId) {
  const mejora = mejorasData.find((m) => m.id === mejoraId);
  if (!mejora) return true;
  const veces = conteoMejora(estadoJuego(), mejoraId);
  if (mejora.unica) return veces >= 1;
  return veces >= (mejora.maxCompras || 1);
}

if (import.meta.env.DEV) {
  window.__forzarRotacion = forzarRotacion;
}
