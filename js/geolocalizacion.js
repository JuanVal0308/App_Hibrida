/**
 * Geolocalización del cazador (API del navegador).
 * Si estás lejos de Medellín, el juego usa el centro de la ciudad (modo demo)
 * para que siempre veas y puedas atrapar arriendos.
 */

export const MEDELLIN = { lat: 6.2442, lng: -75.5812 };

let posicionGps = { ...MEDELLIN, aproximada: true };
let watchId = null;
const escuchas = [];

/** Distancia en metros (Haversine). */
export function distanciaMetros(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Posición usada por el juego (mapa / radio / captura).
 * Si el GPS real está a más de 20 km de Medellín → modo demo en el centro.
 */
export function obtenerPosicion() {
  const lejos = distanciaMetros(posicionGps, MEDELLIN) > 20000;
  if (lejos || posicionGps.aproximada) {
    // En demo o sin GPS fiable, jugamos en Medellín
    if (lejos && !posicionGps.aproximada) {
      return { ...MEDELLIN, aproximada: false, demo: true, gpsLat: posicionGps.lat, gpsLng: posicionGps.lng };
    }
    return { ...MEDELLIN, aproximada: true, demo: true };
  }
  return { ...posicionGps, demo: false };
}

export function obtenerPosicionGpsRaw() {
  return { ...posicionGps };
}

export function alCambiarPosicion(fn) {
  escuchas.push(fn);
}

function notificar() {
  escuchas.forEach((fn) => fn(obtenerPosicion()));
}

function aplicarPosicion(coords, aproximada = false) {
  posicionGps = {
    lat: coords.latitude,
    lng: coords.longitude,
    aproximada,
  };
  notificar();
}

/**
 * Pide permiso de ubicación.
 * @returns {Promise<{ok:boolean, posicion?:object, mensaje?:string}>}
 */
export function pedirPermisoUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      posicionGps = { ...MEDELLIN, aproximada: true };
      notificar();
      resolve({
        ok: false,
        posicion: obtenerPosicion(),
        mensaje: 'Sin geolocalización. Mapa en modo Medellín (demo).',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        aplicarPosicion(pos.coords, false);
        iniciarSeguimiento();
        const juego = obtenerPosicion();
        resolve({
          ok: true,
          posicion: juego,
          mensaje: juego.demo
            ? 'GPS OK. Como estás lejos, el mapa usa Medellín (demo).'
            : 'Ubicación activada.',
        });
      },
      (err) => {
        posicionGps = { ...MEDELLIN, aproximada: true };
        notificar();
        let mensaje = 'No se pudo leer el GPS. Mapa en Medellín (demo).';
        if (err.code === 1) {
          mensaje = 'Permiso denegado. Mapa en Medellín (demo). Actívalo con el botón de ubicación.';
        }
        resolve({ ok: false, posicion: obtenerPosicion(), mensaje });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  });
}

export function iniciarSeguimiento() {
  if (!navigator.geolocation || watchId !== null) return;
  watchId = navigator.geolocation.watchPosition(
    (pos) => aplicarPosicion(pos.coords, false),
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

/** Fuerza el centro de Medellín (útil para pruebas). */
export function usarMedellinDemo() {
  posicionGps = { ...MEDELLIN, aproximada: true };
  notificar();
}
