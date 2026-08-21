/**
 * Orquestador de la SPA Renta Ya.
 */
import { configurarNavegacion, irA, alCambiarVista, esVistaPrivada } from './router.js';
import { haySesion } from './auth.js';
import { iniciarAuth } from './formularios.js';
import { iniciarMapa, refrescarMapa } from './mapa.js';
import { pintarInventario } from './inventario.js';
import { pintarTienda } from './tienda.js';
import { pintarPerfil, iniciarPerfil } from './perfil.js';
import { iniciarDetalle } from './detalle.js';

function protegerRutas(nombre) {
  if (esVistaPrivada(nombre) && !haySesion()) {
    irA('login', { inmediata: true });
    return false;
  }
  if ((nombre === 'login' || nombre === 'registro' || nombre === 'onboarding') && haySesion()) {
    irA('mapa', { inmediata: true });
    return false;
  }
  return true;
}

function alMostrar(nombre) {
  if (!protegerRutas(nombre)) return;

  if (nombre === 'mapa') refrescarMapa();
  if (nombre === 'inventario') {
    window.__detalleOrigen = 'inventario';
    pintarInventario();
  }
  if (nombre === 'tienda') pintarTienda();
  if (nombre === 'perfil') pintarPerfil();
  if (nombre === 'detalle') window.__detalleOrigen = window.__detalleOrigen || 'mapa';
}

export function iniciarApp() {
  configurarNavegacion();
  iniciarAuth();
  iniciarMapa();
  iniciarDetalle();
  iniciarPerfil();

  alCambiarVista(alMostrar);

  if (haySesion()) {
    irA('mapa', { inmediata: true });
  } else {
    irA('onboarding', { inmediata: true });
  }
}
