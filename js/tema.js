/**
 * Modo claro/oscuro de toda la app. Preferencia local (localStorage,
 * prefijo rentaya_ vía storage.js), independiente de la sesión: se lee
 * antes de iniciar sesión y sobrevive a cerrar sesión.
 */
import { leer, guardar } from './storage.js';

const CLAVE_TEMA = 'tema';
const OSCURO = 'oscuro';
const CLARO = 'claro';

const BG_CLARO = '#f7fafd';
const BG_OSCURO = '#12161c';

export function obtenerTema() {
  return leer(CLAVE_TEMA, CLARO) === OSCURO ? OSCURO : CLARO;
}

export function esOscuro() {
  return obtenerTema() === OSCURO;
}

function aplicarTema(tema) {
  const oscuro = tema === OSCURO;

  if (oscuro) {
    document.documentElement.setAttribute('data-tema', OSCURO);
  } else {
    document.documentElement.removeAttribute('data-tema');
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', oscuro ? BG_OSCURO : BG_CLARO);
}

export function establecerTema(tema) {
  const valor = tema === OSCURO ? OSCURO : CLARO;
  guardar(CLAVE_TEMA, valor);
  aplicarTema(valor);
  return valor;
}

export function alternarTema() {
  return establecerTema(esOscuro() ? CLARO : OSCURO);
}

/** Llamar lo antes posible al cargar la app, para evitar parpadeo de tema. */
export function inicializarTema() {
  aplicarTema(obtenerTema());
}
