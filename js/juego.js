/**
 * Lógica del juego: puntos, captura y estado del jugador.
 */
import { obtenerJuego, guardarJuego } from './auth.js';
import arriendosData from '../json/arriendos.json';
import mejorasData from '../json/mejoras.json';

export function listarArriendos() {
  return arriendosData;
}

export function obtenerArriendo(id) {
  return arriendosData.find((a) => a.id === id) || null;
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

export function puedeAtrapar(id) {
  const juego = estadoJuego();
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
  return { ok: true, juego, mejora };
}

export function mejoraAgotada(mejoraId) {
  const mejora = mejorasData.find((m) => m.id === mejoraId);
  if (!mejora) return true;
  const veces = conteoMejora(estadoJuego(), mejoraId);
  if (mejora.unica) return veces >= 1;
  return veces >= (mejora.maxCompras || 1);
}
