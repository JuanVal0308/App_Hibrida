/**
 * Módulo Actualizar — gestiona la descarga de paquetes de zonas cuando hay conexión.
 */

import { leer, guardar } from './storage.js';
import { mostrarAviso } from './ui.js';

// URL base de los paquetes (GitHub Pages o configurable)
// En producción, apuntará a: https://juanval0308.github.io/App_Hibrida/packages/
const BASE_URL = import.meta.env.PROD 
  ? 'https://juanval0308.github.io/App_Hibrida/packages/'
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
 * Obtiene el catálogo de zonas disponibles para descargar desde el servidor.
 * Intenta primero desde el paquete local (funciona offline), luego desde remoto.
 */
export async function obtenerCatalogoZonas() {
  try {
    const response = await fetch(`${BASE_URL}catalogo.json`);
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    return await response.json();
  } catch (error) {
    console.error('Error cargando catálogo remoto, intentando local:', error);
    try {
      const localResponse = await fetch('/packages/catalogo.json');
      if (localResponse.ok) {
        return await localResponse.json();
      }
    } catch (localError) {
      console.error('Error cargando catálogo local:', localError);
    }
    return [];
  }
}

/**
 * Descarga un paquete de zona desde el servidor.
 * Intenta primero desde el paquete local (funciona offline), luego desde remoto.
 * @param {string} zonaId 
 */
export async function descargarZona(zonaId) {
  try {
    const response = await fetch(`${BASE_URL}zona-${zonaId}.js`);
    if (!response.ok) throw new Error(`No se pudo descargar zona ${zonaId}`);
    
    const codigo = await response.text();
    return codigo;
  } catch (error) {
    console.error(`Error descargando zona ${zonaId} remota, intentando local:`, error);
    try {
      const localResponse = await fetch(`/packages/zona-${zonaId}.js`);
      if (localResponse.ok) {
        const codigo = await localResponse.text();
        return codigo;
      }
    } catch (localError) {
      console.error(`Error descargando zona ${zonaId} local:`, localError);
    }
    throw error;
  }
}

/**
 * Procesa y aplica un paquete de zona descargado.
 * @param {string} zonaId 
 * @param {string} codigoPaquete 
 */
export function aplicarPaqueteZona(zonaId, codigoPaquete) {
  try {
    // Evalúa el código del paquete de forma segura
    // El paquete debe exportar: { zonaId, zonaNombre, apartamentos: [...] }
    const funcion = new Function('exports', codigoPaquete + '; return exports;');
    const paquete = funcion({});
    
    if (!paquete || !paquete.apartamentos) {
      throw new Error('Paquete inválido');
    }
    
    // Guarda el paquete descargado
    const descargados = leer('zonas_descargadas', {});
    descargados[zonaId] = {
      zonaId: paquete.zonaId,
      zonaNombre: paquete.zonaNombre,
      apartamentos: paquete.apartamentos,
      fechaDescarga: Date.now()
    };
    guardar('zonas_descargadas', descargados);
    
    return true;
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
  // Carga apartamentos base
  const response = await fetch('/json/arriendos.json');
  const apartamentosBase = await response.json();
  
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
    btnDescargar.textContent = 'Descargando...';
    
    let exitos = 0;
    let errores = 0;
    
    for (const checkbox of seleccionadas) {
      const zonaId = checkbox.value;
      try {
        const codigo = await descargarZona(zonaId);
        aplicarPaqueteZona(zonaId, codigo);
        checkbox.checked = false;
        exitos++;
      } catch (error) {
        errores++;
      }
    }
    
    btnDescargar.disabled = false;
    btnDescargar.textContent = 'Descargar seleccionadas';
    
    if (exitos > 0) {
      mostrarAviso(`${exitos} zona(s) descargada(s) correctamente`, 'success');
      cargarZonasDescargadas();
    }
    
    if (errores > 0) {
      mostrarAviso(`Error descargando ${errores} zona(s)`, 'error');
    }
    
    actualizarBotonDescargar();
  });
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
  
  catalogo.forEach(zona => {
    const yaDescargada = descargadas[zona.id];
    
    const item = document.createElement('label');
    item.className = 'zona-item';
    item.innerHTML = `
      <input type="checkbox" value="${zona.id}" ${yaDescargada ? 'disabled' : ''}>
      <div class="zona-info">
        <span class="zona-nombre">${zona.nombre}</span>
        <span class="small muted">${zona.descripcion}</span>
        ${yaDescargada ? '<span class="badge-descargada">Ya descargada</span>' : ''}
      </div>
    `;
    
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', actualizarBotonDescargar);
    
    zonaLista.appendChild(item);
  });
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
