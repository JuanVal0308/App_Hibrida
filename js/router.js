/**
 * Router SPA: muestra/oculta vistas con Animate.css.
 */

const VISTAS_CON_NAV = new Set(['mapa', 'inventario', 'tienda', 'perfil']);
const VISTAS_PUBLICAS = new Set(['onboarding', 'login', 'registro']);

let vistaActual = null;
let animando = false;

const escuchasCambio = [];

export function alCambiarVista(fn) {
  escuchasCambio.push(fn);
}

function notificar(nombre) {
  escuchasCambio.forEach((fn) => fn(nombre));
}

function animarBoton(el) {
  if (!el || !el.classList) return;
  el.classList.add('animate__animated', 'animate__pulse');
  const limpiar = () => {
    el.classList.remove('animate__animated', 'animate__pulse');
    el.removeEventListener('animationend', limpiar);
  };
  el.addEventListener('animationend', limpiar);
}

export function configurarNavegacion() {
  document.querySelectorAll('[data-ir]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      animarBoton(el);
      const destino = el.getAttribute('data-ir');
      if (destino) irA(destino);
    });
  });
}

function actualizarNav(nombre) {
  const app = document.getElementById('app');
  const nav = document.getElementById('bottom-nav');
  const conNav = VISTAS_CON_NAV.has(nombre);

  if (app) {
    app.classList.toggle('sin-nav', !conNav);
  }

  if (nav) {
    nav.hidden = !conNav;
    nav.querySelectorAll('.nav-item').forEach((item) => {
      const dest = item.getAttribute('data-ir');
      item.classList.toggle('active', dest === nombre);
    });
  }
}

/**
 * Cambia a una vista con fadeOut / fadeIn.
 * @param {string} nombre
 * @param {{ inmediata?: boolean }} opciones
 */
export function irA(nombre, opciones = {}) {
  const destino = document.querySelector(`[data-vista="${nombre}"]`);
  if (!destino) return;
  if (animando && !opciones.inmediata) return;
  if (vistaActual === nombre) return;

  const actual = vistaActual
    ? document.querySelector(`[data-vista="${vistaActual}"]`)
    : null;

  if (opciones.inmediata || !actual) {
    document.querySelectorAll('.vista').forEach((v) => {
      v.hidden = true;
      v.classList.remove('animate__animated', 'animate__fadeIn', 'animate__fadeOut');
    });
    destino.hidden = false;
    destino.classList.add('animate__animated', 'animate__fadeIn');
    vistaActual = nombre;
    actualizarNav(nombre);
    notificar(nombre);
    return;
  }

  animando = true;
  actual.classList.add('animate__animated', 'animate__fadeOut', 'oculta-anim');

  const alTerminar = () => {
    actual.removeEventListener('animationend', alTerminar);
    actual.hidden = true;
    actual.classList.remove('animate__animated', 'animate__fadeOut', 'oculta-anim');

    destino.hidden = false;
    destino.classList.add('animate__animated', 'animate__fadeIn');

    const alEntrar = () => {
      destino.removeEventListener('animationend', alEntrar);
      destino.classList.remove('animate__animated', 'animate__fadeIn');
      animando = false;
    };
    destino.addEventListener('animationend', alEntrar);

    vistaActual = nombre;
    actualizarNav(nombre);
    notificar(nombre);
  };

  actual.addEventListener('animationend', alTerminar);
}

export function vistaActualNombre() {
  return vistaActual;
}

export function esVistaPublica(nombre) {
  return VISTAS_PUBLICAS.has(nombre);
}

export function esVistaPrivada(nombre) {
  return !VISTAS_PUBLICAS.has(nombre);
}
