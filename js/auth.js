/**
 * Registro, login y sesión local (sin internet).
 */
import { leer, guardar, eliminar } from './storage.js';

const CLAVE_USUARIOS = 'usuarios';
const CLAVE_SESION = 'sesion';

const ESTADO_JUEGO_INICIAL = {
  puntos: 0,
  capturas: [],
  slots: 5,
  radio: 1,
  bonusCaptura: 0,
  mejorasCompradas: [],
};

function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function telefonoValido(tel) {
  return String(tel).replace(/\D/g, '').length >= 7;
}

export function listarUsuarios() {
  return leer(CLAVE_USUARIOS, []);
}

function guardarUsuarios(lista) {
  guardar(CLAVE_USUARIOS, lista);
}

export function obtenerSesion() {
  return leer(CLAVE_SESION, null);
}

export function haySesion() {
  return Boolean(obtenerSesion()?.correo);
}

export function obtenerUsuarioActual() {
  const sesion = obtenerSesion();
  if (!sesion) return null;
  return listarUsuarios().find((u) => u.correo === sesion.correo) || null;
}

export function actualizarUsuarioActual(cambios) {
  const sesion = obtenerSesion();
  if (!sesion) return null;
  const lista = listarUsuarios();
  const idx = lista.findIndex((u) => u.correo === sesion.correo);
  if (idx < 0) return null;
  lista[idx] = { ...lista[idx], ...cambios };
  guardarUsuarios(lista);
  return lista[idx];
}

export function registrarUsuario({ nombre, correo, telefono, contrasena }) {
  const errores = {};

  if (!nombre || nombre.trim().length < 2) {
    errores.nombre = 'Ingresa tu nombre.';
  }
  if (!correoValido(correo)) {
    errores.correo = 'Ingresa un correo válido.';
  }
  if (!telefonoValido(telefono)) {
    errores.telefono = 'Ingresa un teléfono válido.';
  }
  if (!contrasena || contrasena.length < 6) {
    errores.contrasena = 'Mínimo 6 caracteres.';
  }

  const lista = listarUsuarios();
  if (lista.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
    errores.correo = 'Este correo ya está registrado.';
  }

  if (Object.keys(errores).length) {
    return { ok: false, errores };
  }

  const usuario = {
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    telefono: telefono.trim(),
    contrasena,
    juego: { ...ESTADO_JUEGO_INICIAL, capturas: [], mejorasCompradas: [] },
    creadoEn: Date.now(),
  };

  lista.push(usuario);
  guardarUsuarios(lista);

  return { ok: true, usuario };
}

export function iniciarSesion({ correo, contrasena }) {
  const errores = {};
  if (!correoValido(correo)) errores.correo = 'Ingresa un correo válido.';
  if (!contrasena || contrasena.length < 6) errores.contrasena = 'Mínimo 6 caracteres.';
  if (Object.keys(errores).length) return { ok: false, errores };

  const usuario = listarUsuarios().find(
    (u) => u.correo === correo.trim().toLowerCase() && u.contrasena === contrasena
  );

  if (!usuario) {
    return { ok: false, mensaje: 'Correo o contraseña incorrectos.' };
  }

  guardar(CLAVE_SESION, { correo: usuario.correo, desde: Date.now() });
  return { ok: true, usuario };
}

export function cerrarSesion() {
  eliminar(CLAVE_SESION);
}

export function obtenerJuego() {
  const u = obtenerUsuarioActual();
  if (!u) return { ...ESTADO_JUEGO_INICIAL, capturas: [], mejorasCompradas: [] };
  return {
    ...ESTADO_JUEGO_INICIAL,
    ...u.juego,
    capturas: u.juego?.capturas || [],
    mejorasCompradas: u.juego?.mejorasCompradas || [],
  };
}

export function guardarJuego(juego) {
  return actualizarUsuarioActual({ juego });
}
