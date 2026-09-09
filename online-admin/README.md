# Admin de Zonas · Renta Ya

Aplicación web para administrar zonas y apartamentos que pueden descargarse en la app móvil Renta Ya.

## Uso

1. Abre `index.html` en tu navegador
2. Crea zonas (barrios/sectores)
3. Agrega apartamentos a cada zona
4. Exporta los paquetes de zona

## Exportación

### Catálogo (`catalogo.json`)

Lista todas las zonas disponibles para descargar. Se descarga desde la app móvil para mostrar las opciones.

Formato:
```json
[
  {
    "id": "zona-1",
    "nombre": "Envigado Sur",
    "descripcion": "Apartamentos y casas en el sur de Envigado",
    "cantidadApartamentos": 5
  }
]
```

### Paquetes de zona (`zona-{id}.js`)

Cada zona se exporta como un archivo JavaScript que la app puede descargar y ejecutar.

Formato:
```javascript
exports.zonaId = "zona-1";
exports.zonaNombre = "Envigado Sur";
exports.apartamentos = [
  {
    "id": "zona-1-apto-1",
    "titulo": "Apto Moderno",
    "barrio": "Envigado Sur",
    // ... resto de campos del apartamento
  }
];
```

## Despliegue en GitHub Pages

1. Copia los archivos generados (`catalogo.json` y `zona-*.js`) a la carpeta `public/packages/` del repositorio principal
2. Habilita GitHub Pages en la configuración del repositorio:
   - Ve a Settings > Pages
   - Source: Deploy from a branch
   - Branch: `main` (o la rama que elijas)
   - Folder: `/` o `/public` (según tu configuración)
3. Actualiza la URL base en `/js/actualizar.js`:
   - Cambia `BASE_URL` a: `https://juanval0308.github.io/App_Hibrida/packages/`

## Persistencia

Los datos se guardan en `localStorage` del navegador. Para respaldar:

1. Exporta todos los paquetes
2. Guarda los archivos generados
3. Sube los archivos a la carpeta `packages/` del repo

## Estructura de apartamentos

Campos obligatorios:
- `id`: identificador único
- `titulo`: nombre del apartamento
- `barrio`: barrio/zona
- `tipo`: "apto", "casa" o "celda"
- `precio`: precio en COP (número)
- `precioTexto`: precio formateado (ej: "$2.1M")
- `habitaciones`: número
- `banos`: número
- `metros`: metros cuadrados
- `descripcion`: texto descriptivo
- `rareza`: "comun", "raro", "epico", "legendario"
- `puntos`: puntos que otorga al capturarlo
- `lat`, `lng`: coordenadas (simuladas, para el radar)
- `fotos`: array de rutas a imágenes
- `amenidades`: array de strings

## Notas

- La app descarga y aplica solo las zonas seleccionadas por el usuario
- Los apartamentos descargados se mezclan con los base de la app
- El usuario puede eliminar zonas descargadas desde la app
