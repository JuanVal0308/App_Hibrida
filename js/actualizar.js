/**
 * Módulo Actualizar — gestiona la descarga de paquetes de zonas cuando hay conexión.
 */

import { leer, guardar } from './storage.js';
import { mostrarAviso } from './ui.js';
import { aplicarImagenesLocalesArray } from './imagenes-inmuebles.js';

// URL base de los paquetes (GitHub Pages o configurable)
// En producción (Capacitor Android/iOS), usar ruta relativa para acceder a assets empaquetados
// En desarrollo web, usar /packages/
const BASE_URL = import.meta.env.PROD 
  ? './packages/'  // Ruta relativa para assets empaquetados en Capacitor
  : '/packages/';

let estadoOnline = false;

/**
 * Verifica si el dispositivo tiene conexión a internet.
 */
export async function verificarConexion() {
  if (!navigator.onLine) {
    return false;
  }
  
  // Intenta hacer fetch a un endpoint conocido para confirmar conectividad real
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el catálogo de zonas disponibles para descargar desde el paquete local.
 * Funciona offline con assets empaquetados en Capacitor.
 */
export async function obtenerCatalogoZonas() {
  // Intentar primero con ruta relativa (funciona en Capacitor)
  const rutasAIntentar = [
    './packages/catalogo.json',
    '/packages/catalogo.json',
    'packages/catalogo.json'
  ];
  
  for (const ruta of rutasAIntentar) {
    try {
      const response = await fetch(ruta);
      if (response.ok) {
        const catalogo = await response.json();
        console.log(`✓ Catálogo cargado desde: ${ruta}`);
        return catalogo;
      }
    } catch (error) {
      console.log(`✗ No se pudo cargar catálogo desde: ${ruta}`);
    }
  }
  
  console.error('No se pudo cargar el catálogo de zonas desde ninguna ruta');
  return [];
}

/**
 * Descarga un paquete de zona desde los assets empaquetados.
 * Funciona offline con assets empaquetados en Capacitor.
 * @param {string} zonaId 
 */
export async function descargarZona(zonaId) {
  // Intentar múltiples rutas para compatibilidad con Capacitor
  const rutasAIntentar = [
    `./packages/zona-${zonaId}.js`,
    `/packages/zona-${zonaId}.js`,
    `packages/zona-${zonaId}.js`
  ];
  
  for (const ruta of rutasAIntentar) {
    try {
      const response = await fetch(ruta);
      if (response.ok) {
        const codigo = await response.text();
        console.log(`✓ Zona ${zonaId} descargada desde: ${ruta}`);
        return codigo;
      }
    } catch (error) {
      console.log(`✗ No se pudo descargar zona ${zonaId} desde: ${ruta}`);
    }
  }
  
  throw new Error(`No es posible descargar la zona ${zonaId}. Verifica que la app esté correctamente instalada.`);
}

/**
 * Procesa y aplica un paquete de zona descargado.
 * Si la zona ya existe, MERGE los apartamentos por ID (no reemplaza).
 * @param {string} zonaId 
 * @param {string} codigoPaquete 
 * @param {boolean} esMerge - Si es true, fusiona con datos existentes
 * @returns {Object} - { success: boolean, nuevosCount: number } - indica éxito y cuántos apartamentos fueron nuevos
 */
export function aplicarPaqueteZona(zonaId, codigoPaquete, esMerge = false) {
  try {
    // Evalúa el código del paquete de forma segura
    // El paquete debe exportar: { zonaId, zonaNombre, apartamentos: [...] }
    const funcion = new Function('exports', codigoPaquete + '; return exports;');
    const paquete = funcion({});
    
    if (!paquete || !paquete.apartamentos) {
      throw new Error('Paquete inválido');
    }
    
    // Aplica imágenes locales a los apartamentos del paquete
    const apartamentosConImagenes = aplicarImagenesLocalesArray(paquete.apartamentos);
    
    const descargados = leer('zonas_descargadas', {});
    const zonaExistente = descargados[zonaId];
    
    let apartamentosFinales;
    let nuevosCount = 0;
    
    if (esMerge && zonaExistente && zonaExistente.apartamentos) {
      // MERGE: Combina apartamentos existentes con nuevos por ID
      const apartamentosMap = new Map();
      
      // Primero agregar los existentes
      zonaExistente.apartamentos.forEach(apt => {
        apartamentosMap.set(apt.id, apt);
      });
      
      // Contar IDs existentes antes del merge
      const idsExistentes = new Set(apartamentosMap.keys());
      
      // Luego agregar/actualizar con los nuevos
      apartamentosConImagenes.forEach(apt => {
        if (!idsExistentes.has(apt.id)) {
          nuevosCount++;
        }
        apartamentosMap.set(apt.id, apt);
      });
      
      apartamentosFinales = Array.from(apartamentosMap.values());
    } else {
      // Nueva descarga: todos son nuevos
      apartamentosFinales = apartamentosConImagenes;
      nuevosCount = apartamentosFinales.length;
    }
    
    // Guarda el paquete descargado con imágenes locales
    descargados[zonaId] = {
      zonaId: paquete.zonaId,
      zonaNombre: paquete.zonaNombre,
      apartamentos: apartamentosFinales,
      fechaDescarga: Date.now(),
      version: (zonaExistente?.version || 0) + 1
    };
    guardar('zonas_descargadas', descargados);
    
    return { success: true, nuevosCount };
  } catch (error) {
    console.error('Error aplicando paquete:', error);
    throw error;
  }
}

/**
 * Obtiene todas las zonas descargadas localmente.
 */
export function obtenerZonasDescargadas() {
  return leer('zonas_descargadas', {});
}

/**
 * Elimina una zona descargada del dispositivo.
 * @param {string} zonaId 
 */
export function eliminarZonaDescargada(zonaId) {
  const descargados = leer('zonas_descargadas', {});
  delete descargados[zonaId];
  guardar('zonas_descargadas', descargados);
}

/**
 * Obtiene todos los apartamentos (base + zonas descargadas).
 */
export async function obtenerTodosLosApartamentos() {
  // Carga apartamentos base - intentar múltiples rutas para Capacitor
  const rutasAIntentar = ['./json/arriendos.json', '/json/arriendos.json', 'json/arriendos.json'];
  let apartamentosBase = [];
  
  for (const ruta of rutasAIntentar) {
    try {
      const response = await fetch(ruta);
      if (response.ok) {
        apartamentosBase = await response.json();
        break;
      }
    } catch (error) {
      console.log(`No se pudo cargar arriendos desde: ${ruta}`);
    }
  }
  
  // Agrega apartamentos de zonas descargadas
  const zonasDescargadas = obtenerZonasDescargadas();
  const apartamentosExtra = [];
  
  Object.values(zonasDescargadas).forEach(zona => {
    if (zona.apartamentos && Array.isArray(zona.apartamentos)) {
      apartamentosExtra.push(...zona.apartamentos);
    }
  });
  
  return [...apartamentosBase, ...apartamentosExtra];
}

/**
 * Inicializa la vista de actualización.
 */
export function inicializarActualizar() {
  const estadoLabel = document.getElementById('estado-label');
  const estadoDesc = document.getElementById('estado-descripcion');
  const estadoCard = document.querySelector('.estado-card');
  const zonaContenido = document.getElementById('zona-contenido');
  const zonaOffline = document.getElementById('zona-offline');
  const zonaLista = document.getElementById('zona-lista');
  const zonaDescargadaLista = document.getElementById('zona-descargada-lista');
  const zonaDescargadaVacio = document.getElementById('zona-descargada-vacio');
  const btnDescargar = document.getElementById('btn-descargar-zonas');
  
  // Verifica conexión
  verificarConexion().then(online => {
    estadoOnline = online;
    
    if (online) {
      estadoLabel.textContent = 'Conectado a internet';
      estadoDesc.textContent = 'Puedes descargar nuevas zonas';
      estadoCard.classList.add('online');
      zonaContenido.hidden = false;
      zonaOffline.hidden = true;
      
      // Carga catálogo de zonas disponibles
      cargarCatalogoZonas();
    } else {
      estadoLabel.textContent = 'Sin conexión';
      estadoDesc.textContent = 'Las actualizaciones requieren internet';
      estadoCard.classList.remove('online');
      zonaContenido.hidden = true;
      zonaOffline.hidden = false;
    }
    
    // Muestra zonas descargadas (funciona offline)
    cargarZonasDescargadas();
  });
  
  // Botón de descarga
  btnDescargar.addEventListener('click', async () => {
    const seleccionadas = zonaLista.querySelectorAll('input[type="checkbox"]:checked');
    if (seleccionadas.length === 0) {
      mostrarAviso('Selecciona al menos una zona', 'error');
      return;
    }
    
    btnDescargar.disabled = true;
    btnDescargar.textContent = 'Procesando...';
    
    let exitos = 0;
    let errores = 0;
    let actualizaciones = 0;
    let totalNuevosInmuebles = 0;
    
    for (const checkbox of seleccionadas) {
      const zonaId = checkbox.value;
      const esMerge = checkbox.dataset.esActualizacion === 'true';
      
      try {
        const codigo = await descargarZona(zonaId);
        const resultado = aplicarPaqueteZona(zonaId, codigo, esMerge);
        checkbox.checked = false;
        if (esMerge) {
          actualizaciones++;
          totalNuevosInmuebles += resultado.nuevosCount;
        } else {
          exitos++;
        }
      } catch (error) {
        errores++;
      }
    }
    
    btnDescargar.disabled = false;
    btnDescargar.textContent = 'Descargar seleccionadas';
    
    if (exitos > 0) {
      mostrarAviso(`${exitos} zona(s) descargada(s) correctamente`, 'success');
    }
    
    if (actualizaciones > 0) {
      const inmueblesTexto = totalNuevosInmuebles === 1 ? 'inmueble nuevo' : 'inmuebles nuevos';
      mostrarAviso(`${actualizaciones} zona(s) actualizada(s): ${totalNuevosInmuebles} ${inmueblesTexto}`, 'success');
    }
    
    if (exitos > 0 || actualizaciones > 0) {
      cargarZonasDescargadas();
    }
    
    if (errores > 0) {
      mostrarAviso(`Error procesando ${errores} zona(s)`, 'error');
    }
    
    actualizarBotonDescargar();
  });
}

/**
 * Calcula cuántos apartamentos en un paquete de zona son nuevos (no descargados aún).
 * @param {string} zonaId 
 * @param {Array} apartamentosPaquete - Array de apartamentos del paquete
 * @returns {number} - Cantidad de apartamentos nuevos
 */
function calcularApartamentosNuevos(zonaId, apartamentosPaquete) {
  const descargadas = obtenerZonasDescargadas();
  const zonaExistente = descargadas[zonaId];
  
  if (!zonaExistente || !zonaExistente.apartamentos) {
    // Si no está descargada, todos son nuevos
    return apartamentosPaquete.length;
  }
  
  // Crear set de IDs existentes
  const idsExistentes = new Set(zonaExistente.apartamentos.map(apt => apt.id));
  
  // Contar cuántos del paquete NO están en los existentes
  return apartamentosPaquete.filter(apt => !idsExistentes.has(apt.id)).length;
}

async function cargarCatalogoZonas() {
  const zonaLista = document.getElementById('zona-lista');
  const catalogo = await obtenerCatalogoZonas();
  const descargadas = obtenerZonasDescargadas();
  
  zonaLista.innerHTML = '';
  
  if (catalogo.length === 0) {
    zonaLista.innerHTML = '<p class="small muted">No hay zonas disponibles en este momento.</p>';
    return;
  }
  
  for (const zona of catalogo) {
    const yaDescargada = descargadas[zona.id];
    
    const item = document.createElement('label');
    item.className = 'zona-item';
    
    if (yaDescargada) {
      // Zona ya descargada - calcular cuántos apartamentos son nuevos
      try {
        const codigo = await descargarZona(zona.id);
        const funcion = new Function('exports', codigo + '; return exports;');
        const paquete = funcion({});
        
        const nuevosCount = calcularApartamentosNuevos(zona.id, paquete.apartamentos || []);
        
        if (nuevosCount > 0) {
          // Hay apartamentos nuevos - mostrar opción de actualizar con el count
          const inmueblesTexto = nuevosCount === 1 ? 'inmueble nuevo' : 'inmuebles nuevos';
          item.innerHTML = `
            <input type="checkbox" value="${zona.id}" data-es-actualizacion="true">
            <div class="zona-info">
              <span class="zona-nombre">${zona.nombre}</span>
              <span class="small muted">${zona.descripcion}</span>
              <span class="badge-actualizable">Actualizar · ${nuevosCount} ${inmueblesTexto}</span>
            </div>
          `;
        } else {
          // Ya tiene todos los apartamentos - no mostrar opción de actualizar
          item.innerHTML = `
            <div class="zona-info" style="opacity: 0.6; padding-left: 12px;">
              <span class="zona-nombre">${zona.nombre}</span>
              <span class="small muted">${zona.descripcion}</span>
              <span class="badge-actualizable" style="background: var(--success); color: white;">✓ Actualizada</span>
            </div>
          `;
        }
      } catch (error) {
        console.error(`Error cargando paquete ${zona.id}:`, error);
        // Si hay error cargando, mostrar opción genérica
        item.innerHTML = `
          <input type="checkbox" value="${zona.id}" data-es-actualizacion="true">
          <div class="zona-info">
            <span class="zona-nombre">${zona.nombre}</span>
            <span class="small muted">${zona.descripcion}</span>
            <span class="badge-actualizable">Actualizar</span>
          </div>
        `;
      }
    } else {
      // Zona nueva - descarga normal
      item.innerHTML = `
        <input type="checkbox" value="${zona.id}">
        <div class="zona-info">
          <span class="zona-nombre">${zona.nombre}</span>
          <span class="small muted">${zona.descripcion}</span>
        </div>
      `;
    }
    
    const checkbox = item.querySelector('input');
    if (checkbox) {
      checkbox.addEventListener('change', actualizarBotonDescargar);
    }
    
    zonaLista.appendChild(item);
  }
}

function cargarZonasDescargadas() {
  const zonaDescargadaLista = document.getElementById('zona-descargada-lista');
  const zonaDescargadaVacio = document.getElementById('zona-descargada-vacio');
  const descargadas = obtenerZonasDescargadas();
  const ids = Object.keys(descargadas);
  
  zonaDescargadaLista.innerHTML = '';
  
  if (ids.length === 0) {
    zonaDescargadaVacio.hidden = false;
    return;
  }
  
  zonaDescargadaVacio.hidden = true;
  
  ids.forEach(zonaId => {
    const zona = descargadas[zonaId];
    const fecha = new Date(zona.fechaDescarga).toLocaleDateString('es-CO');
    
    const item = document.createElement('div');
    item.className = 'zona-descargada-item';
    item.innerHTML = `
      <div class="zona-info">
        <span class="zona-nombre">${zona.zonaNombre}</span>
        <span class="small muted">${zona.apartamentos.length} apartamento(s) · ${fecha}</span>
      </div>
      <button type="button" class="btn-outline-sm btn-animar" data-zona-id="${zonaId}">
        Eliminar
      </button>
    `;
    
    const btnEliminar = item.querySelector('button');
    btnEliminar.addEventListener('click', () => {
      if (confirm(`¿Eliminar la zona "${zona.zonaNombre}"?`)) {
        eliminarZonaDescargada(zonaId);
        mostrarAviso('Zona eliminada', 'success');
        cargarZonasDescargadas();
        if (estadoOnline) {
          cargarCatalogoZonas();
        }
      }
    });
    
    zonaDescargadaLista.appendChild(item);
  });
}

function actualizarBotonDescargar() {
  const btnDescargar = document.getElementById('btn-descargar-zonas');
  const zonaLista = document.getElementById('zona-lista');
  const seleccionadas = zonaLista.querySelectorAll('input[type="checkbox"]:checked');
  btnDescargar.disabled = seleccionadas.length === 0;
}
