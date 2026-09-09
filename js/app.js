/**
 * Orquestador de la SPA RentaGo.
 */
import { configurarNavegacion, irA, alCambiarVista, esVistaPrivada } from './router.js';
import { haySesion } from './auth.js';
import { iniciarAuth } from './formularios.js';
import { iniciarRadar, refrescarRadar } from './radar.js';
import { pintarInventario, iniciarInventario } from './inventario.js';
import { pintarTienda } from './tienda.js';
import { pintarPerfil, iniciarPerfil } from './perfil.js';
import { iniciarDetalle } from './detalle.js';
import { inicializarActualizar } from './actualizar.js';

function protegerRutas(nombre) {
  if (esVistaPrivada(nombre) && !haySesion()) {
    irA('login', { inmediata: true });
    return false;
  }
  if ((nombre === 'login' || nombre === 'registro' || nombre === 'onboarding') && haySesion()) {
    irA('radar', { inmediata: true });
    return false;
  }
  return true;
}

function alMostrar(nombre) {
  if (!protegerRutas(nombre)) return;

  if (nombre === 'radar') refrescarRadar();
  if (nombre === 'inventario') {
    window.__detalleOrigen = 'inventario';
    pintarInventario();
  }
  if (nombre === 'actualizar') inicializarActualizar();
  if (nombre === 'tienda') pintarTienda();
  if (nombre === 'perfil') pintarPerfil();
  if (nombre === 'detalle') window.__detalleOrigen = window.__detalleOrigen || 'radar';
}

export function iniciarApp() {
  configurarNavegacion();
  iniciarAuth();
  iniciarRadar();
  iniciarInventario();
  iniciarDetalle();
  iniciarPerfil();

  alCambiarVista(alMostrar);

  if (haySesion()) {
    irA('radar', { inmediata: true });
  } else {
    irA('onboarding', { inmediata: true });
  }
}
