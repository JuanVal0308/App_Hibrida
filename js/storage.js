/**
 * Wrappers de localStorage para RentaGo (offline).
 */

const PREFIJO = 'rentaya_';

export function leer(clave, respaldo = null) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (crudo === null) return respaldo;
    return JSON.parse(crudo);
  } catch {
    return respaldo;
  }
}

export function guardar(clave, valor) {
  localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
}

export function eliminar(clave) {
  localStorage.removeItem(PREFIJO + clave);
}

export function existe(clave) {
  return localStorage.getItem(PREFIJO + clave) !== null;
}
