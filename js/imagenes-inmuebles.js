/**
 * Módulo de gestión de imágenes locales para inmuebles.
 * Asigna imágenes aleatorias pero estables (basadas en hash del ID) para offline/Capacitor.
 */

// Pool de imágenes locales empaquetadas (offline-ready)
const IMAGENES_LOCALES = {
  apto: [
    '/img/inmuebles/apto1.jpg',
    '/img/inmuebles/apto2.jpg',
    '/img/inmuebles/apto3.jpg',
    '/img/inmuebles/apto4.jpg',
    '/img/inmuebles/apto5.jpg'
  ],
  casa: [
    '/img/inmuebles/casa1.jpg',
    '/img/inmuebles/casa2.jpg',
    '/img/inmuebles/casa3.jpg',
    '/img/inmuebles/casa4.jpg',
    '/img/inmuebles/casa5.jpg'
  ],
  parqueadero: [
    '/img/inmuebles/parking1.jpg',
    '/img/inmuebles/parking2.jpg',
    '/img/inmuebles/parking3.jpg'
  ],
  celda: [
    '/img/inmuebles/apto1.jpg',
    '/img/inmuebles/apto2.jpg',
    '/img/inmuebles/apto3.jpg'
  ]
};

/**
 * Hash simple de un string a número (para estabilidad).
 * Mismo ID siempre retorna el mismo número.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Obtiene una imagen aleatoria pero estable para un inmueble.
 * La misma propiedad (mismo ID + tipo) siempre retorna la misma imagen.
 * 
 * @param {string} id - ID único del inmueble
 * @param {string} tipo - Tipo: 'apto', 'casa', 'parqueadero', 'celda'
 * @returns {string} Ruta local de la imagen (/img/inmuebles/...)
 */
export function obtenerImagenInmueble(id, tipo) {
  // Normalizar tipo
  const tipoNormalizado = tipo?.toLowerCase() || 'apto';
  
  // Seleccionar pool según tipo
  let pool = IMAGENES_LOCALES[tipoNormalizado];
  
  // Fallback a apto si tipo desconocido
  if (!pool || pool.length === 0) {
    pool = IMAGENES_LOCALES.apto;
  }
  
  // Selección estable basada en hash del ID
  const hash = hashString(String(id));
  const index = hash % pool.length;
  
  return pool[index];
}

/**
 * Obtiene múltiples imágenes para un inmueble (para galería).
 * Retorna hasta 3 imágenes diferentes del mismo tipo.
 * 
 * @param {string} id - ID único del inmueble
 * @param {string} tipo - Tipo: 'apto', 'casa', 'parqueadero', 'celda'
 * @param {number} cantidad - Cantidad de imágenes (default: 3)
 * @returns {string[]} Array de rutas locales
 */
export function obtenerImagenesInmueble(id, tipo, cantidad = 3) {
  const tipoNormalizado = tipo?.toLowerCase() || 'apto';
  let pool = IMAGENES_LOCALES[tipoNormalizado] || IMAGENES_LOCALES.apto;
  
  // Generar índices estables a partir del hash
  const hash = hashString(String(id));
  const imagenes = [];
  
  for (let i = 0; i < Math.min(cantidad, pool.length); i++) {
    const index = (hash + i) % pool.length;
    imagenes.push(pool[index]);
  }
  
  return imagenes;
}

/**
 * Normaliza un array de fotos para usar imágenes locales.
 * Útil para procesar datos de zona descargados.
 * 
 * @param {string} id - ID del inmueble
 * @param {string} tipo - Tipo del inmueble
 * @param {string[]} fotosExistentes - Array de fotos (puede contener URLs remotas)
 * @returns {string[]} Array con imágenes locales
 */
export function normalizarFotos(id, tipo, fotosExistentes = []) {
  // Si ya tiene fotos locales válidas, mantenerlas
  const fotosLocales = fotosExistentes.filter(foto => 
    foto && foto.startsWith('/img/inmuebles/')
  );
  
  if (fotosLocales.length >= 3) {
    return fotosLocales.slice(0, 3);
  }
  
  // Caso contrario, generar imágenes locales
  return obtenerImagenesInmueble(id, tipo, 3);
}

/**
 * Aplica imágenes locales a un objeto inmueble.
 * Modifica el objeto in-place agregando la propiedad 'fotosLocales'.
 * 
 * @param {Object} inmueble - Objeto inmueble con { id, tipo, fotos? }
 * @returns {Object} El mismo objeto con fotosLocales agregado
 */
export function aplicarImagenesLocales(inmueble) {
  if (!inmueble || !inmueble.id) return inmueble;
  
  inmueble.fotosLocales = normalizarFotos(
    inmueble.id, 
    inmueble.tipo, 
    inmueble.fotos
  );
  
  return inmueble;
}

/**
 * Aplica imágenes locales a un array de inmuebles.
 * 
 * @param {Object[]} inmuebles - Array de inmuebles
 * @returns {Object[]} Array con fotosLocales aplicadas
 */
export function aplicarImagenesLocalesArray(inmuebles) {
  if (!Array.isArray(inmuebles)) return inmuebles;
  return inmuebles.map(aplicarImagenesLocales);
}
